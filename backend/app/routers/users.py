from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.dependencies import require_role
from app.models import User, UserRole
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.user import RoleUpdateRequest, UserResponse, UserStatusUpdateRequest


router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=PaginatedResponse[UserResponse])
async def get_users(
    search: str | None = None,
    pending_licenses: bool = Query(default=False),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=50),
    db: AsyncSession = Depends(get_session),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> PaginatedResponse[UserResponse]:
    query = select(User).order_by(User.created_at.desc())
    count_query = select(func.count(User.id))
    if search:
        search_term = f"%{search.strip()}%"
        query = query.where(User.name.ilike(search_term) | User.email.ilike(search_term))
        count_query = count_query.where(User.name.ilike(search_term) | User.email.ilike(search_term))

    if pending_licenses:
        query = query.where(User.license_document_url.isnot(None), User.license_verified == False)
        count_query = count_query.where(User.license_document_url.isnot(None), User.license_verified == False)

    total = await db.scalar(count_query) or 0
    result = await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    items = [UserResponse.model_validate(user) for user in result.scalars().all()]
    total_pages = max((total + page_size - 1) // page_size, 1)
    return PaginatedResponse[UserResponse](
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_session),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> UserResponse:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return UserResponse.model_validate(user)


@router.put("/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: int,
    payload: RoleUpdateRequest,
    db: AsyncSession = Depends(get_session),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> UserResponse:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    user.role = payload.role
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.delete("/{user_id}", response_model=MessageResponse)
async def deactivate_user(
    user_id: int,
    db: AsyncSession = Depends(get_session),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> MessageResponse:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    user.is_active = False
    await db.commit()
    return MessageResponse(message="User deactivated successfully.")


@router.put("/{user_id}/status", response_model=UserResponse)
async def update_user_status(
    user_id: int,
    payload: UserStatusUpdateRequest,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
) -> UserResponse:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    if user.id == current_user.id and not payload.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admin cannot block their own account.")

    user.is_active = payload.is_active
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.put("/{user_id}/verify-license", response_model=UserResponse)
async def verify_user_license(
    user_id: int,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.VEHICLE_MANAGER)),
) -> UserResponse:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    user.license_verified = True

    from loguru import logger
    logger.info(f"license_verified_success actor_id={current_user.id} actor_role={current_user.role.value} target_user_id={user.id}")

    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)
