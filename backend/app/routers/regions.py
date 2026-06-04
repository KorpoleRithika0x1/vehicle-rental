from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models import RegionPickupAddress


router = APIRouter(prefix="/regions", tags=["regions"])


class PickupAddressItem(BaseModel):
    id: int
    city: str
    label: str
    address: str

    model_config = {"from_attributes": True}


@router.get("/pickup-addresses", response_model=list[PickupAddressItem])
async def list_pickup_addresses(
    city: str | None = Query(default=None, description="Filter by city/region name"),
    db: AsyncSession = Depends(get_session),
) -> list[PickupAddressItem]:
    query = select(RegionPickupAddress).order_by(RegionPickupAddress.city.asc(), RegionPickupAddress.id.asc())
    if city:
        query = query.where(RegionPickupAddress.city.ilike(city.strip()))
    result = await db.execute(query)
    return [PickupAddressItem.model_validate(row) for row in result.scalars().all()]
