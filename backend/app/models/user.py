from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, Enum as SqlEnum, String, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, Enum):
    CUSTOMER = "customer"
    VEHICLE_MANAGER = "vehicle_manager"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SqlEnum(UserRole, name="user_role", values_callable=lambda enum: [item.value for item in enum]),
        nullable=False,
        server_default=UserRole.CUSTOMER.value,
    )
    profile_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    driving_license_number: Mapped[str | None] = mapped_column(String(50), nullable=True, default=None)
    license_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("0"), default=False)
    license_document_url: Mapped[str | None] = mapped_column(String(500), nullable=True, default=None)

    @property
    def license_number(self) -> str | None:
        return self.driving_license_number

    @license_number.setter
    def license_number(self, value: str | None) -> None:
        self.driving_license_number = value

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("1"), default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    managed_vehicles = relationship("Vehicle", back_populates="manager", cascade="all,delete")
    bookings = relationship("Booking", back_populates="customer", cascade="all,delete")
