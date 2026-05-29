from decimal import Decimal

from fastapi import HTTPException, status
from fastapi.encoders import jsonable_encoder
from loguru import logger
from redis.asyncio import Redis
from redis.exceptions import RedisError
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.models import Booking, BookingStatus, User, UserRole, Vehicle, VehicleImage
from app.schemas.common import PaginatedResponse
from app.schemas.vehicle import (
    AvailabilityResponse,
    AvailabilityRange,
    VehicleCreateRequest,
    VehicleDetailResponse,
    VehicleImageCreate,
    VehicleListItem,
    VehicleResponse,
    VehicleUpdateRequest,
)
from app.services.cache_service import cache_or_fetch, filters_hash, invalidate_pattern
from app.utils.date_utils import normalize_datetime


settings = get_settings()


async def invalidate_vehicle_cache(redis: Redis, vehicle_id: int, manager_id: int | None = None) -> None:
    try:
        await redis.delete(f"vehicle:{vehicle_id}", f"vehicle:v2:{vehicle_id}")
        await invalidate_pattern(redis, "vehicles:list:*")
        await invalidate_pattern(redis, f"vehicle:availability:{vehicle_id}:*")
        await invalidate_pattern(redis, f"vehicle:availability:v2:{vehicle_id}:*")
        if manager_id is not None:
            await redis.delete(f"stats:manager:{manager_id}")
        await redis.delete("stats:admin")
    except RedisError as exc:
        logger.warning(f"vehicle_cache_invalidate_failed vehicle_id={vehicle_id} error={exc}")


async def _get_manager(db: AsyncSession, manager_id: int) -> User:
    result = await db.execute(select(User).where(User.id == manager_id, User.role == UserRole.VEHICLE_MANAGER, User.is_active.is_(True)))
    manager = result.scalar_one_or_none()
    if manager is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Assigned manager was not found.")
    return manager


async def _get_vehicle_with_images(db: AsyncSession, vehicle_id: int) -> Vehicle:
    result = await db.execute(
        select(Vehicle)
        .where(Vehicle.id == vehicle_id)
        .options(selectinload(Vehicle.images))
    )
    vehicle = result.scalar_one_or_none()
    if vehicle is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")
    return vehicle


async def _vehicle_has_active_booking(db: AsyncSession, vehicle_id: int) -> bool:
    active_booking = await db.execute(
        select(Booking.id).where(
            Booking.vehicle_id == vehicle_id,
            Booking.status.in_([BookingStatus.PENDING, BookingStatus.APPROVED, BookingStatus.ACTIVE]),
        )
    )
    return active_booking.scalar_one_or_none() is not None


def _serialize_vehicle_detail(vehicle: Vehicle) -> dict:
    payload = VehicleDetailResponse(
        id=vehicle.id,
        manager_id=vehicle.manager_id,
        vehicle_name=vehicle.vehicle_name,
        brand=vehicle.brand,
        vehicle_type=vehicle.vehicle_type,
        registration_number=vehicle.registration_number,
        rental_price_per_day=vehicle.rental_price_per_day,
        fuel_type=vehicle.fuel_type,
        seating_capacity=vehicle.seating_capacity,
        vehicle_count=vehicle.vehicle_count,
        availability_status=vehicle.availability_status,
        description=vehicle.description,
        created_at=vehicle.created_at,
        updated_at=vehicle.updated_at,
        manager_name=vehicle.manager.name if vehicle.manager else None,
        images=[{"id": image.id, "image_url": image.image_url, "is_primary": image.is_primary} for image in vehicle.images],
    )
    return jsonable_encoder(payload)


async def list_vehicles(
    db: AsyncSession,
    redis: Redis,
    *,
    search: str | None,
    vehicle_type: str | None,
    brand: str | None,
    fuel_type: str | None,
    min_price: Decimal | None,
    max_price: Decimal | None,
    available_only: bool,
    page: int,
    page_size: int,
) -> tuple[PaginatedResponse[VehicleListItem], bool]:
    filters = {
        "search": search,
        "vehicle_type": vehicle_type,
        "brand": brand,
        "fuel_type": fuel_type,
        "min_price": str(min_price) if min_price is not None else None,
        "max_price": str(max_price) if max_price is not None else None,
        "available_only": available_only,
        "page_size": page_size,
    }
    cache_key = f"vehicles:list:v2:{page}:{filters_hash(filters)}"

    async def fetch() -> dict:
        primary_image_subquery = (
            select(VehicleImage.vehicle_id, VehicleImage.image_url.label("primary_image"))
            .where(VehicleImage.is_primary.is_(True))
            .subquery()
        )
        active_booking_subquery = (
            select(Booking.vehicle_id, func.count(Booking.id).label("active_booking_count"))
            .where(Booking.status.in_([BookingStatus.PENDING, BookingStatus.APPROVED, BookingStatus.ACTIVE]))
            .group_by(Booking.vehicle_id)
            .subquery()
        )

        conditions = []
        if search:
            search_term = f"%{search.strip()}%"
            conditions.append(
                or_(
                    Vehicle.vehicle_name.ilike(search_term),
                    Vehicle.brand.ilike(search_term),
                    Vehicle.registration_number.ilike(search_term),
                    Vehicle.description.ilike(search_term),
                )
            )
        if vehicle_type:
            conditions.append(Vehicle.vehicle_type == vehicle_type)
        if brand:
            conditions.append(Vehicle.brand.ilike(f"%{brand.strip()}%"))
        if fuel_type:
            conditions.append(Vehicle.fuel_type == fuel_type)
        if min_price is not None:
            conditions.append(Vehicle.rental_price_per_day >= min_price)
        if max_price is not None:
            conditions.append(Vehicle.rental_price_per_day <= max_price)
        if available_only:
            conditions.append(Vehicle.availability_status.is_(True))
            conditions.append(Vehicle.vehicle_count > 0)

        base_filters = and_(*conditions) if conditions else None
        count_query = select(func.count(Vehicle.id))
        data_query = (
            select(
                Vehicle.id,
                Vehicle.manager_id,
                Vehicle.vehicle_name,
                Vehicle.brand,
                Vehicle.vehicle_type,
                Vehicle.registration_number,
                Vehicle.rental_price_per_day,
                Vehicle.fuel_type,
                Vehicle.seating_capacity,
                Vehicle.vehicle_count,
                Vehicle.availability_status,
                Vehicle.created_at,
                func.coalesce(active_booking_subquery.c.active_booking_count, 0).label("active_booking_count"),
                primary_image_subquery.c.primary_image,
            )
            .outerjoin(primary_image_subquery, primary_image_subquery.c.vehicle_id == Vehicle.id)
            .outerjoin(active_booking_subquery, active_booking_subquery.c.vehicle_id == Vehicle.id)
            .order_by(Vehicle.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        if base_filters is not None:
            count_query = count_query.where(base_filters)
            data_query = data_query.where(base_filters)

        total = await db.scalar(count_query) or 0
        result = await db.execute(data_query)
        items = [
            {
                "id": row.id,
                "manager_id": row.manager_id,
                "vehicle_name": row.vehicle_name,
                "brand": row.brand,
                "vehicle_type": row.vehicle_type,
                "registration_number": row.registration_number,
                "rental_price_per_day": row.rental_price_per_day,
                "fuel_type": row.fuel_type,
                "seating_capacity": row.seating_capacity,
                "vehicle_count": row.vehicle_count,
                "availability_status": row.availability_status,
                "has_active_booking": bool(row.active_booking_count),
                "primary_image": row.primary_image,
                "created_at": row.created_at,
            }
            for row in result.all()
        ]
        total_pages = max((total + page_size - 1) // page_size, 1)
        return jsonable_encoder(
            PaginatedResponse[VehicleListItem](
                items=[VehicleListItem.model_validate(item) for item in items],
                total=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages,
            )
        )

    data, cache_hit = await cache_or_fetch(redis, cache_key, settings.vehicle_list_cache_ttl, fetch)
    return PaginatedResponse[VehicleListItem].model_validate(data), cache_hit


async def get_vehicle_detail(db: AsyncSession, redis: Redis, vehicle_id: int) -> tuple[VehicleDetailResponse, bool]:
    cache_key = f"vehicle:v2:{vehicle_id}"

    async def fetch() -> dict:
        result = await db.execute(
            select(Vehicle)
            .where(Vehicle.id == vehicle_id)
            .options(selectinload(Vehicle.images), selectinload(Vehicle.manager))
        )
        vehicle = result.scalar_one_or_none()
        if vehicle is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")
        return _serialize_vehicle_detail(vehicle)

    data, cache_hit = await cache_or_fetch(redis, cache_key, settings.vehicle_detail_cache_ttl, fetch)
    return VehicleDetailResponse.model_validate(data), cache_hit


async def create_vehicle(db: AsyncSession, redis: Redis, payload: VehicleCreateRequest, actor: User) -> Vehicle:
    existing = await db.execute(select(Vehicle.id).where(Vehicle.registration_number == payload.registration_number.strip().upper()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Registration number already exists.")

    manager_id = actor.id if actor.role == UserRole.VEHICLE_MANAGER else payload.manager_id
    if manager_id is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="manager_id is required for admin-created vehicles.")

    await _get_manager(db, manager_id)
    vehicle = Vehicle(
        manager_id=manager_id,
        vehicle_name=payload.vehicle_name.strip(),
        brand=payload.brand.strip(),
        vehicle_type=payload.vehicle_type,
        registration_number=payload.registration_number.strip().upper(),
        rental_price_per_day=payload.rental_price_per_day,
        fuel_type=payload.fuel_type,
        seating_capacity=payload.seating_capacity,
        vehicle_count=payload.vehicle_count,
        availability_status=payload.availability_status,
        description=payload.description,
    )

    if payload.images:
        primary_set = any(image.is_primary for image in payload.images)
        for index, image in enumerate(payload.images):
            vehicle.images.append(VehicleImage(image_url=str(image.image_url), is_primary=image.is_primary or (index == 0 and not primary_set)))

    db.add(vehicle)
    await db.commit()
    vehicle = await _get_vehicle_with_images(db, vehicle.id)
    await invalidate_vehicle_cache(redis, vehicle.id, manager_id=vehicle.manager_id)
    logger.info(f"vehicle_created vehicle_id={vehicle.id} manager_id={vehicle.manager_id}")
    return vehicle


async def update_vehicle(db: AsyncSession, redis: Redis, vehicle_id: int, payload: VehicleUpdateRequest, actor: User) -> Vehicle:
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id).options(selectinload(Vehicle.images)))
    vehicle = result.scalar_one_or_none()
    if vehicle is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")

    update_data = payload.model_dump(exclude_unset=True)
    if actor.role == UserRole.VEHICLE_MANAGER and vehicle.manager_id != actor.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only update your own vehicles.")
    if await _vehicle_has_active_booking(db, vehicle.id) and set(update_data) != {"vehicle_count"}:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Vehicle has active or pending bookings and only stock count can be edited.")
    if "registration_number" in update_data:
        registration_number = update_data["registration_number"].strip().upper()
        existing = await db.execute(select(Vehicle.id).where(Vehicle.registration_number == registration_number, Vehicle.id != vehicle.id))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Registration number already exists.")
        update_data["registration_number"] = registration_number

    if "manager_id" in update_data:
        if actor.role != UserRole.ADMIN:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can reassign a vehicle manager.")
        await _get_manager(db, update_data["manager_id"])

    for field, value in update_data.items():
        setattr(vehicle, field, value)

    await db.commit()
    vehicle = await _get_vehicle_with_images(db, vehicle.id)
    await invalidate_vehicle_cache(redis, vehicle.id, manager_id=vehicle.manager_id)
    logger.info(f"vehicle_updated vehicle_id={vehicle.id} manager_id={vehicle.manager_id}")
    return vehicle


async def delete_vehicle(db: AsyncSession, redis: Redis, vehicle_id: int, actor: User) -> None:
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalar_one_or_none()
    if vehicle is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")
    if actor.role == UserRole.VEHICLE_MANAGER and vehicle.manager_id != actor.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own vehicles.")

    if await _vehicle_has_active_booking(db, vehicle.id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Vehicle has active or pending bookings and cannot be deleted.")

    manager_id = vehicle.manager_id
    await db.delete(vehicle)
    await db.commit()
    await invalidate_vehicle_cache(redis, vehicle_id, manager_id=manager_id)
    logger.info(f"vehicle_deleted vehicle_id={vehicle_id} manager_id={manager_id}")


async def add_vehicle_image(
    db: AsyncSession,
    redis: Redis,
    vehicle_id: int,
    payload: VehicleImageCreate,
    actor: User,
) -> VehicleImage:
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id).options(selectinload(Vehicle.images)))
    vehicle = result.scalar_one_or_none()
    if vehicle is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")
    if actor.role == UserRole.VEHICLE_MANAGER and vehicle.manager_id != actor.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only add images to your own vehicles.")
    if len(vehicle.images) >= 10:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Maximum 10 images are allowed per vehicle.")

    if payload.is_primary:
        for image in vehicle.images:
            image.is_primary = False

    image = VehicleImage(vehicle_id=vehicle.id, image_url=str(payload.image_url), is_primary=payload.is_primary or not vehicle.images)
    db.add(image)
    await db.commit()
    await db.refresh(image)
    await invalidate_vehicle_cache(redis, vehicle.id, manager_id=vehicle.manager_id)
    logger.info(f"vehicle_image_added vehicle_id={vehicle.id} image_id={image.id}")
    return image


async def get_vehicle_availability(
    db: AsyncSession,
    redis: Redis,
    vehicle_id: int,
    pickup_date,
    return_date,
) -> tuple[AvailabilityResponse, bool]:
    pickup = normalize_datetime(pickup_date) if pickup_date else None
    dropoff = normalize_datetime(return_date) if return_date else None
    hash_payload = {"pickup_date": pickup.isoformat() if pickup else None, "return_date": dropoff.isoformat() if dropoff else None}
    cache_key = f"vehicle:availability:v2:{vehicle_id}:{filters_hash(hash_payload)}"

    async def fetch() -> dict:
        vehicle = await db.scalar(select(Vehicle).where(Vehicle.id == vehicle_id))
        if vehicle is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")

        result = await db.execute(
            select(Booking.pickup_date, Booking.return_date, Booking.status)
            .where(
                Booking.vehicle_id == vehicle_id,
                Booking.status.in_([BookingStatus.PENDING, BookingStatus.APPROVED, BookingStatus.ACTIVE]),
            )
            .order_by(Booking.pickup_date.asc())
        )
        ranges = [
            AvailabilityRange(
                pickup_date=row.pickup_date,
                return_date=row.return_date,
                status=row.status.value if hasattr(row.status, "value") else str(row.status),
            )
            for row in result.all()
        ]

        available = vehicle.availability_status and vehicle.vehicle_count > 0
        if pickup and dropoff:
            available = available and not any(item.pickup_date < dropoff and item.return_date > pickup for item in ranges)

        return jsonable_encoder(
            AvailabilityResponse(
                vehicle_id=vehicle_id,
                available=available,
                requested_pickup_date=pickup,
                requested_return_date=dropoff,
                unavailable_ranges=ranges,
            )
        )

    data, cache_hit = await cache_or_fetch(redis, cache_key, settings.availability_cache_ttl, fetch)
    return AvailabilityResponse.model_validate(data), cache_hit
