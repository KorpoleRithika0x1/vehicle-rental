from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from fastapi import HTTPException, UploadFile, status
from loguru import logger

from app.models import User, UserRole, AccountStatus
from app.schemas.user import (
    LoginRequest,
    ProfileUpdateRequest,
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
    UserResponse,
)
from app.utils.jwt_utils import create_access_token, create_refresh_token, decode_token
from app.utils.password import hash_password, validate_password_strength, verify_password
from app.services.notification_service import create_notification


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
        account_status=AccountStatus.ACTIVE,  # Default to active for now
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

    # Check account status
    if user.account_status == AccountStatus.PENDING_VERIFICATION:
        logger.warning(f"auth_login_pending_verification user_id={user.id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending verification. You will be able to log in once a manager approves your account."
        )
    
    if user.account_status == AccountStatus.REJECTED:
        logger.warning(f"auth_login_rejected user_id={user.id}")
        reason = user.rejection_reason or "Not specified"
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Your account verification was rejected. Reason: {reason}. Please contact support."
        )
    
    if user.account_status == AccountStatus.SUSPENDED:
        logger.warning(f"auth_login_suspended user_id={user.id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended. Please contact support."
        )

    logger.info(f"auth_login_success user_id={user.id} email={user.email}")
    return TokenResponse(
        access_token=create_access_token(str(user.id), user.role.value),
        refresh_token=create_refresh_token(str(user.id), user.role.value),
        user=UserResponse.model_validate(user),
    )


async def update_profile(db: AsyncSession, user: User, payload: ProfileUpdateRequest) -> User:
    update_data = payload.model_dump(exclude_unset=True)
    if "license_number" in update_data or "license_document_url" in update_data:
        user.license_verified = False
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
    if user is None or user.account_status != AccountStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive.")

    logger.info(f"auth_refresh_success user_id={user.id}")
    return TokenResponse(
        access_token=create_access_token(str(user.id), user.role.value),
        refresh_token=create_refresh_token(str(user.id), user.role.value),
        user=UserResponse.model_validate(user),
    )
async def register_customer_with_verification(
    db: AsyncSession,
    name: str,
    email: str,
    password: str,
    phone_number: str | None,
    license_image: UploadFile,
    live_photo: UploadFile,
) -> RegisterResponse:
    from app.services.upload_service import upload_image_to_cloudinary
    
    # Check email is not already registered
    existing = await db.execute(select(User).where(User.email == email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered.")

    # Validate both uploaded files are images
    if not license_image.content_type or not license_image.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="License image must be an image file.")
    
    if not live_photo.content_type or not live_photo.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Live photo must be an image file.")

    # Upload license_image to Cloudinary under folder "licenses/"
    license_image_url = await upload_image_to_cloudinary(license_image, folder="licenses")
    
    # Upload live_photo to Cloudinary under folder "live_photos/"
    live_photo_url = await upload_image_to_cloudinary(live_photo, folder="live_photos")

    # Hash the password with bcrypt
    validate_password_strength(password)
    password_hash = hash_password(password)

    # Create user record
    user = User(
        name=name.strip(),
        email=email.lower(),
        password_hash=password_hash,
        phone_number=phone_number,
        role=UserRole.CUSTOMER,
        account_status=AccountStatus.PENDING_VERIFICATION,
        license_image_url=license_image_url,
        live_photo_url=live_photo_url,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    admins = await db.execute(select(User).where(User.role == UserRole.ADMIN))
    for admin in admins.scalars().all():
        try:
            await create_notification(
                db=db,
                user_id=admin.id,
                title="New Account Verification Request",
                message=(
                    f"{user.name} ({user.email}) has submitted their driving license "
                    "for account verification."
                ),
                notification_type="account_request",
                reference_id=str(user.id),
            )
        except Exception as exc:
            logger.warning(
                f"account_verification_notification_failed user_id={user.id} "
                f"admin_id={admin.id} error={exc}"
            )

    logger.info(f"auth_register_with_verification_success user_id={user.id} email={user.email}")
    return RegisterResponse(
        message="Registration submitted. Your account is pending verification. You will be able to log in once a manager approves your account.",
        status="pending_verification",
    )
