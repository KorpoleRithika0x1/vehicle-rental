from fastapi import Request

from app.utils.jwt_utils import decode_token


async def attach_auth_context(request: Request, call_next):
    request.state.user_id = None
    request.state.user_role = None

    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1]
        try:
            payload = decode_token(token)
            request.state.user_id = payload.get("sub")
            request.state.user_role = payload.get("role")
        except Exception:
            request.state.user_id = None
            request.state.user_role = None

    return await call_next(request)
