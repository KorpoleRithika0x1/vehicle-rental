from fastapi import APIRouter, Depends, Request
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
from app.services.auth_service import authenticate_user, refresh_tokens, register_user, update_profile
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


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_session),
) -> TokenResponse:
    return await refresh_tokens(db, payload.refresh_token)
