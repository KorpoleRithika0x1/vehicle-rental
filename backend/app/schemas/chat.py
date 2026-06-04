from typing import Literal

from pydantic import BaseModel, Field, field_validator


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=8000)

    @field_validator("content", mode="before")
    @classmethod
    def normalize_content(cls, value: object) -> str:
        if value is None:
            raise ValueError("Message content is required.")
        text = str(value).strip()
        if not text:
            raise ValueError("Message content cannot be empty.")
        return text[:8000]


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    conversation_history: list[ChatMessage] = Field(default_factory=list, max_length=30)

    @field_validator("conversation_history", mode="before")
    @classmethod
    def trim_history(cls, value: object) -> object:
        if not isinstance(value, list):
            return []
        return value[-20:]


class ChatAction(BaseModel):
    type: Literal["BOOK_VEHICLE", "CANCEL_BOOKING", "PAYMENT_REQUIRED", "NONE"]
    success: bool
    message: str
    payload: dict | None = None


class ChatResponse(BaseModel):
    reply: str
    action: ChatAction | None = None
