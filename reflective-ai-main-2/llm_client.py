import json
import ssl
from dataclasses import dataclass
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from http.client import HTTPResponse
from typing import Any, Dict, Mapping, Optional, Sequence, cast

from runtime_config import ENFORCED_MODEL, OPENROUTER_API_KEY, OPENROUTER_BASE_URL

try:
    import certifi
except ImportError:  # pragma: no cover - optional dependency
    certifi = None


@dataclass(frozen=True)
class LlmResponse:
    content: str
    tool_calls: list[dict[str, object]]


def _build_url() -> str:
    if not OPENROUTER_BASE_URL:
        raise RuntimeError("OPENROUTER_API_BASE is missing")
    base = OPENROUTER_BASE_URL.rstrip("/")
    if base.endswith("/chat/completions"):
        return base
    return f"{base}/chat/completions"


def _ssl_context() -> ssl.SSLContext:
    cafile: str | None = None
    if certifi is not None:
        certifi_path = Path(certifi.where())
        if certifi_path.exists():
            cafile = str(certifi_path)
    return ssl.create_default_context(cafile=cafile)


def complete(
    messages: Sequence[Mapping[str, str]],
    model: Optional[str] = None,
    response_format=None,
    require_parameters: Optional[bool] = None,
    plugins: Optional[Sequence[Mapping[str, object]]] = None,
    tools: Optional[Sequence[Mapping[str, object]]] = None,
    tool_choice: Optional[object] = None,
) -> LlmResponse:
    if not OPENROUTER_API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY is missing")
    if not OPENROUTER_BASE_URL:
        raise RuntimeError("OPENROUTER_API_BASE is missing")

    payload: Dict[str, object] = {
        "model": ENFORCED_MODEL,
        "messages": messages,
    }
    if response_format is not None:
        payload["response_format"] = response_format
    if require_parameters is not None:
        payload["provider"] = {"require_parameters": require_parameters}
    if plugins is not None:
        payload["plugins"] = list(plugins)
    if tools is not None:
        payload["tools"] = list(tools)
    if tool_choice is not None:
        payload["tool_choice"] = tool_choice

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/reflective-ai",
        "X-Title": "Reflective AI Minimal Pipeline",
    }

    req = Request(
        _build_url(),
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )

    try:
        with urlopen(req, timeout=60, context=_ssl_context()) as response_handle:
            response = cast(HTTPResponse, response_handle)
            # Handle chunked transfer encoding manually if needed or just read safely
            try:
                raw_bytes = response.read()
            except (
                Exception
            ) as e:  # Catch IncompleteRead and other low-level read errors
                if hasattr(e, "partial"):  # IncompleteRead might have partial data
                    raw_bytes = e.partial
                else:
                    raise RuntimeError(f"Failed to read response: {e}") from e

            raw: str = raw_bytes.decode("utf-8")
            status = getattr(response, "status", None)
            reason = getattr(response, "reason", "")
    except HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(
            f"OpenRouter HTTP {exc.code} {exc.reason}: {error_body}"
        ) from exc

    if not raw:
        raise RuntimeError(
            f"Empty response from OpenRouter (status={status} {reason})."
        )

    data = cast(Dict[str, object], json.loads(raw))
    if "error" in data:
        raise RuntimeError(f"OpenRouter error: {data['error']}")

    choices = cast(list[object], data["choices"])
    first_choice = cast(dict[str, object], choices[0])
    message = cast(dict[str, object], first_choice["message"])

    content = message.get("content")
    content_text = cast(str, content) if isinstance(content, str) else ""
    tool_calls = message.get("tool_calls")
    if isinstance(tool_calls, list) and tool_calls:
        return LlmResponse(
            content=content_text,
            tool_calls=[cast(dict[str, object], item) for item in tool_calls],
        )

    function_call = message.get("function_call")
    if isinstance(function_call, dict):
        return LlmResponse(
            content=content_text,
            tool_calls=[
                {
                    "type": "function",
                    "function": function_call,
                }
            ],
        )

    if content_text:
        return LlmResponse(content=content_text, tool_calls=[])

    reasoning = message.get("reasoning")
    if isinstance(reasoning, str) and reasoning.strip():
        return LlmResponse(content=reasoning, tool_calls=[])

    parsed = message.get("parsed")
    if parsed is not None:
        return LlmResponse(content=json.dumps(parsed), tool_calls=[])

    raise ValueError(f"No content returned from model. Raw response: {raw}")


def chat(
    messages: Sequence[Mapping[str, str]],
    model: Optional[str] = None,
    response_format=None,
    require_parameters: Optional[bool] = None,
    plugins: Optional[Sequence[Mapping[str, object]]] = None,
    tools: Optional[Sequence[Mapping[str, object]]] = None,
    tool_choice: Optional[object] = None,
) -> str:
    result = complete(
        messages,
        model=model,
        response_format=response_format,
        require_parameters=require_parameters,
        plugins=plugins,
        tools=tools,
        tool_choice=tool_choice,
    )
    if result.content:
        return result.content
    if result.tool_calls:
        first_tool = result.tool_calls[0]
        function_data = cast(dict[str, object], first_tool.get("function", {}))
        arguments = function_data.get("arguments")
        if arguments:
            return cast(str, arguments)
    raise ValueError("No content returned from model.")
