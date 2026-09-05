"""Thin wrapper around a local Ollama server, used by every AI feature
(Research Discovery, Integrity Advisor, Writing Support, Source Organiser).

Centralizing the client here means there is exactly one place that owns
model choice, retries, and the "Ollama isn't running / model not pulled"
failure mode. Swapped in for the Anthropic Claude API so the whole platform
runs with zero API keys and zero cost -- see README.md for setup
(`ollama pull <model>`) and the tradeoffs (slower on CPU-only machines,
generally lower quality than Claude on nuanced/structured/BM-fluency tasks).

To go back to a hosted provider later (Claude, Groq, etc.), only this file
needs to change -- every caller only uses complete_text/complete_json/
language_directive.
"""
import json

import httpx
from fastapi import HTTPException, status
from tenacity import retry, retry_if_not_exception_type, stop_after_attempt, wait_exponential

from app.config import settings

# Local CPU inference can be slow; give it real headroom rather than timing
# out a legitimate (if slow) generation.
_REQUEST_TIMEOUT_SECONDS = 180.0


class LlmUnavailableError(HTTPException):
    def __init__(self, detail: str) -> None:
        super().__init__(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=detail)


def is_available() -> tuple[bool, str]:
    """Used by /api/health. Distinguishes 'Ollama isn't running' from
    'Ollama is running but the configured model isn't pulled yet' -- both
    are common first-run states worth surfacing distinctly."""
    try:
        resp = httpx.get(f"{settings.ollama_base_url}/api/tags", timeout=5.0)
        resp.raise_for_status()
        models = [m.get("name", "") for m in resp.json().get("models", [])]
        model_present = any(m == settings.ollama_model or m.startswith(settings.ollama_model + ":") for m in models)
        if not model_present:
            return False, f"Ollama is running but model '{settings.ollama_model}' is not pulled yet"
        return True, "ok"
    except httpx.HTTPError:
        return False, f"Cannot reach Ollama at {settings.ollama_base_url} -- is it running?"


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=8),
    retry=retry_if_not_exception_type(HTTPException),
    reraise=True,
)
def _call(system: str, user: str, max_tokens: int, json_mode: bool) -> str:
    payload = {
        "model": settings.ollama_model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "stream": False,
        "options": {"num_predict": max_tokens},
    }
    if json_mode:
        payload["format"] = "json"

    try:
        resp = httpx.post(f"{settings.ollama_base_url}/api/chat", json=payload, timeout=_REQUEST_TIMEOUT_SECONDS)
    except httpx.ConnectError as exc:
        raise LlmUnavailableError(
            f"Cannot reach Ollama at {settings.ollama_base_url}. Is it running? (`ollama serve`, and "
            f"`ollama pull {settings.ollama_model}` if you haven't already)"
        ) from exc

    if resp.status_code == 404:
        raise LlmUnavailableError(
            f"Ollama model '{settings.ollama_model}' is not available. Run: ollama pull {settings.ollama_model}"
        )
    resp.raise_for_status()
    return resp.json()["message"]["content"]


def complete_text(system: str, user: str, max_tokens: int = 1500) -> str:
    return _call(system, user, max_tokens, json_mode=False)


def complete_json(system: str, user: str, max_tokens: int = 2000) -> dict:
    """Ask the model for a JSON object and parse it, with one repair retry
    on bad JSON. Ollama's `format: "json"` guarantees syntactically valid
    JSON on most models, but smaller/quantized models occasionally still
    wrap it in prose -- the repair pass and fence-stripping handle that.
    """
    json_instruction = (
        "\n\nRespond with ONLY a single valid JSON object. No markdown fences, no prose before or after."
    )
    raw = _call(system + json_instruction, user, max_tokens, json_mode=True)
    try:
        return json.loads(_strip_fences(raw))
    except json.JSONDecodeError:
        repair_prompt = f"The following was supposed to be valid JSON but failed to parse:\n\n{raw}\n\nReturn ONLY the corrected valid JSON object."
        raw2 = _call("You fix malformed JSON. Output only valid JSON.", repair_prompt, max_tokens, json_mode=True)
        return json.loads(_strip_fences(raw2))


def _strip_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
    return text.strip()


def language_directive(language: str) -> str:
    if language == "ms":
        return "Respond entirely in Bahasa Malaysia, using clear academic-register BM."
    return "Respond entirely in English."
