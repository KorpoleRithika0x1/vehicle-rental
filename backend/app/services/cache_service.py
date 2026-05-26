import hashlib
import json
from collections.abc import Awaitable, Callable
from typing import Any

from fastapi.encoders import jsonable_encoder
from loguru import logger
from redis.asyncio import Redis
from redis.exceptions import RedisError


async def get_cached(redis: Redis, key: str) -> dict | list | None:
    try:
        cached = await redis.get(key)
    except RedisError as exc:
        logger.warning(f"cache_get_failed key={key} error={exc}")
        return None
    if not cached:
        logger.debug(f"cache_miss key={key}")
        return None
    logger.debug(f"cache_hit key={key}")
    if isinstance(cached, bytes):
        cached = cached.decode("utf-8")
    return json.loads(cached)


async def set_cached(redis: Redis, key: str, data: Any, ttl: int) -> None:
    encoded = json.dumps(jsonable_encoder(data))
    try:
        await redis.set(key, encoded, ex=ttl)
        logger.debug(f"cache_set key={key} ttl={ttl}")
    except RedisError as exc:
        logger.warning(f"cache_set_failed key={key} error={exc}")


async def invalidate_pattern(redis: Redis, pattern: str) -> None:
    cursor = 0
    keys_deleted = 0
    try:
        while True:
            cursor, keys = await redis.scan(cursor=cursor, match=pattern, count=100)
            if keys:
                await redis.delete(*keys)
                keys_deleted += len(keys)
            if cursor == 0:
                break
        logger.debug(f"cache_invalidate pattern={pattern} deleted={keys_deleted}")
    except RedisError as exc:
        logger.warning(f"cache_invalidate_failed pattern={pattern} error={exc}")


async def cache_or_fetch(
    redis: Redis,
    key: str,
    ttl: int,
    fetch_fn: Callable[[], Awaitable[Any]],
) -> tuple[Any, bool]:
    try:
        cached = await get_cached(redis, key)
        if cached is not None:
            return cached, True
        data = await fetch_fn()
        await set_cached(redis, key, data, ttl)
        return data, False
    except RedisError as exc:
        logger.warning(f"cache_bypass key={key} error={exc}")
        data = await fetch_fn()
        return data, False


def filters_hash(payload: dict[str, Any]) -> str:
    normalized = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.md5(normalized.encode("utf-8")).hexdigest()
