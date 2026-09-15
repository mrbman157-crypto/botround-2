import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const snippetsDir = join(root, "snippets");
mkdirSync(snippetsDir, { recursive: true });
const chatbotSource = readFileSync(join(root, "..", "webapp", "static", "qualtrics-chatbot.js"), "utf8");

const SURVEY_ID = "SV_8hR4nKp2LmQ7zXa";
const RESPONSE_SET_ID = "RS_5uKqT9aLm3ZxP2B";
const BL = {
  trash: "BL_Aaaaaaaaaaaaaaa",
  consent: "BL_Bbbbbbbbbbbbbbb",
  overview: "BL_Ccccccccccccccc",
  background: "BL_Ddddddddddddddd",
  activity: "BL_Eeeeeeeeeeeeeee",
  policy: "BL_Fffffffffffffff",
  prechat: "BL_Ggggggggggggggg",
  chat: "BL_Hhhhhhhhhhhhhhh",
  postchat: "BL_Iiiiiiiiiiiiiii",
  allocation: "BL_Jjjjjjjjjjjjjjj",
  exit: "BL_Kkkkkkkkkkkkkkk",
};

const Q = {
  setup: "QID1",
  consentInfo: "QID2",
  consentChoice: "QID3",
  overview: "QID4",
  comprehension: "QID5",
  typing: "QID6",
  attention: "QID7",
  age: "QID8",
  gender: "QID9",
  race: "QID10",
  education: "QID11",
  employment: "QID33",
  income: "QID34",
  area: "QID35",
  religion: "QID36",
  religiousAttendance: "QID37",
  party: "QID12",
  maga: "QID13",
  ideology: "QID14",
  aiUsage: "QID15",
  aiTrust: "QID16",
  activityTopic: "QID17",
  activityStance: "QID18",
  activityStrength: "QID19",
  politicalTopic: "QID20",
  politicalStance: "QID21",
  politicalStrength: "QID22",
  prechat: "QID23",
  chatbot: "QID24",
  postTransition: "QID38",
  postSupport: "QID25",
  postCertainty: "QID26",
  postUnderstanding: "QID27",
  postLikelihood: "QID28",
  postMatrix: "QID29",
  motive: "QID30",
  allocation: "QID31",
  exit: "QID32",
};

const snippets = {
  "01-embedded-data-setup.js": `Qualtrics.SurveyEngine.addOnload(function () {
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
    Qualtrics.SurveyEngine.setEmbeddedData("respondent_id", "\${e://Field/ResponseID}");
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
});`,

  "02-recaptcha-v3.js": `Qualtrics.SurveyEngine.addOnload(function () {
  var siteKey = "{{RECAPTCHA_SITE_KEY}}";
  var action = "study_overview";
  Qualtrics.SurveyEngine.setEmbeddedData("recaptcha_action", action);

  function storeToken(token) {
    Qualtrics.SurveyEngine.setEmbeddedData("recaptcha_token", token || "");
  }

  function runRecaptcha() {
    if (!window.grecaptcha || !window.grecaptcha.ready) {
      storeToken("");
      return;
    }
    window.grecaptcha.ready(function () {
      window.grecaptcha.execute(siteKey, { action: action }).then(storeToken).catch(function () {
        storeToken("");
      });
    });
  }

  if (!siteKey || siteKey.indexOf("{{") === 0) {
    storeToken("");
    return;
  }

  if (window.grecaptcha) {
    runRecaptcha();
    return;
  }

  var script = document.createElement("script");
  script.src = "https://www.google.com/recaptcha/api.js?render=" + encodeURIComponent(siteKey);
  script.async = true;
  script.defer = true;
  script.onload = runRecaptcha;
  script.onerror = function () {
    storeToken("");
  };
  document.head.appendChild(script);
});`,

  "09-comprehension-check.js": `Qualtrics.SurveyEngine.addOnload(function () {
  var question = this;

  function selectedChoiceIds() {
    var root = question.getQuestionContainer();
    var checked = root.querySelectorAll("input[type='radio']:checked, input[type='checkbox']:checked");
    return Array.prototype.map.call(checked, function (input) {
      return String(input.id || input.value || "").split("~").pop();
    });
  }

  function writePassFlag() {
    var selected = selectedChoiceIds();
    var pass = selected.indexOf("2") !== -1;
    Qualtrics.SurveyEngine.setEmbeddedData("comprehension_pass", pass ? "true" : "false");
  }

  this.questionclick = writePassFlag;
  Qualtrics.SurveyEngine.addOnUnload(writePassFlag);
});`,

  "03-typing-telemetry.js": `Qualtrics.SurveyEngine.addOnload(function () {
  var question = this;
  var startedAt = Date.now();
  var firstKeyAt = 0;
  var lastKeyAt = 0;
  var keydownCount = 0;
  var pasteCount = 0;
  var backspaceCount = 0;
  var intervals = [];

  function setField(name, value) {
    Qualtrics.SurveyEngine.setEmbeddedData(name, String(value == null ? "" : value));
  }

  function textInput() {
    var root = question.getQuestionContainer();
    return root.querySelector("textarea, input[type='text']");
  }

  function median(values) {
    if (!values.length) return "";
    var sorted = values.slice().sort(function (a, b) { return a - b; });
    var mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }

  function writeTelemetry() {
    var input = textInput();
    var value = input ? input.value : "";
    var trimmed = value.trim();
    var duration = Math.max(0, Date.now() - startedAt);
    var meanIki = intervals.length
      ? Math.round(intervals.reduce(function (sum, value) { return sum + value; }, 0) / intervals.length)
      : "";

    setField("typing_duration_ms", duration);
    setField("typing_keydown_count", keydownCount);
    setField("typing_paste_count", pasteCount);
    setField("typing_backspace_count", backspaceCount);
    setField("typing_word_count", trimmed ? trimmed.split(/\\s+/).length : 0);
    setField("typing_char_count", value.length);
    setField("typing_first_key_latency_ms", firstKeyAt ? firstKeyAt - startedAt : "");
    setField("typing_mean_interkey_ms", meanIki);
    setField("typing_median_interkey_ms", median(intervals));
  }

  var input = textInput();
  if (input) {
    input.addEventListener("keydown", function (event) {
      var now = Date.now();
      keydownCount += 1;
      if (!firstKeyAt) firstKeyAt = now;
      if (lastKeyAt) intervals.push(now - lastKeyAt);
      lastKeyAt = now;
      if (event.key === "Backspace") backspaceCount += 1;
    });
    input.addEventListener("paste", function () {
      pasteCount += 1;
    });
  }

  Qualtrics.SurveyEngine.addOnUnload(writeTelemetry);
});`,

  "04-attention-check.js": `Qualtrics.SurveyEngine.addOnload(function () {
  var question = this;

  function selectedChoiceIds() {
    var root = question.getQuestionContainer();
    var checked = root.querySelectorAll("input[type='checkbox']:checked");
    return Array.prototype.map.call(checked, function (input) {
      return String(input.id || input.value || "").split("~").pop();
    });
  }

  function writePassFlag() {
    var selected = selectedChoiceIds();
    var pass = selected.indexOf("1") !== -1 && selected.indexOf("5") !== -1 && selected.length === 2;
    Qualtrics.SurveyEngine.setEmbeddedData("attention_pass", pass ? "true" : "false");
  }

  this.questionclick = writePassFlag;
  Qualtrics.SurveyEngine.addOnUnload(writePassFlag);
});`,

  "05-prechat-routing.js": `Qualtrics.SurveyEngine.addOnload(function () {
  var fields = {
    politicalTopic: "\${q://${Q.politicalTopic}/ChoiceGroup/SelectedChoices}",
    politicalTopicOther: "\${q://${Q.politicalTopic}/ChoiceTextEntryValue/12}",
    politicalStance: "\${q://${Q.politicalStance}/ChoiceTextEntryValue}",
    politicalStrength: "\${q://${Q.politicalStrength}/ChoiceNumericEntryValue/1}",
    activityTopic: "\${q://${Q.activityTopic}/ChoiceGroup/SelectedChoices}",
    activityTopicOther: "\${q://${Q.activityTopic}/ChoiceTextEntryValue/12}",
    activityStance: "\${q://${Q.activityStance}/ChoiceTextEntryValue}",
    activityStrength: "\${q://${Q.activityStrength}/ChoiceNumericEntryValue/1}",
    condition: "\${e://Field/condition}",
    conditionAssignmentSource: "\${e://Field/condition_assignment_source}",
    conditionAssignedAt: "\${e://Field/condition_assigned_at}"
  };

  function clean(value) {
    value = String(value == null ? "" : value).replace(/<[^>]*>/g, " ").replace(/\\s+/g, " ").trim();
    return /^\\$\\{/.test(value) ? "" : value;
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
});`,

  "06-chatbot-mount.js": `${chatbotSource}

Qualtrics.SurveyEngine.addOnload(function () {
  var question = this;
  window.ReflectiveQualtricsChatbot.mount({
    question: question,
    apiBase: "https://{{BACKEND_HOST}}",
    topic: "\${e://Field/topic}",
    stance: "\${e://Field/stance}",
    strengthScore: "\${e://Field/strength_score}",
    condition: "\${e://Field/condition}",
    conditionAssignmentSource: "\${e://Field/condition_assignment_source}",
    conditionAssignedAt: "\${e://Field/condition_assigned_at}",
    respondentId: "\${e://Field/respondent_id}",
    requireCompletion: true
  });
});`,

  "07-motive-total.js": `Qualtrics.SurveyEngine.addOnload(function () {
  var question = this;
  var message = document.createElement("div");
  message.style.marginTop = "8px";
  message.style.fontWeight = "600";
  message.style.color = "#8a1f11";
  question.getQuestionContainer().appendChild(message);

  function inputs() {
    return Array.prototype.slice.call(question.getQuestionContainer().querySelectorAll("input[type='text'], input[type='number']"));
  }

  function total() {
    return inputs().reduce(function (sum, input) {
      var value = Number(input.value);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
  }

  function validate() {
    var currentTotal = total();
    Qualtrics.SurveyEngine.setEmbeddedData("motive_total", String(currentTotal));
    if (currentTotal === 100) {
      message.textContent = "";
      question.showNextButton();
    } else {
      message.textContent = "The six entries must total exactly 100.";
      question.hideNextButton();
    }
  }

  inputs().forEach(function (input) {
    input.setAttribute("inputmode", "decimal");
    input.addEventListener("input", validate);
  });
  validate();
});`,

  "08-allocation.js": `Qualtrics.SurveyEngine.addOnload(function () {
  var question = this;
  var root = question.getQuestionContainer();
  var democratLeft = Math.random() < 0.5;
  var leftLabel = democratLeft ? "Democrat" : "Republican";
  var rightLabel = democratLeft ? "Republican" : "Democrat";

  root.innerHTML = [
    "<p>Earlier in this survey, you told us about your political views.</p>",
    "<p>In this part, you will make a real decision that affects the payment of two other participants.</p>",
    "<p>You have <strong>$4.00</strong> to allocate between two other participants in this study. One of them is a Democrat, and the other is a Republican. You will not allocate any money to yourself.</p>",
    "<p>You must allocate the full $4.00 between the two participants. The minimum you can give to each is $0.50. Amounts are in $0.50 increments.</p>",
    "<p><strong>How payment works.</strong> At the end of the study, we will randomly select 1 in every 10 participants. If you are selected, your decision on this page will be implemented: the two participants you allocated to will each receive the amount you chose, added to their study payment. Whether you are selected is decided by chance and does not depend on what you choose here. You yourself will not receive money from this decision; the money goes to the two other participants.</p>",
    "<p>Allocate $4.00 between the two by choosing the amount assigned to the party shown on the left.</p>",
    "<div id='allocation-widget' style='display:grid;gap:12px;max-width:640px'>",
    "<div style='display:flex;justify-content:space-between;font-weight:700'><span>" + leftLabel + "</span><span>" + rightLabel + "</span></div>",
    "<input id='allocation-left' type='range' min='0.5' max='3.5' step='0.5' value='2.0' aria-label='Allocation to left label'>",
    "<div id='allocation-values' style='display:flex;justify-content:space-between'></div>",
    "</div>"
  ].join("");

  var slider = root.querySelector("#allocation-left");
  var values = root.querySelector("#allocation-values");
  var interacted = false;

  function money(value) {
    return "$" + Number(value).toFixed(2);
  }

  function writeAllocation() {
    var leftAmount = Number(slider.value);
    var rightAmount = 4 - leftAmount;
    var democratAmount = democratLeft ? leftAmount : rightAmount;
    var republicanAmount = democratLeft ? rightAmount : leftAmount;

    values.innerHTML = "<span>" + money(leftAmount) + "</span><span>" + money(rightAmount) + "</span>";
    Qualtrics.SurveyEngine.setEmbeddedData("allocation_label_order", democratLeft ? "democrat_left" : "republican_left");
    Qualtrics.SurveyEngine.setEmbeddedData("allocation_democrat", democratAmount.toFixed(2));
    Qualtrics.SurveyEngine.setEmbeddedData("allocation_republican", republicanAmount.toFixed(2));
    Qualtrics.SurveyEngine.setEmbeddedData("allocation_interacted", interacted ? "true" : "false");
    if (interacted) {
      question.showNextButton();
    } else {
      question.hideNextButton();
    }
  }

  slider.addEventListener("input", function () {
    interacted = true;
    writeAllocation();
  });
  slider.addEventListener("change", function () {
    interacted = true;
    writeAllocation();
  });
  writeAllocation();
});`,
};

for (const [name, code] of Object.entries(snippets)) {
  writeFileSync(join(snippetsDir, name), `${code}\n`);
}

const snippetManifest = {
  version: 1,
  description: "Post-import Qualtrics JavaScript installation map for the Reflective AI survey shell.",
  snippets: [
    {
      qid: Q.consentChoice,
      file: "01-embedded-data-setup.js",
      purpose: "Capture respondent identifiers, assign/persist condition, and initialize export fields.",
      required_before_launch: true,
    },
    {
      qid: Q.overview,
      file: "02-recaptcha-v3.js",
      purpose: "Capture reCAPTCHA v3 token for server-side verification.",
      required_before_launch: true,
    },
    {
      qid: Q.comprehension,
      file: "09-comprehension-check.js",
      purpose: "Write comprehension_pass for the study-overview comprehension check.",
      required_before_launch: true,
    },
    {
      qid: Q.typing,
      file: "03-typing-telemetry.js",
      purpose: "Record typing telemetry for the daylight-saving response.",
      required_before_launch: true,
    },
    {
      qid: Q.attention,
      file: "04-attention-check.js",
      purpose: "Write attention_pass for the instructed-response attention check.",
      required_before_launch: true,
    },
    {
      qid: Q.prechat,
      file: "05-prechat-routing.js",
      purpose: "Copy treatment/control setup answers into chatbot Embedded Data fields, preserving condition fallback and assignment audit metadata.",
      required_before_launch: true,
    },
    {
      qid: Q.chatbot,
      file: "06-chatbot-mount.js",
      purpose: "Mount the hosted chatbot, pass condition assignment metadata to the backend, and write conversation metadata.",
      required_before_launch: true,
    },
    {
      qid: Q.motive,
      file: "07-motive-total.js",
      purpose: "Require six nonnegative motive entries to total exactly 100.",
      required_before_launch: true,
    },
    {
      qid: Q.allocation,
      file: "08-allocation.js",
      purpose: "Render bystander allocation slider, hide Next until slider interaction, and write allocation Embedded Data.",
      required_before_launch: true,
    },
  ],
};

writeFileSync(join(snippetsDir, "manifest.json"), `${JSON.stringify(snippetManifest, null, 2)}\n`);

const edFields = [
  "prolific_pid",
  "prolific_study_id",
  "prolific_session_id",
  "respondent_id",
  "condition",
  "condition_assignment_source",
  "condition_assigned_at",
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
  "comprehension_pass",
  "attention_pass",
  "typing_word_count_in_range",
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
  "recaptcha_success",
  "recaptcha_score",
  "recaptcha_min_score",
  "recaptcha_score_pass",
  "recaptcha_action_verified",
  "recaptcha_action_matches",
  "recaptcha_hostname",
  "recaptcha_challenge_ts",
  "recaptcha_error_codes",
  "conversation_id",
  "transcript_url",
  "chat_completed",
  "chat_turn_count",
  "chat_min_user_turns",
  "chat_max_user_turns",
  "completion_reason",
  "chat_started_at",
  "chat_completed_at",
  "chat_duration_ms",
  "motive_total",
  "allocation_label_order",
  "allocation_democrat",
  "allocation_republican",
  "allocation_interacted",
];

const validationOn = {
  Settings: {
    ForceResponse: "ON",
    ForceResponseType: "ON",
    Type: "None",
  },
};

const validationOff = {
  Settings: {
    ForceResponse: "OFF",
    ForceResponseType: "ON",
    Type: "None",
  },
};

function description(text) {
  return String(text).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
}

function baseQuestion(id, text, tag, type, selector, extra = {}) {
  return {
    SurveyID: SURVEY_ID,
    Element: "SQ",
    PrimaryAttribute: id,
    SecondaryAttribute: description(text),
    TertiaryAttribute: null,
    Payload: {
      QuestionText: text,
      DefaultChoices: false,
      DataExportTag: tag,
      QuestionType: type,
      Selector: selector,
      Configuration: {
        QuestionDescriptionOption: "UseText",
      },
      QuestionDescription: description(text),
      ChoiceOrder: [],
      Validation: validationOff,
      GradingData: [],
      Language: [],
      NextChoiceId: 4,
      NextAnswerId: 1,
      QuestionID: id,
      DataVisibility: {
        Private: false,
        Hidden: false,
      },
      ...extra,
    },
  };
}

function db(id, text, tag, questionJs = "") {
  void questionJs;
  return baseQuestion(id, text, tag, "DB", "TB", {
    ChoiceOrder: [],
    Validation: { Settings: { Type: "None" } },
  });
}

function mc(id, text, tag, choices, { multiple = false, force = true, js = "", displayLogic } = {}) {
  void js;
  const choiceMap = {};
  Object.entries(choices).forEach(([key, value]) => {
    choiceMap[key] = typeof value === "string" ? { Display: value } : value;
  });
  return baseQuestion(id, text, tag, "MC", multiple ? "MAVR" : "SAVR", {
    SubSelector: "TX",
    Choices: choiceMap,
    ChoiceOrder: Object.keys(choiceMap),
    Validation: force ? validationOn : validationOff,
    NextChoiceId: Object.keys(choiceMap).length + 1,
    DisplayLogic: displayLogic,
  });
}

function textEntry(id, text, tag, { selector = "ESTB", force = true, js = "", formChoices } = {}) {
  void js;
  const extra = {
    Validation: force ? validationOn : validationOff,
    SearchSource: { AllowFreeResponse: "false" },
  };
  if (formChoices) {
    extra.Choices = Object.fromEntries(formChoices.map((choice, index) => [String(index + 1), { Display: choice }]));
    extra.ChoiceOrder = formChoices.map((_, index) => String(index + 1));
    extra.NextChoiceId = formChoices.length + 1;
  }
  return baseQuestion(id, text, tag, "TE", selector, extra);
}

function slider(id, text, tag, left, right) {
  return baseQuestion(id, text, tag, "Slider", "HSLIDER", {
    Configuration: {
      QuestionDescriptionOption: "UseText",
      CSSliderMin: 0,
      CSSliderMax: 100,
      GridLines: 10,
      SnapToGrid: false,
      NumDecimals: "0",
      ShowValue: true,
      CustomStart: true,
      SliderStartPositions: { 1: 0.5 },
      NotApplicable: false,
      MobileFirst: true,
    },
    Choices: { 1: { Display: "&nbsp;" } },
    ChoiceOrder: [1],
    Validation: validationOn,
    NextChoiceId: 2,
    NextAnswerId: 3,
    Labels: {
      1: { Display: left },
      2: { Display: right },
    },
  });
}

function likert(id, text, tag, choices) {
  const entries = Array.isArray(choices)
    ? choices.map((choice, index) => [String(index + 1), choice])
    : Object.entries(choices);
  const choiceMap = Object.fromEntries(
    entries.map(([key, value]) => [key, typeof value === "string" ? { Display: value } : value]),
  );
  return mc(id, text, tag, choiceMap, { multiple: false, force: true });
}

function matrix(id, text, tag, rows) {
  return baseQuestion(id, text, tag, "Matrix", "Likert", {
    SubSelector: "SingleAnswer",
    Configuration: {
      QuestionDescriptionOption: "UseText",
      TextPosition: "inline",
      RepeatHeaders: "none",
      WhiteSpace: "OFF",
      MobileFirst: true,
    },
    Choices: Object.fromEntries(rows.map((row, index) => [String(index + 1), { Display: row }])),
    ChoiceOrder: rows.map((_, index) => String(index + 1)),
    Answers: {
      1: { Display: "Strongly disagree" },
      2: { Display: "Disagree" },
      3: { Display: "Somewhat disagree" },
      4: { Display: "Neither agree nor disagree" },
      5: { Display: "Somewhat agree" },
      6: { Display: "Agree" },
      7: { Display: "Strongly agree" },
    },
    AnswerOrder: ["1", "2", "3", "4", "5", "6", "7"],
    Validation: validationOn,
    NextChoiceId: rows.length + 1,
    NextAnswerId: 8,
  });
}

function block(id, description, questionIds, index) {
  return [
    String(index),
    {
      Type: "Standard",
      SubType: "",
      Description: description,
      ID: id,
      BlockElements: questionIds.map((QuestionID) => ({ Type: "Question", QuestionID })),
      Options: {
        BlockLocking: "false",
        RandomizeQuestions: "false",
        BlockVisibility: "Expanded",
        PreviousButton: "",
        previousButtonMID: "",
        NextButton: "Continue",
        nextButtonMID: "",
        previousButtonLibraryID: "",
        nextButtonLibraryID: "",
      },
    },
  ];
}

const blocks = Object.fromEntries([
  [
    "1",
    {
      Type: "Trash",
      Description: "Trash / Unused Questions",
      ID: BL.trash,
      BlockElements: [],
      Options: {
        BlockLocking: "false",
        RandomizeQuestions: "false",
        BlockVisibility: "Expanded",
      },
    },
  ],
  block(BL.consent, "Consent", [Q.consentInfo, Q.consentChoice], 2),
  block(BL.overview, "Study overview and checks", [Q.overview, Q.comprehension, Q.typing, Q.attention], 3),
  block(BL.background, "Background questionnaire", [Q.age, Q.gender, Q.race, Q.education, Q.employment, Q.income, Q.area, Q.religion, Q.religiousAttendance, Q.party, Q.maga, Q.ideology, Q.aiUsage, Q.aiTrust], 4),
  block(BL.activity, "Nonpolitical activity selection", [Q.activityTopic, Q.activityStance, Q.activityStrength], 5),
  block(BL.policy, "Political issue selection", [Q.politicalTopic, Q.politicalStance, Q.politicalStrength], 6),
  block(BL.prechat, "Pre-chat embedded data routing", [Q.prechat], 7),
  block(BL.chat, "Chatbot", [Q.chatbot], 8),
  block(BL.postchat, "Post-chat outcomes", [Q.postTransition, Q.postSupport, Q.postCertainty, Q.postUnderstanding, Q.postLikelihood, Q.motive, Q.postMatrix], 9),
  block(BL.allocation, "Bystander allocation", [Q.allocation], 10),
  block(BL.exit, "Exit", [Q.exit], 11),
]);

const allocationQuestionHtml = [
  "<p>Earlier in this survey, you told us about your political views.</p>",
  "<p>In this part, you will make a real decision that affects the payment of two other participants.</p>",
  "<p>You have $4.00 to allocate between two other participants in this study. One of them is a Democrat, and the other is a Republican. You will not allocate any money to yourself.</p>",
  "<p>You must allocate the full $4.00 between the two participants. The minimum you can give to each is $0.50. Amounts are in $0.50 increments.</p>",
  "<p><strong>How payment works.</strong> At the end of the study, we will randomly select 1 in every 10 participants. If you are selected, your decision on this page will be implemented: the two participants you allocated to will each receive the amount you chose, added to their study payment. Whether you are selected is decided by chance and does not depend on what you choose here. You yourself will not receive money from this decision; the money goes to the two other participants.</p>",
  "<p><strong>Allocation widget placeholder.</strong> After import, add the allocation JavaScript from the project snippets to this Text/Graphic question.</p>",
].join("");

const questions = [
  db(Q.consentInfo, "{{CONSENT_HTML}}", "consent_html", snippets["01-embedded-data-setup.js"]),
  mc(Q.consentChoice, "Do you consent to participate in this study?", "consent", {
    1: "Yes, I consent to participate.",
    2: "No, I do not consent.",
  }),
  db(Q.overview, "{{STUDY_OVERVIEW_HTML}}", "study_overview", snippets["02-recaptcha-v3.js"]),
  mc(
    Q.comprehension,
    "In this study, what will happen on the next pages?",
    "comprehension",
    {
      1: "I will answer a series of multiple-choice questions about politics.",
      2: "I will have a conversation with an AI chatbot about a topic selected earlier, then answer follow-up questions.",
      3: "I will watch a short video and write a summary.",
      4: "I will read a news article and answer questions about it.",
    },
    {
      js: snippets["09-comprehension-check.js"],
    },
  ),
  textEntry(
    Q.typing,
    "Please explain: What is your opinion about the yearly switch to daylight saving time? Do you like or dislike it? Please use about 15-30 words.",
    "typing_speed_check",
    { js: snippets["03-typing-telemetry.js"] },
  ),
  mc(
    Q.attention,
    "For this attention check, please select both the first and last options, and no others.",
    "attention_check",
    {
      1: "Very strongly interested",
      2: "Very interested",
      3: "A little bit interested",
      4: "Not very interested",
      5: "Not at all interested",
    },
    { multiple: true, js: snippets["04-attention-check.js"] },
  ),
  textEntry(Q.age, "What is your age?", "age", { selector: "SL" }),
  mc(Q.gender, "Which of the following best describes your gender?", "gender", {
    1: "Male",
    2: "Female",
    3: "Non-binary",
    4: { Display: "Prefer to self-describe", TextEntry: "true" },
    5: "Prefer not to say",
  }),
  mc(
    Q.race,
    "Which racial or ethnic categories describe you? Select all that apply.",
    "race_ethnicity",
    {
      1: "White",
      2: "Black or African American",
      3: "Hispanic, Latino, or Spanish origin",
      4: "Asian or Asian American",
      5: "Middle Eastern or North African",
      6: "American Indian or Alaska Native",
      7: "Native Hawaiian or Other Pacific Islander",
      8: "Some other race or ethnicity",
      9: "Prefer not to say",
    },
    { multiple: true },
  ),
  mc(Q.education, "Which category best describes your highest level of education?", "education", {
    1: "Less than a high school degree",
    2: "High school graduate (high school diploma or equivalent including GED)",
    3: "Some college but no degree",
    4: "Associate degree in college (2-year)",
    5: "Bachelor's degree in college (4-year)",
    6: "Master's degree",
    7: "Doctoral degree",
    8: "Professional degree (JD, MD, MBA)",
  }),
  mc(Q.employment, "Which of the following best describes your current employment status?", "employment_status", {
    1: "Full-time employee",
    2: "Part-time employee",
    3: "Self-employed or small business owner",
    4: "Unemployed and looking for work",
    5: "Unemployed and not looking for work",
    6: "Student",
    7: "Not working and retired",
    8: "Not working and a homemaker or full-time parent",
    9: "Disabled and unable to work",
  }),
  mc(Q.income, "What was your TOTAL household income, before taxes, last year?", "household_income", {
    1: "$0 - $14,999",
    2: "$15,000 - $24,999",
    3: "$25,000 - $39,999",
    4: "$40,000 - $54,999",
    5: "$55,000 - $74,999",
    6: "$75,000 - $99,999",
    7: "$100,000 - $149,999",
    8: "$150,000 - $199,999",
    9: "$200,000 or more",
    10: "Prefer not to say",
  }),
  mc(Q.area, "Which of the following best describes the area where you live?", "area_type", {
    1: "City",
    2: "Suburb",
    3: "Small town",
    4: "Rural area",
  }),
  mc(Q.religion, "What is your present religion, if any?", "religion", {
    1: "Protestant",
    2: "Roman Catholic",
    3: "Mormon",
    4: "Orthodox (such as Greek or Russian Orthodox)",
    5: "Jewish",
    6: "Muslim",
    7: "Buddhist",
    8: "Hindu",
    9: "Atheist",
    10: "Agnostic",
    11: "Something else",
    12: "Nothing in particular",
  }),
  mc(Q.religiousAttendance, "Aside from weddings and funerals, how often do you attend religious services?", "religious_attendance", {
    1: "More than once a week",
    2: "Once a week",
    3: "Once or twice a month",
    4: "A few times a year",
    5: "Seldom",
    6: "Never",
  }),
  mc(Q.party, "In politics, as of today, do you consider yourself a Republican, a Democrat, or an independent?", "party_id", {
    1: "Republican",
    2: "Democrat",
    3: "Independent",
    4: "Other",
    5: "Prefer not to say",
  }),
  mc(
    Q.maga,
    "Which of the following best describes your relationship to the Republican Party?",
    "maga_support",
    {
      1: 'I consider myself a "MAGA" Republican',
      2: 'I consider myself a Republican, but not "MAGA"',
      3: "Prefer not to say",
    },
    {
      displayLogic: {
        0: {
          0: {
            ChoiceLocator: `q://${Q.party}/SelectableChoice/1`,
            Description: "If party ID is Republican",
            LeftOperand: `q://${Q.party}/SelectableChoice/1`,
            LogicType: "Question",
            Operator: "Selected",
            QuestionID: Q.party,
            QuestionIDFromLocator: Q.party,
            QuestionIsInLoop: "no",
            Type: "Expression",
          },
          Type: "If",
        },
        Type: "BooleanExpression",
        inPage: false,
      },
    },
  ),
  mc(Q.ideology, "Which of the following best describes your political views?", "ideology", {
    1: "Very liberal",
    2: "Liberal",
    3: "Slightly liberal",
    4: "Moderate; middle of the road",
    5: "Slightly conservative",
    6: "Conservative",
    7: "Very conservative",
  }),
  mc(Q.aiUsage, "How often do you personally use generative AI tools or assistants like {{AI_TOOL_NAME}} in your daily life or work?", "ai_usage", {
    1: "Never",
    2: "Rarely (a few times a month or less)",
    3: "Regularly (about once a week)",
    4: "Frequently (multiple times a week)",
    5: "Daily or multiple times every day",
  }),
  mc(Q.aiTrust, "How much do you trust generative AI to provide neutral, unbiased information?", "ai_trust", {
    1: "Do not trust it at all",
    2: "Trust it very little",
    3: "Trust it somewhat",
    4: "Trust it a lot",
    5: "Trust it completely",
  }),
  mc(Q.activityTopic, "Which of the following activities are you most interested in right now?", "activity_topic_choice", {
    1: "Cooking or baking",
    2: "Reading",
    3: "Exercise or sports",
    4: "Music (listening or playing)",
    5: "Gardening or being outdoors",
    6: "Crafts or making things (art, woodworking, sewing, etc.)",
    7: "Video games",
    8: "Watching movies or TV shows",
    9: "Spending time with family or friends",
    10: "Travel",
    11: "Learning something new (a language, a skill, a subject)",
    12: { Display: "Other", TextEntry: "true" },
  }),
  textEntry(Q.activityStance, "In one or two sentences, what do you enjoy about it?", "activity_stance_text"),
  slider(Q.activityStrength, "How much do you enjoy it?", "activity_strength_0_100", "Not at all", "Extremely"),
  mc(Q.politicalTopic, "Which of the following policy issues are you most interested in right now?", "political_topic_choice", {
    1: "Economic policy and inflation",
    2: "Immigration and border policy",
    3: "Taxes, government spending, and the deficit",
    4: "Climate change and energy policy",
    5: "Abortion and reproductive rights",
    6: "Gun policy",
    7: "Healthcare access and costs",
    8: "Racial inequality and policing",
    9: "LGBTQ+ rights",
    10: "Voting rules and election integrity",
    11: "U.S. foreign policy and military involvement abroad",
    12: { Display: "Other", TextEntry: "true" },
  }),
  textEntry(Q.politicalStance, "In one or two sentences, what is your view on this issue?", "political_stance_text"),
  slider(Q.politicalStrength, "How strongly do you hold this view?", "political_strength_0_100", "Not strongly", "Extremely strongly"),
  db(Q.prechat, '<div style="display:none" aria-hidden="true" data-reflective-routing-placeholder="true">Preparing study assignment...</div>', "prechat_routing", snippets["05-prechat-routing.js"]),
  db(Q.chatbot, '<h2>A short conversation with an AI chatbot</h2><p>Next, you will have a short chat with an AI conversation partner.</p><p><strong>Your topic for this conversation:</strong> ${e://Field/topic}</p><p>This is a chance to think out loud about something you care about. The chatbot will ask you questions and respond to what you share. It is not there to test you, fact-check you, or push you toward any particular conclusion. Its role is to listen and help keep the conversation going.</p><p>There are no right or wrong answers, so please answer honestly. The conversation will last about 10 minutes. When it reaches a natural ending, you will move on to the next part of the survey.</p><p><strong>Chatbot placeholder.</strong> After import, add the chatbot JavaScript from the project integration notes to this Text/Graphic question. The backend host placeholder is {{BACKEND_HOST}}.</p>', "chatbot", snippets["06-chatbot-mount.js"]),
  db(Q.postTransition, "<p>Thank you for completing the conversation.</p><p>The next few pages will ask about your views on a political topic you indicated earlier: <strong>${e://Field/political_topic}</strong>.</p><p>There are no right or wrong answers. We are simply interested in your views.</p>", "post_chat_transition"),
  slider(Q.postSupport, "How certain are you that your position about ${e://Field/political_topic} is 'correct'?", "post_certainty_0_100", "Not at all certain", "Completely certain"),
  mc(Q.postCertainty, "How willing are you to seriously consider the opposing view on ${e://Field/political_topic}?", "post_openness_opposing_view_1_7", {
    1: "Not at all willing",
    2: "2",
    3: "3",
    4: "4",
    5: "5",
    6: "6",
    7: "Extremely willing",
  }),
  mc(Q.postUnderstanding, "How well do you understand why people on the opposing side of ${e://Field/political_topic} hold their view?", "post_perspective_taking_1_7", {
    1: "Not at all",
    2: "2",
    3: "3",
    4: "4",
    5: "5",
    6: "6",
    7: "Completely",
  }),
  slider(Q.postLikelihood, "In your daily life, how much of the information you encounter about ${e://Field/political_topic} reflects your own point of view?", "post_selective_information_exposure_0_100", "None of the information", "All of the information"),
  slider(Q.postMatrix, "We would like to know how you feel toward people who disagree with you on ${e://Field/political_topic} using a 0 to 100 feeling thermometer. How warm or cold do you feel toward people who hold the opposing view on ${e://Field/political_topic}?", "post_affective_hostility_0_100", "Extremely cold / Unfavorable", "Extremely warm / Favorable"),
  textEntry(Q.motive, "Imagine 100 people who hold the opposing view on ${e://Field/political_topic}. In your opinion, how many of these 100 people hold that view for each of the following reasons? Your total must equal 100.", "motive_attribution_100", {
    selector: "FORM",
    formChoices: [
      "They are exposed to true but different information through their news sources, social media, and the people around them.",
      "They have been deceived about the facts by misleading sources.",
      "They have different moral beliefs about this issue.",
      "They have had different life experiences that shape how they see the issue.",
      "They are putting their personal interests ahead of what is best for the country.",
      "They haven't thought deeply or carefully enough about the issue.",
    ],
    js: snippets["07-motive-total.js"],
  }),
  db(Q.allocation, allocationQuestionHtml, "bystander_allocation", snippets["08-allocation.js"]),
  db(Q.exit, "<p>{{PAYMENT_RECEIPT_HTML}}</p><p>{{PROLIFIC_COMPLETION_CODE}}</p>", "exit"),
];


const embeddedDataFieldManifest = {
  version: 1,
  description: "Embedded Data fields used by the Reflective AI Qualtrics survey and post-import snippets.",
  groups: [
    {
      name: "respondent_and_assignment",
      fields: ["prolific_pid", "prolific_study_id", "prolific_session_id", "respondent_id", "condition", "condition_assignment_source", "condition_assigned_at"],
    },
    {
      name: "prechat_routing",
      fields: ["chat_topic_type", "political_topic", "political_topic_other", "political_stance", "political_strength", "activity_topic", "activity_topic_other", "activity_stance", "activity_strength", "topic", "stance", "strength_score"],
    },
    {
      name: "screening_and_quality",
      fields: ["comprehension_pass", "attention_pass", "typing_word_count_in_range", "typing_duration_ms", "typing_keydown_count", "typing_paste_count", "typing_backspace_count", "typing_word_count", "typing_char_count", "typing_first_key_latency_ms", "typing_mean_interkey_ms", "typing_median_interkey_ms"],
    },
    {
      name: "recaptcha",
      fields: ["recaptcha_token", "recaptcha_action", "recaptcha_success", "recaptcha_score", "recaptcha_min_score", "recaptcha_score_pass", "recaptcha_action_verified", "recaptcha_action_matches", "recaptcha_hostname", "recaptcha_challenge_ts", "recaptcha_error_codes"],
    },
    {
      name: "chatbot_metadata",
      fields: ["conversation_id", "transcript_url", "chat_completed", "chat_turn_count", "chat_min_user_turns", "chat_max_user_turns", "completion_reason", "chat_started_at", "chat_completed_at", "chat_duration_ms"],
    },
    {
      name: "postchat_widgets",
      fields: ["motive_total", "allocation_label_order", "allocation_democrat", "allocation_republican", "allocation_interacted"],
    },
  ],
};

const manifestFields = embeddedDataFieldManifest.groups.flatMap((group) => group.fields);
const manifestOnlyFields = manifestFields.filter((field) => !edFields.includes(field));
const fieldListOnlyFields = edFields.filter((field) => !manifestFields.includes(field));
if (manifestOnlyFields.length || fieldListOnlyFields.length) {
  throw new Error(
    [
      "Embedded Data manifest and generated field list diverged.",
      `Manifest-only fields: ${manifestOnlyFields.join(", ") || "(none)"}`,
      `Field-list-only fields: ${fieldListOnlyFields.join(", ") || "(none)"}`,
    ].join("\n"),
  );
}

writeFileSync(join(root, "embedded-data-fields.json"), JSON.stringify(embeddedDataFieldManifest, null, 2) + "\n");

const flow = {
  Type: "Root",
  FlowID: "FL_1",
  Flow: [
    { Type: "Standard", ID: BL.consent, FlowID: "FL_4", Autofill: [] },
    { Type: "Standard", ID: BL.overview, FlowID: "FL_7", Autofill: [] },
    { Type: "Standard", ID: BL.background, FlowID: "FL_9", Autofill: [] },
    { Type: "Standard", ID: BL.activity, FlowID: "FL_10", Autofill: [] },
    { Type: "Standard", ID: BL.policy, FlowID: "FL_11", Autofill: [] },
    { Type: "Standard", ID: BL.prechat, FlowID: "FL_15", Autofill: [] },
    { Type: "Standard", ID: BL.chat, FlowID: "FL_16", Autofill: [] },
    { Type: "Standard", ID: BL.postchat, FlowID: "FL_17", Autofill: [] },
    { Type: "Standard", ID: BL.allocation, FlowID: "FL_18", Autofill: [] },
    { Type: "Standard", ID: BL.exit, FlowID: "FL_19", Autofill: [] },
    { Type: "EndSurvey", FlowID: "FL_20" },
  ],
  Properties: {
    Count: 0,
    RemovedFieldsets: [],
  },
};
flow.Properties.Count = flow.Flow.length;

const qsf = {
  SurveyEntry: {
    SurveyID: SURVEY_ID,
    SurveyName: "Reflective AI Qualtrics Survey Shell",
    SurveyDescription: "Importable shell for the reflective AI chatbot study.",
    SurveyOwnerID: null,
    SurveyBrandID: null,
    DivisionID: null,
    SurveyLanguage: "EN",
    SurveyActiveResponseSet: RESPONSE_SET_ID,
    SurveyStatus: "Inactive",
    SurveyStartDate: "0000-00-00 00:00:00",
    SurveyExpirationDate: "0000-00-00 00:00:00",
    SurveyCreationDate: "2026-06-05 00:00:00",
    CreatorID: null,
    LastModified: "2026-06-05 00:00:00",
    LastAccessed: "0000-00-00 00:00:00",
    LastActivated: "0000-00-00 00:00:00",
    Deleted: null,
  },
  SurveyElements: [
    {
      SurveyID: SURVEY_ID,
      Element: "BL",
      PrimaryAttribute: "Survey Blocks",
      SecondaryAttribute: null,
      TertiaryAttribute: null,
      Payload: blocks,
    },
    {
      SurveyID: SURVEY_ID,
      Element: "FL",
      PrimaryAttribute: "Survey Flow",
      SecondaryAttribute: null,
      TertiaryAttribute: null,
      Payload: flow,
    },
    {
      SurveyID: SURVEY_ID,
      Element: "SO",
      PrimaryAttribute: "Survey Options",
      SecondaryAttribute: null,
      TertiaryAttribute: null,
      Payload: {
        BackButton: "false",
        SaveAndContinue: "true",
        SurveyProtection: "PublicSurvey",
        BallotBoxStuffingPrevention: "false",
        NoIndex: "Yes",
        SecureResponseFiles: "true",
        SurveyExpiration: "None",
        SurveyTermination: "DisplayMessage",
        Header: "",
        Footer: "",
        ProgressBarDisplay: "None",
        PartialData: "+1 week",
        ValidationMessage: "",
        PreviousButton: "Back",
        NextButton: "Continue",
        SkinLibrary: "qualtrics",
        SkinType: "templated",
        Skin: { templateId: "*2014" },
        NewScoring: 1,
        ProtectSelectionIds: true,
        ShowExportTags: "true",
        CollectGeoLocation: "false",
        SurveyTitle: "Reflective AI Study",
        SurveyMetaDescription: "Reflective AI Study",
        PasswordProtection: "No",
        AnonymizeResponse: "No",
        ResponseSummary: "No",
        EmailThankYou: "false",
        ValidateMessage: "true",
        PartialDataCloseAfter: "SurveyStart",
        AvailableLanguages: { EN: [] },
      },
    },
    {
      SurveyID: SURVEY_ID,
      Element: "SCO",
      PrimaryAttribute: "Scoring",
      SecondaryAttribute: null,
      TertiaryAttribute: null,
      Payload: {
        ScoringCategories: [],
        ScoringCategoryGroups: [],
        ScoringSummaryCategory: null,
        ScoringSummaryAfterQuestions: 0,
        ScoringSummaryAfterSurvey: 0,
        DefaultScoringCategory: null,
        AutoScoringCategory: null,
      },
    },
    {
      SurveyID: SURVEY_ID,
      Element: "PROJ",
      PrimaryAttribute: "CORE",
      SecondaryAttribute: null,
      TertiaryAttribute: "1.1.0",
      Payload: {
        ProjectCategory: "CORE",
        SchemaVersion: "1.1.0",
      },
    },
    {
      SurveyID: SURVEY_ID,
      Element: "STAT",
      PrimaryAttribute: "Survey Statistics",
      SecondaryAttribute: null,
      TertiaryAttribute: null,
      Payload: {
        MobileCompatible: true,
        ID: "Survey Statistics",
      },
    },
    {
      SurveyID: SURVEY_ID,
      Element: "QC",
      PrimaryAttribute: "Survey Question Count",
      SecondaryAttribute: String(questions.length),
      TertiaryAttribute: null,
      Payload: null,
    },
    {
      SurveyID: SURVEY_ID,
      Element: "RS",
      PrimaryAttribute: RESPONSE_SET_ID,
      SecondaryAttribute: "Default Response Set",
      TertiaryAttribute: null,
      Payload: null,
    },
    ...questions,
  ],
};

writeFileSync(join(root, "reflective-ai-survey-shell.qsf"), `${JSON.stringify(qsf)}\n`);

const readme = `# Reflective AI Qualtrics Artifacts

This directory contains a Qualtrics-importable survey shell and separate custom JavaScript snippets for the fragile pieces of the study.

## Files

- \`reflective-ai-survey-shell.qsf\`: import this single file into Qualtrics. Custom JavaScript stays in separate post-import snippets so the QSF remains import-safe.
- \`snippets/01-embedded-data-setup.js\`: captures Prolific URL params, initializes export fields, and assigns/persists treatment/control condition when it is not pre-seeded.
- \`snippets/02-recaptcha-v3.js\`: gets an invisible reCAPTCHA v3 token for action \`study_overview\`.
- \`snippets/03-typing-telemetry.js\`: stores timing metadata for the typing check.
- \`snippets/04-attention-check.js\`: stores \`attention_pass\`.
- \`snippets/05-prechat-routing.js\`: copies selected political/activity answers into embedded data, prefers typed \`Other\` topics, sets the chatbot topic by condition, and preserves condition assignment audit metadata.
- \`snippets/06-chatbot-mount.js\`: mounts the chatbot, passes condition assignment metadata to the backend, hides the Qualtrics Next button until chat completion, and writes conversation timing metadata.
- \`snippets/07-motive-total.js\`: requires the motive attribution form to total exactly 100.
- \`snippets/08-allocation.js\`: randomizes Democrat/Republican label order, hides Next until the slider is touched, and stores the $4.00 allocation.
- \`snippets/09-comprehension-check.js\`: stores \`comprehension_pass\` for the study overview comprehension item.

The import-safe QSF should remain free of embedded \`QuestionJS\` and Survey Flow \`WebService\` elements. Install the snippets after import on the mapped QIDs documented in \`README.md\` and \`docs/qualtrics.md\`.

## Post-Import Snippet Installation Map

- \`QID3\`: \`snippets/01-embedded-data-setup.js\`
- \`QID4\`: \`snippets/02-recaptcha-v3.js\`
- \`QID5\`: \`snippets/09-comprehension-check.js\`
- \`QID6\`: \`snippets/03-typing-telemetry.js\`
- \`QID7\`: \`snippets/04-attention-check.js\`
- \`QID23\`: \`snippets/05-prechat-routing.js\`
- \`QID24\`: \`snippets/06-chatbot-mount.js\`
- \`QID30\`: \`snippets/07-motive-total.js\`
- \`QID31\`: \`snippets/08-allocation.js\`

Machine-readable copy: \`snippets/manifest.json\`.

## Placeholders To Replace

- \`{{CONSENT_HTML}}\`
- \`{{STUDY_OVERVIEW_HTML}}\`
- \`{{AI_TOOL_NAME}}\`
- \`{{BACKEND_HOST}}\`
- \`{{RECAPTCHA_SITE_KEY}}\`
- \`{{PAYMENT_RECEIPT_HTML}}\`
- \`{{PROLIFIC_COMPLETION_CODE}}\`

Keep \`RECAPTCHA_SECRET\` only on the backend. Do not place the secret in browser JavaScript or the import-safe QSF.
Replace \`{{BACKEND_HOST}}\` in the chatbot snippet with the deployed backend host before launch.

## Survey Flow Notes

The embedded-data setup snippet initializes all export fields at the start. It then captures Prolific identifiers and assigns a browser-side 50/50 \`condition\` if Qualtrics has not already pre-seeded \`treatment\` or \`control\`. The pre-chat routing and chatbot mount snippets preserve a final fallback that reuses browser-session assignment or browser-randomizes treatment/control 50/50 if condition Embedded Data is unavailable, then writes \`condition_assignment_source\` and \`condition_assigned_at\` for export auditability. Add Qualtrics-native consent routing after import so non-consent does not depend on browser JavaScript.

The pre-chat page writes:

- \`political_topic\`, \`political_stance\`, \`political_strength\`
- \`activity_topic\`, \`activity_stance\`, \`activity_strength\`
- \`political_topic_other\`, \`activity_topic_other\`
- \`topic\`, \`stance\`, \`strength_score\`
- \`chat_topic_type\`

For treatment, the chatbot receives the political values. For control, it receives the activity/hobby values and avoids political or reflective mechanisms while targeting the same 8-10 user-turn length. Post-chat political outcomes always pipe \`political_topic\`.

## Import QA

After importing into a Qualtrics sandbox:

1. Preview with \`?PROLIFIC_PID=test123&STUDY_ID=study123&SESSION_ID=session123\` and confirm \`prolific_pid\`, \`prolific_study_id\`, \`prolific_session_id\`, and \`respondent_id\`.
2. Confirm the assignment snippet produces both \`treatment\` and \`control\`, or that pre-seeded Qualtrics Embedded Data is respected.
3. Confirm the backend \`/api/recaptcha/verify\` response maps score, success, action, hostname, and pass/fail fields into Embedded Data.
4. Confirm treatment chats route political topics and control chats route activity/hobby topics, including typed \`Other\` values.
5. Confirm the chatbot hides Next until completion and writes \`conversation_id\`, \`chat_turn_count\`, \`completion_reason\`, duration fields, and \`transcript_url\`.
6. Complete a test response and inspect all embedded data columns.
`;

writeFileSync(join(root, "README.md"), readme);
