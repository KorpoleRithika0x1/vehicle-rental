from datetime import datetime

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.dependencies import get_current_user
from app.models import User, Booking, BookingStatus
from app.services.notification_service import (
    get_notifications_for_user,
    get_unread_count,
    mark_all_read,
    create_notification,
)

router = APIRouter(tags=["Notifications"])


class NotificationItem(BaseModel):
    id: int
    title: str
    message: str
    is_read: bool
    notification_type: str
    reference_id: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationsResponse(BaseModel):
    notifications: list[NotificationItem]
    unread_count: int


@router.get("", response_model=NotificationsResponse)
async def list_notifications(
    unread_only: bool = Query(default=False),
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    notifications = await get_notifications_for_user(db, current_user.id, unread_only=unread_only)
    unread = await get_unread_count(db, current_user.id)
    return NotificationsResponse(
        notifications=[NotificationItem.model_validate(n) for n in notifications],
        unread_count=unread,
    )


@router.put("/mark-read")
async def mark_notifications_read(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    await mark_all_read(db, current_user.id)
    return {"message": "All notifications marked as read"}


@router.post("/send-daily-reminders")
async def send_daily_reminders(db: AsyncSession = Depends(get_session)):
    """Called once per day (e.g. by a cron job) to send pickup/dropoff reminders."""
    today = datetime.utcnow().date()

    result = await db.execute(
        select(Booking).where(Booking.status == BookingStatus.APPROVED)
    )
    bookings = result.scalars().all()

    sent = 0
    for booking in bookings:
        pickup_day = booking.pickup_date.date()
        return_day = booking.return_date.date()

        if pickup_day == today:
            await create_notification(
                db=db,
                user_id=booking.customer_id,
                title="Today is your pickup day!",
                message=f"Your vehicle is ready for pickup today ({today.strftime('%d %b %Y')}). Have a great trip!",
                notification_type="reminder_pickup",
                reference_id=str(booking.id),
            )
            sent += 1

        if return_day == today:
            await create_notification(
                db=db,
                user_id=booking.customer_id,
                title="Today is your return day!",
                message=f"Please return your vehicle today ({today.strftime('%d %b %Y')}). We hope you enjoyed your trip!",
                notification_type="reminder_return",
                reference_id=str(booking.id),
            )
            sent += 1

    return {"sent": sent}
