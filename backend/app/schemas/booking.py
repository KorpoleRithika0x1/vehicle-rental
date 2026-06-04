from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.booking import BookingStatus
from app.schemas.common import ORMBaseModel


class BookingCreateRequest(BaseModel):
    vehicle_id: int
    pickup_date: datetime
    return_date: datetime
    pickup_address: str | None = None


class BookingVehicleSummary(BaseModel):
    id: int
    vehicle_name: str
    brand: str
    vehicle_type: str
    primary_image: str | None = None


class BookingCustomerSummary(BaseModel):
    id: int
    name: str
    email: str


class BookingResponse(ORMBaseModel):
    id: int
    customer_id: int
    vehicle_id: int
    pickup_date: datetime
    return_date: datetime
    pickup_address: str | None = None
    total_amount: Decimal
    status: BookingStatus
    created_at: datetime
    updated_at: datetime


class BookingListItem(BaseModel):
    id: int
    customer_id: int
    customer_name: str
    vehicle_id: int
    vehicle_name: str
    brand: str
    primary_image: str | None = None
    pickup_date: datetime
    return_date: datetime
    total_amount: Decimal
    status: BookingStatus
    created_at: datetime


class BookingDetailResponse(BookingResponse):
    vehicle: BookingVehicleSummary
    customer: BookingCustomerSummary
