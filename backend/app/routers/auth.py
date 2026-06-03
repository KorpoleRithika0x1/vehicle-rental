from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.dependencies import get_current_user
from app.models import User, UserRole
from app.schemas.user import (
    LoginRequest,
    ChangePasswordRequest,
    ProfileUpdateRequest,
    RefreshTokenRequest,
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
    UserResponse,
)
from app.schemas.common import ImageUploadResponse, MessageResponse
from app.services.auth_service import authenticate_user, refresh_tokens, register_user, update_profile, register_customer_with_verification
from app.services.upload_service import upload_image_to_cloudinary
from app.utils.password import verify_password, hash_password, validate_password_strength
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


@router.post("/register/customer", response_model=RegisterResponse)
@limiter.limit("10/minute")
async def register_customer(
    request: Request,
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    phone_number: str = Form(None),
    license_image: UploadFile = File(...),
    live_photo: UploadFile = File(...),
    db: AsyncSession = Depends(get_session),
) -> RegisterResponse:
    return await register_customer_with_verification(
        db=db,
        name=name,
        email=email,
        password=password,
        phone_number=phone_number,
        license_image=license_image,
        live_photo=live_photo,
    )


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


@router.post("/profile/license-document", response_model=ImageUploadResponse)
async def upload_license_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ImageUploadResponse:
    url = await upload_image_to_cloudinary(file, folder="vehicle-rental/licenses")
    current_user.license_document_url = url
    current_user.license_verified = False
    await db.commit()
    await db.refresh(current_user)

    from app.models import UserRole as _UserRole
    from app.services.notification_service import create_notification
    from sqlalchemy import select as _select
    admins_result = await db.execute(_select(User).where(User.role == _UserRole.ADMIN))
    for admin in admins_result.scalars().all():
        try:
            await create_notification(
                db=db,
                user_id=admin.id,
                title="License Document Submitted",
                message=f"{current_user.name} ({current_user.email}) has submitted a license document for verification.",
                notification_type="license_submitted",
                reference_id=str(current_user.id),
            )
        except Exception:
            pass

    return ImageUploadResponse(image_url=url)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_session),
) -> TokenResponse:
    return await refresh_tokens(db, payload.refresh_token)


@router.put("/profile/password", response_model=MessageResponse)
async def change_password(
    payload: ChangePasswordRequest,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect.")
    validate_password_strength(payload.new_password)
    current_user.password_hash = hash_password(payload.new_password)
    await db.commit()
    return MessageResponse(message="Password updated successfully.")
