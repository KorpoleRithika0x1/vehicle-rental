from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.dependencies import require_role
from app.models import Booking, BookingStatus, User, UserRole, Vehicle
from app.models.review import Review

router = APIRouter(prefix="/reports", tags=["reports"])

REVENUE_STATUSES = [BookingStatus.APPROVED, BookingStatus.ACTIVE, BookingStatus.COMPLETED]


@router.get("/region/{city}")
async def region_report(
    city: str,
    db: AsyncSession = Depends(get_session),
    _: User = Depends(require_role(UserRole.ADMIN)),
):
    # Total bookings
    total_bookings = await db.scalar(
        select(func.count(Booking.id))
        .join(Vehicle, Vehicle.id == Booking.vehicle_id)
        .where(Vehicle.city == city)
    ) or 0

    # Unique customers
    unique_customers = await db.scalar(
        select(func.count(func.distinct(Booking.customer_id)))
        .join(Vehicle, Vehicle.id == Booking.vehicle_id)
        .where(Vehicle.city == city)
    ) or 0

    # Total revenue
    total_revenue = await db.scalar(
        select(func.coalesce(func.sum(Booking.total_amount), 0))
        .join(Vehicle, Vehicle.id == Booking.vehicle_id)
        .where(Vehicle.city == city, Booking.status.in_(REVENUE_STATUSES))
    ) or 0

    # Total vehicles in region
    total_vehicles = await db.scalar(
        select(func.count(Vehicle.id)).where(Vehicle.city == city)
    ) or 0

    # Average review rating
    avg_rating = await db.scalar(
        select(func.avg(Review.rating))
        .join(Vehicle, Vehicle.id == Review.vehicle_id)
        .where(Vehicle.city == city)
    )

    # Booking status breakdown
    status_rows = await db.execute(
        select(Booking.status, func.count(Booking.id).label("count"))
        .join(Vehicle, Vehicle.id == Booking.vehicle_id)
        .where(Vehicle.city == city)
        .group_by(Booking.status)
    )
    status_breakdown = [
        {"status": row.status.value if hasattr(row.status, "value") else str(row.status), "count": row.count}
        for row in status_rows.all()
    ]

    # Monthly revenue trend (last 6 months)
    trend_rows = await db.execute(
        select(
            func.date_format(Booking.created_at, "%Y-%m").label("month"),
            func.coalesce(func.sum(Booking.total_amount), 0).label("revenue"),
        )
        .join(Vehicle, Vehicle.id == Booking.vehicle_id)
        .where(Vehicle.city == city, Booking.status.in_(REVENUE_STATUSES))
        .group_by("month")
        .order_by("month")
    )
    revenue_trend = [{"label": row.month, "revenue": float(row.revenue)} for row in trend_rows.all()[-6:]]

    # Monthly bookings trend (last 6 months)
    bookings_trend_rows = await db.execute(
        select(
            func.date_format(Booking.created_at, "%Y-%m").label("month"),
            func.count(Booking.id).label("count"),
        )
        .join(Vehicle, Vehicle.id == Booking.vehicle_id)
        .where(Vehicle.city == city)
        .group_by("month")
        .order_by("month")
    )
    bookings_trend = [{"label": row.month, "count": row.count} for row in bookings_trend_rows.all()[-6:]]

    return {
        "city": city,
        "total_bookings": total_bookings,
        "unique_customers": unique_customers,
        "total_revenue": float(total_revenue),
        "total_vehicles": total_vehicles,
        "avg_rating": round(float(avg_rating), 1) if avg_rating else None,
        "status_breakdown": status_breakdown,
        "revenue_trend": revenue_trend,
        "bookings_trend": bookings_trend,
    }
