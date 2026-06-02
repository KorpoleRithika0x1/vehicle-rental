from datetime import datetime
from decimal import Decimal

import stripe
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.database import get_session
from app.dependencies import get_current_user, require_role
from app.models import Booking, BookingStatus, PaymentStatus, User, UserRole, Vehicle
from app.redis_client import get_redis
from app.services.booking_service import create_booking
from app.utils.date_utils import validate_booking_dates


router = APIRouter(prefix="/payments", tags=["payments"])
settings = get_settings()


def _get_stripe():
    if not settings.stripe_secret_key or settings.stripe_secret_key == "sk_test_YOUR_TEST_KEY":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe is not configured on the server.",
        )
    stripe.api_key = settings.stripe_secret_key
    return stripe


# ── Schemas ────────────────────────────────────────────────────────────────

class CreateIntentRequest(BaseModel):
    vehicle_id: int
    pickup_date: datetime
    return_date: datetime


class CreateIntentResponse(BaseModel):
    client_secret: str
    amount: int          # in paise
    currency: str
    payment_intent_id: str


class ConfirmPaymentRequest(BaseModel):
    payment_intent_id: str
    vehicle_id: int
    pickup_date: datetime
    return_date: datetime


class ConfirmPaymentResponse(BaseModel):
    booking_id: int
    status: str
    total_amount: Decimal
    message: str


# ── Endpoints ──────────────────────────────────────────────────────────────

@router.post("/create-intent", response_model=CreateIntentResponse)
async def create_payment_intent(
    payload: CreateIntentRequest,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role(UserRole.CUSTOMER)),
):
    _stripe = _get_stripe()

    # Validate dates and calculate amount
    pickup_date, return_date = validate_booking_dates(payload.pickup_date, payload.return_date)

    existing_active = await db.execute(
        select(Booking.id).where(
            Booking.customer_id == current_user.id,
            Booking.status.in_([BookingStatus.PENDING, BookingStatus.APPROVED, BookingStatus.ACTIVE]),
        )
    )
    if existing_active.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "You already have an active booking. You cannot make another booking until "
                "your current booking is completed or cancelled."
            ),
        )

    vehicle_result = await db.execute(select(Vehicle).where(Vehicle.id == payload.vehicle_id))
    vehicle = vehicle_result.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")
    if not vehicle.availability_status:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Vehicle is not available.")

    overlap = await db.execute(
        select(Booking.id).where(
            Booking.vehicle_id == payload.vehicle_id,
            Booking.status.in_([BookingStatus.PENDING, BookingStatus.APPROVED, BookingStatus.ACTIVE]),
            Booking.pickup_date < return_date,
            Booking.return_date > pickup_date,
        )
    )
    if overlap.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This vehicle is not available for your selected dates. Please choose different dates.",
        )

    days = max((return_date.date() - pickup_date.date()).days, 1)
    total_inr = Decimal(vehicle.rental_price_per_day) * days
    amount_paise = int(total_inr * 100)  # INR → paise

    intent = _stripe.PaymentIntent.create(
        amount=amount_paise,
        currency="inr",
        metadata={
            "customer_id": str(current_user.id),
            "vehicle_id": str(payload.vehicle_id),
            "pickup_date": pickup_date.isoformat(),
            "return_date": return_date.isoformat(),
        },
    )

    return CreateIntentResponse(
        client_secret=intent.client_secret,
        amount=amount_paise,
        currency="inr",
        payment_intent_id=intent.id,
    )


@router.post("/confirm", response_model=ConfirmPaymentResponse)
async def confirm_payment(
    payload: ConfirmPaymentRequest,
    db: AsyncSession = Depends(get_session),
    redis=Depends(get_redis),
    current_user: User = Depends(require_role(UserRole.CUSTOMER)),
):
    _stripe = _get_stripe()

    # Verify PaymentIntent status with Stripe
    try:
        intent = _stripe.PaymentIntent.retrieve(payload.payment_intent_id)
    except stripe.error.StripeError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stripe error: {exc.user_message or str(exc)}",
        )

    if intent.status != "succeeded":
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Payment not completed. Stripe status: {intent.status}",
        )

    # Create the booking
    booking = await create_booking(
        db=db,
        redis=redis,
        customer_id=current_user.id,
        vehicle_id=payload.vehicle_id,
        pickup_date=payload.pickup_date,
        return_date=payload.return_date,
    )

    # Stamp payment info on the booking
    booking.payment_intent_id = payload.payment_intent_id
    booking.payment_status = PaymentStatus.PAID
    booking.paid_at = datetime.utcnow()
    await db.commit()
    await db.refresh(booking)

    return ConfirmPaymentResponse(
        booking_id=booking.id,
        status=booking.status.value,
        total_amount=booking.total_amount,
        message="Booking confirmed successfully.",
    )
