from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from loguru import logger
from redis.exceptions import RedisError
from sqlalchemy.exc import SQLAlchemyError


def error_payload(message: str, detail, code: str, status_code: int) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error": True,
            "message": message,
            "detail": detail,
            "code": code,
        },
    )


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(HTTPException)
    async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
        detail = exc.detail
        if isinstance(detail, dict):
            message = detail.get("message", "Request failed.")
        else:
            message = str(detail)
        return error_payload(message, detail, "HTTP_ERROR", exc.status_code)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
        return error_payload(
            "Validation failed.",
            exc.errors(),
            "VALIDATION_ERROR",
            status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    @app.exception_handler(SQLAlchemyError)
    async def sqlalchemy_exception_handler(_: Request, exc: SQLAlchemyError) -> JSONResponse:
        logger.exception("database_error", error=str(exc))
        return error_payload(
            "A database error occurred.",
            None,
            "DATABASE_ERROR",
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    @app.exception_handler(RedisError)
    async def redis_exception_handler(_: Request, exc: RedisError) -> JSONResponse:
        logger.exception("redis_error", error=str(exc))
        return error_payload(
            "A cache service error occurred.",
            None,
            "REDIS_ERROR",
            status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("unhandled_error", error=str(exc))
        return error_payload(
            "An unexpected server error occurred.",
            None,
            "INTERNAL_SERVER_ERROR",
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
