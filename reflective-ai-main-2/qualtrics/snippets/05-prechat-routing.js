Qualtrics.SurveyEngine.addOnload(function () {
  var fields = {
    politicalTopic: "${q://QID20/ChoiceGroup/SelectedChoices}",
    politicalTopicOther: "${q://QID20/ChoiceTextEntryValue/12}",
    politicalStance: "${q://QID21/ChoiceTextEntryValue}",
    politicalStrength: "${q://QID22/ChoiceNumericEntryValue/1}",
    activityTopic: "${q://QID17/ChoiceGroup/SelectedChoices}",
    activityTopicOther: "${q://QID17/ChoiceTextEntryValue/12}",
    activityStance: "${q://QID18/ChoiceTextEntryValue}",
    activityStrength: "${q://QID19/ChoiceNumericEntryValue/1}",
    condition: "${e://Field/condition}",
    conditionAssignmentSource: "${e://Field/condition_assignment_source}",
    conditionAssignedAt: "${e://Field/condition_assigned_at}"
  };

  function clean(value) {
    value = String(value == null ? "" : value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return /^\$\{/.test(value) ? "" : value;
  }

  function set(name, value) {
    Qualtrics.SurveyEngine.setEmbeddedData(name, clean(value));
  }

  function validCondition(value) {
    return value === "treatment" || value === "control";
  }

  set("political_topic", fields.politicalTopic);
  set("political_topic_other", fields.politicalTopicOther);
  set("political_stance", fields.politicalStance);
  set("political_strength", fields.politicalStrength);
  set("activity_topic", fields.activityTopic);
  set("activity_topic_other", fields.activityTopicOther);
  set("activity_stance", fields.activityStance);
  set("activity_strength", fields.activityStrength);

  var condition = clean(fields.condition).toLowerCase();
  var conditionSource = clean(fields.conditionAssignmentSource);
  var conditionAssignedAt = clean(fields.conditionAssignedAt);
  if (!validCondition(condition)) {
    try {
      condition = String(window.sessionStorage.getItem("reflective_qualtrics.condition") || "").trim().toLowerCase();
      conditionAssignedAt = window.sessionStorage.getItem("reflective_qualtrics.condition_assigned_at") || "";
    } catch (error) {
      condition = "";
      conditionAssignedAt = "";
    }
    if (validCondition(condition)) {
      conditionSource = "session_storage";
    }
  }
  if (!validCondition(condition)) {
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
  if (!conditionSource) {
    conditionSource = "preseeded_embedded_data";
  }
  if (clean(fields.condition).toLowerCase() !== condition) {
    Qualtrics.SurveyEngine.setEmbeddedData("condition", condition);
  }
  Qualtrics.SurveyEngine.setEmbeddedData("condition_assignment_source", conditionSource);
  Qualtrics.SurveyEngine.setEmbeddedData("condition_assigned_at", conditionAssignedAt);

  var usePolitical = condition === "treatment";
  var politicalTopic = clean(fields.politicalTopicOther) || clean(fields.politicalTopic);
  var activityTopic = clean(fields.activityTopicOther) || clean(fields.activityTopic);
  set("topic", usePolitical ? politicalTopic : activityTopic);
  set("stance", usePolitical ? fields.politicalStance : fields.activityStance);
  set("strength_score", usePolitical ? fields.politicalStrength : fields.activityStrength);
  set("chat_topic_type", usePolitical ? "political" : "activity");
});
