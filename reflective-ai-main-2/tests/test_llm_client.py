from __future__ import annotations

import json
import ssl
import unittest
from unittest import mock

import llm_client


class LlmClientTests(unittest.TestCase):
    def test_ssl_context_uses_certifi_bundle_when_available(self) -> None:
        fake_certifi = mock.Mock()
        fake_certifi.where.return_value = "/tmp/cacert.pem"

        with (
            mock.patch.object(llm_client, "certifi", fake_certifi),
            mock.patch("llm_client.Path.exists", return_value=True),
            mock.patch("llm_client.ssl.create_default_context") as mock_context,
        ):
            sentinel = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
            mock_context.return_value = sentinel

            context = llm_client._ssl_context()

        self.assertIs(sentinel, context)
        mock_context.assert_called_once_with(cafile="/tmp/cacert.pem")

    def test_chat_enforces_configured_default_model_even_when_override_is_passed(self) -> None:
        response = mock.MagicMock()
        response.read.return_value = (
            b'{"choices":[{"message":{"content":"ok"}}]}'
        )
        response.status = 200
        response.reason = "OK"
        response_handle = mock.MagicMock()
        response_handle.__enter__.return_value = response
        response_handle.__exit__.return_value = False

        with (
            mock.patch.object(llm_client, "OPENROUTER_API_KEY", "test-key"),
            mock.patch.object(
                llm_client, "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"
            ),
            mock.patch.object(llm_client, "_ssl_context", return_value=mock.sentinel.ssl),
            mock.patch("llm_client.urlopen", return_value=response_handle) as mock_urlopen,
        ):
            result = llm_client.chat(
                [{"role": "user", "content": "hello"}],
                model="openai/gpt-4.1",
            )

        self.assertEqual("ok", result)
        request = mock_urlopen.call_args.args[0]
        payload = json.loads(request.data.decode("utf-8"))
        self.assertEqual(
            "anthropic/claude-sonnet-4.6",
            payload["model"],
        )

    def test_chat_requires_openrouter_base_url(self) -> None:
        with (
            mock.patch.object(llm_client, "OPENROUTER_API_KEY", "test-key"),
            mock.patch.object(llm_client, "OPENROUTER_BASE_URL", ""),
        ):
            with self.assertRaisesRegex(RuntimeError, "OPENROUTER_API_BASE is missing"):
                llm_client.chat([{"role": "user", "content": "hello"}])


if __name__ == "__main__":
    unittest.main()
