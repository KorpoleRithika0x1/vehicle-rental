from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict


T = TypeVar("T")


class MessageResponse(BaseModel):
    message: str
    detail: dict | None = None


class ImageUploadResponse(BaseModel):
    image_url: str


class ErrorResponse(BaseModel):
    error: bool = True
    message: str
    detail: dict | list | str | None = None
    code: str


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class StatusBreakdown(BaseModel):
    status: str
    count: int


class RevenuePoint(BaseModel):
    label: str
    revenue: float


class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    total_vehicles: int
    available_vehicles: int
    total_bookings: int
    pending_bookings: int
    approved_bookings: int
    completed_bookings: int
    monthly_revenue: float
    revenue_trend: list[RevenuePoint]
    booking_statuses: list[StatusBreakdown]


class ManagerStatsResponse(BaseModel):
    fleet_size: int
    available_fleet: int
    total_bookings: int
    pending_bookings: int
    approved_bookings: int
    completed_bookings: int
    monthly_revenue: float
    revenue_trend: list[RevenuePoint]
    booking_statuses: list[StatusBreakdown]


class CustomerStatsResponse(BaseModel):
    total_bookings: int
    active_bookings: int
    pending_bookings: int
    completed_bookings: int
    total_spent: float


class ORMBaseModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)
