from datetime import UTC, datetime, timedelta

import pytest
from fastapi import HTTPException

from app.utils.date_utils import validate_booking_dates


def test_validate_booking_dates_allows_future_range():
    pickup = datetime.now(UTC).replace(tzinfo=None) + timedelta(days=2)
    dropoff = pickup + timedelta(days=3)
    validated_pickup, validated_dropoff = validate_booking_dates(pickup, dropoff)
    assert validated_pickup == pickup
    assert validated_dropoff == dropoff


def test_validate_booking_dates_rejects_past_booking():
    pickup = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=1)
    dropoff = datetime.now(UTC).replace(tzinfo=None) + timedelta(days=1)
    with pytest.raises(HTTPException):
        validate_booking_dates(pickup, dropoff)
