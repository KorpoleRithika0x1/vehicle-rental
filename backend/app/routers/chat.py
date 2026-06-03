from fastapi import APIRouter, Depends, Request

from app.dependencies import DBSession, RedisClient, require_role
from app.limiter import limiter
from app.models import User, UserRole
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
    current_user: User = Depends(require_role(UserRole.CUSTOMER)),
) -> ChatResponse:
    return await handle_chat(
        db,
        redis,
        current_user,
        payload.message.strip(),
        payload.conversation_history,
    )
