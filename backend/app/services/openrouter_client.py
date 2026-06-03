from __future__ import annotations

import httpx

from app.config import get_settings


def openrouter_headers() -> dict[str, str]:
    settings = get_settings()
    if not settings.openrouter_api_key:
        return {}
    return {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": settings.frontend_url,
        "X-Title": settings.app_name,
    }


def openrouter_base_url() -> str:
    return get_settings().openrouter_base_url.rstrip("/")
