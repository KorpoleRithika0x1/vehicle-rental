from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_session
from app.dependencies import get_current_user, require_role
from app.models import Booking, BookingStatus, ManagerRegion, Review, User, UserRole, Vehicle

router = APIRouter(prefix="/reviews", tags=["reviews"])


class ReviewCreate(BaseModel):
    booking_id: int
    rating: int = Field(..., ge=1, le=5)
    title: str | None = None
    comment: str | None = None


class ReviewOut(BaseModel):
    id: int
    booking_id: int
    customer_name: str
    vehicle_name: str
    vehicle_city: str
    rating: int
    title: str | None
    comment: str | None
    created_at: str

    model_config = {"from_attributes": True}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def submit_review(
    payload: ReviewCreate,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role(UserRole.CUSTOMER)),
):
    # Booking must be completed and belong to this customer
    result = await db.execute(
        select(Booking)
        .where(Booking.id == payload.booking_id, Booking.customer_id == current_user.id)
        .options(selectinload(Booking.vehicle))
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")
    if booking.status != BookingStatus.COMPLETED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only completed bookings can be reviewed.")

    # One review per booking
    existing = await db.scalar(select(Review.id).where(Review.booking_id == payload.booking_id))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You have already reviewed this booking.")

    review = Review(
        booking_id=payload.booking_id,
        customer_id=current_user.id,
        vehicle_id=booking.vehicle_id,
        rating=payload.rating,
        title=payload.title,
        comment=payload.comment,
    )
    db.add(review)
    await db.commit()
    return {"message": "Review submitted successfully."}


@router.get("/", response_model=list[ReviewOut])
async def list_reviews(
    city: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in [UserRole.ADMIN, UserRole.VEHICLE_MANAGER]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    query = (
        select(Review)
        .join(Vehicle, Vehicle.id == Review.vehicle_id)
        .join(User, User.id == Review.customer_id)
        .options(selectinload(Review.customer), selectinload(Review.vehicle))
        .order_by(Review.created_at.desc())
    )

    if current_user.role == UserRole.VEHICLE_MANAGER:
        cities_result = await db.execute(
            select(ManagerRegion.city).where(ManagerRegion.manager_id == current_user.id)
        )
        manager_cities = cities_result.scalars().all()
        if manager_cities:
            query = query.where(Vehicle.city.in_(manager_cities))
        else:
            query = query.where(Vehicle.manager_id == current_user.id)

    if city:
        query = query.where(Vehicle.city == city)

    result = await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    reviews = result.scalars().all()

    return [
        ReviewOut(
            id=r.id,
            booking_id=r.booking_id,
            customer_name=r.customer.name,
            vehicle_name=r.vehicle.vehicle_name,
            vehicle_city=r.vehicle.city,
            rating=r.rating,
            title=r.title,
            comment=r.comment,
            created_at=r.created_at.isoformat(),
        )
        for r in reviews
    ]


@router.get("/my", response_model=list[dict])
async def my_reviews(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role(UserRole.CUSTOMER)),
):
    """Returns booking_ids that this customer has already reviewed."""
    result = await db.execute(
        select(Review.booking_id).where(Review.customer_id == current_user.id)
    )
    return [{"booking_id": row} for row in result.scalars().all()]
