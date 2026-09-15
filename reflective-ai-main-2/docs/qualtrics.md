# Qualtrics Chatbot Setup

This integration keeps Qualtrics responsible for the survey flow and keeps the chatbot backend responsible for LLM calls, conversation state, transcripts, and completion.

## Backend

Deploy the Flask app behind HTTPS and set the Qualtrics origins that may call the API:

```bash
QUALTRICS_ALLOWED_ORIGINS=https://umich.qualtrics.com
```

The API accepts Qualtrics respondent identity through `X-Qualtrics-Respondent-Id`. The embedded script sends that header on every request, so it does not depend on third-party cookies.
Keep `DATA_DIR` on persistent storage in production so SQLite transcripts survive deploys/restarts.

The Qualtrics smoke test should pass from the deployed HTTPS host:

```bash
curl -i https://YOUR_BACKEND_HOST/api/me \
  -H 'Origin: https://umich.qualtrics.com'

curl -i https://YOUR_BACKEND_HOST/api/conversations \
  -H 'Origin: https://umich.qualtrics.com' \
  -H 'Content-Type: application/json' \
  -H 'X-Qualtrics-Respondent-Id: test123' \
  --data '{"survey":{"topic":"Housing policy","stance":"I support more affordable housing.","strength_score":72}}'
```

For the current Render deployment, `YOUR_BACKEND_HOST` is `reflective-chatbot.onrender.com`.

## Survey Flow

An API-tested single-file survey shell is available at `qualtrics/reflective-ai-survey-shell.qsf`.
It intentionally omits custom JavaScript, generated randomizer flow, and Web Service elements so Qualtrics can create the project; its companion snippets in `qualtrics/snippets/` are audit/post-import copies only and are not needed for import.

### Current Deployment Note

One API-created copy exists in the `umich.qualtrics.com` brand for the current deployment:

- Survey name: `Reflective AI Survey Shell`
- Survey ID: `SV_afz2IX85QQcxkUe`
- Its `QID23` and `QID24` post-import JavaScript hooks are already installed.
- Its `QID24` chatbot mount should use `https://reflective-chatbot.onrender.com` as the chatbot `apiBase`.

Treat these values as deployment notes, not reusable shell defaults.

After import, add Qualtrics-native consent handling before launch: participants who select “No, I do not consent” on `QID3` should be terminated or sent to a non-participation end screen before the study overview. Keep this as native Survey Flow or display/skip logic rather than browser JavaScript so non-consent routing does not depend on client-side execution.

Create Embedded Data fields before the chatbot question:

- `condition`
- `condition_assignment_source`
- `condition_assigned_at`
- `chat_topic_type`
- `political_topic`
- `political_topic_other`
- `political_stance`
- `political_strength`
- `activity_topic`
- `activity_topic_other`
- `activity_stance`
- `activity_strength`
- `comprehension_pass`
- `attention_pass`
- `typing_word_count_in_range`
- `allocation_interacted`
- `recaptcha_success`
- `recaptcha_score`
- `recaptcha_min_score`
- `recaptcha_score_pass`
- `recaptcha_action_verified`
- `recaptcha_action_matches`
- `recaptcha_hostname`
- `recaptcha_challenge_ts`
- `recaptcha_error_codes`
- `topic`
- `stance`
- `strength_score`
- `prolific_pid`
- `prolific_study_id`
- `prolific_session_id`
- `respondent_id`
- `conversation_id`
- `chat_completed`
- `chat_turn_count`
- `chat_min_user_turns`
- `chat_max_user_turns`
- `completion_reason`
- `chat_started_at`
- `chat_completed_at`
- `chat_duration_ms`
- `transcript_url`

Populate `condition` before the pre-chat routing step with either `treatment` or `control`; the provided post-import embedded-data snippet assigns a 50/50 split and persists it in session storage. It also writes `condition_assignment_source` and `condition_assigned_at` so exports can distinguish pre-seeded assignment, session-storage reuse, and browser randomization. The pre-chat routing snippet copies political issue fields into `topic`/`stance`/`strength_score` for treatment participants and activity or hobby fields into those same fields for control participants. If participants select “Other,” routing prefers the typed “Other” text over the generic selected-choice label. The chatbot writes `conversation_id`, `chat_completed`, `chat_turn_count`, `chat_min_user_turns`, `chat_max_user_turns`, `completion_reason`, `chat_started_at`, `chat_completed_at`, `chat_duration_ms`, and `transcript_url` as the conversation progresses.

The comprehension-check snippet writes `comprehension_pass=true` only when the participant selects the chatbot-conversation answer. The attention-check snippet writes `attention_pass=true` only when the participant selects the instructed first and last interest options.

The typing telemetry snippet writes timing, paste, backspace, word-count, and character-count fields. It also writes `typing_word_count_in_range=true` when the daylight-saving response contains 15-30 words, matching the prompt guidance.

For reCAPTCHA v3 score logging, add a Qualtrics Web Service step after `QID4` calls `02-recaptcha-v3.js`. POST `recaptcha_token` to `https://YOUR_BACKEND_HOST/api/recaptcha/verify` as either form field `recaptcha_token` or `token`, or as JSON with the same key. Include `expected_action=study_overview`. Then map returned fields into Embedded Data: `recaptcha_success`, `recaptcha_score`, `recaptcha_min_score`, `recaptcha_score_pass`, `recaptcha_action_verified`, `recaptcha_action_matches`, `recaptcha_hostname`, `recaptcha_challenge_ts`, and `recaptcha_error_codes`. Configure the backend with `RECAPTCHA_SECRET` and optionally `RECAPTCHA_MIN_SCORE` (default `0.5`); never put the secret in browser JavaScript.

## Export Field Dictionary

Machine-readable copy: `qualtrics/embedded-data-fields.json`.

Qualtrics Embedded Data fields:

- `condition`: assigned `treatment` or `control`.
- `condition_assignment_source`: `preseeded_embedded_data`, `session_storage`, or `browser_randomized`.
- `condition_assigned_at`: ISO timestamp for the original assignment in the browser session.
- `prolific_pid`, `prolific_study_id`, `prolific_session_id`: Prolific participant, study, and session IDs copied from launch URL query parameters.
- `chat_topic_type`: `political` for treatment routing or `activity` for control routing.
- `political_topic`, `political_topic_other`, `political_stance`, `political_strength`: political setup values used for treatment chats and all post-chat political outcomes.
- `activity_topic`, `activity_topic_other`, `activity_stance`, `activity_strength`: hobby/interest setup values used for control chats.
- `topic`, `stance`, `strength_score`: normalized chatbot setup values after treatment/control routing.
- `respondent_id`, `conversation_id`, `transcript_url`: backend/Qualtrics join identifiers. Token-authenticated transcript URLs redact `respondent_id` from transcript payloads.
- `chat_completed`, `chat_turn_count`, `chat_min_user_turns`, `chat_max_user_turns`, `completion_reason`, `chat_started_at`, `chat_completed_at`, `chat_duration_ms`: chatbot completion and engagement metadata. `completion_reason` indicates `model_tool` or `forced_max_turns`.
- `comprehension_pass`, `attention_pass`, `typing_word_count_in_range`: screening and quality flags.
- `typing_duration_ms`, `typing_keydown_count`, `typing_paste_count`, `typing_backspace_count`, `typing_word_count`, `typing_char_count`, `typing_first_key_latency_ms`, `typing_mean_interkey_ms`, `typing_median_interkey_ms`: typing telemetry from the daylight-saving check.
- `recaptcha_token`, `recaptcha_action`, `recaptcha_success`, `recaptcha_score`, `recaptcha_min_score`, `recaptcha_score_pass`, `recaptcha_action_verified`, `recaptcha_action_matches`, `recaptcha_hostname`, `recaptcha_challenge_ts`, `recaptcha_error_codes`: reCAPTCHA v3 token and verification metadata.
- `motive_total`: post-import validator total for the six motive attribution entries.
- `allocation_label_order`, `allocation_democrat`, `allocation_republican`, `allocation_interacted`: bystander allocation widget metadata.

Backend transcript top-level fields:

- `chat_condition`: backend echo of treatment/control condition.
- `chat_topic`: backend echo of the routed chatbot topic.
- `chat_condition_assignment_source`, `chat_condition_assigned_at`: backend echo of condition assignment audit metadata.
- `respondent_id`: present in respondent-scoped conversation payloads; redacted from bearer-token transcript URL payloads.

## Launch Readiness Checklist

- Replace `{{CONSENT_HTML}}`, `{{STUDY_OVERVIEW_HTML}}`, `{{AI_TOOL_NAME}}`, `{{BACKEND_HOST}}`, `{{PAYMENT_RECEIPT_HTML}}`, and `{{PROLIFIC_COMPLETION_CODE}}`.
- Deploy the backend over HTTPS with `QUALTRICS_ALLOWED_ORIGINS=https://umich.qualtrics.com`, `OPENROUTER_API_KEY`, `OPENROUTER_API_BASE`, `CHAT_MODEL`, persistent `DATA_DIR`, and `RECAPTCHA_SECRET` if reCAPTCHA score verification is used.
- Check `https://YOUR_BACKEND_HOST/api/health` before launch; it reports non-secret readiness flags for OpenRouter config, Qualtrics CORS origins, SQLite transcript storage, reCAPTCHA config, chat model, score threshold, and enforced chat turn bounds.
- Create or verify all Embedded Data fields listed in `qualtrics/embedded-data-fields.json`.
- Add Qualtrics-native consent routing so `QID3` choice 2 terminates or screens out before the study overview.
- Install each post-import JavaScript snippet on the mapped QID, keeping hidden `QID23` on the same page as chatbot `QID24`.
- Add the reCAPTCHA Web Service step after `QID4` token capture and map returned verification fields to Embedded Data.
- Confirm treatment/control routing: treatment copies political setup into `topic`/`stance`/`strength_score`, while control copies activity/hobby setup.
- Confirm the chatbot page hides Next until `chat_completed=true` and writes `conversation_id`, `chat_turn_count`, `transcript_url`, and duration metadata.
- Confirm motive attribution cannot continue unless all six nonnegative entries sum to exactly 100.
- Confirm allocation cannot continue until the slider has been touched and `allocation_interacted=true`.
- Export a pilot response and verify the field dictionary columns plus transcript URL retrieval.

The allocation snippet writes `allocation_interacted=true` only after the participant touches the allocation slider; before that, it keeps the Next button hidden even though the default `$2/$2` display is visible.

## Chatbot Question

Add a Text/Graphic question where the chatbot should appear, then add custom JavaScript:

```javascript
Qualtrics.SurveyEngine.addOnload(function () {
  var question = this;
  var script = document.createElement("script");
  script.src = "https://YOUR_BACKEND_HOST/static/qualtrics-chatbot.js";
  script.onload = function () {
    window.ReflectiveQualtricsChatbot.mount({
      question: question,
      apiBase: "https://YOUR_BACKEND_HOST",
      topic: "${e://Field/topic}",
      stance: "${e://Field/stance}",
      strengthScore: "${e://Field/strength_score}",
      condition: "${e://Field/condition}",
      conditionAssignmentSource: "${e://Field/condition_assignment_source}",
      conditionAssignedAt: "${e://Field/condition_assigned_at}",
      respondentId: "${e://Field/respondent_id}",
      requireCompletion: true
    });
  };
  document.head.appendChild(script);
});
```

With `requireCompletion: true`, the script hides the Qualtrics Next button until the backend marks the chat complete.

If values are not available as Embedded Data, pass DOM selectors instead:

```javascript
window.ReflectiveQualtricsChatbot.mount({
  question: question,
  apiBase: "https://YOUR_BACKEND_HOST",
  topicSelector: "#QR\\~QID1",
  stanceSelector: "#QR\\~QID2",
  strengthScoreSelector: "#QR\\~QID3",
  conditionSelector: "#reflective-condition",
  conditionAssignmentSourceSelector: "#reflective-condition-assignment-source",
  conditionAssignedAtSelector: "#reflective-condition-assigned-at",
  respondentId: "${e://Field/ResponseID}"
});
```

If no condition value is available from Embedded Data, direct config, or selectors, the chatbot embed falls back to the browser-session assignment and then to browser-side 50/50 treatment/control randomization. It writes the final `condition`, `condition_assignment_source`, and `condition_assigned_at` values back to Embedded Data before creating the backend conversation.

## Notes

- Post-import JavaScript installation map:
- Consent routing: terminate or screen out `QID3` choice 2 before the study overview.
- `QID3`: `qualtrics/snippets/01-embedded-data-setup.js`
- `QID4`: `qualtrics/snippets/02-recaptcha-v3.js`
- `QID5`: `qualtrics/snippets/09-comprehension-check.js`
- `QID6`: `qualtrics/snippets/03-typing-telemetry.js`
- `QID7`: `qualtrics/snippets/04-attention-check.js`
- `QID23`: `qualtrics/snippets/05-prechat-routing.js`
- `QID24`: `qualtrics/snippets/06-chatbot-mount.js`
- `QID30`: `qualtrics/snippets/07-motive-total.js`
- `QID31`: `qualtrics/snippets/08-allocation.js`
- Machine-readable copy: `qualtrics/snippets/manifest.json`.
- Keep hidden `QID23` on the same page as `QID24`; it prepares Embedded Data immediately before the chatbot mount runs.
- Use query strings only to pass recruitment or respondent identifiers into Embedded Data.
- Treatment conversations use the reflective political prompt; control conversations use the selected hobby or interest and avoid reflective, political, misinformation, ideology, or perspective-taking mechanisms while targeting the same 8-10 user-turn length.
- The chatbot backend stores condition-assignment audit fields in conversation transcripts when the Qualtrics embed passes them.
- Transcript payloads expose `chat_condition`, `chat_topic`, `chat_condition_assignment_source`, and `chat_condition_assigned_at` at the top level in addition to the nested `conversation_state`.
- Store full transcripts in the backend database. Qualtrics should store `conversation_id`, `chat_completed`, `chat_turn_count`, and `transcript_url`, not the full transcript.
- `transcript_url` points to `/api/transcripts/<conversation_id>/<transcript_token>`, which is readable from an exported response without the original Qualtrics respondent header. Treat exported URLs as sensitive bearer links.
- The script uses session storage to reuse an existing conversation on refresh or back navigation for the same respondent.
