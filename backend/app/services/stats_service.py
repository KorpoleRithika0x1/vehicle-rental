from datetime import datetime

from fastapi.encoders import jsonable_encoder
from redis.asyncio import Redis
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models import Booking, BookingStatus, User, UserRole, Vehicle
from app.schemas.common import AdminStatsResponse, CustomerStatsResponse, ManagerStatsResponse, RevenuePoint, StatusBreakdown
from app.services.cache_service import cache_or_fetch


settings = get_settings()
REVENUE_STATUSES = [BookingStatus.APPROVED, BookingStatus.ACTIVE, BookingStatus.COMPLETED]


async def _build_revenue_trend(
    db: AsyncSession,
    *,
    manager_id: int | None = None,
) -> list[RevenuePoint]:
    query = (
        select(
            func.date_format(Booking.created_at, "%Y-%m").label("bucket"),
            func.coalesce(func.sum(Booking.total_amount), 0).label("revenue"),
        )
        .where(Booking.status.in_(REVENUE_STATUSES))
        .group_by("bucket")
        .order_by("bucket")
    )
    if manager_id is not None:
        query = query.join(Vehicle, Vehicle.id == Booking.vehicle_id).where(Vehicle.manager_id == manager_id)

    result = await db.execute(query)
    rows = result.all()[-6:]
    return [RevenuePoint(label=row.bucket, revenue=float(row.revenue or 0)) for row in rows]


async def _build_status_breakdown(
    db: AsyncSession,
    *,
    manager_id: int | None = None,
) -> list[StatusBreakdown]:
    query = select(Booking.status, func.count(Booking.id).label("count")).group_by(Booking.status)
    if manager_id is not None:
        query = query.join(Vehicle, Vehicle.id == Booking.vehicle_id).where(Vehicle.manager_id == manager_id)
    result = await db.execute(query)
    return [
        StatusBreakdown(status=row.status.value if hasattr(row.status, "value") else str(row.status), count=row.count)
        for row in result.all()
    ]


async def get_admin_stats(db: AsyncSession, redis: Redis) -> tuple[AdminStatsResponse, bool]:
    async def fetch() -> dict:
        total_users, active_users = (
            await db.execute(
                select(
                    func.count(User.id),
                    func.coalesce(func.sum(case((User.is_active.is_(True), 1), else_=0)), 0),
                )
            )
        ).one()
        total_vehicles, available_vehicles = (
            await db.execute(
                select(
                    func.count(Vehicle.id),
                    func.coalesce(func.sum(case((Vehicle.availability_status.is_(True), 1), else_=0)), 0),
                )
            )
        ).one()
        total_bookings, pending_bookings, approved_bookings, completed_bookings = (
            await db.execute(
                select(
                    func.count(Booking.id),
                    func.coalesce(func.sum(case((Booking.status == BookingStatus.PENDING, 1), else_=0)), 0),
                    func.coalesce(func.sum(case((Booking.status == BookingStatus.APPROVED, 1), else_=0)), 0),
                    func.coalesce(func.sum(case((Booking.status == BookingStatus.COMPLETED, 1), else_=0)), 0),
                )
            )
        ).one()
        month_prefix = datetime.utcnow().strftime("%Y-%m")
        monthly_revenue = await db.scalar(
            select(func.coalesce(func.sum(Booking.total_amount), 0)).where(
                Booking.status.in_(REVENUE_STATUSES),
                func.date_format(Booking.created_at, "%Y-%m") == month_prefix,
            )
        )
        payload = AdminStatsResponse(
            total_users=total_users,
            active_users=active_users,
            total_vehicles=total_vehicles,
            available_vehicles=available_vehicles,
            total_bookings=total_bookings,
            pending_bookings=pending_bookings,
            approved_bookings=approved_bookings,
            completed_bookings=completed_bookings,
            monthly_revenue=float(monthly_revenue or 0),
            revenue_trend=await _build_revenue_trend(db),
            booking_statuses=await _build_status_breakdown(db),
        )
        return jsonable_encoder(payload)

    data, cache_hit = await cache_or_fetch(redis, "stats:admin", settings.stats_cache_ttl, fetch)
    return AdminStatsResponse.model_validate(data), cache_hit


async def get_manager_stats(db: AsyncSession, redis: Redis, manager_id: int) -> tuple[ManagerStatsResponse, bool]:
    cache_key = f"stats:manager:{manager_id}"

    async def fetch() -> dict:
        fleet_size, available_fleet = (
            await db.execute(
                select(
                    func.count(Vehicle.id),
                    func.coalesce(func.sum(case((Vehicle.availability_status.is_(True), 1), else_=0)), 0),
                ).where(Vehicle.manager_id == manager_id)
            )
        ).one()
        total_bookings, pending_bookings, approved_bookings, completed_bookings = (
            await db.execute(
                select(
                    func.count(Booking.id),
                    func.coalesce(func.sum(case((Booking.status == BookingStatus.PENDING, 1), else_=0)), 0),
                    func.coalesce(func.sum(case((Booking.status == BookingStatus.APPROVED, 1), else_=0)), 0),
                    func.coalesce(func.sum(case((Booking.status == BookingStatus.COMPLETED, 1), else_=0)), 0),
                )
                .join(Vehicle, Vehicle.id == Booking.vehicle_id)
                .where(Vehicle.manager_id == manager_id)
            )
        ).one()
        month_prefix = datetime.utcnow().strftime("%Y-%m")
        monthly_revenue = await db.scalar(
            select(func.coalesce(func.sum(Booking.total_amount), 0))
            .join(Vehicle, Vehicle.id == Booking.vehicle_id)
            .where(
                Vehicle.manager_id == manager_id,
                Booking.status.in_(REVENUE_STATUSES),
                func.date_format(Booking.created_at, "%Y-%m") == month_prefix,
            )
        )
        payload = ManagerStatsResponse(
            fleet_size=fleet_size,
            available_fleet=available_fleet,
            total_bookings=total_bookings,
            pending_bookings=pending_bookings,
            approved_bookings=approved_bookings,
            completed_bookings=completed_bookings,
            monthly_revenue=float(monthly_revenue or 0),
            revenue_trend=await _build_revenue_trend(db, manager_id=manager_id),
            booking_statuses=await _build_status_breakdown(db, manager_id=manager_id),
        )
        return jsonable_encoder(payload)

    data, cache_hit = await cache_or_fetch(redis, cache_key, settings.stats_cache_ttl, fetch)
    return ManagerStatsResponse.model_validate(data), cache_hit


async def get_customer_stats(db: AsyncSession, customer_id: int) -> CustomerStatsResponse:
    total_bookings, active_bookings, pending_bookings, completed_bookings = (
        await db.execute(
            select(
                func.count(Booking.id),
                func.coalesce(func.sum(case((Booking.status == BookingStatus.ACTIVE, 1), else_=0)), 0),
                func.coalesce(func.sum(case((Booking.status == BookingStatus.PENDING, 1), else_=0)), 0),
                func.coalesce(func.sum(case((Booking.status == BookingStatus.COMPLETED, 1), else_=0)), 0),
            ).where(Booking.customer_id == customer_id)
        )
    ).one()
    total_spent = await db.scalar(
        select(func.coalesce(func.sum(Booking.total_amount), 0)).where(
            Booking.customer_id == customer_id,
            Booking.status.in_([BookingStatus.ACTIVE, BookingStatus.COMPLETED]),
        )
    )

    # Last 6 months booking count trend
    booking_trend_result = await db.execute(
        select(
            func.date_format(Booking.created_at, "%Y-%m").label("bucket"),
            func.count(Booking.id).label("count"),
        )
        .where(Booking.customer_id == customer_id)
        .group_by("bucket")
        .order_by("bucket")
    )
    booking_trend = [
        RevenuePoint(label=row.bucket, revenue=float(row.count))
        for row in booking_trend_result.all()[-6:]
    ]

    # Last 6 months spending trend
    spending_trend_result = await db.execute(
        select(
            func.date_format(Booking.created_at, "%Y-%m").label("bucket"),
            func.coalesce(func.sum(Booking.total_amount), 0).label("amount"),
        )
        .where(
            Booking.customer_id == customer_id,
            Booking.status.in_([BookingStatus.APPROVED, BookingStatus.ACTIVE, BookingStatus.COMPLETED]),
        )
        .group_by("bucket")
        .order_by("bucket")
    )
    spending_trend = [
        RevenuePoint(label=row.bucket, revenue=float(row.amount))
        for row in spending_trend_result.all()[-6:]
    ]

    return CustomerStatsResponse(
        total_bookings=total_bookings,
        active_bookings=active_bookings,
        pending_bookings=pending_bookings,
        completed_bookings=completed_bookings,
        total_spent=float(total_spent or 0),
        booking_trend=booking_trend,
        spending_trend=spending_trend,
    )
