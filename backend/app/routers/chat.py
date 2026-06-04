from fastapi import APIRouter, Depends, Request

from app.dependencies import DBSession, RedisClient, get_optional_user
from app.limiter import limiter
from app.models import User
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import handle_chat


router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
@limiter.limit("30/minute")
async def post_chat(
    request: Request,
    payload: ChatRequest,
    db: DBSession,
    redis: RedisClient,
    current_user: User | None = Depends(get_optional_user),
) -> ChatResponse:
    return await handle_chat(
        db,
        redis,
        current_user,
        payload.message.strip(),
        payload.conversation_history,
    )
