from datetime import UTC, datetime

from fastapi import HTTPException, status


def normalize_datetime(value: datetime) -> datetime:
    if value.tzinfo is not None:
        return value.astimezone(UTC).replace(tzinfo=None)
    return value


def calculate_rental_days(pickup_date: datetime, return_date: datetime) -> int:
    normalized_pickup = normalize_datetime(pickup_date)
    normalized_return = normalize_datetime(return_date)
    return (normalized_return.date() - normalized_pickup.date()).days


def validate_booking_dates(pickup_date: datetime, return_date: datetime) -> tuple[datetime, datetime]:
    pickup = normalize_datetime(pickup_date)
    dropoff = normalize_datetime(return_date)
    today = datetime.now(UTC).date()

    if pickup.date() < today:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Pickup date must be today or later.")
    if dropoff <= pickup:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Return date must be after pickup date.")

    rental_days = calculate_rental_days(pickup, dropoff)
    if rental_days < 1:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Return date must be at least one day after pickup date.")
    if rental_days > 90:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Maximum rental duration is 90 days.")

    return pickup, dropoff
