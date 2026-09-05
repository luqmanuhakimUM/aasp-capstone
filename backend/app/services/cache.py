"""Redis-backed cache with a transparent in-memory fallback.

Keeps the app runnable for local dev even if Redis isn't up -- important
for a low-friction prototype -- while still exercising the real caching
path (NFR-1/NFR-9 in the PRD) when Redis is available.
"""
import json
import time
from typing import Any

import redis

from app.config import settings

_memory_store: dict[str, tuple[float, str]] = {}

try:
    _redis_client: redis.Redis | None = redis.from_url(settings.redis_url, decode_responses=True)
    _redis_client.ping()
except Exception:
    _redis_client = None


def get_json(key: str) -> Any | None:
    if _redis_client is not None:
        raw = _redis_client.get(key)
        return json.loads(raw) if raw else None

    entry = _memory_store.get(key)
    if entry is None:
        return None
    expires_at, raw = entry
    if time.time() > expires_at:
        _memory_store.pop(key, None)
        return None
    return json.loads(raw)


def set_json(key: str, value: Any, ttl_seconds: int = 3600) -> None:
    raw = json.dumps(value)
    if _redis_client is not None:
        _redis_client.setex(key, ttl_seconds, raw)
    else:
        _memory_store[key] = (time.time() + ttl_seconds, raw)
