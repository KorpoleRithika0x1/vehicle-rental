from collections.abc import AsyncIterator

from redis.asyncio import Redis

from app.config import get_settings


settings = get_settings()
redis_client: Redis | None = None


async def init_redis() -> Redis:
    global redis_client
    if redis_client is None:
        redis_client = Redis.from_url(settings.redis_url, decode_responses=False)
    return redis_client


async def get_redis() -> AsyncIterator[Redis]:
    client = await init_redis()
    yield client


async def close_redis() -> None:
    global redis_client
    if redis_client is not None:
        await redis_client.close()
        redis_client = None
