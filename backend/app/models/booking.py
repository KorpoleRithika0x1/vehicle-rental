from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SqlEnum, ForeignKey, Index, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class BookingStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (
        Index("idx_vehicle_dates", "vehicle_id", "pickup_date", "return_date"),
        Index("idx_customer", "customer_id"),
        Index("idx_status", "status"),
        Index("idx_customer_status", "customer_id", "status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id", ondelete="RESTRICT"), nullable=False, index=True)
    pickup_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    return_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[BookingStatus] = mapped_column(
        SqlEnum(BookingStatus, name="booking_status"),
        nullable=False,
        server_default=BookingStatus.PENDING.value,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    customer = relationship("User", back_populates="bookings")
    vehicle = relationship("Vehicle", back_populates="bookings")
