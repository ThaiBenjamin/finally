"""LiteLLM call to OpenRouter with Cerebras as the inference provider.

Returns a parsed `LLMResponse`. The model is constrained to the Pydantic schema
via `response_format`. See `planning/PLAN.md` Section 9 and the
`cerebras-inference` skill.
"""

from __future__ import annotations

import asyncio

from litellm import completion

from .schemas import LLMResponse

MODEL = "openrouter/openai/gpt-oss-120b"
_EXTRA_BODY = {"provider": {"order": ["cerebras"]}}


def call_llm(messages: list[dict]) -> LLMResponse:
    """Blocking LiteLLM call. Use `acall_llm` from async code."""
    response = completion(
        model=MODEL,
        messages=messages,
        response_format=LLMResponse,
        reasoning_effort="low",
        extra_body=_EXTRA_BODY,
    )
    content = response.choices[0].message.content
    return LLMResponse.model_validate_json(content)


async def acall_llm(messages: list[dict]) -> LLMResponse:
    """Run the blocking LiteLLM call in a worker thread."""
    return await asyncio.to_thread(call_llm, messages)
