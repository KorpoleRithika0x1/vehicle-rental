from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.dependencies import get_current_user, require_role
from app.models import ManagerRegion, User, UserRole
from app.schemas.common import MessageResponse


router = APIRouter(prefix="/admin/managers", tags=["admin-regions"])


class RegionGrantRequest(BaseModel):
    city: str


class RegionItem(BaseModel):
    id: int
    city: str
    granted_at: str

    model_config = {"from_attributes": True}


class ManagerWithRegions(BaseModel):
    id: int
    name: str
    email: str
    regions: list[str]

    model_config = {"from_attributes": True}


async def _get_manager_or_404(db: AsyncSession, manager_id: int) -> User:
    result = await db.execute(select(User).where(User.id == manager_id, User.role == UserRole.VEHICLE_MANAGER))
    manager = result.scalar_one_or_none()
    if manager is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Manager not found.")
    return manager


@router.get("/", response_model=list[ManagerWithRegions])
async def list_managers_with_regions(
    db: AsyncSession = Depends(get_session),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> list[ManagerWithRegions]:
    managers_result = await db.execute(select(User).where(User.role == UserRole.VEHICLE_MANAGER).order_by(User.created_at.desc()))
    managers = managers_result.scalars().all()

    manager_ids = [m.id for m in managers]
    regions_result = await db.execute(select(ManagerRegion).where(ManagerRegion.manager_id.in_(manager_ids)))
    regions = regions_result.scalars().all()

    region_map: dict[int, list[str]] = {m.id: [] for m in managers}
    for region in regions:
        region_map[region.manager_id].append(region.city)

    return [ManagerWithRegions(id=m.id, name=m.name, email=m.email, regions=region_map[m.id]) for m in managers]


@router.get("/{manager_id}/regions", response_model=list[str])
async def get_manager_regions(
    manager_id: int,
    db: AsyncSession = Depends(get_session),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> list[str]:
    await _get_manager_or_404(db, manager_id)
    result = await db.execute(select(ManagerRegion.city).where(ManagerRegion.manager_id == manager_id))
    return result.scalars().all()


@router.post("/{manager_id}/regions", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def grant_region(
    manager_id: int,
    payload: RegionGrantRequest,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
) -> MessageResponse:
    await _get_manager_or_404(db, manager_id)
    city = payload.city.strip()
    existing = await db.execute(select(ManagerRegion.id).where(ManagerRegion.manager_id == manager_id, ManagerRegion.city == city))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"{city} is already assigned to this manager.")
    db.add(ManagerRegion(manager_id=manager_id, city=city, granted_by=current_user.id))
    await db.commit()
    return MessageResponse(message=f"Region '{city}' granted successfully.")


@router.delete("/{manager_id}/regions/{city}", response_model=MessageResponse)
async def revoke_region(
    manager_id: int,
    city: str,
    db: AsyncSession = Depends(get_session),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> MessageResponse:
    result = await db.execute(select(ManagerRegion).where(ManagerRegion.manager_id == manager_id, ManagerRegion.city == city))
    region = result.scalar_one_or_none()
    if region is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Region assignment not found.")
    await db.delete(region)
    await db.commit()
    return MessageResponse(message=f"Region '{city}' revoked successfully.")


# Manager self-service: get own assigned regions
manager_router = APIRouter(prefix="/manager", tags=["manager-regions"])


@manager_router.get("/regions", response_model=list[str])
async def get_my_regions(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role(UserRole.VEHICLE_MANAGER)),
) -> list[str]:
    result = await db.execute(select(ManagerRegion.city).where(ManagerRegion.manager_id == current_user.id))
    return result.scalars().all()
