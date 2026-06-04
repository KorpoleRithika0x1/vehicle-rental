from __future__ import annotations

import json
import re
from datetime import datetime

import httpx
from fastapi import HTTPException, status
from loguru import logger
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models import User, UserRole
from app.schemas.chat import ChatAction, ChatMessage, ChatResponse
from app.services.booking_service import cancel_booking, create_booking, list_bookings
from app.services.openrouter_client import openrouter_base_url, openrouter_headers
from app.services.rag_service import retrieve_context
from app.services.vehicle_service import get_manager_cities, list_vehicles
from app.utils.date_utils import validate_booking_dates


settings = get_settings()
ACTION_MARKER = "---ACTION---"
MAX_HISTORY_MESSAGES = 12


def _normalize_history(history: list[ChatMessage]) -> list[ChatMessage]:
    trimmed = history[-MAX_HISTORY_MESSAGES:]
    return [item for item in trimmed if item.content.strip()]


def _resolve_vehicle_id(
    vehicles,
    *,
    vehicle_id: int | None,
    vehicle_name: str | None,
    user_message: str,
) -> int | None:
    if vehicle_id:
        return int(vehicle_id)

    candidates: list[tuple[int, str]] = [
        (item.id, f"{item.vehicle_name} {item.brand}".lower()) for item in vehicles.items
    ]
    search_text = " ".join(
        part for part in [vehicle_name or "", user_message] if part
    ).lower()

    best_id: int | None = None
    best_score = 0
    for vid, label in candidates:
        if label in search_text or search_text in label:
            return vid
        score = sum(1 for token in label.split() if token in search_text)
        if score > best_score:
            best_score = score
            best_id = vid
    return best_id if best_score >= 2 else None


def _format_bookings_context(bookings) -> str:
    if not bookings.items:
        return "The user has no bookings."

    lines = ["User bookings (most recent first):"]
    for item in bookings.items[:15]:
        lines.append(
            f"- Booking #{item.id}: {item.vehicle_name} ({item.brand}), "
            f"status={item.status}, pickup={item.pickup_date.isoformat()}, "
            f"return={item.return_date.isoformat()}, total=₹{item.total_amount}"
        )
    return "\n".join(lines)


def _format_vehicles_context(vehicles) -> str:
    if not vehicles.items:
        return "No available vehicles found."

    lines = ["Available vehicles (live catalog):"]
    for item in vehicles.items[:30]:
        lines.append(
            f"- ID {item.id}: {item.vehicle_name} ({item.brand}), type={item.vehicle_type}, "
            f"city={item.city}, fuel={item.fuel_type}, "
            f"₹{item.rental_price_per_day}/day, seats={item.seating_capacity}"
        )
    return "\n".join(lines)


def _build_system_prompt(
    *,
    user: User | None,
    rag_context: str,
    bookings_context: str,
    vehicles_context: str,
) -> str:
    role = user.role.value if user else "public"
    name = user.name if user else "Guest visitor"
    email = user.email if user else "Not signed in"
    action_instructions = (
        """2. Help customers book vehicles when they provide enough details (vehicle ID or clear vehicle match, pickup date, return date).
3. Help customers cancel approved bookings when they provide a booking ID."""
        if user and user.role == UserRole.CUSTOMER
        else """2. Answer knowledge-base questions only for this user.
3. Do not create, cancel, approve, reject, update, delete, or complete records from chat for this user."""
    )
    intent_instruction = (
    "Use intent BOOK_VEHICLE only when vehicle, pickup date, and return date are known. The chatbot must collect booking details only. Payment and booking confirmation happen later through the payment flow. Use CANCEL_BOOKING only when user clearly wants to cancel a specific booking ID."
        if user and user.role == UserRole.CUSTOMER
        else "Always use intent GENERAL_QUERY for this user."
    )
    access_boundary = (
        "This is a public chat. Answer public app questions, customer account creation questions, vehicle browsing questions, and how a customer can book after approval. Do not answer manager/admin dashboard internals or claim you can perform signed-in actions."
        if user is None
        else f"This user is signed in as {role}. Do not answer questions about dashboards or permissions for other roles."
    )
    return f"""You are Veloce Assistant, a helpful vehicle rental chatbot for Veloce Rentals.

User profile:
- Name: {name}
- Email: {email}
- Role: {role}

Your job:
1. Answer questions about vehicles, bookings, policies, and the rental platform.
{action_instructions}
4. Use the live data below for accurate answers. Do not invent vehicles or bookings.
5. If the answer is not in the retrieved knowledge base or live data, say you do not know.
6. Access boundary: {access_boundary}

{rag_context}

{bookings_context}

{vehicles_context}

Booking rules:
- Use create intent only when vehicle_id, pickup_date, and return_date are clear.
- Dates must be in the future or today; return after pickup.
- Only customers can book.

Cancellation rules:
- Only approved bookings belonging to this user can be cancelled.
- If booking is pending, active, completed, or cancelled, explain why cancel is not allowed.

Response format (strict):
1. Write a friendly natural-language reply first.
2. Then output a blank line and exactly this marker on its own line: {ACTION_MARKER}
3. Then output a single JSON object (no markdown fences) with this schema:
{{"intent":"GENERAL_QUERY"|"BOOK_VEHICLE"|"CANCEL_BOOKING","vehicle_id":null|number,"vehicle_name":null|"string","pickup_date":null|"ISO-8601","return_date":null|"ISO-8601","booking_id":null|number}}

{intent_instruction}
Use GENERAL_QUERY for questions, recommendations, or when more info is needed (leave action fields null).
"""


def _parse_action(raw_reply: str) -> tuple[str, dict | None]:
    if ACTION_MARKER not in raw_reply:
        json_start = raw_reply.rfind("{")
        if json_start == -1:
            return raw_reply.strip(), None
        reply = raw_reply[:json_start].strip()
        action_text = raw_reply[json_start:].strip()
        try:
            action = json.loads(action_text)
        except json.JSONDecodeError:
            return raw_reply.strip(), None
        if not isinstance(action, dict) or "intent" not in action:
            return raw_reply.strip(), None
        reply = re.sub(r"\n?\s*-{3,}\s*$", "", reply).strip()
        return reply, action

    reply, action_text = raw_reply.split(ACTION_MARKER, 1)
    action_text = action_text.strip()
    match = re.search(r"\{.*\}", action_text, re.DOTALL)
    if not match:
        return reply.strip(), None

    try:
        return reply.strip(), json.loads(match.group(0))
    except json.JSONDecodeError:
        logger.warning("chat_action_parse_failed")
        return reply.strip(), None


async def _call_openrouter(system_prompt: str, history: list[ChatMessage], message: str) -> str:
    headers = openrouter_headers()
    if not headers:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Chat assistant is not configured. Set OPENROUTER_API_KEY in backend/.env.",
        )

    messages = [{"role": "system", "content": system_prompt}]
    for item in history[-10:]:
        messages.append({"role": item.role, "content": item.content})
    messages.append({"role": "user", "content": message})

    payload = {
        "model": settings.openrouter_chat_model,
        "messages": messages,
        "temperature": 0.4,
        "max_tokens": 1024,
    }

    url = f"{openrouter_base_url()}/chat/completions"
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, headers=headers, json=payload)
        if response.status_code >= 400:
            logger.error(f"openrouter_error status={response.status_code} body={response.text[:500]}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI assistant is temporarily unavailable. Please try again.",
            )
        data = response.json()

    choices = data.get("choices", [])
    if not choices:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI assistant returned an empty response.",
        )

    content = choices[0].get("message", {}).get("content", "")
    if not content:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI assistant returned an empty response.",
        )
    return str(content).strip()


async def _execute_action(
    db: AsyncSession,
    redis: Redis,
    user: User,
    action: dict | None,
    *,
    vehicles=None,
    user_message: str = "",
) -> ChatAction | None:
    if not action:
        return None

    intent = action.get("intent", "GENERAL_QUERY")
    if intent == "GENERAL_QUERY":
        return None

    if user.role != UserRole.CUSTOMER:
        return ChatAction(
            type="NONE",
            success=False,
            message="Chat actions are available for customers only.",
            payload={"intent": intent},
        )

    if intent == "BOOK_VEHICLE":
        vehicle_id = (
            _resolve_vehicle_id(
                vehicles,
                vehicle_id=action.get("vehicle_id"),
                vehicle_name=action.get("vehicle_name"),
                user_message=user_message,
            )
            if vehicles is not None
            else action.get("vehicle_id")
        )

        pickup_raw = action.get("pickup_date")
        return_raw = action.get("return_date")

        if not vehicle_id:
            return ChatAction(
                type="BOOK_VEHICLE",
                success=False,
                message="Please specify which vehicle you would like to book.",
                payload={"intent": intent},
            )

        if not pickup_raw or not return_raw:
            return ChatAction(
                type="BOOK_VEHICLE",
                success=False,
                message="Please provide pickup and return dates to continue.",
                payload={
                    "intent": intent,
                    "vehicle_id": vehicle_id,
                },
            )

        try:
            pickup_date, return_date = validate_booking_dates(
                datetime.fromisoformat(str(pickup_raw).replace("Z", "+00:00")),
                datetime.fromisoformat(str(return_raw).replace("Z", "+00:00")),
            )

            vehicle_name = None

            if vehicles:
                for v in vehicles.items:
                    if v.id == int(vehicle_id):
                        vehicle_name = f"{v.vehicle_name} {v.brand}"
                        break

            return ChatAction(
                type="PAYMENT_REQUIRED",
                success=False,
                message="Payment is required before booking can be confirmed.",
                payload={
                    "vehicle_id": int(vehicle_id),
                    "vehicle_name": vehicle_name,
                    "pickup_date": pickup_date.isoformat(),
                    "return_date": return_date.isoformat(),
                },
            )

        except HTTPException as exc:
            detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)

            return ChatAction(
                type="BOOK_VEHICLE",
                success=False,
                message=detail,
                payload={"intent": intent},
            )

        except Exception as exc:
            logger.warning(f"chat_book_failed error={exc}")

            return ChatAction(
                type="BOOK_VEHICLE",
                success=False,
                message="Could not validate booking details.",
                payload={"intent": intent},
            )

    if intent == "CANCEL_BOOKING":
        booking_id = action.get("booking_id")
        if not booking_id:
            return ChatAction(
                type="CANCEL_BOOKING",
                success=False,
                message="Please provide a booking ID to cancel.",
                payload={"intent": intent},
            )

        try:
            booking = await cancel_booking(db, redis, int(booking_id), user, background_tasks=None)
            return ChatAction(
                type="CANCEL_BOOKING",
                success=True,
                message=f"Booking #{booking.id} has been cancelled.",
                payload={"booking_id": booking.id, "status": booking.status.value},
            )
        except HTTPException as exc:
            detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
            return ChatAction(type="CANCEL_BOOKING", success=False, message=detail, payload={"intent": intent})
        except Exception as exc:
            logger.warning(f"chat_cancel_failed error={exc}")
            return ChatAction(
                type="CANCEL_BOOKING",
                success=False,
                message="Could not cancel booking. Check the booking ID and status.",
                payload={"intent": intent},
            )

    return None


async def handle_chat(
    db: AsyncSession,
    redis: Redis,
    user: User | None,
    message: str,
    conversation_history: list[ChatMessage],
) -> ChatResponse:
    conversation_history = _normalize_history(conversation_history)

    role = user.role.value if user else None
    rag_context = retrieve_context(message, role=role)
    bookings_context = "No signed-in customer booking context is available."
    if user and user.role == UserRole.CUSTOMER:
        bookings = await list_bookings(db, user, page=1, page_size=15, status_filter=None)
        bookings_context = _format_bookings_context(bookings)

    manager_cities = None
    if user and user.role == UserRole.VEHICLE_MANAGER:
        manager_cities = await get_manager_cities(db, user.id)
    vehicles, _ = await list_vehicles(
        db,
        redis,
        search=None,
        vehicle_type=None,
        brand=None,
        fuel_type=None,
        min_price=None,
        max_price=None,
        available_only=True,
        page=1,
        page_size=30,
        manager_cities=manager_cities,
    )

    system_prompt = _build_system_prompt(
        user=user,
        rag_context=rag_context or "Knowledge base unavailable.",
        bookings_context=bookings_context,
        vehicles_context=_format_vehicles_context(vehicles),
    )

    raw_reply = await _call_openrouter(system_prompt, conversation_history, message)
    reply, action_data = _parse_action(raw_reply)
    action_result = None
    if user:
        action_result = await _execute_action(
            db,
            redis,
            user,
            action_data,
            vehicles=vehicles,
            user_message=message,
        )

    if action_result and not action_result.success and action_result.message:
        reply = f"{reply}\n\nNote: {action_result.message}"
    elif action_result and action_result.success:
        reply = f"{reply}\n\n✓ {action_result.message}"

    return ChatResponse(reply=reply.strip(), action=action_result)
