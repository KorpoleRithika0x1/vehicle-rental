import hashlib
import json
from collections.abc import Awaitable, Callable
from typing import Any

from fastapi.encoders import jsonable_encoder
from loguru import logger
from redis.asyncio import Redis


async def get_cached(redis: Redis, key: str) -> dict | list | None:
    cached = await redis.get(key)
    if not cached:
        logger.debug(f"cache_miss key={key}")
        return None
    logger.debug(f"cache_hit key={key}")
    if isinstance(cached, bytes):
        cached = cached.decode("utf-8")
    return json.loads(cached)


async def set_cached(redis: Redis, key: str, data: Any, ttl: int) -> None:
    encoded = json.dumps(jsonable_encoder(data))
    await redis.set(key, encoded, ex=ttl)
    logger.debug(f"cache_set key={key} ttl={ttl}")


async def invalidate_pattern(redis: Redis, pattern: str) -> None:
    cursor = 0
    keys_deleted = 0
    while True:
        cursor, keys = await redis.scan(cursor=cursor, match=pattern, count=100)
        if keys:
            await redis.delete(*keys)
            keys_deleted += len(keys)
        if cursor == 0:
            break
    logger.debug(f"cache_invalidate pattern={pattern} deleted={keys_deleted}")


async def cache_or_fetch(
    redis: Redis,
    key: str,
    ttl: int,
    fetch_fn: Callable[[], Awaitable[Any]],
) -> tuple[Any, bool]:
    cached = await get_cached(redis, key)
    if cached is not None:
        return cached, True
    data = await fetch_fn()
    await set_cached(redis, key, data, ttl)
    return data, False


def filters_hash(payload: dict[str, Any]) -> str:
    normalized = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.md5(normalized.encode("utf-8")).hexdigest()
