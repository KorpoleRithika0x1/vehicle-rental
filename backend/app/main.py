from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from sqlalchemy import text

from app.config import get_settings
from app.database import Base, engine
from app.limiter import limiter
from app.logger import setup_logger
from app.middleware.auth_middleware import attach_auth_context
from app.middleware.error_handler import register_exception_handlers
from app.middleware.logging_middleware import log_requests
from app.redis_client import close_redis, init_redis
from app.routers import admin_regions, auth, bookings, notifications, payments, stats, users, vehicles, verification


settings = get_settings()
setup_logger()


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.auto_create_tables:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
    await init_redis()
    yield
    await close_redis()
    await engine.dispose()


app = FastAPI(title=settings.app_name, debug=settings.debug, lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=500)
app.middleware("http")(attach_auth_context)
app.middleware("http")(log_requests)

register_exception_handlers(app)
app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(vehicles.router, prefix=settings.api_prefix)
app.include_router(bookings.router, prefix=settings.api_prefix)
app.include_router(notifications.router, prefix=settings.api_prefix)
app.include_router(payments.router, prefix=settings.api_prefix)
app.include_router(users.router, prefix=settings.api_prefix)
app.include_router(stats.router, prefix=settings.api_prefix)
app.include_router(verification.router, prefix=settings.api_prefix)
app.include_router(admin_regions.router, prefix=settings.api_prefix)
app.include_router(admin_regions.manager_router, prefix=settings.api_prefix)


@app.get("/")
async def root() -> dict:
    return {"message": "Vehicle Rental Management System API"}


@app.get("/health")
async def health_check() -> dict:
    db_status = "error"
    redis_status = "error"

    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "error"

    try:
        client = await init_redis()
        await client.ping()
        redis_status = "ok"
    except Exception:
        redis_status = "error"

    return {"db": db_status, "redis": redis_status}
