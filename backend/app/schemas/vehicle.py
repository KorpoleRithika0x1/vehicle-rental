from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, HttpUrl, field_validator

from app.models.vehicle import FuelType, VehicleType
from app.schemas.common import ORMBaseModel


class VehicleImageCreate(BaseModel):
    image_url: HttpUrl
    is_primary: bool = False


class VehicleImageResponse(ORMBaseModel):
    id: int
    image_url: str
    is_primary: bool


class VehicleBase(BaseModel):
    vehicle_name: str = Field(min_length=2, max_length=150)
    brand: str = Field(min_length=2, max_length=100)
    vehicle_type: VehicleType
    registration_number: str = Field(min_length=3, max_length=50)
    rental_price_per_day: Decimal = Field(gt=0)
    fuel_type: FuelType
    seating_capacity: int = Field(ge=1, le=50)
    vehicle_count: int = Field(default=1, ge=0)
    availability_status: bool = True
    description: str | None = None


class VehicleCreateRequest(VehicleBase):
    manager_id: int | None = None
    images: list[VehicleImageCreate] = Field(default_factory=list, max_length=10)

    @field_validator("images")
    @classmethod
    def validate_image_count(cls, value: list[VehicleImageCreate]) -> list[VehicleImageCreate]:
        if len(value) > 10:
            raise ValueError("Maximum 10 images are allowed per vehicle.")
        return value


class VehicleUpdateRequest(BaseModel):
    manager_id: int | None = None
    vehicle_name: str | None = Field(default=None, min_length=2, max_length=150)
    brand: str | None = Field(default=None, min_length=2, max_length=100)
    vehicle_type: VehicleType | None = None
    registration_number: str | None = Field(default=None, min_length=3, max_length=50)
    rental_price_per_day: Decimal | None = Field(default=None, gt=0)
    fuel_type: FuelType | None = None
    seating_capacity: int | None = Field(default=None, ge=1, le=50)
    vehicle_count: int | None = Field(default=None, ge=0)
    availability_status: bool | None = None
    description: str | None = None


class VehicleListItem(BaseModel):
    id: int
    manager_id: int
    vehicle_name: str
    brand: str
    vehicle_type: VehicleType
    registration_number: str
    rental_price_per_day: Decimal
    fuel_type: FuelType
    seating_capacity: int
    vehicle_count: int
    availability_status: bool
    has_active_booking: bool = False
    primary_image: str | None = None
    created_at: datetime


class VehicleResponse(ORMBaseModel):
    id: int
    manager_id: int
    vehicle_name: str
    brand: str
    vehicle_type: VehicleType
    registration_number: str
    rental_price_per_day: Decimal
    fuel_type: FuelType
    seating_capacity: int
    vehicle_count: int
    availability_status: bool
    description: str | None = None
    created_at: datetime
    updated_at: datetime
    images: list[VehicleImageResponse] = Field(default_factory=list)


class VehicleDetailResponse(VehicleResponse):
    manager_name: str | None = None


class AvailabilityRange(BaseModel):
    pickup_date: datetime
    return_date: datetime
    status: str


class AvailabilityResponse(BaseModel):
    vehicle_id: int
    available: bool
    requested_pickup_date: datetime | None = None
    requested_return_date: datetime | None = None
    unavailable_ranges: list[AvailabilityRange] = Field(default_factory=list)
