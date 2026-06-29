from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.dependencies import get_current_user, pagination_params, require_role
from app.models import User, UserRole, AccountStatus
from app.schemas.verification import (
    VerificationQueueItem,
    VerificationQueueResponse,
    RejectRequest,
    VerificationStatsResponse,
)
from app.services.email_service import send_account_approved_email
from loguru import logger


router = APIRouter(prefix="/verification", tags=["Verification"])


@router.get("/queue", response_model=VerificationQueueResponse)
async def get_verification_queue(
    page_params: tuple[int, int] = Depends(pagination_params),
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role(UserRole.VEHICLE_MANAGER, UserRole.ADMIN)),
):
    page, page_size = page_params
    offset = (page - 1) * page_size

    # Count total
    count_query = select(func.count()).select_from(User).where(
        User.account_status == AccountStatus.PENDING_VERIFICATION,
        User.role == UserRole.CUSTOMER,
    )
    total = await db.scalar(count_query)

    # Get paginated items
    query = select(User).where(
        User.account_status == AccountStatus.PENDING_VERIFICATION,
        User.role == UserRole.CUSTOMER,
    ).order_by(User.created_at.asc()).offset(offset).limit(page_size)
    
    result = await db.execute(query)
    users = result.scalars().all()

    items = [
        VerificationQueueItem(
            id=user.id,
            name=user.name,
            email=user.email,
            phone_number=user.phone_number,
            license_image_url=user.license_image_url or "",
            live_photo_url=user.live_photo_url or "",
            created_at=user.created_at,
        )
        for user in users
    ]

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return VerificationQueueResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.put("/{user_id}/approve")
async def approve_account(
    user_id: int,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role(UserRole.VEHICLE_MANAGER, UserRole.ADMIN)),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    
    if user.account_status != AccountStatus.PENDING_VERIFICATION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not pending verification.",
        )
    
    user.account_status = AccountStatus.ACTIVE
    user.license_verified = True
    if not user.license_document_url:
        user.license_document_url = user.license_image_url
    user.verification_reviewed_by = str(current_user.id)
    user.verification_reviewed_at = datetime.utcnow()
    user.rejection_reason = None

    await db.commit()

    from app.services.notification_service import create_notification
    try:
        await create_notification(
            db=db,
            user_id=user.id,
            title="Account Approved",
            message="Your account has been verified and approved. You can now log in and start booking vehicles!",
            notification_type="account_approved",
            reference_id=str(user.id),
        )
    except Exception:
        pass

    try:
        await send_account_approved_email(
            to_email=user.email,
            customer_name=user.name,
        )
    except Exception as e:
        logger.error(f"Email send failed for {user.email}: {e}")
    
    return {"message": "Account approved. Customer can now log in."}


@router.put("/{user_id}/reject")
async def reject_account(
    user_id: int,
    payload: RejectRequest,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role(UserRole.VEHICLE_MANAGER, UserRole.ADMIN)),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    
    if user.account_status != AccountStatus.PENDING_VERIFICATION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not pending verification.",
        )
    
    user.account_status = AccountStatus.REJECTED
    user.license_verified = False
    user.rejection_reason = payload.reason
    user.verification_reviewed_by = str(current_user.id)
    user.verification_reviewed_at = datetime.utcnow()
    
    await db.commit()

    from app.services.notification_service import create_notification
    try:
        await create_notification(
            db=db,
            user_id=user.id,
            title="Account Verification Rejected",
            message=f"Your account verification was rejected. Reason: {payload.reason or 'Not specified'}. Please contact support for assistance.",
            notification_type="account_rejected",
            reference_id=str(user.id),
        )
    except Exception:
        pass
    
    return {"message": "Account rejected."}


@router.get("/stats", response_model=VerificationStatsResponse)
async def get_verification_stats(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    # Count pending
    pending_query = select(func.count()).select_from(User).where(
        User.account_status == AccountStatus.PENDING_VERIFICATION,
        User.role == UserRole.CUSTOMER,
    )
    pending = await db.scalar(pending_query) or 0
    
    # Count approved (active customers)
    approved_query = select(func.count()).select_from(User).where(
        User.account_status == AccountStatus.ACTIVE,
        User.role == UserRole.CUSTOMER,
    )
    approved = await db.scalar(approved_query) or 0
    
    # Count rejected
    rejected_query = select(func.count()).select_from(User).where(
        User.account_status == AccountStatus.REJECTED,
        User.role == UserRole.CUSTOMER,
    )
    rejected = await db.scalar(rejected_query) or 0
    
    return VerificationStatsResponse(
        pending=pending,
        approved=approved,
        rejected=rejected,
    )
