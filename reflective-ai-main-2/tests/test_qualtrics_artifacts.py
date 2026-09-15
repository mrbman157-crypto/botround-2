from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
QSF = ROOT / "qualtrics" / "reflective-ai-survey-shell.qsf"


def load_qsf() -> dict:
    return json.loads(QSF.read_text())


def test_importable_qsf_has_all_study_questions_without_custom_code() -> None:
    qsf = load_qsf()
    questions = [element for element in qsf["SurveyElements"] if element["Element"] == "SQ"]

    assert len(questions) == 37
    assert not any("QuestionJS" in question["Payload"] for question in questions)
    assert "{{RECAPTCHA_SECRET}}" not in QSF.read_text()
    assert "/static/qualtrics-chatbot.js" not in QSF.read_text()


def test_importable_qsf_uses_simple_known_good_flow() -> None:
    qsf = load_qsf()
    flow = next(element for element in qsf["SurveyElements"] if element["Element"] == "FL")[
        "Payload"
    ]

    assert flow["Flow"] == [
        {
            "Type": "Standard",
            "ID": "BL_3IeCclKV7Z2jpqK",
            "FlowID": "FL_2",
            "Autofill": [],
        }
    ]
    assert flow["Properties"] == {"Count": 2, "RemovedFieldsets": []}


def test_importable_qsf_places_every_question_in_the_study_block() -> None:
    qsf = load_qsf()
    blocks = next(element for element in qsf["SurveyElements"] if element["Element"] == "BL")[
        "Payload"
    ]
    study_block = next(
        block for block in blocks.values() if block["Description"] == "Reflective AI Study Shell"
    )
    question_ids = {
        question["Payload"]["QuestionID"]
        for question in qsf["SurveyElements"]
        if question["Element"] == "SQ"
    }
    block_question_ids = {
        element["QuestionID"] for element in study_block["BlockElements"] if element["Type"] == "Question"
    }

    assert block_question_ids == question_ids


def test_importable_qsf_uses_page_breaks_for_major_survey_sections() -> None:
    qsf = load_qsf()
    blocks = next(element for element in qsf["SurveyElements"] if element["Element"] == "BL")[
        "Payload"
    ]
    study_block = next(
        block for block in blocks.values() if block["Description"] == "Reflective AI Study Shell"
    )
    page_breaks = [
        element for element in study_block["BlockElements"] if element["Type"] == "Page Break"
    ]

    assert len(page_breaks) >= 12


def test_importable_qsf_post_chat_outcomes_follow_brainstorm_order() -> None:
    qsf = load_qsf()
    blocks = next(element for element in qsf["SurveyElements"] if element["Element"] == "BL")[
        "Payload"
    ]
    study_block = next(
        block for block in blocks.values() if block["Description"] == "Reflective AI Study Shell"
    )
    question_order = [
        element["QuestionID"]
        for element in study_block["BlockElements"]
        if element["Type"] == "Question"
    ]

    expected_order = ["QID25", "QID26", "QID27", "QID28", "QID30", "QID29", "QID31"]
    actual_order = [qid for qid in question_order if qid in expected_order]

    assert actual_order == expected_order


def test_generated_qsf_post_chat_outcomes_follow_brainstorm_order() -> None:
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    assert (
        "[Q.postTransition, Q.postSupport, Q.postCertainty, Q.postUnderstanding, "
        "Q.postLikelihood, Q.motive, Q.postMatrix]"
    ) in builder


def test_importable_qsf_keeps_required_placeholders() -> None:
    text = QSF.read_text()

    assert "{{CONSENT_HTML}}" in text
    assert "{{STUDY_OVERVIEW_HTML}}" in text
    assert "{{AI_TOOL_NAME}}" in text
    assert "{{BACKEND_HOST}}" in text
    assert "{{PAYMENT_RECEIPT_HTML}}" in text
    assert "{{PROLIFIC_COMPLETION_CODE}}" in text
    assert "51A038FF" not in text
    assert "app.prolific.co/submissions/complete" not in text


def test_import_safe_builder_strips_hardcoded_prolific_redirects() -> None:
    builder = (ROOT / "qualtrics" / "build-import-safe-qsf.mjs").read_text()

    assert "EOSRedirectURL" in builder
    assert 'surveyOptions.Payload.EOSRedirectURL = ""' in builder


def test_importable_qsf_includes_brainstorm_background_and_topic_items() -> None:
    text = QSF.read_text()

    required_fragments = [
        "yearly switch to daylight saving time",
        "Which of the following best describes your current employment status?",
        "What was your TOTAL household income, before taxes, last year?",
        "What is your present religion, if any?",
        "Which of the following activities are you most interested in right now?",
        "Learning something new (a language, a skill, a subject)",
        "Which of the following policy issues are you most interested in right now?",
        "Voting rules and election integrity",
        "U.S. foreign policy and military involvement abroad",
        "A short conversation with an AI chatbot",
        "Your topic for this conversation",
        "about a topic selected earlier",
        "The conversation will last about 10 minutes",
        'data-reflective-routing-placeholder',
        "How willing are you to seriously consider the opposing view",
        "Thank you for completing the conversation",
        "The next few pages will ask about your views on a political topic",
        "How well do you understand why people on the opposing side",
        "how much of the information you encounter",
        "They are exposed to true but different information",
        "How warm or cold do you feel toward people who hold the opposing view",
        "Earlier in this survey, you told us about your political views.",
        "You have $4.00 to allocate between two other participants",
        "How payment works.",
        "randomly select 1 in every 10 participants",
        "Whether you are selected is decided by chance",
    ]
    for fragment in required_fragments:
        assert fragment in text


def test_generated_qsf_includes_brainstorm_screening_wording() -> None:
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    assert "In this study, what will happen on the next pages?" in builder
    assert "yearly switch to daylight saving time" in builder
    assert "Please use about 15-30 words." in builder


def test_post_import_snippets_include_comprehension_flagging() -> None:
    snippet = ROOT / "qualtrics" / "snippets" / "09-comprehension-check.js"
    text = snippet.read_text()

    assert "comprehension_pass" in text
    assert 'selected.indexOf("2")' in text


def test_qsf_builder_keeps_comprehension_choice_two_as_correct() -> None:
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    assert '"09-comprehension-check.js"' in builder
    assert "about a topic selected earlier" in builder
    assert "I will watch a short video and write a summary." in builder
    assert 'selected.indexOf("2")' in builder
    assert 'js: snippets["09-comprehension-check.js"]' in builder
    assert "I will chat with another participant about a hobby." not in builder


def test_qsf_builder_keeps_attention_check_choices_aligned_with_snippet() -> None:
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()
    snippet = (ROOT / "qualtrics" / "snippets" / "04-attention-check.js").read_text()

    assert '5: "Not at all interested"' in builder
    assert 'selected.indexOf("4")' not in builder
    assert 'selected.indexOf("5")' in builder
    assert 'selected.indexOf("1")' in snippet
    assert 'selected.indexOf("5")' in snippet
    assert "selected.length === 2" in snippet


def test_qsf_builder_keeps_gender_choices_aligned_with_import_safe_qsf() -> None:
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    assert "Which of the following best describes your gender?" in builder
    assert '3: "Non-binary"' in builder
    assert 'Display: "Prefer to self-describe"' in builder
    assert '5: "Prefer not to say"' in builder


def test_qsf_builder_keeps_race_choices_aligned_with_import_safe_qsf() -> None:
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    assert '1: "White"' in builder
    assert '4: "Asian or Asian American"' in builder
    assert '6: "American Indian or Alaska Native"' in builder
    assert '8: "Some other race or ethnicity"' in builder


def test_qsf_builder_keeps_political_demographics_aligned_with_import_safe_qsf() -> None:
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    assert "Which category best describes your highest level of education?" in builder
    assert '8: "Professional degree (JD, MD, MBA)"' in builder
    assert "Which of the following best describes your current employment status?" in builder
    assert "What was your TOTAL household income, before taxes, last year?" in builder
    assert "Which of the following best describes the area where you live?" in builder
    assert "What is your present religion, if any?" in builder
    assert "Aside from weddings and funerals, how often do you attend religious services?" in builder
    assert "Q.employment" in builder
    assert "Q.religiousAttendance" in builder
    assert "do you consider yourself a Republican, a Democrat, or an independent?" in builder
    assert '1: "Republican"' in builder
    assert '2: "Democrat"' in builder
    assert "SelectableChoice/1" in builder
    assert "relationship to the Republican Party" in builder
    assert 'I consider myself a "MAGA" Republican' in builder
    assert "Which of the following best describes your political views?" in builder
    assert '4: "Moderate; middle of the road"' in builder
    assert "How often do you personally use generative AI tools or assistants like {{AI_TOOL_NAME}} in your daily life or work?" in builder
    assert "Rarely (a few times a month or less)" in builder
    assert "How much do you trust generative AI to provide neutral, unbiased information?" in builder
    assert "Trust it somewhat" in builder
    assert "handle political conversations responsibly" not in builder
    assert '"ideology_0_100"' not in builder


def test_qsf_builder_keeps_control_activity_setup_aligned_with_import_safe_qsf() -> None:
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    assert "Which of the following activities are you most interested in right now?" in builder
    assert '3: "Exercise or sports"' in builder
    assert '4: "Music (listening or playing)"' in builder
    assert '11: "Learning something new (a language, a skill, a subject)"' in builder
    assert '12: { Display: "Other", TextEntry: "true" }' in builder
    assert "In one or two sentences, what do you enjoy about it?" in builder
    assert "How much do you enjoy it?" in builder


def test_qsf_builder_keeps_treatment_political_setup_aligned_with_import_safe_qsf() -> None:
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    assert "Which of the following policy issues are you most interested in right now?" in builder
    assert '1: "Economic policy and inflation"' in builder
    assert '8: "Racial inequality and policing"' in builder
    assert '10: "Voting rules and election integrity"' in builder
    assert '11: "U.S. foreign policy and military involvement abroad"' in builder
    assert '12: { Display: "Other", TextEntry: "true" }' in builder
    assert "In one or two sentences, what is your view on this issue?" in builder
    assert "How strongly do you hold this view?" in builder


def test_qsf_builder_keeps_post_chat_outcomes_aligned_with_import_safe_qsf() -> None:
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    assert "How certain are you that your position about" in builder
    assert "How willing are you to seriously consider the opposing view" in builder
    assert "How well do you understand why people on the opposing side" in builder
    assert "how much of the information you encounter" in builder
    assert "How warm or cold do you feel toward people who hold the opposing view" in builder
    assert "They are exposed to true but different information" in builder
    assert "post_favorability_0_100" not in builder
    assert "post_discuss_likelihood_1_7" not in builder
    assert "post_outcomes_matrix" not in builder


def test_importable_qsf_secondary_labels_match_current_question_descriptions() -> None:
    qsf = load_qsf()

    for qid in [
        "QID5",
        "QID6",
        "QID7",
        "QID8",
        "QID9",
        "QID10",
        "QID11",
        "QID12",
        "QID13",
        "QID14",
        "QID15",
        "QID16",
        "QID17",
        "QID18",
        "QID19",
        "QID20",
        "QID21",
        "QID22",
        "QID25",
        "QID26",
        "QID27",
        "QID28",
        "QID29",
        "QID30",
    ]:
        element = next(
            item
            for item in qsf["SurveyElements"]
            if item["Element"] == "SQ" and item["PrimaryAttribute"] == qid
        )
        assert element["SecondaryAttribute"] == element["Payload"]["QuestionDescription"]

    text = QSF.read_text()
    assert "After the conversation, how favorable is your overall view" not in text
    assert "How likely would you be to discuss" not in text
    assert "post_outcomes_matrix" not in text


def test_qsf_builder_keeps_prechat_routing_hook_hidden() -> None:
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    assert 'data-reflective-routing-placeholder="true"' in builder
    assert 'style="display:none"' in builder
    assert "Preparing the conversation" not in builder


def test_qsf_builder_keeps_chatbot_intro_aligned_with_import_safe_qsf() -> None:
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    assert "A short conversation with an AI chatbot" in builder
    assert "Your topic for this conversation" in builder
    assert "${e://Field/topic}" in builder
    assert "The conversation will last about 10 minutes" in builder
    assert "{{BACKEND_HOST}}" in builder
    assert "The conversation will appear below" not in builder


def test_qsf_builder_keeps_post_chat_transition_before_outcomes() -> None:
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    assert 'postTransition: "QID38"' in builder
    assert "[Q.postTransition, Q.postSupport" in builder
    assert "Thank you for completing the conversation." in builder
    assert "The next few pages will ask about your views on a political topic you indicated earlier" in builder
    assert '"post_chat_transition"' in builder


def test_post_import_motive_validator_requires_nonnegative_complete_total() -> None:
    snippet = ROOT / "qualtrics" / "snippets" / "07-motive-total.js"
    text = snippet.read_text()

    assert "allFilled" in text
    assert "value >= 0" in text
    assert 'input.setAttribute("min", "0")' in text
    assert "currentTotal === 100" in text


def test_prechat_routing_prefers_other_text_entries_for_chat_topics() -> None:
    snippet = ROOT / "qualtrics" / "snippets" / "05-prechat-routing.js"
    text = snippet.read_text()
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    for source in (text, builder):
        assert "politicalTopicOther" in source
        assert "activityTopicOther" in source
        assert "ChoiceTextEntryValue/12" in source
        assert "clean(fields.politicalTopicOther) || clean(fields.politicalTopic)" in source
        assert "clean(fields.activityTopicOther) || clean(fields.activityTopic)" in source
        assert "chat_topic_type" in source


def test_prechat_routing_fallback_preserves_browser_randomized_control_split() -> None:
    snippet = (ROOT / "qualtrics" / "snippets" / "05-prechat-routing.js").read_text()
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    for source in (snippet, builder):
        assert 'condition = "treatment";' not in source
        assert "Math.random() < 0.5 ? \"treatment\" : \"control\"" in source
        assert "reflective_qualtrics.condition" in source
        assert "condition_assignment_source" in source
        assert "condition_assigned_at" in source
        assert "browser_randomized" in source
        assert "session_storage" in source


def test_embedded_data_setup_records_condition_assignment_audit_fields() -> None:
    snippet = ROOT / "qualtrics" / "snippets" / "01-embedded-data-setup.js"
    text = snippet.read_text()

    assert "STUDY_ID" in text
    assert "SESSION_ID" in text
    assert "prolific_study_id" in text
    assert "prolific_session_id" in text
    assert "condition_assignment_source" in text
    assert "condition_assigned_at" in text
    assert "reflective_qualtrics.condition_assigned_at" in text
    assert "preseeded_embedded_data" in text
    assert "session_storage" in text
    assert "browser_randomized" in text


def test_qsf_builder_preserves_prolific_study_session_fields() -> None:
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()
    import_safe_builder = (ROOT / "qualtrics" / "build-import-safe-qsf.mjs").read_text()

    for field in [
        "STUDY_ID",
        "SESSION_ID",
        "prolific_study_id",
        "prolific_session_id",
    ]:
        assert field in builder
    assert "participant, study, and session IDs" in import_safe_builder


def test_embedded_data_setup_initializes_chat_duration_fields() -> None:
    snippet = ROOT / "qualtrics" / "snippets" / "01-embedded-data-setup.js"
    text = snippet.read_text()

    assert "chat_started_at" in text
    assert "chat_completed_at" in text
    assert "chat_duration_ms" in text
    assert "chat_min_user_turns" in text
    assert "chat_max_user_turns" in text
    assert "completion_reason" in text


def test_embedded_data_setup_initializes_prechat_routing_fields() -> None:
    snippet = (ROOT / "qualtrics" / "snippets" / "01-embedded-data-setup.js").read_text()
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    for source in (snippet, builder):
        for field in [
            "chat_topic_type",
            "political_topic",
            "political_topic_other",
            "political_stance",
            "political_strength",
            "activity_topic",
            "activity_topic_other",
            "activity_stance",
            "activity_strength",
            "topic",
            "stance",
            "strength_score",
        ]:
            assert f'setEmbeddedData("{field}", "")' in source


def test_embedded_data_setup_initializes_postchat_widget_fields() -> None:
    snippet = (ROOT / "qualtrics" / "snippets" / "01-embedded-data-setup.js").read_text()
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    for source in (snippet, builder):
        assert "motive_total" in source
        assert "allocation_label_order" in source
        assert "allocation_democrat" in source
        assert "allocation_republican" in source
        assert 'setEmbeddedData("allocation_interacted", "false")' in source


def test_post_import_chatbot_mount_passes_condition_and_metadata_fields() -> None:
    snippet = (ROOT / "qualtrics" / "snippets" / "06-chatbot-mount.js").read_text()
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    assert 'apiBase: "https://{{BACKEND_HOST}}"' in snippet
    assert "reflective-chatbot.onrender.com" not in snippet
    for source in (snippet, builder):
        assert "condition: " in source
        assert "conditionAssignmentSource" in source
        assert "conditionAssignedAt" in source
        assert "condition_assignment_source" in source
        assert "condition_assigned_at" in source
    assert 'readFileSync(join(root, "..", "webapp", "static", "qualtrics-chatbot.js")' in builder

    assert "browser_randomized" in snippet
    assert "session_storage" in snippet
    assert "conditionStorageKey" in snippet
    assert "conditionAssignedAtStorageKey" in snippet
    for source in (snippet, builder):
        assert "chat_min_user_turns" in source
        assert "chat_max_user_turns" in source
        assert "completion_reason" in source
        assert "chat_started_at" in source
        assert "chat_completed_at" in source
        assert "chat_duration_ms" in source


def test_embedded_data_setup_initializes_recaptcha_score_fields() -> None:
    snippet = ROOT / "qualtrics" / "snippets" / "01-embedded-data-setup.js"
    text = snippet.read_text()

    for field in [
        "recaptcha_token",
        "recaptcha_action",
        "recaptcha_success",
        "recaptcha_score",
        "recaptcha_min_score",
        "recaptcha_score_pass",
        "recaptcha_action_verified",
        "recaptcha_action_matches",
        "recaptcha_hostname",
        "recaptcha_challenge_ts",
        "recaptcha_error_codes",
    ]:
        assert field in text


def test_typing_telemetry_records_word_count_range_flag() -> None:
    snippet = ROOT / "qualtrics" / "snippets" / "03-typing-telemetry.js"
    text = snippet.read_text()

    assert "typing_word_count_in_range" in text
    assert "wordCount >= 15 && wordCount <= 30" in text


def test_embedded_data_setup_initializes_typing_telemetry_fields() -> None:
    snippet = (ROOT / "qualtrics" / "snippets" / "01-embedded-data-setup.js").read_text()
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    for source in (snippet, builder):
        assert 'setEmbeddedData("typing_word_count_in_range", "false")' in source
        for field in [
            "typing_duration_ms",
            "typing_keydown_count",
            "typing_paste_count",
            "typing_backspace_count",
            "typing_word_count",
            "typing_char_count",
            "typing_first_key_latency_ms",
            "typing_mean_interkey_ms",
            "typing_median_interkey_ms",
        ]:
            assert f'setEmbeddedData("{field}", "")' in source


def test_prechat_routing_placeholder_is_hidden_in_importable_qsf() -> None:
    qsf = load_qsf()
    routing = next(
        element
        for element in qsf["SurveyElements"]
        if element["Element"] == "SQ" and element["PrimaryAttribute"] == "QID23"
    )

    assert routing["Payload"]["DataExportTag"] == "prechat_routing"
    assert "display:none" in routing["Payload"]["QuestionText"]
    assert "data-reflective-routing-placeholder" in routing["Payload"]["QuestionText"]


def test_hidden_routing_hook_shares_page_with_chatbot() -> None:
    qsf = load_qsf()
    blocks = next(element for element in qsf["SurveyElements"] if element["Element"] == "BL")[
        "Payload"
    ]
    study_block = next(
        block for block in blocks.values() if block["Description"] == "Reflective AI Study Shell"
    )
    elements = study_block["BlockElements"]
    qid23_index = next(
        index
        for index, element in enumerate(elements)
        if element.get("Type") == "Question" and element.get("QuestionID") == "QID23"
    )
    qid24_index = next(
        index
        for index, element in enumerate(elements)
        if element.get("Type") == "Question" and element.get("QuestionID") == "QID24"
    )
    between = elements[qid23_index + 1 : qid24_index]

    assert qid23_index < qid24_index
    assert not any(element["Type"] == "Page Break" for element in between)


def test_allocation_widget_hook_is_text_graphic_not_force_response_mc() -> None:
    qsf = load_qsf()
    allocation = next(
        element
        for element in qsf["SurveyElements"]
        if element["Element"] == "SQ" and element["PrimaryAttribute"] == "QID31"
    )

    assert allocation["Payload"]["DataExportTag"] == "bystander_allocation"
    assert allocation["Payload"]["QuestionType"] == "DB"
    assert allocation["Payload"]["Selector"] == "TB"
    assert allocation["Payload"]["Validation"]["Settings"]["Type"] == "None"
    assert "How payment works." in allocation["Payload"]["QuestionText"]
    assert "randomly select 1 in every 10 participants" in allocation["Payload"]["QuestionText"]


def test_allocation_snippet_requires_slider_interaction_before_continue() -> None:
    snippet = ROOT / "qualtrics" / "snippets" / "08-allocation.js"
    text = snippet.read_text()
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    for source in (text, builder):
        assert "Earlier in this survey, you told us about your political views." in source
        assert "How payment works." in source
        assert "randomly select 1 in every 10 participants" in source
        assert "allocation_interacted" in source
        assert "interacted = true" in source
        assert "question.hideNextButton()" in source
        assert "question.showNextButton()" in source


def test_docs_include_post_import_snippet_installation_map() -> None:
    docs = (ROOT / "docs" / "qualtrics.md").read_text()
    readme = (ROOT / "qualtrics" / "README.md").read_text()

    for text in (docs, readme):
        assert "Consent routing" in text
        assert "QID3" in text
        assert "choice 2" in text
        assert "QID23" in text
        assert "05-prechat-routing.js" in text
        assert "QID24" in text
        assert "06-chatbot-mount.js" in text
        assert "09-comprehension-check.js" in text
        assert "07-motive-total.js" in text


def test_readme_uses_backend_only_recaptcha_secret_guidance() -> None:
    readme = (ROOT / "qualtrics" / "README.md").read_text()

    assert "backend `/api/recaptcha/verify` verification mapping" in readme
    assert "Keep `RECAPTCHA_SECRET` backend-only" in readme
    assert "server-side Web Service verification" not in readme
    assert "{{RECAPTCHA_SECRET}}" not in readme


def test_readme_uses_post_import_snippet_workflow_wording() -> None:
    readme = (ROOT / "qualtrics" / "README.md").read_text()

    assert "Reusable Shell Post-Import Setup" in readme
    assert "Current Deployment Note" in readme
    assert "Treat those values as deployment notes, not reusable shell defaults." in readme
    assert "Replace `{{BACKEND_HOST}}` in the chatbot question JavaScript with the deployed backend host." in readme
    assert "Backend host: `reflective-chatbot.onrender.com`" in readme
    assert "Use `reflective-chatbot.onrender.com` as the backend host in the chatbot question JavaScript." not in readme
    assert "Post-import setup maintained by snippets and docs" in readme
    assert "Install post-import snippets" in readme
    assert "37 study questions" in readme
    assert "overview post-import reCAPTCHA snippet" in readme
    assert "browser-session assignment" in readme
    assert "browser-randomizes treatment/control 50/50" in readme
    assert "condition_assignment_source" in readme
    assert "condition_assigned_at" in readme
    assert "Added `QuestionJS`" not in readme
    assert "31 study questions" not in readme


def test_docs_split_reusable_setup_from_current_deployment_notes() -> None:
    docs = (ROOT / "docs" / "qualtrics.md").read_text()

    assert "Current Deployment Note" in docs
    assert "One API-created copy exists" in docs
    assert "Survey ID: `SV_afz2IX85QQcxkUe`" in docs
    assert "Treat these values as deployment notes, not reusable shell defaults." in docs
    assert "The live API-created survey is" not in docs


def test_docs_chatbot_selector_example_preserves_condition_metadata() -> None:
    docs = (ROOT / "docs" / "qualtrics.md").read_text()

    assert 'script.src = "https://YOUR_BACKEND_HOST/static/qualtrics-chatbot.js";' in docs
    assert 'apiBase: "https://YOUR_BACKEND_HOST"' in docs
    assert "Its `QID24` chatbot mount should use `https://reflective-chatbot.onrender.com`" in docs
    assert "conditionSelector" in docs
    assert "conditionAssignmentSourceSelector" in docs
    assert "conditionAssignedAtSelector" in docs
    assert "browser-session assignment" in docs
    assert "browser-side 50/50 treatment/control randomization" in docs
    assert "condition_assignment_source" in docs
    assert "condition_assigned_at" in docs


def test_snippet_manifest_covers_required_post_import_hooks() -> None:
    manifest_path = ROOT / "qualtrics" / "snippets" / "manifest.json"
    manifest = json.loads(manifest_path.read_text())
    snippets_dir = manifest_path.parent
    qsf = load_qsf()
    qids = {
        element["PrimaryAttribute"]
        for element in qsf["SurveyElements"]
        if element["Element"] == "SQ"
    }
    mappings = {
        item["qid"]: item["file"]
        for item in manifest["snippets"]
        if item["required_before_launch"]
    }

    assert mappings["QID3"] == "01-embedded-data-setup.js"
    assert mappings["QID4"] == "02-recaptcha-v3.js"
    assert mappings["QID5"] == "09-comprehension-check.js"
    assert mappings["QID23"] == "05-prechat-routing.js"
    assert mappings["QID24"] == "06-chatbot-mount.js"
    assert mappings["QID30"] == "07-motive-total.js"
    assert mappings["QID31"] == "08-allocation.js"
    purposes = {
        item["qid"]: item["purpose"]
        for item in manifest["snippets"]
        if item["required_before_launch"]
    }
    assert "condition fallback" in purposes["QID23"]
    assert "assignment audit metadata" in purposes["QID23"]
    assert "condition assignment metadata" in purposes["QID24"]
    assert "conversation metadata" in purposes["QID24"]
    for item in manifest["snippets"]:
        assert (snippets_dir / item["file"]).exists()
        assert item["qid"] in qids


def test_qsf_builder_generates_snippet_manifest_contract() -> None:
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    assert "const snippetManifest" in builder
    assert 'writeFileSync(join(snippetsDir, "manifest.json")' in builder
    assert 'qid: Q.comprehension' in builder
    assert 'file: "09-comprehension-check.js"' in builder
    assert 'qid: Q.prechat' in builder
    assert 'file: "05-prechat-routing.js"' in builder
    assert 'qid: Q.chatbot' in builder
    assert 'file: "06-chatbot-mount.js"' in builder
    assert "condition fallback and assignment audit metadata" in builder
    assert "pass condition assignment metadata to the backend" in builder


def test_qsf_builder_readme_includes_post_import_snippet_installation_map() -> None:
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    assert "Post-Import Snippet Installation Map" in builder
    assert "`QID3`: `snippets/01-embedded-data-setup.js`" in builder
    assert "`QID5`: `snippets/09-comprehension-check.js`" in builder
    assert "`QID23`: `snippets/05-prechat-routing.js`" in builder
    assert "`QID24`: `snippets/06-chatbot-mount.js`" in builder
    assert "`QID31`: `snippets/08-allocation.js`" in builder
    assert "Machine-readable copy: `snippets/manifest.json`" in builder


def test_qsf_builder_keeps_brainstorm_allocation_payment_instructions() -> None:
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    assert "How payment works." in builder
    assert "randomly select 1 in every 10 participants" in builder
    assert "Whether you are selected is decided by chance" in builder


def test_docs_include_export_field_dictionary() -> None:
    docs = (ROOT / "docs" / "qualtrics.md").read_text()
    readme = (ROOT / "qualtrics" / "README.md").read_text()

    for text in (docs, readme):
        assert "Export Field Dictionary" in text
        assert "condition_assignment_source" in text
        assert "chat_duration_ms" in text
        assert "typing_word_count_in_range" in text
        assert "recaptcha_score" in text
        assert "recaptcha_score_pass" in text
        assert "recaptcha_action_matches" in text
        assert "allocation_interacted" in text
        assert "chat_condition" in text
    for field in [
        "typing_duration_ms",
        "typing_keydown_count",
        "typing_paste_count",
        "typing_backspace_count",
        "typing_word_count",
        "typing_char_count",
        "typing_first_key_latency_ms",
        "typing_mean_interkey_ms",
        "typing_median_interkey_ms",
        "recaptcha_token",
        "recaptcha_action",
        "recaptcha_min_score",
        "recaptcha_error_codes",
    ]:
        assert field in readme


def test_qsf_builder_readme_matches_import_safe_post_import_workflow() -> None:
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    assert "QuestionJS" in builder
    assert "QuestionJS:" not in builder
    assert "Custom JavaScript stays in separate post-import snippets" in builder
    assert "Install the snippets after import" in builder
    assert "RECAPTCHA_SECRET` only on the backend" in builder
    assert "browser-side 50/50 `condition`" in builder
    assert "browser-session assignment" in builder
    assert "browser-randomizes treatment/control 50/50" in builder
    assert "condition_assignment_source" in builder
    assert "condition_assigned_at" in builder
    assert "preserves condition assignment audit metadata" in builder
    assert "passes condition assignment metadata to the backend" in builder
    assert "writes conversation timing metadata" in builder
    assert "Replace \\`{{BACKEND_HOST}}\\` in the chatbot snippet with the deployed backend host before launch." in builder
    assert "control chats route activity/hobby topics" in builder
    assert "`{{RECAPTCHA_SECRET}}`" not in builder
    assert "The QSF embeds these snippets" not in builder
    assert "embedded directly in this QSF" not in builder


def test_qsf_builder_does_not_embed_question_javascript_payloads() -> None:
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    assert "QuestionJS:" not in builder
    assert "writeFileSync(join(snippetsDir" in builder
    assert "const snippetManifest" in builder


def test_qsf_builder_does_not_generate_recaptcha_secret_webservice() -> None:
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    assert "{{RECAPTCHA_SECRET}}" not in builder
    assert "https://www.google.com/recaptcha/api/siteverify" not in builder
    assert 'Type: "WebService"' not in builder
    assert "/api/recaptcha/verify" in builder


def test_qsf_builder_does_not_generate_native_condition_randomizer() -> None:
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    assert 'Type: "BlockRandomizer"' not in builder
    assert "EvenPresentation" not in builder
    assert 'Value: "treatment"' not in builder
    assert 'Value: "control"' not in builder
    assert "browser-side 50/50 `condition`" in builder


def test_qsf_builder_derives_survey_flow_count() -> None:
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    assert "flow.Properties.Count = flow.Flow.length" in builder
    assert "Count: 20" not in builder


def test_qsf_builder_defers_consent_routing_to_post_import_native_logic() -> None:
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    assert "Do you consent to participate in this study?" in builder
    assert "branchIfChoice(Q.consentChoice" not in builder
    assert "function branchIfChoice" not in builder
    assert "function endSurvey" not in builder
    assert "You did not consent to participate." not in builder
    assert "Add Qualtrics-native consent routing after import" in builder


def test_import_safe_builder_readme_matches_post_import_control_workflow() -> None:
    builder = (ROOT / "qualtrics" / "build-import-safe-qsf.mjs").read_text()

    assert "Browser-side treatment/control assignment" in builder
    assert "condition assignment audit metadata" in builder
    assert "condition assignment metadata handoff" in builder
    assert "timing/duration exports" in builder
    assert "Post-chat widget Embedded Data defaults" in builder
    assert "motive_total" in builder
    assert "allocation_label_order" in builder
    assert "browser-session assignment" in builder
    assert "browser-randomizes treatment/control 50/50" in builder
    assert "condition_assignment_source" in builder
    assert "condition_assigned_at" in builder
    assert "Control chats use the selected hobby or interest" in builder
    assert "8-10 user-turn conversation length" in builder
    assert "chat_topic_type" in builder
    assert "backend `/api/recaptcha/verify` verification mapping" in builder
    assert "Keep `RECAPTCHA_SECRET` backend-only" in builder
    assert "Replace \\`{{BACKEND_HOST}}\\` in the chatbot snippet with the deployed backend host before launch." in builder
    assert "{{RECAPTCHA_SECRET}}" not in builder
    assert "server-side Web Service verification" not in builder
    assert "Native Survey Flow 50/50 random assignment" not in builder
    assert "Native Survey Flow assignment into chatbot fields" not in builder


def test_import_safe_builder_preserves_single_block_import_safe_flow() -> None:
    builder = (ROOT / "qualtrics" / "build-import-safe-qsf.mjs").read_text()

    assert 'Description === "Reflective AI Study Shell"' in builder
    assert "flowElement.Payload.Flow = [" in builder
    assert 'Type: "EmbeddedData"' not in builder
    assert 'Type: "BlockRandomizer"' not in builder
    assert "EvenPresentation" not in builder
    assert 'entry.Type === "Branch"' not in builder
    assert "Democrat $0.50 / Republican $3.50" not in builder
    assert "QuestionText = \"<p>Preparing study assignment...</p>\"" not in builder


def test_import_safe_qsf_strips_export_specific_brand_metadata() -> None:
    qsf = load_qsf()
    survey_options = next(element for element in qsf["SurveyElements"] if element["Element"] == "SO")[
        "Payload"
    ]

    assert qsf["SurveyEntry"]["SurveyOwnerID"] is None
    assert qsf["SurveyEntry"]["SurveyBrandID"] is None
    assert qsf["SurveyEntry"]["CreatorID"] is None
    assert survey_options["SkinLibrary"] == "qualtrics"
    assert survey_options["EOSMessage"] == ""
    assert survey_options["EOSMessageLibrary"] == ""
    assert survey_options["SurveyTitle"] == "Reflective AI Survey Shell"


def test_import_safe_qsf_disables_native_qualtrics_recaptcha() -> None:
    qsf = load_qsf()
    survey_options = next(element for element in qsf["SurveyElements"] if element["Element"] == "SO")[
        "Payload"
    ]
    builder = (ROOT / "qualtrics" / "build-import-safe-qsf.mjs").read_text()

    assert survey_options["RecaptchaV3"] == "false"
    assert survey_options["ConfirmStart"] is False
    assert survey_options["AutoConfirmStart"] is False
    assert 'surveyOptions.Payload.RecaptchaV3 = "false"' in builder
    assert "surveyOptions.Payload.ConfirmStart = false" in builder
    assert "surveyOptions.Payload.AutoConfirmStart = false" in builder


def test_import_safe_builder_readme_includes_post_import_snippet_installation_map() -> None:
    builder = (ROOT / "qualtrics" / "build-import-safe-qsf.mjs").read_text()

    assert "Post-Import Snippet Installation Map" in builder
    assert "`QID3`: `snippets/01-embedded-data-setup.js`" in builder
    assert "`QID5`: `snippets/09-comprehension-check.js`" in builder
    assert "`QID23`: `snippets/05-prechat-routing.js`" in builder
    assert "`QID24`: `snippets/06-chatbot-mount.js`" in builder
    assert "`QID31`: `snippets/08-allocation.js`" in builder
    assert "Machine-readable copy: `snippets/manifest.json`" in builder


def test_embedded_data_field_manifest_includes_key_export_fields() -> None:
    manifest = json.loads((ROOT / "qualtrics" / "embedded-data-fields.json").read_text())
    fields = {
        field
        for group in manifest["groups"]
        for field in group["fields"]
    }

    for field in [
        "prolific_pid",
        "prolific_study_id",
        "prolific_session_id",
        "respondent_id",
        "condition",
        "condition_assignment_source",
        "political_topic_other",
        "activity_topic_other",
        "comprehension_pass",
        "typing_word_count_in_range",
        "recaptcha_score_pass",
        "conversation_id",
        "transcript_url",
        "chat_min_user_turns",
        "completion_reason",
        "allocation_interacted",
    ]:
        assert field in fields


def test_embedded_data_manifest_fields_are_initialized_by_setup_snippet() -> None:
    manifest = json.loads((ROOT / "qualtrics" / "embedded-data-fields.json").read_text())
    manifest_fields = {
        field
        for group in manifest["groups"]
        for field in group["fields"]
    }
    setup_sources = [
        (ROOT / "qualtrics" / "snippets" / "01-embedded-data-setup.js").read_text(),
        (ROOT / "qualtrics" / "build-qsf.mjs").read_text(),
    ]

    for source in setup_sources:
        initialized_fields = set(re.findall(r'setEmbeddedData\("([^"]+)"', source))
        assert manifest_fields <= initialized_fields


def test_qsf_builder_declares_key_embedded_data_manifest_fields() -> None:
    manifest = json.loads((ROOT / "qualtrics" / "embedded-data-fields.json").read_text())
    fields = {
        field
        for group in manifest["groups"]
        for field in group["fields"]
    }
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    for field in [
        "condition_assignment_source",
        "condition_assigned_at",
        "chat_topic_type",
        "political_topic_other",
        "activity_topic_other",
        "typing_word_count_in_range",
        "recaptcha_score_pass",
        "transcript_url",
        "chat_min_user_turns",
        "chat_max_user_turns",
        "completion_reason",
        "allocation_interacted",
    ]:
        assert field in fields
        assert f'"{field}"' in builder


def test_qsf_builder_generates_embedded_data_manifest_contract() -> None:
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    assert "const embeddedDataFieldManifest" in builder
    assert "manifestOnlyFields" in builder
    assert "fieldListOnlyFields" in builder
    assert "Embedded Data manifest and generated field list diverged." in builder
    assert 'writeFileSync(join(root, "embedded-data-fields.json")' in builder
    assert 'name: "respondent_and_assignment"' in builder
    assert 'name: "prechat_routing"' in builder
    assert 'name: "chatbot_metadata"' in builder
    assert '"chat_topic_type"' in builder
    assert '"allocation_interacted"' in builder


def test_qsf_builder_defers_embedded_data_initialization_to_setup_snippet() -> None:
    builder = (ROOT / "qualtrics" / "build-qsf.mjs").read_text()

    assert 'Type: "EmbeddedData"' not in builder
    assert "Qualtrics.SurveyEngine.setEmbeddedData" in builder
    assert "embedded-data setup snippet initializes all export fields" in builder


def test_docs_reference_embedded_data_manifest_and_key_manifest_fields() -> None:
    manifest = json.loads((ROOT / "qualtrics" / "embedded-data-fields.json").read_text())
    fields = {
        field
        for group in manifest["groups"]
        for field in group["fields"]
    }
    docs = (ROOT / "docs" / "qualtrics.md").read_text()
    readme = (ROOT / "qualtrics" / "README.md").read_text()

    for text in (docs, readme):
        assert "embedded-data-fields.json" in text
        for field in [
            "condition",
            "topic",
            "conversation_id",
            "completion_reason",
            "recaptcha_score_pass",
            "allocation_interacted",
        ]:
            assert field in fields
            assert field in text


def test_docs_include_launch_readiness_checklist() -> None:
    docs = (ROOT / "docs" / "qualtrics.md").read_text()
    readme = (ROOT / "qualtrics" / "README.md").read_text()

    for text in (docs, readme):
        assert "Launch Readiness Checklist" in text
        assert "consent routing" in text
        assert "reCAPTCHA Web Service" in text
        assert "treatment" in text
        assert "control" in text
        assert "transcript" in text
