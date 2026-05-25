from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from fastapi import HTTPException, status
from loguru import logger

from app.models import User, UserRole
from app.schemas.user import (
    LoginRequest,
    ProfileUpdateRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.utils.jwt_utils import create_access_token, create_refresh_token, decode_token
from app.utils.password import hash_password, validate_password_strength, verify_password


async def register_user(db: AsyncSession, payload: RegisterRequest) -> TokenResponse:
    existing = await db.execute(select(User).where(User.email == payload.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered.")

    validate_password_strength(payload.password)
    user = User(
        name=payload.name.strip(),
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        phone_number=payload.phone_number,
        role=UserRole.CUSTOMER,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    logger.info(f"auth_register_success user_id={user.id} email={user.email}")
    return TokenResponse(
        access_token=create_access_token(str(user.id), user.role.value),
        refresh_token=create_refresh_token(str(user.id), user.role.value),
        user=UserResponse.model_validate(user),
    )


async def authenticate_user(db: AsyncSession, payload: LoginRequest) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == payload.email.lower()))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(payload.password, user.password_hash):
        logger.warning(f"auth_login_failed email={payload.email.lower()}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    if not user.is_active:
        logger.warning(f"auth_login_inactive user_id={user.id}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive.")

    logger.info(f"auth_login_success user_id={user.id} email={user.email}")
    return TokenResponse(
        access_token=create_access_token(str(user.id), user.role.value),
        refresh_token=create_refresh_token(str(user.id), user.role.value),
        user=UserResponse.model_validate(user),
    )


async def update_profile(db: AsyncSession, user: User, payload: ProfileUpdateRequest) -> User:
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user


async def refresh_tokens(db: AsyncSession, refresh_token: str) -> TokenResponse:
    payload = decode_token(refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token.")

    result = await db.execute(select(User).where(User.id == int(payload["sub"])))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive.")

    logger.info(f"auth_refresh_success user_id={user.id}")
    return TokenResponse(
        access_token=create_access_token(str(user.id), user.role.value),
        refresh_token=create_refresh_token(str(user.id), user.role.value),
        user=UserResponse.model_validate(user),
    )
