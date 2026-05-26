import re
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, HttpUrl, field_validator

from app.models.user import UserRole
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


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ProfileUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    phone_number: str | None = Field(default=None, max_length=20)
    profile_image_url: HttpUrl | None = None

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
    phone_number: str | None = None
    profile_image_url: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
