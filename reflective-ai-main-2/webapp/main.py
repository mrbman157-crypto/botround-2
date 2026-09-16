from __future__ import annotations

import json
import uuid
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from flask import Flask, jsonify, make_response, request, send_from_directory

from llm_client import LlmResponse, complete as llm_complete
from runtime_config import (
    CHAT_MODEL,
    OPENROUTER_API_KEY,
    OPENROUTER_BASE_URL,
    QUALTRICS_ALLOWED_ORIGINS,
    RECAPTCHA_MIN_SCORE,
    RECAPTCHA_SECRET,
)
from webapp import db
from webapp.prompt_defaults import (
    CONTROL_OPENING_MESSAGE,
    DEFAULT_CONTROL_PROMPT,
    DEFAULT_TREATMENT_PROMPT,
    OPENING_MESSAGE,
    TREATMENT_OPENING_MESSAGE,
)


STATIC_DIR = Path(__file__).parent / "static"

app = Flask(__name__, static_folder=str(STATIC_DIR), static_url_path="/static")

CONVERSATION_END_TOOL = {
    "type": "function",
    "function": {
        "name": "conversation_end",
        "description": (
            "End the conversation when it has reached a natural, warm closing point."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "final_message": {
                    "type": "string",
                    "description": "The final assistant message to show the user.",
                }
            },
            "required": ["final_message"],
            "additionalProperties": False,
        },
    },
}

MIN_CHAT_USER_TURNS_BEFORE_COMPLETION = 3
MAX_CHAT_USER_TURNS_BEFORE_COMPLETION = 5


def _init_db() -> None:
    conn = db.connect()
    try:
        db.init_db(conn)
    finally:
        conn.close()


_init_db()


def _is_cors_origin_allowed(origin: str) -> bool:
    return "*" in QUALTRICS_ALLOWED_ORIGINS or origin in QUALTRICS_ALLOWED_ORIGINS


@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin", "").strip()
    if origin and _is_cors_origin_allowed(origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Headers"] = (
            "Content-Type, X-User-Id, X-Qualtrics-Respondent-Id"
        )
        response.headers["Access-Control-Allow-Methods"] = (
            "GET, POST, DELETE, OPTIONS"
        )
        response.headers["Vary"] = "Origin"
    return response


def _json_error(message: str, status_code: int):
    return make_response(jsonify({"detail": message}), status_code)


def _recaptcha_payload(
    data: dict[str, object], *, expected_action: str = ""
) -> dict[str, object]:
    action = str(data.get("action", "") or "")
    raw_score = data.get("score", "")
    try:
        score = float(raw_score)
    except (TypeError, ValueError):
        score = None
    return {
        "recaptcha_success": bool(data.get("success")),
        "recaptcha_score": raw_score,
        "recaptcha_min_score": RECAPTCHA_MIN_SCORE,
        "recaptcha_score_pass": (
            score >= RECAPTCHA_MIN_SCORE if score is not None else False
        ),
        "recaptcha_action_verified": action,
        "recaptcha_action_matches": (
            action == expected_action if expected_action else ""
        ),
        "recaptcha_hostname": data.get("hostname", ""),
        "recaptcha_challenge_ts": data.get("challenge_ts", ""),
        "recaptcha_error_codes": ",".join(str(value) for value in data.get("error-codes", []) or []),
    }


def _request_data() -> dict[str, object]:
    json_payload = request.get_json(silent=True)
    if isinstance(json_payload, dict):
        return json_payload
    return dict(request.form.items())


def _database_ready() -> bool:
    try:
        conn = db.connect()
        try:
            conn.execute("CREATE TEMP TABLE IF NOT EXISTS health_check (ok INTEGER)")
            conn.execute("INSERT INTO health_check (ok) VALUES (1)")
            conn.execute("DROP TABLE health_check")
            return True
        finally:
            conn.close()
    except Exception:
        return False


def _get_user_id() -> tuple[str, bool]:
    header_user_id = request.headers.get("X-User-Id")
    qualtrics_user_id = request.headers.get("X-Qualtrics-Respondent-Id")
    cookie_user_id = request.cookies.get("rid_user")
    user_id = header_user_id or qualtrics_user_id or cookie_user_id
    if user_id:
        return str(user_id), False
    return str(uuid.uuid4()), True


def _chat_turn_count(messages: list[dict[str, object]]) -> int:
    return sum(1 for message in messages if message.get("role") == "user")


def _with_user_cookie(resp, *, user_id: str, needs_cookie: bool):
    if needs_cookie:
        resp.set_cookie("rid_user", user_id, httponly=False, samesite="Lax")
    return resp


def _normalize_text(value: object) -> str:
    return " ".join(str(value or "").strip().split())


def _parse_strength(value: object) -> int:
    raw = str(value if value is not None else "").strip()
    if not raw:
        raise ValueError("survey.strength_score is required")
    try:
        score = int(raw)
    except (TypeError, ValueError) as exc:
        raise ValueError("survey.strength_score must be an integer from 0 to 100") from exc
    if score < 0 or score > 100:
        raise ValueError("survey.strength_score must be between 0 and 100")
    return score


def _validate_condition(value: object) -> str:
    return "treatment"


def _validate_survey(payload: object) -> tuple[str, str, int, str, str, str]:
    if not isinstance(payload, dict):
        raise ValueError("survey must be an object")
    topic = _normalize_text(payload.get("topic"))
    stance = _normalize_text(payload.get("stance"))
    if not topic:
        raise ValueError("survey.topic is required")
    if not stance:
        raise ValueError("survey.stance is required")
    return (
        topic,
        stance,
        _parse_strength(payload.get("strength_score")),
        _validate_condition(payload.get("condition")),
        _normalize_text(payload.get("condition_assignment_source")),
        _normalize_text(payload.get("condition_assigned_at")),
    )


def _prompt_for_condition(condition: object) -> str:
    if _normalize_text(condition).lower() == "control":
        return DEFAULT_CONTROL_PROMPT
    return DEFAULT_TREATMENT_PROMPT


def _opening_message_for_condition(condition: object) -> str:
    if _normalize_text(condition).lower() == "control":
        return CONTROL_OPENING_MESSAGE
    return TREATMENT_OPENING_MESSAGE


def _render_prompt(*, state: dict[str, object], turn_number: int) -> str:
    values = {
        "topic": str(state.get("topic_raw") or ""),
        "stance": str(state.get("stance_raw") or ""),
        "strength": str(state.get("strength_score") or ""),
        "condition": str(state.get("condition") or "treatment"),
        "turn_number": str(turn_number),
    }
    prompt = _prompt_for_condition(values["condition"])
    for key, value in values.items():
        prompt = prompt.replace("{{" + key + "}}", value)
    return prompt


def _is_control_state(state: dict[str, object]) -> bool:
    return _normalize_text(state.get("condition")).lower() == "control"


def _fallback_final_message(state: dict[str, object]) -> str:
    if _is_control_state(state):
        return "Danke, dass du mir ein wenig von diesem Interesse erzählt hast."
    return "Danke, dass du dir die Zeit genommen hast, das mit mir durchzusprechen."


def _final_turn_instruction(state: dict[str, object]) -> str:
    if _is_control_state(state):
        return (
            "Dies ist der letzte Zug. Gib jetzt eine warme, abschließende Antwort zum Hobby "
            "oder Interesse der teilnehmenden Person. Stelle keine weitere Frage. Bringe keine "
            "Politik oder Perspektivwechsel-Reflexion ein. Beende das Gespräch."
        )
    return (
        "Dies ist der letzte Zug. Gib jetzt eine warme, abschließende Antwort. "
        "Stelle keine weitere Frage. Beende das Gespräch."
    )


def _conversation_end_message(result: LlmResponse, state: dict[str, object]) -> str | None:
    for tool_call in result.tool_calls:
        function_data = tool_call.get("function")
        if not isinstance(function_data, dict):
            continue
        if function_data.get("name") != "conversation_end":
            continue
        raw_arguments = function_data.get("arguments")
        if isinstance(raw_arguments, str):
            try:
                arguments = json.loads(raw_arguments)
            except ValueError:
                arguments = {}
        elif isinstance(raw_arguments, dict):
            arguments = raw_arguments
        else:
            arguments = {}
        final_message = _normalize_text(arguments.get("final_message"))
        return final_message or result.content or _fallback_final_message(state)
    return None


def _conversation_payload(conn, *, user_id: str, conversation_id: str):
    payload = db.export_conversation(
        conn, user_id=user_id, conversation_id=conversation_id
    )
    return _finalize_conversation_payload(payload)


def _transcript_payload(conn, *, conversation_id: str, transcript_token: str):
    payload = db.export_conversation_by_transcript_token(
        conn, conversation_id=conversation_id, transcript_token=transcript_token
    )
    return _finalize_conversation_payload(payload)


def _finalize_conversation_payload(payload):
    if payload is None:
        return None
    state = payload.get("conversation_state", {})
    condition = state.get("condition") if isinstance(state, dict) else "treatment"
    payload["opening_message"] = _opening_message_for_condition(condition)
    payload["chat_min_user_turns"] = MIN_CHAT_USER_TURNS_BEFORE_COMPLETION
    payload["chat_max_user_turns"] = MAX_CHAT_USER_TURNS_BEFORE_COMPLETION
    if isinstance(state, dict):
      payload["chat_condition"] = state.get("condition") or "treatment"
      payload["chat_topic"] = state.get("topic_raw") or ""
      payload["chat_condition_assignment_source"] = (
          state.get("condition_assignment_source") or ""
      )
      payload["chat_condition_assigned_at"] = state.get("condition_assigned_at") or ""
    messages = payload.get("messages", [])
    if isinstance(messages, list):
        payload["chat_turn_count"] = _chat_turn_count(messages)
    else:
        payload["chat_turn_count"] = 0
    payload["chat_completed"] = bool(payload.get("completed_at"))
    return payload


@app.get("/")
def index():
    return send_from_directory(str(STATIC_DIR), "index.html")


@app.get("/api/me")
def api_me():
    user_id, needs_cookie = _get_user_id()
    resp = make_response(
        jsonify(
            {
                "user_id": user_id,
                "chat_model": CHAT_MODEL,
                "app_name": "Reflective Sandbox",
                "opening_message": OPENING_MESSAGE,
            }
        )
    )
    return _with_user_cookie(resp, user_id=user_id, needs_cookie=needs_cookie)


@app.get("/api/health")
def api_health():
    return jsonify(
        {
            "ok": True,
            "chat_model": CHAT_MODEL,
            "openrouter_configured": bool(OPENROUTER_API_KEY and OPENROUTER_BASE_URL),
            "qualtrics_allowed_origins_configured": bool(QUALTRICS_ALLOWED_ORIGINS),
            "database_ready": _database_ready(),
            "recaptcha_configured": bool(RECAPTCHA_SECRET),
            "recaptcha_min_score": RECAPTCHA_MIN_SCORE,
            "chat_min_user_turns": MIN_CHAT_USER_TURNS_BEFORE_COMPLETION,
            "chat_max_user_turns": MAX_CHAT_USER_TURNS_BEFORE_COMPLETION,
        }
    )


@app.post("/api/recaptcha/verify")
def api_verify_recaptcha():
    payload = _request_data()
    token = _normalize_text(payload.get("token") or payload.get("recaptcha_token"))
    remoteip = _normalize_text(payload.get("remoteip"))
    expected_action = _normalize_text(payload.get("expected_action") or "study_overview")
    if not token:
        return _json_error("recaptcha token is required", 400)
    if not RECAPTCHA_SECRET:
        return jsonify(
            {
                "recaptcha_success": False,
                "recaptcha_score": "",
                "recaptcha_min_score": RECAPTCHA_MIN_SCORE,
                "recaptcha_score_pass": False,
                "recaptcha_action_verified": "",
                "recaptcha_action_matches": False,
                "recaptcha_hostname": "",
                "recaptcha_challenge_ts": "",
                "recaptcha_error_codes": "missing-secret",
            }
        )

    verify_payload = {
        "secret": RECAPTCHA_SECRET,
        "response": token,
    }
    if remoteip:
        verify_payload["remoteip"] = remoteip
    req = Request(
        "https://www.google.com/recaptcha/api/siteverify",
        data=urlencode(verify_payload).encode("utf-8"),
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urlopen(req, timeout=10) as response_handle:
            raw = response_handle.read().decode("utf-8")
    except Exception as exc:
        return jsonify(
            {
                "recaptcha_success": False,
                "recaptcha_score": "",
                "recaptcha_min_score": RECAPTCHA_MIN_SCORE,
                "recaptcha_score_pass": False,
                "recaptcha_action_verified": "",
                "recaptcha_action_matches": False,
                "recaptcha_hostname": "",
                "recaptcha_challenge_ts": "",
                "recaptcha_error_codes": f"verification-error:{exc.__class__.__name__}",
            }
        )

    return jsonify(_recaptcha_payload(json.loads(raw or "{}"), expected_action=expected_action))


@app.post("/api/conversations")
def api_create_conversation():
    user_id, needs_cookie = _get_user_id()
    payload = request.get_json(silent=True) or {}
    try:
        (
            topic,
            stance,
            strength_score,
            condition,
            condition_assignment_source,
            condition_assigned_at,
        ) = _validate_survey(payload.get("survey"))
    except ValueError as exc:
        return _json_error(str(exc), 400)

    conn = db.connect()
    try:
        conversation_id = db.create_conversation(
            conn,
            user_id=user_id,
            topic=topic,
            stance=stance,
            strength_score=strength_score,
            condition=condition,
            condition_assignment_source=condition_assignment_source,
            condition_assigned_at=condition_assigned_at,
        )
        response_payload = _conversation_payload(
            conn, user_id=user_id, conversation_id=conversation_id
        )
        resp = make_response(jsonify(response_payload))
        return _with_user_cookie(resp, user_id=user_id, needs_cookie=needs_cookie)
    finally:
        conn.close()


@app.get("/api/conversations/<conversation_id>")
def api_get_conversation(conversation_id: str):
    user_id, needs_cookie = _get_user_id()
    conn = db.connect()
    try:
        payload = _conversation_payload(
            conn, user_id=user_id, conversation_id=conversation_id
        )
        if payload is None:
            return _json_error("Conversation not found", 404)
        resp = make_response(jsonify(payload))
        return _with_user_cookie(resp, user_id=user_id, needs_cookie=needs_cookie)
    finally:
        conn.close()


@app.get("/api/transcripts/<conversation_id>/<transcript_token>")
def api_get_transcript(conversation_id: str, transcript_token: str):
    conn = db.connect()
    try:
        payload = _transcript_payload(
            conn, conversation_id=conversation_id, transcript_token=transcript_token
        )
        if payload is None:
            return _json_error("Transcript not found", 404)
        return jsonify(payload)
    finally:
        conn.close()


@app.post("/api/conversations/<conversation_id>/messages")
def api_send_message(conversation_id: str):
    user_id, needs_cookie = _get_user_id()
    payload = request.get_json(silent=True) or {}
    user_content = _normalize_text(payload.get("content"))
    if not user_content:
        return _json_error("content is required", 400)

    conn = db.connect()
    try:
        conversation = db.get_conversation(
            conn, user_id=user_id, conversation_id=conversation_id
        )
        if conversation is None:
            return _json_error("Conversation not found", 404)
        if conversation.get("completed_at"):
            return _json_error("Conversation complete", 409)
        state = db.get_conversation_state(conn, conversation_id=conversation_id)
        if state is None:
            return _json_error("Conversation setup is missing", 500)

        db.add_message(
            conn,
            conversation_id=conversation_id,
            role="user",
            content=user_content,
        )
        messages = db.list_messages(conn, conversation_id=conversation_id)
        user_turns = sum(1 for message in messages if message.get("role") == "user")
        system_prompt = _render_prompt(state=state, turn_number=user_turns)
        llm_messages = [
            {"role": "system", "content": system_prompt},
            *[
                {"role": str(message["role"]), "content": str(message["content"])}
                for message in messages
                if message.get("role") in {"user", "assistant"}
            ],
        ]

        completion_allowed = user_turns >= MIN_CHAT_USER_TURNS_BEFORE_COMPLETION
        completion_required = user_turns >= MAX_CHAT_USER_TURNS_BEFORE_COMPLETION
        if completion_required:
            llm_messages.append(
                {
                    "role": "system",
                    "content": _final_turn_instruction(state),
                }
            )

        try:
            result = llm_complete(
                llm_messages,
                model=CHAT_MODEL,
                tools=[CONVERSATION_END_TOOL] if completion_allowed else None,
                tool_choice=(
                    {
                        "type": "function",
                        "function": {"name": "conversation_end"},
                    }
                    if completion_required
                    else "auto" if completion_allowed else None
                ),
            )
        except Exception as exc:
            return _json_error(str(exc), 502)

        final_message = _conversation_end_message(result, state) if completion_allowed else None
        if completion_required and final_message is None:
            final_message = result.content or _fallback_final_message(state)
        assistant_text = final_message if final_message is not None else result.content
        if not assistant_text:
            return _json_error("Model returned no assistant message", 502)

        db.add_message(
            conn,
            conversation_id=conversation_id,
            role="assistant",
            content=assistant_text,
            system_prompt=system_prompt,
            model=CHAT_MODEL,
        )
        if final_message is not None:
            db.mark_conversation_completed(
                conn,
                conversation_id=conversation_id,
                completion_reason=(
                    "forced_max_turns" if completion_required else "model_tool"
                ),
            )
        response_payload = _conversation_payload(
            conn, user_id=user_id, conversation_id=conversation_id
        )
        resp = make_response(jsonify(response_payload))
        return _with_user_cookie(resp, user_id=user_id, needs_cookie=needs_cookie)
    finally:
        conn.close()


@app.delete("/api/conversations/<conversation_id>")
def api_delete_conversation(conversation_id: str):
    user_id, needs_cookie = _get_user_id()
    conn = db.connect()
    try:
        deleted = db.delete_conversation(
            conn, user_id=user_id, conversation_id=conversation_id
        )
        if not deleted:
            return _json_error("Conversation not found", 404)
        resp = make_response(jsonify({"deleted": True}))
        return _with_user_cookie(resp, user_id=user_id, needs_cookie=needs_cookie)
    finally:
        conn.close()
