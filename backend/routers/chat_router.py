import os
import json
import time
import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, Body, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import User, AuditLog
from db.audit import audit
from utils.auth import get_current_user_optional

chat_router = APIRouter(prefix="/api/chat", tags=["Pawly AI Animal Welfare Assistant"])

BACKEND_DIR = Path(__file__).resolve().parent.parent
PROMPT_FILE = BACKEND_DIR / "prompts" / "pawly_system_prompt.txt"
FAQ_FILE = BACKEND_DIR / "faq.json"

# In-Memory Rate Limiter: IP -> list of timestamps
_chat_rate_limit = defaultdict(list)

def check_chat_rate_limit(ip: str, is_logged_in: bool = False):
    max_requests = 30 if is_logged_in else 10
    now = time.time()
    _chat_rate_limit[ip] = [t for t in _chat_rate_limit[ip] if now - t < 60]
    if len(_chat_rate_limit[ip]) >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. You can send up to {max_requests} messages per minute."
        )
    _chat_rate_limit[ip].append(now)

def load_system_prompt() -> str:
    if PROMPT_FILE.exists():
        with open(PROMPT_FILE, "r", encoding="utf-8") as f:
            return f.read()
    return "You are Pawly, a warm and practical AI animal welfare assistant for India."

def load_faq() -> List[Dict[str, Any]]:
    if FAQ_FILE.exists():
        with open(FAQ_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def search_faq_fallback(query: str) -> Dict[str, Any]:
    faqs = load_faq()
    query_lower = query.lower()

    best_match = None
    best_score = 0

    for item in faqs:
        score = 0
        for kw in item.get("keywords", []):
            if kw.lower() in query_lower:
                score += 1
        if score > best_score:
            best_score = score
            best_match = item

    if best_match:
        return {
            "answer": best_match["answer"],
            "link": best_match.get("link", "Help & Contacts"),
            "mode": "limited"
        }

    return {
        "answer": "Pawly is currently operating in Limited Mode. For any animal emergency, stray dog rescue, or rabies concern, please consult a vet or visit our Help & Contacts page for verified 24/7 NGO helplines.",
        "link": "Help & Contacts",
        "mode": "limited"
    }

@chat_router.post("")
@chat_router.post("/")
async def stream_pawly_chat(
    request: Request,
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    ip = request.client.host if request.client else "127.0.0.1"
    check_chat_rate_limit(ip, is_logged_in=current_user is not None)

    messages = data.get("messages", [])
    context = data.get("context", {})

    if not messages or not isinstance(messages, list):
        raise HTTPException(status_code=400, detail="Messages array is required.")

    # Cap message length and history turns
    truncated_messages = []
    for msg in messages[-10:]:  # Last 10 turns
        role = msg.get("role", "user")
        content = str(msg.get("content", ""))[:1000]  # Max 1000 chars per message
        truncated_messages.append({"role": role, "content": content})

    last_user_query = truncated_messages[-1]["content"] if truncated_messages else ""

    api_key = os.getenv("ANTHROPIC_API_KEY")
    chat_model = os.getenv("CHAT_MODEL", "claude-3-5-sonnet-20241022")

    system_prompt = load_system_prompt()
    if context:
        ctx_parts = []
        if context.get("dog_id"): ctx_parts.append(f"Dog Profile ID: {context['dog_id']}")
        if context.get("scan_result"): ctx_parts.append(f"AI Scan Finding: {json.dumps(context['scan_result'])}")
        if context.get("city"): ctx_parts.append(f"Location City: {context['city']}")
        if ctx_parts:
            system_prompt += "\n\nCURRENT CONTEXT:\n" + "\n".join(ctx_parts)

    use_live_api = bool(api_key and api_key != "your_anthropic_api_key_here" and len(api_key.strip()) > 10)

    # Stream generator
    async def event_generator():
        nonlocal use_live_api
        success = False

        if use_live_api:
            # Try Anthropic Messages API with retry
            for attempt in range(2):
                try:
                    import anthropic
                    client = anthropic.Anthropic(api_key=api_key)

                    response_stream = client.messages.create(
                        model=chat_model,
                        max_tokens=800,
                        system=system_prompt,
                        messages=truncated_messages,
                        stream=True
                    )

                    for chunk in response_stream:
                        if chunk.type == "content_block_delta" and hasattr(chunk.delta, "text"):
                            text_chunk = chunk.delta.text
                            payload = json.dumps({"chunk": text_chunk, "mode": "live"})
                            yield f"data: {payload}\n\n"
                    
                    yield "data: [DONE]\n\n"
                    success = True
                    break
                except Exception as err:
                    print(f"[PAWLY API ATTEMPT {attempt+1} ERROR] {err}")
                    time.sleep(0.5)

        if not success:
            # Fallback to keyword matching in faq.json
            fallback = search_faq_fallback(last_user_query)
            ans = fallback["answer"]
            
            # Stream in small words to give realistic streaming feel
            words = ans.split(" ")
            for i in range(0, len(words), 3):
                chunk_text = " ".join(words[i:i+3]) + " "
                payload = json.dumps({"chunk": chunk_text, "mode": "limited", "link": fallback.get("link")})
                yield f"data: {payload}\n\n"
                time.sleep(0.04)

            yield "data: [DONE]\n\n"

        # Token usage audit logging without storing sensitive message body
        audit(
            db=db,
            actor_id=current_user.id if current_user else None,
            action="chat_completion",
            entity_type="pawly_chat",
            entity_id=str(int(time.time())),
            before=None,
            after={
                "mode": "live" if success else "limited",
                "turns_count": len(truncated_messages),
                "model": chat_model if success else "faq_fallback",
                "is_logged_in": current_user is not None
            }
        )

    return StreamingResponse(event_generator(), media_type="text/event-stream")
