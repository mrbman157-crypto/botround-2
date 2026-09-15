# Qualtrics implementation changes

## 2026-06-12

- Added condition-aware chatbot setup so Qualtrics can pass `condition` as `treatment` or `control` to the backend.
- Added 50/50 treatment/control assignment in `qualtrics/snippets/01-embedded-data-setup.js`, with session storage persistence for refreshes and preview navigation.
- Updated pre-chat routing so treatment conversations use the earlier political issue while control conversations use the earlier activity or hobby interest.
- Updated the Qualtrics chatbot mount and hosted embed script to include the assigned condition in `/api/conversations` requests.
- Persisted `condition` in backend conversation state and included it in transcript/export payloads.
- Split chatbot prompts into a reflective political treatment prompt and a neutral nonpolitical control prompt.
- Designed the control prompt to produce a similarly lengthed 8-10 turn conversation about the selected hobby or interest, without reflective, political, misinformation, ideology, or perspective-taking mechanisms.
- Added a control-specific opening message for the Qualtrics chat UI.
- Updated tests to encode the treatment default, accepted control condition, rejected invalid condition, control prompt selection, and condition-aware Qualtrics embed contract.

## 2026-06-12 survey shell alignment

- Expanded the importable Qualtrics QSF from 31 to 36 study questions by adding employment, household income, area type, religion, and religious attendance items from `AI Chatbot Mechanisms Brainstorm-3.md`.
- Updated the comprehension check, daylight-saving typing check, and attention check wording to more closely match the brainstorm survey text.
- Updated gender, race/ethnicity, education, party ID, Republican/MAGA follow-up, ideology, AI usage, and AI trust items to match the brainstorm response scales more closely.
- Expanded the activity and policy issue choice lists so control chats can use the broader hobby/interest items and treatment chats can use the broader political-topic items from the brainstorm survey.
- Preserved the import-safe QSF design: no embedded `QuestionJS`, no custom Survey Flow randomizer, and no browser-side reCAPTCHA secret.
- Updated the attention-check JavaScript snippet so the pass flag now requires the first and fifth choices after aligning the response list with the brainstorm text.
- Updated QSF artifact tests to expect the expanded 36-question shell and assert presence of the newly aligned background, activity, and policy-topic items.

## 2026-06-12 sandbox and setup documentation

- Added a local sandbox condition selector so developers can manually exercise the reflective political treatment prompt or neutral hobby/interest control prompt from the served web app.
- Updated the sandbox context line to display the stored condition and neutral wording for treatment/control compatibility.
- Updated Qualtrics setup documentation to list condition-aware embedded data fields and show `condition: "${e://Field/condition}"` in the chatbot mount example.
- Updated Qualtrics README notes to describe the treatment/control routing contract and backend metadata written by the chatbot.
- Updated sandbox UI tests to assert the treatment/control selector and condition payload wiring.

## 2026-06-12 post-chat outcome alignment

- Reworked the post-chat battery to match the brainstorm sequence: certainty, openness to opposing view, perspective taking, selective information exposure, motive attribution, affective hostility, and bystander allocation.
- Replaced the prior generic favorability, discussion-likelihood, and conversation-evaluation items with the specified primary outcome measures.
- Updated motive attribution choices to the six brainstorm-specified explanations for why people hold the opposing political view, preserving the exact-total-100 validation pattern.
- Expanded the QSF bystander allocation prompt text to include the real-payment setup, $4.00 budget, $0.50 minimum, and $0.50 increment constraints.
- Updated the post-import allocation JavaScript snippet so the richer real-payment instructions remain visible when the custom slider widget replaces the QSF placeholder content.
- Updated QSF artifact tests to assert the brainstorm-specified post-chat outcome and allocation text fragments.

## 2026-06-12 post-chat transition page

- Added an import-safe post-chat transition Text/Graphic page after the chatbot and before outcome questions.
- The transition thanks participants for completing the conversation and tells both treatment and control participants that the next pages ask about the earlier political topic, preserving the control-group transition described in the brainstorm notes.
- Updated the QSF question count and study-block order to place the transition between `QID24` and `QID25`.
- Updated QSF artifact tests to expect the 37-question shell and assert the post-chat transition text.

## 2026-06-12 chatbot page participant copy

- Replaced the importable QSF chatbot page placeholder copy with participant-facing text from the brainstorm flow: short AI conversation, dynamic conversation topic, no right or wrong answers, roughly 10-minute duration, and transition after natural completion.
- Preserved the import-safe backend host placeholder and instruction that post-import JavaScript mounts the deployed chatbot on this Text/Graphic question.
- Updated QSF artifact tests to assert the participant-facing chatbot intro text.

## 2026-06-12 comprehension-check flagging

- Added a post-import Qualtrics snippet for the study-overview comprehension check.
- The snippet writes `comprehension_pass=true` only when the participant selects the chatbot-conversation answer, which is choice 2 in the aligned QSF.
- Initialized `comprehension_pass` and `attention_pass` to `false` in the embedded-data setup snippet.
- Updated Qualtrics setup documentation to describe `comprehension_pass` and `attention_pass` as screening/analysis embedded data fields rather than import-safe branch logic.
- Added an artifact test that asserts the comprehension-check snippet exists and targets choice 2.
- Renamed the snippet to `09-comprehension-check.js` to avoid reusing the existing typing-telemetry prefix.

## 2026-06-12 minimum chat length enforcement

- Added backend gating so the `conversation_end` tool is only exposed after at least eight user turns.
- Applied the same minimum-length rule to treatment and control chats so the neutral hobby/interest control condition is structurally closer to the reflective political treatment condition.
- Updated backend tests so early turns cannot complete the conversation and eighth-turn completion still stores the final message and blocks future sends.

## 2026-06-12 maximum chat length enforcement

- Added a 10-user-turn forced completion path so treatment and control conversations stay within the intended 8-10 turn window.
- At the tenth user turn, the backend adds a final-turn instruction, requires the `conversation_end` tool, and falls back to marking the assistant text as final if the model returns text without a tool call.
- Added backend test coverage for forced completion at the tenth user turn.

## 2026-06-12 import-safe page breaks

- Added page break elements to the importable QSF study block to better match the brainstorm survey flow.
- Page breaks now separate consent, overview/comprehension, typing-speed check, attention check, background/AI attitudes, activity setup, political setup, chatbot, post-chat transition, each major outcome page, allocation, and exit.
- Preserved the single standard block and no-QuestionJS import-safe design while making participant page progression closer to the intended survey structure.
- Updated artifact tests to assert that the importable study block includes page breaks while still containing every study question.

## 2026-06-12 motive attribution validation hardening

- Hardened the post-import motive-attribution validator so all six entries must be filled, numeric, nonnegative, and sum exactly to 100 before participants can continue.
- Added `min=0` to the motive-attribution inputs in the validator snippet.
- Updated artifact tests to assert the nonnegative, complete-entry, exact-total validation contract.

## 2026-06-12 pre-chat routing placeholder cleanup

- Made the importable QSF pre-chat routing question visually inert by replacing the visible “Preparing study assignment...” copy with a hidden routing placeholder.
- Preserved `QID23` as the post-import JavaScript hook that copies treatment political fields or control activity fields into chatbot embedded data.
- Added artifact coverage to ensure the pre-chat routing hook remains present but hidden in the importable QSF.

## 2026-06-12 allocation hook question type

- Converted the importable QSF bystander allocation question from Multiple Choice to Text/Graphic.
- This avoids a Qualtrics force-response conflict after the post-import allocation JavaScript replaces the question body with the custom slider widget.
- Preserved the allocation prompt text, `bystander_allocation` export tag, and import-safe placeholder instructions.
- Added artifact coverage requiring the allocation widget hook to remain a no-validation Text/Graphic question.

## 2026-06-12 post-chat outcome order correction

- Reordered the importable QSF study block so motive attribution appears before affective hostility, matching the brainstorm post-chat outcome sequence.
- Preserved the existing question IDs, export tags, wording, and page breaks; only the participant-facing order changed.
- Added artifact coverage asserting the post-chat outcome order from certainty through allocation.

## 2026-06-12 Other-topic routing

- Updated the pre-chat routing snippet to capture typed “Other” text for both the activity/hobby topic and the political issue topic.
- Routing now prefers the typed “Other” value over the generic selected-choice label before writing the chatbot `topic` embedded data field.
- Documented `activity_topic_other` and `political_topic_other` embedded data fields.
- Updated the Qualtrics README to note that typed “Other” values become the chatbot topic.
- Added artifact coverage for the “Other” text-entry routing contract.

## 2026-06-12 Qualtrics chat refresh scoping

- Scoped the Qualtrics embed session-storage key by respondent, condition, topic, stance/preference text, and strength/enjoyment score.
- Preserved refresh/back-navigation conversation reuse when the setup context is unchanged.
- Prevented accidental reuse of an old conversation if a participant changes condition, topic, typed “Other” text, stance/preference, or strength before the chat starts.
- Added embed contract coverage for context-scoped storage.

## 2026-06-12 condition assignment audit fields

- Added `condition_assignment_source` and `condition_assigned_at` embedded data writes to the post-import setup snippet.
- Assignment source records whether the condition came from pre-seeded embedded data, session-storage reuse, or browser-side 50/50 randomization.
- Documented the new export fields in Qualtrics setup notes and the Qualtrics README.
- Added artifact coverage for the condition-assignment audit fields.

## 2026-06-12 backend condition audit persistence

- Updated the Qualtrics chatbot embed and mount snippet to send `condition_assignment_source` and `condition_assigned_at` to the backend when creating a conversation.
- Added nullable backend conversation-state fields for condition assignment source and timestamp so transcripts can be reconciled with Qualtrics exports.
- Updated backend tests to assert condition audit fields are persisted and returned in conversation payloads.
- Updated setup documentation to include the condition audit fields in the chatbot mount example and transcript notes.
- Updated the Qualtrics README to state that the backend stores assignment audit fields in transcripts.

## 2026-06-12 assignment timestamp persistence

- Persisted the browser-randomized condition assignment timestamp in session storage alongside the assigned condition.
- Session-storage reuse now preserves the original `condition_assigned_at` timestamp instead of overwriting it each time the setup snippet runs.
- Updated artifact coverage to assert the persisted assignment timestamp key.

## 2026-06-12 consent routing documentation

- Documented the post-import requirement to terminate or screen out participants who select “No, I do not consent” on `QID3`.
- Kept consent handling as a Qualtrics-native post-import routing requirement rather than browser JavaScript, preserving the import-safe QSF design and making non-consent routing independent of client-side execution.
- Added artifact coverage requiring both Qualtrics setup documents to mention consent routing for `QID3` choice 2.

## 2026-06-12 allocation interaction requirement

- Updated the post-import allocation widget so the Next button remains hidden until the participant interacts with the slider.
- Added `allocation_interacted` embedded data, written as `false` on initial render and `true` after slider input/change.
- Documented the new allocation interaction flag in Qualtrics setup notes and the Qualtrics README.
- Added artifact coverage requiring the allocation snippet to hide Next before slider interaction and record the interaction flag.

## 2026-06-12 control final-turn wording guardrails

- Added condition-aware backend final-turn instructions so forced control-condition endings stay centered on the participant's hobby or interest.
- Added a control-specific fallback final message that avoids reflective/political “talk this through” wording if the model returns no final text/tool message at the forced 10-turn close.
- Added backend test coverage for neutral control final-turn instructions and fallback wording.

## 2026-06-12 condition-aware conversation_end fallback

- Made empty `conversation_end` tool-call fallbacks condition-aware.
- Control chats now use neutral hobby/interest fallback wording if the model calls the end tool without a usable final message.
- Added backend test coverage for empty control-condition `conversation_end` arguments.

## 2026-06-12 transcript condition metadata

- Added top-level `chat_condition`, `chat_topic`, `chat_condition_assignment_source`, and `chat_condition_assigned_at` fields to backend conversation and transcript payloads.
- Preserved the nested `conversation_state` object while making exported transcript records easier to join against Qualtrics condition metadata.
- Updated backend transcript tests to assert the top-level condition metadata is returned.
- Documented the top-level transcript condition fields in Qualtrics setup notes and the Qualtrics README.

## 2026-06-12 typing-check word-count range flag

- Added `typing_word_count_in_range` to the typing telemetry snippet.
- The flag is `true` when the daylight-saving response contains 15-30 words, matching the prompt guidance, and `false` otherwise.
- Documented the new typing quality flag in Qualtrics setup notes and the Qualtrics README.
- Added artifact coverage for the typing word-count range flag.

## 2026-06-12 chat duration metadata

- Added Qualtrics Embedded Data fields for `chat_started_at`, `chat_completed_at`, and `chat_duration_ms`.
- The Qualtrics chatbot embed now persists the chat start timestamp in session storage for refresh/back-navigation safety and writes duration metadata when the conversation completes.
- Initialized the chat duration fields in the embedded-data setup snippet.
- Documented the duration metadata in Qualtrics setup notes and the Qualtrics README.
- Added artifact and embed coverage for the chat duration metadata contract.

## 2026-06-12 reCAPTCHA score verification endpoint

- Added backend `POST /api/recaptcha/verify` to verify reCAPTCHA v3 tokens server-side using `RECAPTCHA_SECRET`.
- The endpoint returns Qualtrics-mappable fields: `recaptcha_success`, `recaptcha_score`, `recaptcha_action_verified`, `recaptcha_hostname`, `recaptcha_challenge_ts`, and `recaptcha_error_codes`.
- Documented the Qualtrics Web Service setup needed to post `recaptcha_token` to the backend and map the returned score fields into Embedded Data.
- Added backend test coverage for successful reCAPTCHA score-field mapping.

## 2026-06-12 reCAPTCHA Web Service payload compatibility

- Made the reCAPTCHA verification endpoint explicitly accept both JSON payloads and form-encoded Qualtrics Web Service payloads.
- The endpoint now accepts either `token` or `recaptcha_token` as the submitted token field.
- Added backend test coverage for form-encoded reCAPTCHA verification requests.
- Updated Qualtrics setup docs to describe the accepted JSON and form field names.

## 2026-06-12 reCAPTCHA export field initialization

- Initialized reCAPTCHA verification result fields in the embedded-data setup snippet so exports have deterministic blank values before the Qualtrics Web Service maps verification results.
- Fields initialized: `recaptcha_success`, `recaptcha_score`, `recaptcha_action_verified`, `recaptcha_hostname`, `recaptcha_challenge_ts`, and `recaptcha_error_codes`.
- Added artifact coverage for reCAPTCHA score-field initialization.

## 2026-06-12 reCAPTCHA action-match metadata

- Added `recaptcha_action_matches` to the server-side verification response and Qualtrics Embedded Data initialization.
- The reCAPTCHA verification endpoint now accepts `expected_action` and defaults it to `study_overview`.
- Updated setup docs so the Qualtrics Web Service sends `expected_action=study_overview` and maps `recaptcha_action_matches` into exports.
- Updated backend and artifact tests for action-match metadata.

## 2026-06-12 reCAPTCHA score threshold metadata

- Added `RECAPTCHA_MIN_SCORE` backend configuration with default `0.5`.
- The reCAPTCHA verification endpoint now returns `recaptcha_min_score` and `recaptcha_score_pass` alongside the raw score.
- Initialized the new reCAPTCHA threshold fields in the embedded-data setup snippet.
- Updated Qualtrics setup docs and README instructions to map `recaptcha_min_score` and `recaptcha_score_pass`.
- Updated backend and artifact tests for the score-pass metadata.

## 2026-06-12 backend readiness endpoint

- Added `GET /api/health` for launch readiness checks without exposing secrets.
- The endpoint reports chat model, OpenRouter configured status, Qualtrics allowed-origin configured status, reCAPTCHA configured status, and `recaptcha_min_score`.
- Updated launch checklists to include the backend health endpoint.
- Added backend test coverage that readiness flags are returned without leaking secret values.

## 2026-06-12 database readiness health check

- Extended `GET /api/health` with `database_ready`, a non-secret flag that checks whether the SQLite transcript store can be opened and written via a temporary table.
- Updated launch checklist documentation to include SQLite transcript storage readiness.
- Updated backend health endpoint tests to assert `database_ready`.

## 2026-06-12 chatbot completion reason metadata

- Added backend `completion_reason` persistence to conversations.
- Completion reason records `model_tool` for ordinary model-triggered `conversation_end` completions and `forced_max_turns` for backend-enforced 10-turn closures.
- Exposed `completion_reason` in conversation and transcript payloads through the existing backend export path.
- Updated backend tests and export field documentation for completion reason metadata.

## 2026-06-12 Qualtrics completion reason export

- Updated the Qualtrics chatbot embed to write backend `completion_reason` into Embedded Data.
- Initialized `completion_reason` in the embedded-data setup snippet for deterministic exports.
- Updated setup documentation and artifact coverage so Qualtrics exports include whether chat completion was `model_tool` or `forced_max_turns`.

## 2026-06-12 chat dosage bound metadata

- Added backend payload and health fields for `chat_min_user_turns` and `chat_max_user_turns`.
- Updated the Qualtrics chatbot embed to write those enforced turn bounds into Embedded Data.
- Initialized chat turn-bound fields in the embedded-data setup snippet.
- Updated setup documentation, README notes, backend tests, embed tests, and artifact tests for the chat dosage metadata.

## 2026-06-12 respondent join metadata

- Added `respondent_id` to respondent-scoped backend conversation payloads for easier Qualtrics/backend joins.
- Token-authenticated transcript URL payloads continue to redact `respondent_id` because exported transcript URLs are bearer links.
- Updated backend tests and export field documentation for respondent join metadata.

## 2026-06-12 snippet installation manifest

- Added `qualtrics/snippets/manifest.json`, a machine-readable QID-to-snippet installation map.
- The manifest records target QID, snippet filename, purpose, and whether each hook is required before launch.
- Updated setup docs to point to the manifest alongside the Markdown installation maps.
- Added artifact coverage for the required manifest mappings.
- Extended manifest coverage so every listed snippet file must exist.
- Extended manifest coverage so every listed target QID must exist in the importable QSF.

## 2026-06-12 embedded data field manifest

- Added `qualtrics/embedded-data-fields.json`, a machine-readable Embedded Data field manifest grouped by respondent/assignment, pre-chat routing, screening/quality, reCAPTCHA, chatbot metadata, and post-chat widgets.
- Updated Qualtrics setup docs and README launch checklists to point to the manifest before fielding.
- Added artifact coverage for key fields in the Embedded Data manifest.
- Added artifact coverage that setup docs reference the manifest and key manifest fields.

## 2026-06-12 reCAPTCHA threshold config hardening

- Hardened `RECAPTCHA_MIN_SCORE` parsing so malformed values fall back to `0.5`.
- Clamped valid `RECAPTCHA_MIN_SCORE` values to the reCAPTCHA score range `0.0-1.0`.
- Rejected non-finite threshold values such as `NaN` or infinity, falling back to `0.5`.
- Added test coverage for non-finite fallback and high-value clamping.
- Cleaned up the threshold parser test to import `runtime_config` directly instead of using inline dynamic imports.

## 2026-06-12 export field dictionary

- Added an export field dictionary to the Qualtrics setup documentation.
- The dictionary groups assignment/routing fields, political setup fields, activity/control setup fields, chatbot metadata, screening/telemetry fields, reCAPTCHA fields, motive/allocation widget fields, and backend transcript top-level fields.
- Added artifact coverage requiring both setup documents to include the export field dictionary and key analysis fields.

## 2026-06-12 neutral local sandbox setup copy

- Updated the local sandbox setup form to support both treatment and control testing with neutral labels: “view or preference” and “strength/enjoyment.”
- Updated local sandbox validation messages so control-condition testing no longer requires political “stance” wording.
- Added UI contract coverage for the neutral treatment/control setup copy.

## 2026-06-12 launch readiness checklist

- Added launch readiness checklists to Qualtrics setup documentation.
- The checklist covers placeholder replacement, backend HTTPS/env vars, native consent routing, QID-to-snippet installation, reCAPTCHA Web Service mapping, treatment/control routing, chatbot completion metadata, motive-total validation, allocation interaction gating, and pilot export/transcript checks.
- Added artifact coverage requiring both setup documents to include the launch readiness checklist.

## 2026-06-12 routing page-break correction

- Moved the pre-chat page break from after hidden `QID23` to after `QID22`.
- The hidden pre-chat routing hook now shares the chatbot page with `QID24` instead of creating a blank standalone routing page.
- Preserved the participant-facing split between political setup and the chatbot page.
- Added artifact coverage asserting there is no page break between hidden `QID23` and chatbot `QID24`.

## 2026-06-12 post-import snippet installation map

- Added QID-to-snippet installation maps to both Qualtrics setup documents.
- Documented that hidden `QID23` must remain on the same page as chatbot `QID24` so routing embedded data is prepared before the chatbot mount runs.
- Added artifact coverage requiring the docs to include the routing, chatbot, comprehension, and motive-total snippet mappings.

## 2026-06-12 Prolific study/session metadata

- Captured Prolific `STUDY_ID` and `SESSION_ID` query parameters in the Qualtrics embedded-data setup snippet.
- Added `prolific_study_id` and `prolific_session_id` to the embedded-data manifest and export documentation.
- Added artifact-test assertions so future Qualtrics changes keep the Prolific study/session fields wired.

## 2026-06-12 QSF generator Prolific metadata alignment

- Updated `qualtrics/build-qsf.mjs` so regenerated embedded-data setup snippets preserve Prolific participant, study, and session ID capture.
- Added `prolific_study_id` and `prolific_session_id` to the generator's embedded-data field list and import QA preview instructions.
- Updated the import-safe builder README text and artifact coverage so future generator changes do not regress Prolific study/session metadata wiring.

## 2026-06-12 condition-neutral comprehension wording

- Updated the Qualtrics comprehension-check answer choice so it describes a chatbot conversation about a topic selected earlier, rather than always saying the chat is about a political topic.
- Preserved the existing correct answer choice ID, keeping the `comprehension_pass` post-import snippet behavior stable.
- Updated the QSF generator text and artifact coverage so future rebuilds keep the comprehension item accurate for both treatment and control participants.

## 2026-06-12 QSF generator comprehension key alignment

- Aligned `qualtrics/build-qsf.mjs` with the import-safe QSF and post-import comprehension snippet so choice `2` remains the correct comprehension answer.
- Updated the generator's comprehension distractors to match the current import-safe survey wording.
- Added artifact coverage to prevent future rebuilds from reverting `comprehension_pass` to choice `1`.

## 2026-06-12 QSF generator attention-check alignment

- Updated `qualtrics/build-qsf.mjs` so regenerated attention checks use the same five-choice scale as the import-safe QSF.
- Preserved the first-and-last instruction by making choice `1` "Very strongly interested" and choice `5` "Not at all interested."
- Added artifact coverage tying the builder's fifth choice to the post-import attention snippet that requires selected choices `1` and `5` and no others.

## 2026-06-12 QSF generator gender item alignment

- Updated `qualtrics/build-qsf.mjs` so regenerated gender questions use the current import-safe survey wording.
- Aligned the response labels to `Male`, `Female`, `Non-binary`, `Prefer to self-describe`, and `Prefer not to say`.
- Added artifact coverage to keep the generator aligned with the current demographics item.

## 2026-06-12 QSF generator race item alignment

- Updated `qualtrics/build-qsf.mjs` so regenerated race/ethnicity questions use the current import-safe survey ordering and labels.
- Aligned the race choices to start with `White`, include `Asian or Asian American`, and use `Some other race or ethnicity`.
- Added artifact coverage to keep the generator aligned with the current race/ethnicity demographics item.

## 2026-06-12 QSF generator political demographics alignment

- Updated `qualtrics/build-qsf.mjs` so regenerated education, party ID, MAGA, and ideology questions match the current import-safe QSF.
- Corrected the party-choice ordering so `Republican` is choice `1`, and updated MAGA display logic to key off that Republican choice.
- Replaced the generator's 0-100 ideology slider with the current seven-choice ideology item.
- Added artifact coverage to prevent these political demographics from drifting away from the import-safe survey again.

## 2026-06-12 QSF generator pre-chat routing alignment

- Updated `qualtrics/build-qsf.mjs` so regenerated pre-chat routing snippets preserve typed `Other` political and activity topic text.
- Matched the shipped routing snippet's invalid-condition fallback and `chat_topic_type` embedded-data write.
- Added artifact coverage requiring both the shipped snippet and generator snippet to prefer typed `Other` values before falling back to selected labels.

## 2026-06-12 QSF generator attention-check pass key fix

- Corrected the embedded attention-check JavaScript in `qualtrics/build-qsf.mjs` so regenerated surveys require choices `1` and `5`, matching the five-choice attention scale.
- Added artifact coverage preventing the generated attention logic from reverting to the old choice `4` pass key.
- Kept the shipped post-import attention snippet unchanged because it already required choices `1` and `5` and exactly two selections.

## 2026-06-12 QSF generator control activity setup alignment

- Updated `qualtrics/build-qsf.mjs` so regenerated control activity setup uses the same hobby/interest list as the import-safe QSF.
- Preserved `Other` as choice `12`, matching the pre-chat routing snippet's typed `Other` lookup for control chatbot topics.
- Aligned the activity follow-up wording to `what do you enjoy about it?` and `How much do you enjoy it?`.
- Added artifact coverage to keep the generated control setup aligned with the current survey.

## 2026-06-12 QSF generator political setup alignment

- Updated `qualtrics/build-qsf.mjs` so regenerated treatment political setup uses the same policy issue list as the import-safe QSF.
- Preserved `Other` as choice `12`, matching the pre-chat routing snippet's typed `Other` lookup for treatment chatbot topics.
- Aligned the political follow-up wording to `what is your view on this issue?` and `How strongly do you hold this view?`.
- Added artifact coverage to keep the generated treatment setup aligned with the current survey.

## 2026-06-12 QSF generator post-chat outcome alignment

- Updated `qualtrics/build-qsf.mjs` so regenerated post-chat outcomes match the current import-safe QSF outcome set.
- Replaced the old generated favorability, discussion-likelihood, and matrix items with certainty, openness to opposing views, perspective taking, selective information exposure, affective hostility, and the six motive-attribution entries.
- Added artifact coverage to keep generated post-chat outcomes aligned with the current survey and prevent old outcome tags from reappearing.

## 2026-06-12 QSF generator hidden pre-chat hook alignment

- Updated `qualtrics/build-qsf.mjs` so regenerated pre-chat routing questions use the same hidden placeholder as the import-safe QSF.
- Removed visible generated `Preparing the conversation...` copy from the routing hook.
- Added artifact coverage to keep regenerated routing hooks visually inert.

## 2026-06-12 QSF generator chatbot intro alignment

- Updated `qualtrics/build-qsf.mjs` so regenerated chatbot pages preserve the current participant-facing intro from the import-safe QSF.
- Included the dynamic `${e://Field/topic}` topic pipe, 10-minute conversation framing, neutral no-right-or-wrong wording, and `{{BACKEND_HOST}}` integration placeholder.
- Added artifact coverage to prevent regenerated chatbot pages from reverting to the old bare `The conversation will appear below` placeholder.

## 2026-06-12 QSF generator added demographics alignment

- Added the import-safe QSF's employment, household income, area type, religion, and religious-attendance questions to `qualtrics/build-qsf.mjs`.
- Inserted those generated questions into the background block before party and ideology items, matching the current survey flow.
- Added artifact coverage to prevent regenerated QSF artifacts from dropping the added demographics fields.

## 2026-06-12 QSF generator post-chat transition alignment

- Added generated `QID38` post-chat transition copy to `qualtrics/build-qsf.mjs`.
- Placed the generated transition before post-chat political outcomes so control participants are told why the survey returns to their earlier political topic after the nonpolitical chatbot conversation.
- Added artifact coverage to keep the generated transition and `post_chat_transition` export tag in place.

## 2026-06-12 QSF generator embedded-data manifest alignment

- Replaced the generated Survey Flow Embedded Data list in `qualtrics/build-qsf.mjs` with the current manifest-aligned export field set.
- Added routing, typed `Other`, condition-assignment audit, typing telemetry, reCAPTCHA, chatbot completion, transcript, and allocation fields to generated initialization.
- Added artifact coverage cross-checking key fields from `qualtrics/embedded-data-fields.json` against the generator source.

## 2026-06-12 QSF generator README workflow alignment

- Updated the README text emitted by `qualtrics/build-qsf.mjs` to match the current import-safe plus post-import snippet workflow.
- Removed stale claims that the QSF embeds snippets directly and that `{{RECAPTCHA_SECRET}}` is a QSF placeholder.
- Documented browser-side condition assignment, typed `Other` routing, control activity/hobby chat routing, backend reCAPTCHA verification, and chatbot completion metadata checks in the generated import QA guidance.
- Added artifact coverage to keep the generator README aligned with the current launch workflow.

## 2026-06-12 import-safe builder README workflow alignment

- Updated the README text emitted by `qualtrics/build-import-safe-qsf.mjs` so it no longer claims native Survey Flow randomization or native assignment into chatbot fields.
- Documented the current post-import workflow: browser-side condition assignment, typed `Other` routing, `chat_topic_type`, chatbot completion gating, and transcript metadata writes.
- Added explicit control-chat documentation stating that control conversations use the selected hobby or interest, avoid political/reflective mechanisms, and target the same 8-10 user-turn length.
- Added artifact coverage to keep the import-safe builder documentation aligned with the treatment/control implementation.

## 2026-06-12 QSF generator comprehension snippet alignment

- Added `09-comprehension-check.js` to the snippets generated by `qualtrics/build-qsf.mjs`.
- Wired the generated comprehension question to the shared comprehension snippet instead of maintaining a separate inline pass/fail implementation.
- Added artifact coverage requiring the generator to keep choice `2` as the comprehension pass key through the shared snippet.

## 2026-06-12 QSF generator snippet manifest output

- Updated `qualtrics/build-qsf.mjs` to emit `qualtrics/snippets/manifest.json` alongside regenerated snippet files.
- Kept the generated manifest aligned with the required post-import QID-to-snippet installation map, including comprehension, pre-chat routing, chatbot mount, motive validation, and allocation hooks.
- Added artifact coverage so regenerated snippets keep their machine-readable installation contract.

## 2026-06-12 QSF generator embedded-data manifest output

- Updated `qualtrics/build-qsf.mjs` to emit `qualtrics/embedded-data-fields.json` alongside regenerated QSF and snippet artifacts.
- Grouped generated Embedded Data fields into respondent/assignment, pre-chat routing, screening/quality, reCAPTCHA, chatbot metadata, and post-chat widget sections.
- Added artifact coverage so regenerated artifacts keep the machine-readable export-field contract aligned with routing, chatbot completion, and allocation metadata.

## 2026-06-12 QSF generator embedded-data consistency guard

- Added a generation-time consistency check in `qualtrics/build-qsf.mjs` comparing the grouped Embedded Data manifest fields against the Survey Flow Embedded Data initialization list.
- The generator now throws if a field appears only in the manifest or only in the flow initialization list.
- Added artifact coverage requiring the manifest/flow divergence guard to remain in the generator.

## 2026-06-12 QSF generator snippet-owned Embedded Data initialization

- Removed the generated Survey Flow `EmbeddedData` initialization block from `qualtrics/build-qsf.mjs`.
- Kept Embedded Data initialization owned by `01-embedded-data-setup.js`, matching the current post-import snippet workflow.
- Updated the generator consistency guard wording so it compares the grouped manifest against the generated field list rather than a Survey Flow initialization list.
- Added artifact coverage preventing generated Survey Flow `EmbeddedData` blocks from returning.

## 2026-06-12 QSF generator README snippet map

- Added a concrete QID-to-snippet installation map to the README text emitted by `qualtrics/build-qsf.mjs`.
- Included setup, reCAPTCHA, comprehension, typing telemetry, attention, pre-chat routing, chatbot mount, motive-total, and allocation hooks.
- Linked the generated README text to the machine-readable `snippets/manifest.json` map and added artifact coverage for the generated install map.

## 2026-06-12 import-safe builder README snippet map

- Added the concrete QID-to-snippet installation map to the README text emitted by `qualtrics/build-import-safe-qsf.mjs`.
- Included the setup, reCAPTCHA, comprehension, typing telemetry, attention, pre-chat routing, chatbot mount, motive-total, and allocation post-import hooks.
- Linked the import-safe generated README text to `snippets/manifest.json` and added artifact coverage for the install map.

## 2026-06-12 import-safe builder reCAPTCHA secret wording

- Updated the README text emitted by `qualtrics/build-import-safe-qsf.mjs` so it no longer suggests adding `{{RECAPTCHA_SECRET}}` after import.
- Clarified that only the reCAPTCHA site key belongs in the post-import browser snippet, while `RECAPTCHA_SECRET` must remain backend-only.
- Added artifact coverage preventing the secret placeholder from returning to the import-safe builder template.

## 2026-06-12 QSF generator README import-safe wording

- Updated the README text emitted by `qualtrics/build-qsf.mjs` so it no longer says chatbot/custom JavaScript is embedded directly in the QSF.
- Clarified that custom JavaScript stays in separate post-import snippets so the generated QSF remains import-safe.
- Added artifact coverage preventing the stale embedded-script claim from returning.

## 2026-06-12 QSF generator backend-only reCAPTCHA alignment

- Removed the generated Qualtrics `WebService` step that posted directly to Google's reCAPTCHA siteverify endpoint with `{{RECAPTCHA_SECRET}}`.
- Kept reCAPTCHA verification aligned with the current backend-only `/api/recaptcha/verify` workflow so the secret remains off Qualtrics browser/QSF artifacts.
- Added artifact coverage preventing `{{RECAPTCHA_SECRET}}`, Google's siteverify URL, or generated WebService flow elements from reappearing in `qualtrics/build-qsf.mjs`.

## 2026-06-12 QSF generator browser-side condition assignment alignment

- Removed the generated native Qualtrics `BlockRandomizer` that directly wrote `condition=treatment` or `condition=control`.
- Kept regenerated flow aligned with the current setup snippet, which respects pre-seeded conditions or assigns/persists a browser-side 50/50 condition.
- Added artifact coverage preventing generated native randomizer and direct condition-value flow writes from returning.

## 2026-06-12 QSF generator Survey Flow count alignment

- Replaced the stale hardcoded generated Survey Flow `Properties.Count` value with a derived `flow.Flow.length` assignment in `qualtrics/build-qsf.mjs`.
- This keeps regenerated flow metadata aligned after removing the old WebService and native randomizer elements.
- Added artifact coverage preventing the old hardcoded `Count: 20` value from returning.

## 2026-06-12 QSF generator import-safe JavaScript alignment

- Updated `qualtrics/build-qsf.mjs` so generated question payloads no longer embed `QuestionJS`.
- Kept snippet file and snippet manifest generation intact, preserving the post-import installation workflow.
- Added artifact coverage requiring the generator to stay free of embedded question JavaScript payloads while still emitting snippet artifacts.

## 2026-06-12 QSF generator consent-routing workflow alignment

- Removed the generated native consent-termination branch from `qualtrics/build-qsf.mjs`.
- Kept the consent question itself in the generated survey while deferring non-consent termination to post-import Qualtrics-native routing, matching the current import-safe workflow documentation.
- Added artifact coverage to prevent regenerated flow from silently reintroducing the stale consent branch.

## 2026-06-12 QSF generator stale native flow helper cleanup

- Removed unused `branchIfChoice` and `endSurvey` helpers from `qualtrics/build-qsf.mjs` after deferring consent routing to post-import Qualtrics-native logic.
- Tightened artifact coverage so the generator cannot quietly reintroduce native branch/end-survey helper paths.

## 2026-06-12 import-safe builder backend reCAPTCHA wording

- Updated `qualtrics/build-import-safe-qsf.mjs` so its README template describes backend `/api/recaptcha/verify` verification mapping instead of generic server-side Web Service verification.
- Added artifact coverage to keep import-safe builder guidance aligned with backend-only reCAPTCHA secret handling.

## 2026-06-12 import-safe QSF Prolific redirect cleanup

- Removed the hardcoded Prolific completion redirect URL from `qualtrics/reflective-ai-survey-shell.qsf`.
- Updated `qualtrics/build-import-safe-qsf.mjs` so regenerated import-safe QSF artifacts clear survey-level `EOSRedirectURL` values.
- Kept `{{PROLIFIC_COMPLETION_CODE}}` as the documented placeholder in the exit question instead of embedding a launch-specific completion code in Survey Options.
- Added artifact coverage preventing the old `51A038FF` completion code or Prolific redirect URL from returning to the import-safe QSF.

## 2026-06-12 Qualtrics README backend reCAPTCHA wording

- Updated `qualtrics/README.md` so reCAPTCHA guidance names backend `/api/recaptcha/verify` verification mapping instead of server-side Web Service verification.
- Clarified that only the reCAPTCHA site key belongs in the post-import browser snippet and `RECAPTCHA_SECRET` stays backend-only.
- Added artifact coverage preventing `{{RECAPTCHA_SECRET}}` and stale Web Service wording from returning to the checked-in Qualtrics README.

## 2026-06-12 Qualtrics README post-import snippet wording

- Updated `qualtrics/README.md` so setup notes describe the current post-import snippet workflow instead of saying `QuestionJS` was added directly.
- Corrected the study-question count from 31 to 37 in the setup notes.
- Clarified that the reCAPTCHA site key belongs in the overview post-import reCAPTCHA snippet.
- Added artifact coverage preventing stale `QuestionJS` and 31-question wording from returning.

## 2026-06-12 Qualtrics README reusable shell/deployment split

- Reworked `qualtrics/README.md` so reusable post-import setup guidance is separate from current deployment notes.
- Moved the live `umich.qualtrics.com` survey ID into an explicit `Current Deployment Note` section.
- Added artifact coverage clarifying that live survey values are deployment notes, not reusable shell defaults.

## 2026-06-12 import-safe builder flow and metadata cleanup

- Updated `qualtrics/build-import-safe-qsf.mjs` so it preserves the current single-block import-safe flow instead of reconstructing stale native Embedded Data, consent branch, randomizer, and EndSurvey flow logic.
- Stopped the import-safe builder from rewriting the hidden routing hook, chatbot intro, and allocation widget hook back to older fallback text/question types.
- Stripped old Qualtrics export-specific owner, brand, creator, skin, and end-of-survey message metadata from `qualtrics/reflective-ai-survey-shell.qsf`.
- Added artifact coverage to keep the import-safe builder from reintroducing native flow logic or export-specific metadata.

## 2026-06-12 import-safe native reCAPTCHA disablement

- Disabled native Qualtrics `RecaptchaV3`, `ConfirmStart`, and `AutoConfirmStart` flags in `qualtrics/reflective-ai-survey-shell.qsf`.
- Updated `qualtrics/build-import-safe-qsf.mjs` so regenerated import-safe shells keep native Qualtrics reCAPTCHA/start-confirmation behavior disabled.
- Kept bot-screening aligned with the post-import reCAPTCHA snippet plus backend `/api/recaptcha/verify` workflow.
- Added artifact coverage preventing native Qualtrics reCAPTCHA flags from returning.

## 2026-06-12 Qualtrics docs reusable shell/deployment split

- Reworked `docs/qualtrics.md` so the live API-created survey ID is documented under an explicit `Current Deployment Note`.
- Clarified that the existing `umich.qualtrics.com` survey ID and Render chatbot host are deployment notes, not reusable shell defaults.
- Added artifact coverage preventing the old live-survey sentence from returning to the reusable setup section.

## 2026-06-12 bystander allocation payment instructions

- Added the brainstorm-specified `How payment works` paragraph to the bystander allocation question in `qualtrics/build-qsf.mjs`.
- Added the brainstorm-specified framing that the allocation task follows the participant's earlier political self-report, without assuming the respondent chose a Democrat or Republican identity.
- Updated `qualtrics/reflective-ai-survey-shell.qsf` so imported participants see the real-payment random-selection explanation before using the allocation widget.
- Updated the post-import allocation snippet so the rendered widget preserves the same earlier-political-views framing and payment-implementation explanation.
- Added artifact coverage requiring the allocation instructions to mention the 1-in-10 implementation rule and chance selection.

## 2026-06-12 pre-chat routing control fallback

- Updated `qualtrics/snippets/05-prechat-routing.js` so missing or invalid `condition` values reuse session-storage assignment or browser-randomize treatment/control 50/50 instead of silently defaulting to treatment.
- Mirrored the same fallback logic in `qualtrics/build-qsf.mjs` so regenerated snippets preserve the control-group path.
- Wrote `condition_assignment_source` and `condition_assigned_at` from the routing fallback, keeping assignment audit fields available even if the earlier setup hook is missed.
- Added artifact coverage preventing the pre-chat routing hook from reintroducing an all-treatment fallback.

## 2026-06-12 post-import chatbot condition metadata handoff

- Updated the generated `06-chatbot-mount.js` mount call in `qualtrics/build-qsf.mjs` to pass `condition`, `condition_assignment_source`, and `condition_assigned_at` into the chatbot library.
- Refreshed the checked-in post-import chatbot snippet so it sends treatment/control condition metadata to the backend and writes chat turn bounds, completion reason, start time, completion time, duration, and transcript URL into Embedded Data.
- Added artifact coverage requiring the post-import chatbot mount snippet and generator to preserve condition handoff and chat completion metadata fields.

## 2026-06-12 Qualtrics chatbot final condition fallback

- Updated `webapp/static/qualtrics-chatbot.js` so a blank or invalid condition reuses the stored browser assignment or browser-randomizes treatment/control 50/50 instead of falling through to treatment.
- Wrote fallback `condition`, `condition_assignment_source`, and `condition_assigned_at` values back to Embedded Data from the chatbot mount, preserving export auditability if earlier setup or routing hooks are missed.
- Refreshed `qualtrics/snippets/06-chatbot-mount.js` from the patched static library so the post-import snippet uses the same final control-safe fallback.
- Added static coverage requiring the browser-randomized/session-storage fallback strings in the shared Qualtrics embed and refreshed post-import snippet, while confirming the QSF generator reads that shared embed source.

## 2026-06-12 QSF generator comprehension and AI-attitudes alignment

- Updated `qualtrics/build-qsf.mjs` so regenerated comprehension choices match the brainstorm and checked-in import-safe QSF, including the short-video distractor.
- Replaced stale generator AI-usage and AI-trust wording with the current generative-AI usage frequency item and neutral/unbiased-information trust item.
- Added artifact coverage preventing the old hobby-chat comprehension distractor and political-conversation AI-trust wording from returning.

## 2026-06-12 import-safe QSF post-chat label cleanup

- Updated post-chat `SecondaryAttribute` labels in `qualtrics/reflective-ai-survey-shell.qsf` for `QID25` through `QID30` so Qualtrics import metadata matches the current brainstorm-aligned outcome text.
- Removed stale internal labels referring to favorability, discussion likelihood, generic argument understanding, and older matrix wording from the import-safe QSF.
- Added artifact coverage requiring post-chat QSF labels to match each question payload description.

## 2026-06-12 import-safe QSF pre-chat label cleanup

- Updated `SecondaryAttribute` labels in `qualtrics/reflective-ai-survey-shell.qsf` for `QID5` through `QID22` so Qualtrics import metadata matches the current comprehension, quality-check, background, AI-attitudes, activity/control, and political setup question text.
- Removed stale internal labels that referred to older AI-chatbot willingness wording, older AI-trust wording, and older activity/political setup phrasing.
- Expanded artifact coverage so corrected pre-chat and post-chat participant-facing QSF labels must match each question payload description.

## 2026-06-12 snippet manifest condition metadata wording

- Updated `qualtrics/snippets/manifest.json` so the `QID23` routing snippet explicitly documents condition fallback and assignment audit metadata.
- Updated the `QID24` chatbot mount manifest purpose to document condition assignment metadata handoff to the backend plus conversation metadata export.
- Mirrored the manifest purpose wording in `qualtrics/build-qsf.mjs` and added artifact coverage so regenerated snippet manifests preserve the control-condition contract.

## 2026-06-12 Qualtrics docs selector fallback condition metadata

- Updated the DOM-selector chatbot mount example in `docs/qualtrics.md` to include `conditionSelector`, `conditionAssignmentSourceSelector`, and `conditionAssignedAtSelector`.
- Documented the chatbot embed's final browser-session and browser-randomized treatment/control fallback when no condition value is available.
- Added artifact coverage so documentation examples continue to preserve condition metadata for control-condition launches.

## 2026-06-12 post-chat widget Embedded Data initialization

- Updated `qualtrics/snippets/01-embedded-data-setup.js` to initialize `motive_total`, `allocation_label_order`, `allocation_democrat`, `allocation_republican`, and `allocation_interacted`.
- Mirrored the same post-chat widget initialization in `qualtrics/build-qsf.mjs` so regenerated setup snippets preserve the export-field defaults.
- Added artifact coverage requiring the setup snippet and generator to initialize motive/allocation fields before participants reach those widgets.

## 2026-06-12 import-safe builder post-import contract wording

- Updated the README template in `qualtrics/build-import-safe-qsf.mjs` to document condition assignment audit metadata, chatbot condition handoff, timing/duration exports, and post-chat widget Embedded Data defaults.
- Documented the final chatbot mount fallback that reuses browser-session assignment or browser-randomizes treatment/control 50/50 if condition Embedded Data is unavailable.
- Added artifact coverage so the import-safe builder guidance preserves the current control-condition and export-field contract.

## 2026-06-12 pre-chat routing Embedded Data initialization

- Updated `qualtrics/snippets/01-embedded-data-setup.js` to initialize `chat_topic_type`, political setup fields, activity/control setup fields, and normalized chatbot `topic`/`stance`/`strength_score` fields before routing runs.
- Mirrored the same pre-chat routing defaults in `qualtrics/build-qsf.mjs` so regenerated setup snippets preserve complete export columns.
- Added artifact coverage requiring the setup snippet and generator to initialize all pre-chat routing fields listed in the Embedded Data manifest.

## 2026-06-12 typing and reCAPTCHA Embedded Data initialization

- Updated `qualtrics/snippets/01-embedded-data-setup.js` to initialize all typing telemetry fields, `recaptcha_token`, and `recaptcha_action` before their later post-import snippets run.
- Mirrored the same typing and reCAPTCHA token/action defaults in `qualtrics/build-qsf.mjs` so regenerated setup snippets preserve complete export columns.
- Added artifact coverage requiring the setup snippet and generator to initialize the typing telemetry fields and reCAPTCHA token/action fields listed in the Embedded Data manifest.

## 2026-06-12 Qualtrics README condition fallback wording

- Updated `qualtrics/README.md` so chatbot setup notes mention the pre-chat routing and chatbot mount final condition fallback, including browser-session reuse and browser-randomized treatment/control 50/50 assignment.
- Mirrored the same fallback/audit wording in the generated README template in `qualtrics/build-qsf.mjs`.
- Added artifact coverage so README guidance preserves `condition_assignment_source` and `condition_assigned_at` audit wording for fallback assignment paths.

## 2026-06-12 Qualtrics README export field expansion

- Expanded the `qualtrics/README.md` export field dictionary to name each typing telemetry field and each reCAPTCHA token/verification field explicitly.
- Replaced shorthand wording for typing timing/count fields and reCAPTCHA verification fields with the exact Embedded Data field names used by the setup and post-import snippets.
- Added artifact coverage requiring the README export dictionary to include the full telemetry and reCAPTCHA field set.

## 2026-06-12 Embedded Data manifest initialization coverage

- Added artifact coverage requiring every field listed in `qualtrics/embedded-data-fields.json` to be initialized by `qualtrics/snippets/01-embedded-data-setup.js`.
- Added the same coverage for the generated setup snippet source in `qualtrics/build-qsf.mjs`.
- This guards against future survey/export fields being added to the manifest without launch-time defaults in Qualtrics Embedded Data.

## 2026-06-12 reusable chatbot snippet backend placeholder

- Updated `qualtrics/snippets/06-chatbot-mount.js` to use `https://{{BACKEND_HOST}}` instead of the current Render deployment host.
- Kept the reusable post-import snippet aligned with the import-safe QSF and `qualtrics/build-qsf.mjs`, while deployment notes continue to document the current Render host separately.
- Added artifact coverage preventing the reusable chatbot mount snippet from reintroducing a hardcoded deployment host.

## 2026-06-12 Qualtrics README backend host placeholder split

- Updated `qualtrics/README.md` so reusable launch setup tells users to replace `{{BACKEND_HOST}}` with the deployed backend host instead of naming the current Render deployment.
- Moved `reflective-chatbot.onrender.com` into the explicit current deployment note as the deployment-specific backend host.
- Added artifact coverage preventing the reusable checklist from reintroducing hardcoded backend-host wording.

## 2026-06-12 generated README snippet contract wording

- Updated the generated README template in `qualtrics/build-qsf.mjs` so `05-prechat-routing.js` documents condition assignment audit preservation.
- Updated the generated `06-chatbot-mount.js` description to document condition metadata handoff, Next-button gating, and conversation timing metadata writes.
- Added generated README guidance to replace `{{BACKEND_HOST}}` in the chatbot snippet with the deployed backend host before launch, with artifact coverage for the wording.

## 2026-06-12 Qualtrics docs backend host placeholder split

- Updated reusable chatbot JavaScript examples in `docs/qualtrics.md` to use `https://YOUR_BACKEND_HOST` instead of the current Render deployment host.
- Kept `reflective-chatbot.onrender.com` documented in the explicit current deployment note for the existing API-created survey.
- Added artifact coverage so docs keep reusable setup examples placeholder-based while preserving deployment-specific host notes separately.

## 2026-06-12 import-safe builder backend host replacement wording

- Updated `qualtrics/build-import-safe-qsf.mjs` so its generated README template tells users to replace `{{BACKEND_HOST}}` in the chatbot snippet with the deployed backend host before launch.
- Kept import-safe builder guidance aligned with the reusable chatbot snippet placeholder instead of deployment-specific backend host values.
- Added artifact coverage requiring the import-safe builder template to preserve backend host replacement guidance.

## 2026-06-12 generated allocation snippet interaction gating

- Updated the `08-allocation.js` template inside `qualtrics/build-qsf.mjs` to match the checked-in post-import allocation snippet.
- Restored the brainstorm payment instructions, earlier-political-views framing, `allocation_interacted` writes, and hidden Next button until participants touch the allocation slider in regenerated snippets.
- Expanded artifact coverage so both the checked-in allocation snippet and generator template must preserve interaction gating and payment-implementation wording.

## 2026-06-12 generated post-chat outcome order alignment

- Updated `qualtrics/build-qsf.mjs` so regenerated surveys place motive attribution before the affective-hostility feeling thermometer, matching `AI Chatbot Mechanisms Brainstorm-3.md` and the import-safe QSF.
- Added artifact coverage requiring the generator's post-chat block order to preserve certainty, openness, perspective-taking, selective exposure, motive attribution, feeling thermometer, allocation.

## 2026-06-12 generated screening wording alignment

- Updated `qualtrics/build-qsf.mjs` so regenerated surveys use the brainstorm/import-safe comprehension prompt wording: "In this study, what will happen on the next pages?"
- Updated the generated typing-speed check prompt to ask about the yearly switch to daylight saving time and request about 15-30 words, matching `AI Chatbot Mechanisms Brainstorm-3.md` and the import-safe QSF.
- Added artifact coverage requiring the generator to preserve the brainstorm screening wording.

## 2026-06-12 allocation snippet contract wording

- Updated `qualtrics/snippets/manifest.json` so the `08-allocation.js` purpose documents that the Next button stays hidden until slider interaction.
- Mirrored the same interaction-gating wording in `qualtrics/build-qsf.mjs` and its generated README template.

## 2026-06-12 chatbot prompt style variation guidance

- Added concise style guidance to both `DEFAULT_TREATMENT_PROMPT` and `DEFAULT_CONTROL_PROMPT` in `webapp/prompt_defaults.py`.
- The guidance tells the chatbot to vary conversational style and avoid formulaic assistant phrasing, repeated summaries, numbered mini-frameworks, and tidy two-part Claude-style responses while keeping replies compact.
