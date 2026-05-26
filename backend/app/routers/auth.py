from fastapi import APIRouter, Depends, File, Request, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.dependencies import get_current_user
from app.models import User
from app.schemas.user import (
    LoginRequest,
    ProfileUpdateRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.schemas.common import ImageUploadResponse
from app.services.auth_service import authenticate_user, refresh_tokens, register_user, update_profile
from app.services.upload_service import upload_image_to_cloudinary
from app.limiter import limiter


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
@limiter.limit("10/minute")
async def register(
    request: Request,
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_session),
) -> TokenResponse:
    return await register_user(db, payload)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(
    request: Request,
    payload: LoginRequest,
    db: AsyncSession = Depends(get_session),
) -> TokenResponse:
    return await authenticate_user(db, payload)


@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.put("/profile", response_model=UserResponse)
async def put_profile(
    payload: ProfileUpdateRequest,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    user = await update_profile(db, current_user, payload)
    return UserResponse.model_validate(user)


@router.post("/profile/image", response_model=ImageUploadResponse)
async def upload_profile_image(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ImageUploadResponse:
    image_url = await upload_image_to_cloudinary(file, folder="vehicle-rental/profiles")
    current_user.profile_image_url = image_url
    await db.commit()
    await db.refresh(current_user)
    return ImageUploadResponse(image_url=image_url)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_session),
) -> TokenResponse:
    return await refresh_tokens(db, payload.refresh_token)
