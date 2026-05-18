"""`/api/chat` REST endpoint."""

from __future__ import annotations

from fastapi import APIRouter

from .schemas import ChatRequest, ChatResponse
from .service import handle_chat

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    return await handle_chat(payload.message)
