from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.dependencies import get_current_user, require_role
from app.models import User, UserRole
from app.redis_client import get_redis
from app.schemas.common import AdminStatsResponse, CustomerStatsResponse, ManagerStatsResponse
from app.services.stats_service import get_admin_stats, get_customer_stats, get_manager_stats


router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/admin", response_model=AdminStatsResponse)
async def admin_stats(
    response: Response,
    db: AsyncSession = Depends(get_session),
    redis=Depends(get_redis),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> AdminStatsResponse:
    data, cache_hit = await get_admin_stats(db, redis)
    response.headers["X-Cache"] = "HIT" if cache_hit else "MISS"
    return data


@router.get("/manager", response_model=ManagerStatsResponse)
async def manager_stats(
    response: Response,
    db: AsyncSession = Depends(get_session),
    redis=Depends(get_redis),
    current_user: User = Depends(require_role(UserRole.VEHICLE_MANAGER)),
) -> ManagerStatsResponse:
    data, cache_hit = await get_manager_stats(db, redis, current_user.id)
    response.headers["X-Cache"] = "HIT" if cache_hit else "MISS"
    return data


@router.get("/customer", response_model=CustomerStatsResponse)
async def customer_stats(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role(UserRole.CUSTOMER)),
) -> CustomerStatsResponse:
    return await get_customer_stats(db, current_user.id)
