from fastapi import APIRouter, BackgroundTasks, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.dependencies import get_current_user
from app.models import User, UserRole
from app.redis_client import get_redis
from app.schemas.booking import BookingCreateRequest, BookingDetailResponse, BookingListItem, BookingResponse
from app.schemas.common import PaginatedResponse
from app.schemas.vehicle import AvailabilityResponse
from app.services.booking_service import (
    cancel_booking,
    complete_booking,
    create_booking,
    get_booking_detail,
    list_bookings,
)
from app.services.vehicle_service import get_vehicle_availability


router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.get("/availability/{vehicle_id}", response_model=AvailabilityResponse)
async def get_booking_availability(
    vehicle_id: int,
    response: Response,
    db: AsyncSession = Depends(get_session),
    redis=Depends(get_redis),
) -> AvailabilityResponse:
    data, cache_hit = await get_vehicle_availability(db, redis, vehicle_id, None, None)
    response.headers["X-Cache"] = "HIT" if cache_hit else "MISS"
    return data


@router.post("/", response_model=BookingResponse)
async def post_booking(
    payload: BookingCreateRequest,
    db: AsyncSession = Depends(get_session),
    redis=Depends(get_redis),
    current_user: User = Depends(get_current_user),
) -> BookingResponse:
    if current_user.role != UserRole.CUSTOMER:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only customers can create bookings.")
    booking = await create_booking(
        db,
        redis,
        current_user.id,
        payload.vehicle_id,
        payload.pickup_date,
        payload.return_date,
        payload.pickup_address,
    )
    return BookingResponse.model_validate(booking)


@router.get("/", response_model=PaginatedResponse[BookingListItem])
async def get_bookings(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=50),
    status: str | None = Query(default=None),
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> PaginatedResponse[BookingListItem]:
    return await list_bookings(db, current_user, page=page, page_size=page_size, status_filter=status)


@router.get("/{booking_id}", response_model=BookingDetailResponse)
async def get_booking(
    booking_id: int,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> BookingDetailResponse:
    return await get_booking_detail(db, booking_id, current_user)



@router.put("/{booking_id}/cancel", response_model=BookingResponse)
async def cancel(
    booking_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_session),
    redis=Depends(get_redis),
    current_user: User = Depends(get_current_user),
) -> BookingResponse:
    booking = await cancel_booking(db, redis, booking_id, current_user, background_tasks)
    return BookingResponse.model_validate(booking)


@router.put("/{booking_id}/complete", response_model=BookingResponse)
async def complete(
    booking_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_session),
    redis=Depends(get_redis),
    current_user: User = Depends(get_current_user),
) -> BookingResponse:
    booking = await complete_booking(db, redis, booking_id, current_user, background_tasks)
    return BookingResponse.model_validate(booking)
