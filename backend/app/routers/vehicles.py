from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, File, Query, Response, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.dependencies import get_current_user, require_role
from app.models import User, UserRole
from app.redis_client import get_redis
from app.schemas.common import ImageUploadResponse, MessageResponse, PaginatedResponse
from app.schemas.vehicle import (
    AvailabilityResponse,
    VehicleCreateRequest,
    VehicleDetailResponse,
    VehicleImageCreate,
    VehicleImageResponse,
    VehicleListItem,
    VehicleResponse,
    VehicleUpdateRequest,
)
from app.services.vehicle_service import (
    add_vehicle_image,
    create_vehicle,
    delete_vehicle,
    get_vehicle_availability,
    get_vehicle_detail,
    list_vehicles,
    update_vehicle,
)
from app.services.upload_service import upload_image_to_cloudinary


router = APIRouter(prefix="/vehicles", tags=["vehicles"])


@router.post(
    "/images/upload",
    response_model=ImageUploadResponse,
)
async def upload_image_file(
    file: UploadFile = File(...),
    _: User = Depends(require_role(UserRole.VEHICLE_MANAGER, UserRole.ADMIN)),
) -> ImageUploadResponse:
    image_url = await upload_image_to_cloudinary(file, folder="vehicle-rental/vehicles")
    return ImageUploadResponse(image_url=image_url)


@router.get("/", response_model=PaginatedResponse[VehicleListItem])
async def get_vehicles(
    response: Response,
    search: str | None = None,
    vehicle_type: str | None = None,
    brand: str | None = None,
    fuel_type: str | None = None,
    min_price: Decimal | None = Query(default=None, gt=0),
    max_price: Decimal | None = Query(default=None, gt=0),
    available_only: bool = False,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=50),
    db: AsyncSession = Depends(get_session),
    redis=Depends(get_redis),
) -> PaginatedResponse[VehicleListItem]:
    data, cache_hit = await list_vehicles(
        db,
        redis,
        search=search,
        vehicle_type=vehicle_type,
        brand=brand,
        fuel_type=fuel_type,
        min_price=min_price,
        max_price=max_price,
        available_only=available_only,
        page=page,
        page_size=page_size,
    )
    response.headers["X-Cache"] = "HIT" if cache_hit else "MISS"
    return data


@router.get("/{vehicle_id}", response_model=VehicleDetailResponse)
async def get_vehicle(
    vehicle_id: int,
    response: Response,
    db: AsyncSession = Depends(get_session),
    redis=Depends(get_redis),
) -> VehicleDetailResponse:
    data, cache_hit = await get_vehicle_detail(db, redis, vehicle_id)
    response.headers["X-Cache"] = "HIT" if cache_hit else "MISS"
    return data


@router.post("/", response_model=VehicleResponse)
async def post_vehicle(
    payload: VehicleCreateRequest,
    db: AsyncSession = Depends(get_session),
    redis=Depends(get_redis),
    current_user: User = Depends(require_role(UserRole.VEHICLE_MANAGER, UserRole.ADMIN)),
) -> VehicleResponse:
    vehicle = await create_vehicle(db, redis, payload, current_user)
    return VehicleResponse.model_validate(vehicle)


@router.put("/{vehicle_id}", response_model=VehicleResponse)
async def put_vehicle(
    vehicle_id: int,
    payload: VehicleUpdateRequest,
    db: AsyncSession = Depends(get_session),
    redis=Depends(get_redis),
    current_user: User = Depends(require_role(UserRole.VEHICLE_MANAGER, UserRole.ADMIN)),
) -> VehicleResponse:
    vehicle = await update_vehicle(db, redis, vehicle_id, payload, current_user)
    return VehicleResponse.model_validate(vehicle)


@router.delete("/{vehicle_id}", response_model=MessageResponse)
async def remove_vehicle(
    vehicle_id: int,
    db: AsyncSession = Depends(get_session),
    redis=Depends(get_redis),
    current_user: User = Depends(require_role(UserRole.VEHICLE_MANAGER, UserRole.ADMIN)),
) -> MessageResponse:
    await delete_vehicle(db, redis, vehicle_id, current_user)
    return MessageResponse(message="Vehicle deleted successfully.")


@router.get("/{vehicle_id}/availability", response_model=AvailabilityResponse)
async def vehicle_availability(
    vehicle_id: int,
    response: Response,
    pickup_date: datetime | None = None,
    return_date: datetime | None = None,
    db: AsyncSession = Depends(get_session),
    redis=Depends(get_redis),
) -> AvailabilityResponse:
    data, cache_hit = await get_vehicle_availability(db, redis, vehicle_id, pickup_date, return_date)
    response.headers["X-Cache"] = "HIT" if cache_hit else "MISS"
    return data


@router.post("/{vehicle_id}/images", response_model=VehicleImageResponse)
async def upload_vehicle_image(
    vehicle_id: int,
    payload: VehicleImageCreate,
    db: AsyncSession = Depends(get_session),
    redis=Depends(get_redis),
    current_user: User = Depends(require_role(UserRole.VEHICLE_MANAGER, UserRole.ADMIN)),
) -> VehicleImageResponse:
    image = await add_vehicle_image(db, redis, vehicle_id, payload, current_user)
    return VehicleImageResponse.model_validate(image)
