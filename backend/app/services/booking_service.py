import asyncio
import uuid
from decimal import Decimal

from fastapi import BackgroundTasks, HTTPException, status
from fastapi.encoders import jsonable_encoder
from loguru import logger
from redis.asyncio import Redis
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.models import Booking, BookingStatus, ManagerRegion, User, UserRole, Vehicle, VehicleImage
from app.schemas.booking import BookingDetailResponse, BookingListItem
from app.schemas.common import PaginatedResponse
from app.services.cache_service import invalidate_pattern
from app.services.notification_service import create_notification
from app.utils.date_utils import calculate_rental_days, validate_booking_dates


settings = get_settings()
LOCK_EXPIRE_SECONDS = settings.redis_lock_expire_seconds
ACTIVE_BOOKING_STATUSES = [BookingStatus.APPROVED, BookingStatus.ACTIVE]


async def _invalidate_booking_cache(redis: Redis, booking: Booking) -> None:
    try:
        await invalidate_pattern(redis, f"vehicle:availability:{booking.vehicle_id}:*")
        await invalidate_pattern(redis, f"vehicle:availability:v2:{booking.vehicle_id}:*")
        await invalidate_pattern(redis, "vehicles:list:*")
        await redis.delete(f"vehicle:{booking.vehicle_id}", f"vehicle:v2:{booking.vehicle_id}")
        if booking.vehicle:
            await redis.delete(f"stats:manager:{booking.vehicle.manager_id}")
        await redis.delete("stats:admin")
    except Exception as exc:
        logger.warning(f"booking_cache_invalidate_failed booking_id={booking.id} error={exc}")


def _queue_notification(background_tasks: BackgroundTasks | None, event: str, booking: Booking) -> None:
    if background_tasks is None:
        return
    background_tasks.add_task(
        logger.info,
        f"booking_notification event={event} booking_id={booking.id} customer_id={booking.customer_id} vehicle_id={booking.vehicle_id}",
    )


async def create_booking(
    db: AsyncSession,
    redis: Redis,
    customer_id: int,
    vehicle_id: int,
    pickup_date,
    return_date,
) -> Booking:
    customer_result = await db.execute(select(User).where(User.id == customer_id))
    customer = customer_result.scalar_one_or_none()
    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")

    pickup_date, return_date = validate_booking_dates(pickup_date, return_date)

    # Block customer if they already have an approved/active booking overlapping these dates
    existing_active = await db.execute(
        select(Booking.id).where(
            Booking.customer_id == customer_id,
            Booking.status.in_(ACTIVE_BOOKING_STATUSES),
            Booking.pickup_date < return_date,
            Booking.return_date > pickup_date,
        )
    )
    if existing_active.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have a booking that overlaps with these dates.",
        )

    lock_key = f"booking_lock:vehicle:{vehicle_id}"
    lock_value = str(uuid.uuid4())

    try:
        acquired = await asyncio.wait_for(
            redis.set(lock_key, lock_value, nx=True, ex=LOCK_EXPIRE_SECONDS),
            timeout=3,
        )
    except asyncio.TimeoutError as exc:
        logger.error(f"booking_lock_timeout vehicle_id={vehicle_id}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Booking service is temporarily unavailable. Please try again.",
        ) from exc
    except Exception as exc:
        logger.warning(f"booking_lock_unavailable vehicle_id={vehicle_id} error={exc} — proceeding without lock")
        acquired = True

    if not acquired:
        logger.warning(f"booking_lock_busy vehicle_id={vehicle_id}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Vehicle is being booked by another user. Please try again.",
        )

    logger.info(f"booking_lock_acquired vehicle_id={vehicle_id} customer_id={customer_id}")
    try:
        # Count active bookings for this vehicle in the date range vs stock
        overlap_count_result = await db.execute(
            select(func.count(Booking.id)).where(
                Booking.vehicle_id == vehicle_id,
                Booking.status.in_(ACTIVE_BOOKING_STATUSES),
                Booking.pickup_date < return_date,
                Booking.return_date > pickup_date,
            )
        )
        overlap_count = overlap_count_result.scalar() or 0

        vehicle_result = await db.execute(
            select(Vehicle)
            .where(Vehicle.id == vehicle_id)
            .options(selectinload(Vehicle.manager))
        )
        vehicle = vehicle_result.scalar_one_or_none()
        if vehicle is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")
        if not vehicle.availability_status:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Vehicle is currently unavailable.")

        if overlap_count >= vehicle.vehicle_count:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Vehicle is not available for the selected dates.",
            )

        days = calculate_rental_days(pickup_date, return_date)
        if days < 1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Return date must be after pickup date.")
        total = Decimal(vehicle.rental_price_per_day) * days

        booking = Booking(
            customer_id=customer_id,
            vehicle_id=vehicle_id,
            pickup_date=pickup_date,
            return_date=return_date,
            total_amount=total,
            status=BookingStatus.APPROVED,
        )
        db.add(booking)
        await db.commit()
        await db.refresh(booking)
        booking.vehicle = vehicle
        # Decrement stock immediately on booking
        vehicle_for_stock = await _load_vehicle_for_stock_update(db, vehicle_id)
        vehicle_for_stock.vehicle_count -= 1
        await db.commit()
        pickup_str = booking.pickup_date.strftime("%d %b %Y")
        return_str = booking.return_date.strftime("%d %b %Y")
        await create_notification(
            db=db,
            user_id=vehicle.manager_id,
            title="New Booking Confirmed",
            message=(
                f"{customer.name} has booked {vehicle.vehicle_name} "
                f"from {pickup_str} to {return_str}."
            ),
            notification_type="booking_confirmed",
            reference_id=str(booking.id),
        )
        await create_notification(
            db=db,
            user_id=customer_id,
            title="Booking Confirmed",
            message=(
                f"Your booking for {vehicle.vehicle_name} from {pickup_str} to {return_str} is confirmed."
            ),
            notification_type="booking_confirmed",
            reference_id=str(booking.id),
        )

        try:
            await redis.delete(f"vehicle:{vehicle_id}")
            await redis.delete(f"vehicle:v2:{vehicle_id}")
            await invalidate_pattern(redis, "vehicles:list:*")
            await invalidate_pattern(redis, f"vehicle:availability:{vehicle_id}:*")
            await invalidate_pattern(redis, f"vehicle:availability:v2:{vehicle_id}:*")
            await redis.delete("stats:admin")
            await redis.delete(f"stats:manager:{vehicle.manager_id}")
        except Exception as exc:
            logger.warning(f"booking_cache_invalidate_failed vehicle_id={vehicle_id} error={exc}")
        logger.info(f"booking_created booking_id={booking.id} vehicle_id={vehicle_id} customer_id={customer_id}")
        return booking
    finally:
        try:
            stored = await redis.get(lock_key)
            if stored and stored.decode() == lock_value:
                await redis.delete(lock_key)
                logger.info(f"booking_lock_released vehicle_id={vehicle_id} customer_id={customer_id}")
        except Exception as exc:
            logger.warning(f"booking_lock_release_failed vehicle_id={vehicle_id} error={exc}")


async def list_bookings(
    db: AsyncSession,
    actor: User,
    *,
    page: int,
    page_size: int,
    status_filter: str | None = None,
) -> PaginatedResponse[BookingListItem]:
    primary_image_subquery = (
        select(VehicleImage.vehicle_id, VehicleImage.image_url.label("primary_image"))
        .where(VehicleImage.is_primary.is_(True))
        .subquery()
    )
    query = (
        select(
            Booking.id,
            Booking.customer_id,
            User.name.label("customer_name"),
            Vehicle.id.label("vehicle_id"),
            Vehicle.vehicle_name,
            Vehicle.brand,
            primary_image_subquery.c.primary_image,
            Booking.pickup_date,
            Booking.return_date,
            Booking.total_amount,
            Booking.status,
            Booking.created_at,
        )
        .join(User, User.id == Booking.customer_id)
        .join(Vehicle, Vehicle.id == Booking.vehicle_id)
        .outerjoin(primary_image_subquery, primary_image_subquery.c.vehicle_id == Vehicle.id)
        .order_by(Booking.created_at.desc())
    )
    count_query = select(func.count(Booking.id)).join(Vehicle, Vehicle.id == Booking.vehicle_id)
    if status_filter:
        status_values = [value.strip().lower() for value in status_filter.split(",") if value.strip()]
        if status_values:
            try:
                statuses = [BookingStatus(value) for value in status_values]
            except ValueError as exc:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid booking status filter.") from exc
            query = query.where(Booking.status.in_(statuses))
            count_query = count_query.where(Booking.status.in_(statuses))
    if actor.role == UserRole.CUSTOMER:
        query = query.where(Booking.customer_id == actor.id)
        count_query = count_query.where(Booking.customer_id == actor.id)
    elif actor.role == UserRole.VEHICLE_MANAGER:
        cities_result = await db.execute(select(ManagerRegion.city).where(ManagerRegion.manager_id == actor.id))
        manager_cities = cities_result.scalars().all()
        if manager_cities:
            query = query.where(Vehicle.city.in_(manager_cities))
            count_query = count_query.where(Vehicle.city.in_(manager_cities))
        else:
            query = query.where(Vehicle.manager_id == actor.id)
            count_query = count_query.where(Vehicle.manager_id == actor.id)

    total = await db.scalar(count_query) or 0
    result = await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    items = [
        BookingListItem(
            id=row.id,
            customer_id=row.customer_id,
            customer_name=row.customer_name,
            vehicle_id=row.vehicle_id,
            vehicle_name=row.vehicle_name,
            brand=row.brand,
            primary_image=row.primary_image,
            pickup_date=row.pickup_date,
            return_date=row.return_date,
            total_amount=row.total_amount,
            status=row.status,
            created_at=row.created_at,
        )
        for row in result.all()
    ]
    total_pages = max((total + page_size - 1) // page_size, 1)
    return PaginatedResponse[BookingListItem](
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


async def get_booking_detail(db: AsyncSession, booking_id: int, actor: User) -> BookingDetailResponse:
    result = await db.execute(
        select(Booking)
        .where(Booking.id == booking_id)
        .options(
            selectinload(Booking.customer),
            selectinload(Booking.vehicle).selectinload(Vehicle.images),
        )
    )
    booking = result.scalar_one_or_none()
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")

    if actor.role == UserRole.CUSTOMER and booking.customer_id != actor.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own bookings.")
    if actor.role == UserRole.VEHICLE_MANAGER and booking.vehicle.manager_id != actor.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view bookings for your own vehicles.")

    primary_image = next((image.image_url for image in booking.vehicle.images if image.is_primary), None)
    return BookingDetailResponse.model_validate(
        jsonable_encoder(
            {
                "id": booking.id,
                "customer_id": booking.customer_id,
                "vehicle_id": booking.vehicle_id,
                "pickup_date": booking.pickup_date,
                "return_date": booking.return_date,
                "total_amount": booking.total_amount,
                "status": booking.status,
                "created_at": booking.created_at,
                "updated_at": booking.updated_at,
                "vehicle": {
                    "id": booking.vehicle.id,
                    "vehicle_name": booking.vehicle.vehicle_name,
                    "brand": booking.vehicle.brand,
                    "vehicle_type": booking.vehicle.vehicle_type.value,
                    "primary_image": primary_image,
                },
                "customer": {
                    "id": booking.customer.id,
                    "name": booking.customer.name,
                    "email": booking.customer.email,
                },
            }
        )
    )


async def _load_booking_for_update(db: AsyncSession, booking_id: int) -> Booking:
    result = await db.execute(
        select(Booking)
        .where(Booking.id == booking_id)
        .options(
            selectinload(Booking.vehicle).selectinload(Vehicle.manager),
            selectinload(Booking.customer),
        )
    )
    booking = result.scalar_one_or_none()
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")
    return booking


async def _load_vehicle_for_stock_update(db: AsyncSession, vehicle_id: int) -> Vehicle:
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id).with_for_update())
    vehicle = result.scalar_one_or_none()
    if vehicle is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")
    return vehicle


def _check_management_access(actor: User, booking: Booking) -> None:
    if actor.role == UserRole.CUSTOMER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Customers cannot manage bookings.")
    if actor.role == UserRole.VEHICLE_MANAGER and booking.vehicle.manager_id != actor.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only manage bookings for your own vehicles.")


async def approve_booking(
    db: AsyncSession,
    redis: Redis,
    booking_id: int,
    actor: User,
    background_tasks: BackgroundTasks | None = None,
) -> Booking:
    booking = await _load_booking_for_update(db, booking_id)
    _check_management_access(actor, booking)
    if booking.status != BookingStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only pending bookings can be approved.")
    vehicle = await _load_vehicle_for_stock_update(db, booking.vehicle_id)
    vehicle.vehicle_count -= 1
    booking.status = BookingStatus.APPROVED
    await db.commit()
    await db.refresh(booking)
    await _invalidate_booking_cache(redis, booking)
    logger.info(f"booking_approved booking_id={booking.id} actor_id={actor.id}")
    _queue_notification(background_tasks, "approved", booking)
    return booking


async def reject_booking(
    db: AsyncSession,
    redis: Redis,
    booking_id: int,
    actor: User,
    background_tasks: BackgroundTasks | None = None,
) -> Booking:
    booking = await _load_booking_for_update(db, booking_id)
    _check_management_access(actor, booking)
    if booking.status != BookingStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only pending bookings can be rejected.")
    booking.status = BookingStatus.CANCELLED
    await db.commit()
    await db.refresh(booking)
    await _invalidate_booking_cache(redis, booking)
    logger.info(f"booking_rejected booking_id={booking.id} actor_id={actor.id}")
    _queue_notification(background_tasks, "rejected", booking)
    return booking


async def cancel_booking(
    db: AsyncSession,
    redis: Redis,
    booking_id: int,
    actor: User,
    background_tasks: BackgroundTasks | None = None,
) -> Booking:
    booking = await _load_booking_for_update(db, booking_id)

    if actor.role == UserRole.CUSTOMER:
        if booking.customer_id != actor.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only cancel your own bookings.")
        if booking.status not in [BookingStatus.APPROVED]:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You can only cancel approved bookings.")
    elif booking.status == BookingStatus.COMPLETED:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Completed bookings cannot be cancelled.")

    if booking.status == BookingStatus.CANCELLED:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Booking is already cancelled.")

    if booking.status == BookingStatus.APPROVED:
        vehicle = await _load_vehicle_for_stock_update(db, booking.vehicle_id)
        vehicle.vehicle_count += 1
    booking.status = BookingStatus.CANCELLED
    await db.commit()
    await db.refresh(booking)
    await _invalidate_booking_cache(redis, booking)
    logger.info(f"booking_cancelled booking_id={booking.id} actor_id={actor.id}")
    _queue_notification(background_tasks, "cancelled", booking)
    return booking


async def complete_booking(
    db: AsyncSession,
    redis: Redis,
    booking_id: int,
    actor: User,
    background_tasks: BackgroundTasks | None = None,
) -> Booking:
    booking = await _load_booking_for_update(db, booking_id)
    _check_management_access(actor, booking)
    if booking.status != BookingStatus.APPROVED:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only approved bookings can be completed.")
    from datetime import datetime
    if datetime.utcnow() < booking.return_date:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Booking cannot be completed before the return date.")
    vehicle = await _load_vehicle_for_stock_update(db, booking.vehicle_id)
    vehicle.vehicle_count += 1
    booking.status = BookingStatus.COMPLETED
    await db.commit()
    await db.refresh(booking)
    await _invalidate_booking_cache(redis, booking)
    
    await create_notification(
        db=db,
        user_id=booking.customer_id,
        title="Booking Completed",
        message=f"Your booking for {booking.vehicle.vehicle_name} has been completed. Thank you for choosing us!",
        notification_type="booking_completed",
        reference_id=str(booking.id),
    )
    
    logger.info(f"booking_completed booking_id={booking.id} actor_id={actor.id}")
    _queue_notification(background_tasks, "completed", booking)
    return booking
