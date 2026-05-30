import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, HttpUrl, field_validator

from app.models.user import UserRole, AccountStatus
from app.schemas.common import ORMBaseModel


PHONE_PATTERN = re.compile(r"^\+?[0-9\s\-()]{7,20}$")


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str
    phone_number: str | None = Field(default=None, max_length=20)

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        if value and not PHONE_PATTERN.match(value):
            raise ValueError("Phone number format is invalid.")
        return value


class RegisterResponse(BaseModel):
    message: str
    status: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ProfileUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    phone_number: str | None = Field(default=None, max_length=20)
    profile_image_url: HttpUrl | None = None
    license_number: str | None = Field(default=None, max_length=50)
    license_document_url: str | None = Field(default=None, max_length=500)

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        if value and not PHONE_PATTERN.match(value):
            raise ValueError("Phone number format is invalid.")
        return value


class RoleUpdateRequest(BaseModel):
    role: UserRole


class UserStatusUpdateRequest(BaseModel):
    is_active: bool


class UserResponse(ORMBaseModel):
    id: int
    name: str
    email: EmailStr
    role: UserRole
    account_status: AccountStatus
    phone_number: str | None = None
    profile_image_url: str | None = None
    license_image_url: str | None = None
    live_photo_url: str | None = None
    verification_reviewed_by: str | None = None
    verification_reviewed_at: datetime | None = None
    rejection_reason: str | None = None
    created_at: datetime
    updated_at: datetime
    driving_license_number: str | None = None
    license_verified: bool = False
    license_document_url: str | None = None
    license_number: str | None = None
    
    @property
    def is_active(self) -> bool:
        return self.account_status == AccountStatus.ACTIVE


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
