from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class VerificationQueueItem(BaseModel):
    id: int
    name: str
    email: str
    phone_number: Optional[str] = None
    license_image_url: str
    live_photo_url: str
    created_at: datetime


class VerificationQueueResponse(BaseModel):
    items: list[VerificationQueueItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class RejectRequest(BaseModel):
    reason: str = Field(min_length=10, description="Reason for rejection (minimum 10 characters)")


class VerificationStatsResponse(BaseModel):
    pending: int
    approved: int
    rejected: int