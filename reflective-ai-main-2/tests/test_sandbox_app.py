from __future__ import annotations

import sqlite3
import unittest
import uuid
from pathlib import Path
from unittest import mock

from llm_client import LlmResponse
import runtime_config
from runtime_config import DATA_DIR
from webapp import db
import webapp.main as webapp_main
from webapp.main import app

APP_JS = Path(__file__).resolve().parents[1] / "webapp" / "static" / "app.js"
INDEX_HTML = Path(__file__).resolve().parents[1] / "webapp" / "static" / "index.html"
QUALTRICS_JS = (
    Path(__file__).resolve().parents[1] / "webapp" / "static" / "qualtrics-chatbot.js"
)


class SandboxAppTests(unittest.TestCase):
    def setUp(self) -> None:
        self.original_db_path = db.DB_PATH
        self.test_db_path = DATA_DIR / f"test-sandbox-{uuid.uuid4().hex}.sqlite3"
        db.DB_PATH = self.test_db_path
        conn = db.connect()
        try:
            db.init_db(conn)
        finally:
            conn.close()
        self.client = app.test_client()
        self.headers = {"X-User-Id": f"test-user-{uuid.uuid4().hex}"}

    def tearDown(self) -> None:
        mock.patch.stopall()
        db.DB_PATH = self.original_db_path
        if self.test_db_path.exists():
            self.test_db_path.unlink()

    def _create_conversation(self, **survey_overrides: object):
        survey = {
            "topic": "Housing policy",
            "stance": "I support more affordable housing.",
            "strength_score": 72,
            "condition_assignment_source": "browser_randomized",
            "condition_assigned_at": "2026-06-12T12:00:00.000Z",
        }
        survey.update(survey_overrides)
        return self.client.post(
            "/api/conversations",
            json={"survey": survey},
            headers=self.headers,
        )

    def test_create_conversation_requires_complete_valid_survey(self) -> None:
        missing_topic = self._create_conversation(topic="")
        self.assertEqual(400, missing_topic.status_code)
        self.assertIn("survey.topic is required", missing_topic.get_json()["detail"])

        bad_strength = self._create_conversation(strength_score=101)
        self.assertEqual(400, bad_strength.status_code)
        self.assertIn("between 0 and 100", bad_strength.get_json()["detail"])

        response = self._create_conversation()
        self.assertEqual(200, response.status_code)
        payload = response.get_json()
        self.assertEqual([], payload["messages"])
        self.assertEqual("Housing policy", payload["conversation_state"]["topic_raw"])
        self.assertEqual(72, payload["conversation_state"]["strength_score"])
        self.assertEqual("treatment", payload["conversation_state"]["condition"])
        self.assertEqual(
            "browser_randomized",
            payload["conversation_state"]["condition_assignment_source"],
        )
        self.assertEqual(
            "2026-06-12T12:00:00.000Z",
            payload["conversation_state"]["condition_assigned_at"],
        )
        self.assertTrue(payload["transcript_token"])
        self.assertEqual(0, payload["chat_turn_count"])
        self.assertFalse(payload["chat_completed"])

        control_response = self._create_conversation(
            topic="Cooking or baking",
            stance="I like trying new recipes on weekends.",
            strength_score=88,
            condition="control",
        )
        self.assertEqual(200, control_response.status_code)
        self.assertEqual(
            "control",
            control_response.get_json()["conversation_state"]["condition"],
        )

        bad_condition = self._create_conversation(condition="reflection-only")
        self.assertEqual(400, bad_condition.status_code)
        self.assertIn("survey.condition", bad_condition.get_json()["detail"])

    def test_qualtrics_origin_gets_cors_headers(self) -> None:
        headers = {
            "Origin": "https://umich.qualtrics.com",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type, X-Qualtrics-Respondent-Id",
        }
        with mock.patch.object(
            webapp_main,
            "QUALTRICS_ALLOWED_ORIGINS",
            ("https://umich.qualtrics.com",),
        ):
            response = self.client.options("/api/conversations", headers=headers)

        self.assertEqual(200, response.status_code)
        self.assertEqual(
            "https://umich.qualtrics.com",
            response.headers["Access-Control-Allow-Origin"],
        )
        self.assertIn(
            "X-Qualtrics-Respondent-Id",
            response.headers["Access-Control-Allow-Headers"],
        )
        self.assertIn("POST", response.headers["Access-Control-Allow-Methods"])

        with mock.patch.object(
            webapp_main,
            "QUALTRICS_ALLOWED_ORIGINS",
            ("https://umich.qualtrics.com",),
        ):
            blocked = self.client.options(
                "/api/conversations",
                headers={**headers, "Origin": "https://example.com"},
            )
        self.assertNotIn("Access-Control-Allow-Origin", blocked.headers)

    def test_health_endpoint_reports_non_secret_readiness_flags(self) -> None:
        with (
            mock.patch.object(webapp_main, "OPENROUTER_API_KEY", "test-key"),
            mock.patch.object(webapp_main, "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
            mock.patch.object(webapp_main, "QUALTRICS_ALLOWED_ORIGINS", ("https://umich.qualtrics.com",)),
            mock.patch.object(webapp_main, "RECAPTCHA_SECRET", "secret"),
        ):
            response = self.client.get("/api/health", headers=self.headers)

        self.assertEqual(200, response.status_code)
        payload = response.get_json()
        self.assertTrue(payload["ok"])
        self.assertTrue(payload["openrouter_configured"])
        self.assertTrue(payload["qualtrics_allowed_origins_configured"])
        self.assertTrue(payload["database_ready"])
        self.assertTrue(payload["recaptcha_configured"])
        self.assertEqual(8, payload["chat_min_user_turns"])
        self.assertEqual(10, payload["chat_max_user_turns"])
        self.assertIn("chat_model", payload)
        self.assertNotIn("test-key", str(payload))
        self.assertNotIn("secret", str(payload))

    def test_recaptcha_min_score_config_helper_falls_back_and_clamps(self) -> None:
        with mock.patch("runtime_config.os.getenv", return_value="not-a-number"):
            self.assertEqual(
                0.5,
                runtime_config._float_env("RECAPTCHA_MIN_SCORE", 0.5, minimum=0.0, maximum=1.0),
            )
        with mock.patch("runtime_config.os.getenv", return_value="nan"):
            self.assertEqual(
                0.5,
                runtime_config._float_env("RECAPTCHA_MIN_SCORE", 0.5, minimum=0.0, maximum=1.0),
            )
        with mock.patch("runtime_config.os.getenv", return_value="2.5"):
            self.assertEqual(
                1.0,
                runtime_config._float_env("RECAPTCHA_MIN_SCORE", 0.5, minimum=0.0, maximum=1.0),
            )

    def test_recaptcha_verify_endpoint_returns_score_fields(self) -> None:
        response = mock.MagicMock()
        response.read.return_value = (
            b'{"success":true,"score":0.91,"action":"study_overview","hostname":"umich.qualtrics.com","challenge_ts":"2026-06-12T12:00:00Z"}'
        )
        response_handle = mock.MagicMock()
        response_handle.__enter__.return_value = response
        response_handle.__exit__.return_value = False

        with (
            mock.patch.object(webapp_main, "RECAPTCHA_SECRET", "test-secret"),
            mock.patch("webapp.main.urlopen", return_value=response_handle),
        ):
            verify_response = self.client.post(
                "/api/recaptcha/verify",
                json={"token": "test-token"},
                headers=self.headers,
            )

        self.assertEqual(200, verify_response.status_code)
        payload = verify_response.get_json()
        self.assertTrue(payload["recaptcha_success"])
        self.assertEqual(0.91, payload["recaptcha_score"])
        self.assertEqual(0.5, payload["recaptcha_min_score"])
        self.assertTrue(payload["recaptcha_score_pass"])
        self.assertEqual("study_overview", payload["recaptcha_action_verified"])
        self.assertTrue(payload["recaptcha_action_matches"])
        self.assertEqual("umich.qualtrics.com", payload["recaptcha_hostname"])

    def test_recaptcha_verify_endpoint_accepts_form_encoded_token(self) -> None:
        response = mock.MagicMock()
        response.read.return_value = b'{"success":true,"score":0.74,"action":"study_overview"}'
        response_handle = mock.MagicMock()
        response_handle.__enter__.return_value = response
        response_handle.__exit__.return_value = False

        with (
            mock.patch.object(webapp_main, "RECAPTCHA_SECRET", "test-secret"),
            mock.patch("webapp.main.urlopen", return_value=response_handle),
        ):
            verify_response = self.client.post(
                "/api/recaptcha/verify",
                data={"recaptcha_token": "form-token", "expected_action": "study_overview"},
                headers=self.headers,
            )

        self.assertEqual(200, verify_response.status_code)
        payload = verify_response.get_json()
        self.assertTrue(payload["recaptcha_success"])
        self.assertEqual(0.74, payload["recaptcha_score"])
        self.assertTrue(payload["recaptcha_score_pass"])
        self.assertTrue(payload["recaptcha_action_matches"])

    def test_qualtrics_respondent_header_scopes_conversation(self) -> None:
        qualtrics_headers = {"X-Qualtrics-Respondent-Id": "respondent-123"}
        create_response = self.client.post(
            "/api/conversations",
            json={
                "survey": {
                    "topic": "Housing policy",
                    "stance": "I support more affordable housing.",
                    "strength_score": 72,
                }
            },
            headers=qualtrics_headers,
        )

        self.assertEqual(200, create_response.status_code)
        self.assertNotIn("Set-Cookie", create_response.headers)
        conversation_id = create_response.get_json()["conversation_id"]
        self.assertEqual("respondent-123", create_response.get_json()["respondent_id"])

        same_respondent = self.client.get(
            f"/api/conversations/{conversation_id}",
            headers=qualtrics_headers,
        )
        self.assertEqual(200, same_respondent.status_code)
        self.assertEqual("respondent-123", same_respondent.get_json()["respondent_id"])

        other_respondent = self.client.get(
            f"/api/conversations/{conversation_id}",
            headers={"X-Qualtrics-Respondent-Id": "respondent-456"},
        )
        self.assertEqual(404, other_respondent.status_code)

    def test_transcript_url_is_accessible_by_token_without_respondent_header(self) -> None:
        create_response = self._create_conversation()
        payload = create_response.get_json()
        conversation_id = payload["conversation_id"]
        transcript_token = payload["transcript_token"]
        self.assertEqual("treatment", payload["chat_condition"])
        self.assertEqual("Housing policy", payload["chat_topic"])
        self.assertEqual("browser_randomized", payload["chat_condition_assignment_source"])
        self.assertEqual("2026-06-12T12:00:00.000Z", payload["chat_condition_assigned_at"])

        with mock.patch(
            "webapp.main.llm_complete",
            return_value=LlmResponse(content="Tell me more about that.", tool_calls=[]),
        ):
            response = self.client.post(
                f"/api/conversations/{conversation_id}/messages",
                json={"content": "It affects my neighborhood."},
                headers=self.headers,
            )

        self.assertEqual(200, response.status_code)

        transcript = self.client.get(
            f"/api/transcripts/{conversation_id}/{transcript_token}"
        )
        self.assertEqual(200, transcript.status_code)
        transcript_payload = transcript.get_json()
        self.assertEqual(conversation_id, transcript_payload["conversation_id"])
        self.assertEqual("", transcript_payload["respondent_id"])
        self.assertEqual(1, transcript_payload["chat_turn_count"])
        self.assertEqual(8, transcript_payload["chat_min_user_turns"])
        self.assertEqual(10, transcript_payload["chat_max_user_turns"])
        self.assertEqual("treatment", transcript_payload["chat_condition"])
        self.assertEqual("Housing policy", transcript_payload["chat_topic"])
        self.assertEqual(
            "browser_randomized",
            transcript_payload["chat_condition_assignment_source"],
        )
        self.assertEqual(
            "2026-06-12T12:00:00.000Z",
            transcript_payload["chat_condition_assigned_at"],
        )
        self.assertEqual(
            ["user", "assistant"],
            [message["role"] for message in transcript_payload["messages"]],
        )
        self.assertNotIn("transcript_token", transcript_payload)

        wrong_token = self.client.get(f"/api/transcripts/{conversation_id}/wrong-token")
        self.assertEqual(404, wrong_token.status_code)

    def test_send_message_interpolates_fixed_prompt_and_stores_turns(self) -> None:
        create_response = self._create_conversation()
        conversation_id = create_response.get_json()["conversation_id"]
        captured_messages = []

        def fake_llm(messages, model=None, tools=None, tool_choice=None):
            captured_messages.append(messages)
            return LlmResponse(
                content="What feels most important about that to you?",
                tool_calls=[],
            )

        with mock.patch("webapp.main.llm_complete", side_effect=fake_llm):
            response = self.client.post(
                f"/api/conversations/{conversation_id}/messages",
                json={"content": "It affects whether my family can stay nearby."},
                headers=self.headers,
            )

        self.assertEqual(200, response.status_code)
        payload = response.get_json()
        self.assertEqual(["user", "assistant"], [m["role"] for m in payload["messages"]])
        self.assertEqual(1, payload["chat_turn_count"])
        self.assertFalse(payload["chat_completed"])
        system_prompt = payload["messages"][1]["system_prompt"]
        self.assertIn("Their chosen topic: Housing policy", system_prompt)
        self.assertIn("Their position: I support more affordable housing.", system_prompt)
        self.assertIn("How strongly they hold this view: 72 on a 0–100 scale", system_prompt)
        self.assertIn("One question per turn, strictly", system_prompt)
        self.assertIn("conversation_end tool", system_prompt)
        self.assertEqual("system", captured_messages[0][0]["role"])

    def test_control_condition_uses_neutral_hobby_prompt(self) -> None:
        create_response = self._create_conversation(
            topic="Cooking or baking",
            stance="I like trying new recipes on weekends.",
            strength_score=88,
            condition="control",
        )
        conversation_id = create_response.get_json()["conversation_id"]

        with mock.patch(
            "webapp.main.llm_complete",
            return_value=LlmResponse(content="What do you most like to make?", tool_calls=[]),
        ):
            response = self.client.post(
                f"/api/conversations/{conversation_id}/messages",
                json={"content": "I usually bake bread."},
                headers=self.headers,
            )

        self.assertEqual(200, response.status_code)
        payload = response.get_json()
        system_prompt = payload["messages"][1]["system_prompt"]
        self.assertEqual("control", payload["conversation_state"]["condition"])
        self.assertIn("light, nonpolitical chat", system_prompt)
        self.assertIn("Their chosen activity or interest: Cooking or baking", system_prompt)
        self.assertIn("avoiding the reflective intervention", system_prompt)
        self.assertNotIn("fellow citizens on the other side", system_prompt)

    def test_control_forced_final_turn_uses_neutral_hobby_instruction(self) -> None:
        create_response = self._create_conversation(
            topic="Cooking or baking",
            stance="I like trying new recipes on weekends.",
            strength_score=88,
            condition="control",
        )
        conversation_id = create_response.get_json()["conversation_id"]
        conn = db.connect()
        try:
            for index in range(9):
                db.add_message(
                    conn,
                    conversation_id=conversation_id,
                    role="user",
                    content=f"Prior user turn {index + 1}.",
                )
                db.add_message(
                    conn,
                    conversation_id=conversation_id,
                    role="assistant",
                    content=f"Prior assistant turn {index + 1}.",
                )
        finally:
            conn.close()

        captured_messages = []

        def fake_llm(messages, model=None, tools=None, tool_choice=None):
            captured_messages.extend(messages)
            return LlmResponse(content="", tool_calls=[])

        with mock.patch("webapp.main.llm_complete", side_effect=fake_llm):
            response = self.client.post(
                f"/api/conversations/{conversation_id}/messages",
                json={"content": "That is my final baking thought."},
                headers=self.headers,
            )

        self.assertEqual(200, response.status_code)
        payload = response.get_json()
        self.assertTrue(payload["chat_completed"])
        self.assertEqual("forced_max_turns", payload["completion_reason"])
        self.assertEqual(
            "Thank you for sharing a bit about this interest with me.",
            payload["messages"][-1]["content"],
        )
        self.assertIn("participant's hobby or interest", captured_messages[-1]["content"])
        self.assertIn("Do not introduce politics", captured_messages[-1]["content"])
        self.assertIn("reflective perspective-taking", captured_messages[-1]["content"])

    def test_control_empty_conversation_end_tool_uses_neutral_fallback(self) -> None:
        create_response = self._create_conversation(
            topic="Cooking or baking",
            stance="I like trying new recipes on weekends.",
            strength_score=88,
            condition="control",
        )
        conversation_id = create_response.get_json()["conversation_id"]
        conn = db.connect()
        try:
            for index in range(7):
                db.add_message(
                    conn,
                    conversation_id=conversation_id,
                    role="user",
                    content=f"Prior user turn {index + 1}.",
                )
                db.add_message(
                    conn,
                    conversation_id=conversation_id,
                    role="assistant",
                    content=f"Prior assistant turn {index + 1}.",
                )
        finally:
            conn.close()

        with mock.patch(
            "webapp.main.llm_complete",
            return_value=LlmResponse(
                content="",
                tool_calls=[
                    {
                        "type": "function",
                        "function": {
                            "name": "conversation_end",
                            "arguments": '{"final_message": ""}',
                        },
                    }
                ],
            ),
        ):
            response = self.client.post(
                f"/api/conversations/{conversation_id}/messages",
                json={"content": "That feels like a good place to stop."},
                headers=self.headers,
            )

        self.assertEqual(200, response.status_code)
        payload = response.get_json()
        self.assertTrue(payload["chat_completed"])
        self.assertEqual("model_tool", payload["completion_reason"])
        self.assertEqual(
            "Thank you for sharing a bit about this interest with me.",
            payload["messages"][-1]["content"],
        )

    def test_removed_routes_return_404(self) -> None:
        removed_paths = [
            "/viewer",
            "/mobile",
            "/sandbox",
            "/api/system-prompt",
            "/api/prompt-components",
            "/api/guardrails",
            "/api/evals",
            "/api/db-view",
            "/api/conversations/export",
        ]
        for path in removed_paths:
            with self.subTest(path=path):
                self.assertEqual(404, self.client.get(path, headers=self.headers).status_code)

    def test_existing_legacy_tables_are_not_wiped_by_init(self) -> None:
        conn = sqlite3.connect(self.test_db_path)
        try:
            conn.execute(
                "INSERT INTO conversations (conversation_id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
                ("legacy-conversation", self.headers["X-User-Id"], "Legacy", "t1", "t1"),
            )
            conn.execute(
                "CREATE TABLE IF NOT EXISTS user_settings (user_id TEXT PRIMARY KEY, system_prompt TEXT)"
            )
            conn.execute(
                "INSERT INTO user_settings (user_id, system_prompt) VALUES (?, ?)",
                ("legacy-user", "legacy prompt"),
            )
            conn.commit()
        finally:
            conn.close()

        conn = db.connect()
        try:
            db.init_db(conn)
            count = conn.execute("SELECT COUNT(*) FROM conversations").fetchone()[0]
            settings_count = conn.execute("SELECT COUNT(*) FROM user_settings").fetchone()[0]
        finally:
            conn.close()

        self.assertEqual(1, count)
        self.assertEqual(1, settings_count)

    def test_prompt_still_instructs_model_not_to_use_markdown(self) -> None:
        create_response = self._create_conversation()
        conversation_id = create_response.get_json()["conversation_id"]

        with mock.patch(
            "webapp.main.llm_complete",
            return_value=LlmResponse(
                content="I can still render **bold** if the model sends it.",
                tool_calls=[],
            ),
        ):
            response = self.client.post(
                f"/api/conversations/{conversation_id}/messages",
                json={"content": "Hello"},
                headers=self.headers,
            )

        self.assertEqual(200, response.status_code)
        system_prompt = response.get_json()["messages"][1]["system_prompt"]
        self.assertIn("Use plain, conversational language", system_prompt)

    def test_conversation_end_tool_stores_final_message_and_blocks_future_sends(self) -> None:
        create_response = self._create_conversation()
        conversation_id = create_response.get_json()["conversation_id"]
        conn = db.connect()
        try:
            for index in range(7):
                db.add_message(
                    conn,
                    conversation_id=conversation_id,
                    role="user",
                    content=f"Prior user turn {index + 1}.",
                )
                db.add_message(
                    conn,
                    conversation_id=conversation_id,
                    role="assistant",
                    content=f"Prior assistant turn {index + 1}.",
                )
        finally:
            conn.close()

        with mock.patch(
            "webapp.main.llm_complete",
            return_value=LlmResponse(
                content="",
                tool_calls=[
                    {
                        "type": "function",
                        "function": {
                            "name": "conversation_end",
                            "arguments": '{"final_message": "Thanks for thinking this through with me."}',
                        },
                    }
                ],
            ),
        ) as mock_complete:
            response = self.client.post(
                f"/api/conversations/{conversation_id}/messages",
                json={"content": "That feels like a good place to stop."},
                headers=self.headers,
            )

        self.assertEqual(200, response.status_code)
        payload = response.get_json()
        self.assertIsNotNone(payload["completed_at"])
        self.assertTrue(payload["chat_completed"])
        self.assertEqual("model_tool", payload["completion_reason"])
        self.assertEqual(1, payload["chat_turn_count"])
        self.assertEqual(
            "Thanks for thinking this through with me.",
            payload["messages"][-1]["content"],
        )
        self.assertEqual("conversation_end", mock_complete.call_args.kwargs["tools"][0]["function"]["name"])

        blocked_response = self.client.post(
            f"/api/conversations/{conversation_id}/messages",
            json={"content": "One more thought."},
            headers=self.headers,
        )
        self.assertEqual(409, blocked_response.status_code)

    def test_conversation_cannot_complete_before_eighth_user_turn(self) -> None:
        create_response = self._create_conversation()
        conversation_id = create_response.get_json()["conversation_id"]

        with mock.patch(
            "webapp.main.llm_complete",
            return_value=LlmResponse(
                content="What feels most important about that?",
                tool_calls=[],
            ),
        ) as mock_complete:
            response = self.client.post(
                f"/api/conversations/{conversation_id}/messages",
                json={"content": "This is my first thought."},
                headers=self.headers,
            )

        self.assertEqual(200, response.status_code)
        payload = response.get_json()
        self.assertFalse(payload["chat_completed"])
        self.assertEqual(1, payload["chat_turn_count"])
        self.assertIsNone(mock_complete.call_args.kwargs["tools"])
        self.assertIsNone(mock_complete.call_args.kwargs["tool_choice"])

    def test_conversation_forces_completion_on_tenth_user_turn(self) -> None:
        create_response = self._create_conversation()
        conversation_id = create_response.get_json()["conversation_id"]
        conn = db.connect()
        try:
            for index in range(9):
                db.add_message(
                    conn,
                    conversation_id=conversation_id,
                    role="user",
                    content=f"Prior user turn {index + 1}.",
                )
                db.add_message(
                    conn,
                    conversation_id=conversation_id,
                    role="assistant",
                    content=f"Prior assistant turn {index + 1}.",
                )
        finally:
            conn.close()

        with mock.patch(
            "webapp.main.llm_complete",
            return_value=LlmResponse(content="Thanks for sharing that with me.", tool_calls=[]),
        ) as mock_complete:
            response = self.client.post(
                f"/api/conversations/{conversation_id}/messages",
                json={"content": "That is my final thought."},
                headers=self.headers,
            )

        self.assertEqual(200, response.status_code)
        payload = response.get_json()
        self.assertTrue(payload["chat_completed"])
        self.assertEqual("forced_max_turns", payload["completion_reason"])
        self.assertEqual(10, payload["chat_turn_count"])
        self.assertEqual("Thanks for sharing that with me.", payload["messages"][-1]["content"])
        self.assertEqual(
            {"type": "function", "function": {"name": "conversation_end"}},
            mock_complete.call_args.kwargs["tool_choice"],
        )

    def test_frontend_refresh_starts_clean_instead_of_resuming_conversation(self) -> None:
        script = APP_JS.read_text()
        self.assertNotIn("localStorage.getItem", script)
        self.assertNotIn("localStorage.setItem", script)
        self.assertNotIn("resumeConversation", script)
        self.assertIn('"reflective_sandbox.conversation_id"', script)
        self.assertIn('"reflective_chatbot.active_conversation_id"', script)
        self.assertIn("clearStoredConversationArtifacts", script)
        self.assertIn(".then(resetConversation)", script)

    def test_sandbox_completion_banner_is_wired_to_completed_state(self) -> None:
        html = INDEX_HTML.read_text()
        script = APP_JS.read_text()

        self.assertIn('id="condition-input"', html)
        self.assertIn('value="treatment"', html)
        self.assertIn('value="control"', html)
        self.assertIn("View or preference", html)
        self.assertIn("how much do you enjoy it", html)
        self.assertIn('document.getElementById("condition-input")', script)
        self.assertIn("condition: el.conditionInput.value", script)
        self.assertIn("view or preference", script)
        self.assertIn("strength or enjoyment", script)
        self.assertIn('id="completion-banner"', html)
        self.assertIn("Conversation complete", html)
        self.assertIn('document.getElementById("completion-banner")', script)
        self.assertIn("el.completionBanner.hidden = false", script)
        self.assertIn("el.completionBanner.hidden = true", script)

    def test_qualtrics_embed_script_handles_metadata_and_refresh(self) -> None:
        script = QUALTRICS_JS.read_text()
        self.assertIn("ReflectiveQualtricsChatbot", script)
        self.assertIn('"X-Qualtrics-Respondent-Id"', script)
        self.assertIn("setEmbeddedData", script)
        self.assertIn("conversation_id", script)
        self.assertIn("chat_completed", script)
        self.assertIn("chat_turn_count", script)
        self.assertIn("chat_min_user_turns", script)
        self.assertIn("chat_max_user_turns", script)
        self.assertIn("completion_reason", script)
        self.assertIn("chat_started_at", script)
        self.assertIn("chat_completed_at", script)
        self.assertIn("chat_duration_ms", script)
        self.assertIn(".started_at", script)
        self.assertIn("condition", script)
        self.assertIn("getConversationSetup", script)
        self.assertIn("conditionStorageKey", script)
        self.assertIn("conditionAssignedAtStorageKey", script)
        self.assertIn("browser_randomized", script)
        self.assertIn("session_storage", script)
        self.assertIn("preseeded_embedded_data", script)
        self.assertIn("hashString", script)
        self.assertIn("[setup.condition, setup.topic, setup.stance, setup.strengthScore]", script)
        self.assertIn("condition_assignment_source", script)
        self.assertIn("condition_assigned_at", script)
        self.assertIn("/api/transcripts/", script)
        self.assertIn("sessionStorage", script)
        self.assertIn("hideNextButton", script)
        self.assertIn("showNextButton", script)


if __name__ == "__main__":
    unittest.main()
