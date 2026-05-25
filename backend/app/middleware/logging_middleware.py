import time

from fastapi import Request
from loguru import logger


async def log_requests(request: Request, call_next):
    start = time.time()
    try:
        response = await call_next(request)
    except Exception:
        duration = (time.time() - start) * 1000
        logger.exception(
            "request_failed",
            method=request.method,
            path=request.url.path,
            duration_ms=round(duration, 1),
            user_id=request.state.user_id,
            user_role=request.state.user_role,
        )
        raise

    duration = (time.time() - start) * 1000
    logger.info(
        f"{request.method} {request.url.path} -> {response.status_code} [{duration:.1f}ms]"
    )
    return response
