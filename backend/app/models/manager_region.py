from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ManagerRegion(Base):
    __tablename__ = "manager_regions"
    __table_args__ = (UniqueConstraint("manager_id", "city", name="uq_manager_city"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    manager_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    granted_by: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    granted_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())

    manager = relationship("User", foreign_keys=[manager_id])
