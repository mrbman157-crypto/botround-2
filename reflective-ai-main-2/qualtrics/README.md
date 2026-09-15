# Reflective AI Qualtrics Artifacts

## Upload File

Upload only `reflective-ai-survey-shell.qsf` to Qualtrics.

This is an API-tested single-file survey shell. It intentionally contains no `QuestionJS`, no custom Survey Flow randomizer, and no Survey Flow `WebService` element, because those generated QSF sections caused Qualtrics `ESDEF10` data-validation failures during project creation.

## What Is Included In The QSF

- Consent placeholder: `{{CONSENT_HTML}}`
- Study overview placeholder: `{{STUDY_OVERVIEW_HTML}}`
- Background, activity, political issue, post-chat, motive attribution, and allocation questions
- Treatment/control-ready activity and political topic setup, with the control chatbot using the activity or hobby selected before the chat
- A simple known-good Survey Flow containing one standard study block

## What Is Deferred Until After Import

These pieces are not embedded in the upload QSF so Qualtrics can create the project:

- Chatbot mount JavaScript
- Comprehension-check pass/fail JavaScript
- Invisible reCAPTCHA v3 JavaScript and backend `/api/recaptcha/verify` verification mapping
- Typing telemetry JavaScript
- Attention-check pass/fail JavaScript
- Motive-total JavaScript validation
- Allocation label-order randomization and computed embedded data
- Prolific URL parameter fallback JavaScript
- Embedded data setup and 50/50 treatment/control randomization

Audit/post-import snippets remain in `snippets/`. They are not upload dependencies.

## Post-Import Snippet Map

- Consent routing: use Qualtrics-native logic to terminate or screen out `QID3` choice 2 before the study overview.
- `QID3`: `01-embedded-data-setup.js`
- `QID4`: `02-recaptcha-v3.js`
- `QID5`: `09-comprehension-check.js`
- `QID6`: `03-typing-telemetry.js`
- `QID7`: `04-attention-check.js`
- `QID23`: `05-prechat-routing.js`
- `QID24`: `06-chatbot-mount.js`
- `QID30`: `07-motive-total.js`
- `QID31`: `08-allocation.js`

Keep hidden `QID23` on the same Qualtrics page as `QID24` so routing runs before the chatbot mount.

A machine-readable copy of this map is available at `snippets/manifest.json`.

## Remaining Placeholders

- `{{CONSENT_HTML}}`
- `{{STUDY_OVERVIEW_HTML}}`
- `{{AI_TOOL_NAME}}`
- `{{BACKEND_HOST}}`
- `{{PAYMENT_RECEIPT_HTML}}`
- `{{PROLIFIC_COMPLETION_CODE}}`

`{{RECAPTCHA_SITE_KEY}}` is intentionally absent from the import-safe QSF. Add the site key only to the post-import browser snippet after the project imports successfully. Keep `RECAPTCHA_SECRET` backend-only; never add the secret to the QSF, browser JavaScript, or Qualtrics-visible placeholder text.

## Reusable Shell Post-Import Setup

After importing `reflective-ai-survey-shell.qsf`, complete the post-import setup with the snippets and docs:

- Initialize Embedded Data fields with `01-embedded-data-setup.js`.
- Preserve page breaks between the 37 study questions.
- Install post-import snippets for Prolific/respondent ID capture, reCAPTCHA token capture, comprehension and attention flags, typing telemetry, pre-chat condition assignment/topic copying, chatbot mount, motive total validation, and allocation widget.
- Add Republican-only display logic for the MAGA follow-up.
- Confirm treatment/control condition handling so treatment chats use political topics and control chats use the earlier hobby or interest topic.

Still requires real values before launch:

- Deploy the backend behind HTTPS with `QUALTRICS_ALLOWED_ORIGINS=https://umich.qualtrics.com`.
- Replace `{{CONSENT_HTML}}`.
- Replace `{{STUDY_OVERVIEW_HTML}}`.
- Replace `{{AI_TOOL_NAME}}`.
- Replace `{{BACKEND_HOST}}` in the chatbot question JavaScript with the deployed backend host.
- Replace `{{RECAPTCHA_SITE_KEY}}` in the overview post-import reCAPTCHA snippet.
- Add backend reCAPTCHA verification if required, using `RECAPTCHA_SECRET` only in backend environment configuration.
- The backend exposes `POST /api/recaptcha/verify` for Qualtrics Web Service verification. Send `recaptcha_token` as form field `recaptcha_token` or `token`, or as JSON with the same key; include `expected_action=study_overview`; and map `recaptcha_success`, `recaptcha_score`, `recaptcha_min_score`, `recaptcha_score_pass`, `recaptcha_action_verified`, `recaptcha_action_matches`, `recaptcha_hostname`, `recaptcha_challenge_ts`, and `recaptcha_error_codes` into Embedded Data. Configure `RECAPTCHA_MIN_SCORE` to change the score-pass threshold from the default `0.5`.
- Replace `{{PAYMENT_RECEIPT_HTML}}` and `{{PROLIFIC_COMPLETION_CODE}}`.

## Current Deployment Note

One API-created copy exists in the `umich.qualtrics.com` brand for the current deployment:

- Survey name: `Reflective AI Survey Shell`
- Survey ID: `SV_afz2IX85QQcxkUe`
- Backend host: `reflective-chatbot.onrender.com`

Treat those values as deployment notes, not reusable shell defaults.

The chatbot reads `condition`, `condition_assignment_source`, `condition_assigned_at`, `topic`, `stance`, `strength_score`, and `respondent_id` from Embedded Data. The setup snippet writes the assignment audit fields before the chatbot starts, and the pre-chat routing and chatbot mount snippets preserve a final fallback that reuses browser-session assignment or browser-randomizes treatment/control 50/50 if condition Embedded Data is unavailable. The backend stores assignment audit fields in conversation transcripts. Transcript payloads also expose `chat_condition`, `chat_topic`, `chat_condition_assignment_source`, and `chat_condition_assigned_at` at the top level for easier export joins. For treatment, `topic`/`stance`/`strength_score` should be copied from the political issue questions. For control, they should be copied from the activity or hobby questions. If participants select “Other,” the routing snippet stores typed values in `political_topic_other` or `activity_topic_other` and uses those values as the chatbot topic. The chatbot writes `conversation_id`, `chat_completed`, `chat_turn_count`, `chat_min_user_turns`, `chat_max_user_turns`, `completion_reason`, `chat_started_at`, `chat_completed_at`, `chat_duration_ms`, and `transcript_url` to Embedded Data. `transcript_url` points to the backend `/api/transcripts/<conversation_id>/<transcript_token>` endpoint so exported Qualtrics metadata can retrieve the backend transcript without the original Qualtrics respondent header.

The comprehension and attention snippets write `comprehension_pass` and `attention_pass` to Embedded Data for downstream screening or analysis; the import-safe QSF does not branch participants out automatically.

The typing telemetry snippet writes `typing_word_count_in_range` for the daylight-saving response so exports can flag whether the answer followed the requested 15-30 word range.

The allocation snippet writes `allocation_interacted` so exports can distinguish participants who actively touched the allocation slider from those who only saw the default display.

## Export Field Dictionary

A machine-readable field list is available at `embedded-data-fields.json`.

- Routing and assignment: `condition`, `condition_assignment_source`, `condition_assigned_at`, `chat_topic_type`.
- Political setup: `political_topic`, `political_topic_other`, `political_stance`, `political_strength`.
- Activity/control setup: `activity_topic`, `activity_topic_other`, `activity_stance`, `activity_strength`.
- Chatbot setup and metadata: `prolific_pid`, `prolific_study_id`, `prolific_session_id`, `respondent_id`, `topic`, `stance`, `strength_score`, `conversation_id`, `transcript_url`, `chat_completed`, `chat_turn_count`, `chat_min_user_turns`, `chat_max_user_turns`, `completion_reason`, `chat_started_at`, `chat_completed_at`, `chat_duration_ms`.
- Screening and telemetry: `comprehension_pass`, `attention_pass`, `typing_word_count_in_range`, `typing_duration_ms`, `typing_keydown_count`, `typing_paste_count`, `typing_backspace_count`, `typing_word_count`, `typing_char_count`, `typing_first_key_latency_ms`, `typing_mean_interkey_ms`, `typing_median_interkey_ms`, `recaptcha_token`, `recaptcha_action`, `recaptcha_success`, `recaptcha_score`, `recaptcha_min_score`, `recaptcha_score_pass`, `recaptcha_action_verified`, `recaptcha_action_matches`, `recaptcha_hostname`, `recaptcha_challenge_ts`, and `recaptcha_error_codes`.
- Outcomes/widgets: `motive_total`, `allocation_label_order`, `allocation_democrat`, `allocation_republican`, `allocation_interacted`.
- Backend transcripts additionally expose top-level `chat_condition`, `chat_topic`, `chat_condition_assignment_source`, and `chat_condition_assigned_at`.

## Launch Readiness Checklist

- Replace all QSF placeholders and configure backend HTTPS/env vars.
- Check `https://YOUR_BACKEND_HOST/api/health` for non-secret backend readiness flags, including SQLite transcript storage readiness and enforced chat turn bounds, before launch.
- Create or verify all Embedded Data fields listed in `embedded-data-fields.json`.
- Add Qualtrics-native consent routing for `QID3` choice 2.
- Install every post-import snippet on the mapped QID and keep hidden `QID23` with `QID24`.
- Add the reCAPTCHA Web Service verification step and Embedded Data mappings if using score logging.
- Pilot treatment and control routing, chatbot completion gating, motive total validation, allocation interaction gating, transcript URL retrieval, and export field coverage.
