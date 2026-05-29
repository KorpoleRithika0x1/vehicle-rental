from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, CheckConstraint, DateTime, Enum as SqlEnum, ForeignKey, Index, Numeric, String, Text, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class VehicleType(str, Enum):
    CAR = "car"
    SUV = "suv"
    VAN = "van"
    TRUCK = "truck"
    BIKE = "bike"


class FuelType(str, Enum):
    PETROL = "petrol"
    DIESEL = "diesel"
    ELECTRIC = "electric"
    HYBRID = "hybrid"


class Vehicle(Base):
    __tablename__ = "vehicles"
    __table_args__ = (
        Index("idx_vehicles_availability_type_brand", "availability_status", "vehicle_type", "brand"),
        CheckConstraint("vehicle_count >= 0", name="ck_vehicles_vehicle_count_non_negative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    manager_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    vehicle_name: Mapped[str] = mapped_column(String(150), nullable=False)
    brand: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    vehicle_type: Mapped[VehicleType] = mapped_column(
        SqlEnum(VehicleType, name="vehicle_type", values_callable=lambda enum: [item.value for item in enum]),
        nullable=False,
        index=True,
    )
    registration_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    rental_price_per_day: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    fuel_type: Mapped[FuelType] = mapped_column(
        SqlEnum(FuelType, name="fuel_type", values_callable=lambda enum: [item.value for item in enum]),
        nullable=False,
    )
    seating_capacity: Mapped[int] = mapped_column(nullable=False)
    vehicle_count: Mapped[int] = mapped_column(nullable=False, server_default=text("1"), default=1)
    availability_status: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("1"), default=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    manager = relationship("User", back_populates="managed_vehicles")
    images = relationship("VehicleImage", back_populates="vehicle", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="vehicle")


class VehicleImage(Base):
    __tablename__ = "vehicle_images"

    id: Mapped[int] = mapped_column(primary_key=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("0"), default=False)

    vehicle = relationship("Vehicle", back_populates="images")
