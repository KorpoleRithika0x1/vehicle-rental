from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, Enum as SqlEnum, String, Text, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, Enum):
    CUSTOMER = "customer"
    VEHICLE_MANAGER = "vehicle_manager"
    ADMIN = "admin"


class AccountStatus(str, Enum):
    PENDING_VERIFICATION = "pending_verification"
    ACTIVE = "active"
    REJECTED = "rejected"
    SUSPENDED = "suspended"


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
    account_status: Mapped[AccountStatus] = mapped_column(
        SqlEnum(AccountStatus, name="account_status_enum", values_callable=lambda enum: [item.value for item in enum]),
        nullable=False,
        server_default=AccountStatus.PENDING_VERIFICATION.value,
    )
    profile_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    driving_license_number: Mapped[str | None] = mapped_column(String(50), nullable=True, default=None)
    license_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("0"), default=False)
    license_document_url: Mapped[str | None] = mapped_column(String(500), nullable=True, default=None)
    license_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)        # Cloudinary URL
    live_photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)           # Cloudinary URL
    verification_reviewed_by: Mapped[str | None] = mapped_column(String(36), nullable=True)  # reviewer user id
    verification_reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    @property
    def license_number(self) -> str | None:
        return self.driving_license_number

    @license_number.setter
    def license_number(self, value: str | None) -> None:
        self.driving_license_number = value

    @property
    def is_active(self) -> bool:
        return self.account_status == AccountStatus.ACTIVE

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    managed_vehicles = relationship("Vehicle", back_populates="manager", cascade="all,delete")
    bookings = relationship("Booking", back_populates="customer", cascade="all,delete")
