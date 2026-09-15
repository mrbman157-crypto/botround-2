Qualtrics.SurveyEngine.addOnload(function () {
  var params = new URLSearchParams(window.location.search);
  var prolificId = "";
  var prolificStudyId = "";
  var prolificSessionId = "";
  var condition = "";
  var conditionSource = "";
  var conditionAssignedAt = "";
  ["PROLIFIC_PID", "prolific_pid", "pid"].some(function (key) {
    prolificId = (params.get(key) || "").trim();
    return Boolean(prolificId);
  });
  ["STUDY_ID", "study_id"].some(function (key) {
    prolificStudyId = (params.get(key) || "").trim();
    return Boolean(prolificStudyId);
  });
  ["SESSION_ID", "session_id"].some(function (key) {
    prolificSessionId = (params.get(key) || "").trim();
    return Boolean(prolificSessionId);
  });

  Qualtrics.SurveyEngine.setEmbeddedData("prolific_pid", prolificId);
  Qualtrics.SurveyEngine.setEmbeddedData("prolific_study_id", prolificStudyId);
  Qualtrics.SurveyEngine.setEmbeddedData("prolific_session_id", prolificSessionId);

  if (prolificId) {
    Qualtrics.SurveyEngine.setEmbeddedData("respondent_id", prolificId);
  } else {
    Qualtrics.SurveyEngine.setEmbeddedData("respondent_id", "${e://Field/ResponseID}");
  }

  try {
    condition = String(Qualtrics.SurveyEngine.getEmbeddedData("condition") || "").trim().toLowerCase();
  } catch (error) {
    condition = "";
  }
  if (condition === "treatment" || condition === "control") {
    conditionSource = "preseeded_embedded_data";
  }

  if (condition !== "treatment" && condition !== "control") {
    try {
      condition = window.sessionStorage.getItem("reflective_qualtrics.condition") || "";
      conditionAssignedAt = window.sessionStorage.getItem("reflective_qualtrics.condition_assigned_at") || "";
    } catch (error) {
      condition = "";
      conditionAssignedAt = "";
    }
    if (condition === "treatment" || condition === "control") {
      conditionSource = "session_storage";
    }
  }

  if (condition !== "treatment" && condition !== "control") {
    condition = Math.random() < 0.5 ? "treatment" : "control";
    conditionSource = "browser_randomized";
    conditionAssignedAt = new Date().toISOString();
    try {
      window.sessionStorage.setItem("reflective_qualtrics.condition", condition);
      window.sessionStorage.setItem("reflective_qualtrics.condition_assigned_at", conditionAssignedAt);
    } catch (error) {
      // Qualtrics preview or privacy modes may block session storage.
    }
  }

  if (!conditionAssignedAt) {
    conditionAssignedAt = new Date().toISOString();
  }

  Qualtrics.SurveyEngine.setEmbeddedData("condition", condition);
  Qualtrics.SurveyEngine.setEmbeddedData("condition_assignment_source", conditionSource);
  Qualtrics.SurveyEngine.setEmbeddedData("condition_assigned_at", conditionAssignedAt);
  Qualtrics.SurveyEngine.setEmbeddedData("chat_topic_type", "");
  Qualtrics.SurveyEngine.setEmbeddedData("political_topic", "");
  Qualtrics.SurveyEngine.setEmbeddedData("political_topic_other", "");
  Qualtrics.SurveyEngine.setEmbeddedData("political_stance", "");
  Qualtrics.SurveyEngine.setEmbeddedData("political_strength", "");
  Qualtrics.SurveyEngine.setEmbeddedData("activity_topic", "");
  Qualtrics.SurveyEngine.setEmbeddedData("activity_topic_other", "");
  Qualtrics.SurveyEngine.setEmbeddedData("activity_stance", "");
  Qualtrics.SurveyEngine.setEmbeddedData("activity_strength", "");
  Qualtrics.SurveyEngine.setEmbeddedData("topic", "");
  Qualtrics.SurveyEngine.setEmbeddedData("stance", "");
  Qualtrics.SurveyEngine.setEmbeddedData("strength_score", "");
  Qualtrics.SurveyEngine.setEmbeddedData("comprehension_pass", "false");
  Qualtrics.SurveyEngine.setEmbeddedData("attention_pass", "false");
  Qualtrics.SurveyEngine.setEmbeddedData("typing_word_count_in_range", "false");
  Qualtrics.SurveyEngine.setEmbeddedData("typing_duration_ms", "");
  Qualtrics.SurveyEngine.setEmbeddedData("typing_keydown_count", "");
  Qualtrics.SurveyEngine.setEmbeddedData("typing_paste_count", "");
  Qualtrics.SurveyEngine.setEmbeddedData("typing_backspace_count", "");
  Qualtrics.SurveyEngine.setEmbeddedData("typing_word_count", "");
  Qualtrics.SurveyEngine.setEmbeddedData("typing_char_count", "");
  Qualtrics.SurveyEngine.setEmbeddedData("typing_first_key_latency_ms", "");
  Qualtrics.SurveyEngine.setEmbeddedData("typing_mean_interkey_ms", "");
  Qualtrics.SurveyEngine.setEmbeddedData("typing_median_interkey_ms", "");
  Qualtrics.SurveyEngine.setEmbeddedData("recaptcha_token", "");
  Qualtrics.SurveyEngine.setEmbeddedData("recaptcha_action", "");
  Qualtrics.SurveyEngine.setEmbeddedData("recaptcha_success", "");
  Qualtrics.SurveyEngine.setEmbeddedData("recaptcha_score", "");
  Qualtrics.SurveyEngine.setEmbeddedData("recaptcha_min_score", "");
  Qualtrics.SurveyEngine.setEmbeddedData("recaptcha_score_pass", "");
  Qualtrics.SurveyEngine.setEmbeddedData("recaptcha_action_verified", "");
  Qualtrics.SurveyEngine.setEmbeddedData("recaptcha_action_matches", "");
  Qualtrics.SurveyEngine.setEmbeddedData("recaptcha_hostname", "");
  Qualtrics.SurveyEngine.setEmbeddedData("recaptcha_challenge_ts", "");
  Qualtrics.SurveyEngine.setEmbeddedData("recaptcha_error_codes", "");
  Qualtrics.SurveyEngine.setEmbeddedData("chat_completed", "false");
  Qualtrics.SurveyEngine.setEmbeddedData("chat_turn_count", "0");
  Qualtrics.SurveyEngine.setEmbeddedData("chat_min_user_turns", "");
  Qualtrics.SurveyEngine.setEmbeddedData("chat_max_user_turns", "");
  Qualtrics.SurveyEngine.setEmbeddedData("completion_reason", "");
  Qualtrics.SurveyEngine.setEmbeddedData("chat_started_at", "");
  Qualtrics.SurveyEngine.setEmbeddedData("chat_completed_at", "");
  Qualtrics.SurveyEngine.setEmbeddedData("chat_duration_ms", "");
  Qualtrics.SurveyEngine.setEmbeddedData("conversation_id", "");
  Qualtrics.SurveyEngine.setEmbeddedData("transcript_url", "");
  Qualtrics.SurveyEngine.setEmbeddedData("motive_total", "");
  Qualtrics.SurveyEngine.setEmbeddedData("allocation_label_order", "");
  Qualtrics.SurveyEngine.setEmbeddedData("allocation_democrat", "");
  Qualtrics.SurveyEngine.setEmbeddedData("allocation_republican", "");
  Qualtrics.SurveyEngine.setEmbeddedData("allocation_interacted", "false");
});
