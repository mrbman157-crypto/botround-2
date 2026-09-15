(function () {
  "use strict";

  const DEFAULT_CONFIG = {
    apiBase: "",
    topic: "",
    stance: "",
    strengthScore: "",
    condition: "",
    conditionAssignmentSource: "",
    conditionAssignedAt: "",
    respondentId: "",
    topicEmbeddedData: "topic",
    stanceEmbeddedData: "stance",
    strengthScoreEmbeddedData: "strength_score",
    conditionEmbeddedData: "condition",
    conditionAssignmentSourceEmbeddedData: "condition_assignment_source",
    conditionAssignedAtEmbeddedData: "condition_assigned_at",
    respondentIdEmbeddedData: "respondent_id",
    topicSelector: "",
    stanceSelector: "",
    strengthScoreSelector: "",
    conditionSelector: "",
    conditionAssignmentSourceSelector: "",
    conditionAssignedAtSelector: "",
    respondentIdSelector: "",
    requireCompletion: true,
    storagePrefix: "reflective_qualtrics.conversation_id",
    respondentStorageKey: "reflective_qualtrics.respondent_id",
    conditionStorageKey: "reflective_qualtrics.condition",
    conditionAssignedAtStorageKey: "reflective_qualtrics.condition_assigned_at",
    embeddedData: {
      conversationId: "conversation_id",
      chatCompleted: "chat_completed",
      chatTurnCount: "chat_turn_count",
      chatMinUserTurns: "chat_min_user_turns",
      chatMaxUserTurns: "chat_max_user_turns",
      completionReason: "completion_reason",
      chatStartedAt: "chat_started_at",
      chatCompletedAt: "chat_completed_at",
      chatDurationMs: "chat_duration_ms",
      transcriptUrl: "transcript_url",
    },
  };

  function mergeConfig(config) {
    const embeddedData = {
      ...DEFAULT_CONFIG.embeddedData,
      ...((config && config.embeddedData) || {}),
    };
    return { ...DEFAULT_CONFIG, ...(config || {}), embeddedData };
  }

  function normalizeText(value) {
    return String(value == null ? "" : value).trim().replace(/\s+/g, " ");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function currentScriptConfig() {
    const script = document.currentScript;
    if (!script || !script.dataset) return {};
    let scriptOrigin = "";
    if (script.src) {
      try {
        scriptOrigin = new URL(script.src).origin;
      } catch {
        scriptOrigin = "";
      }
    }
    return {
      apiBase: script.dataset.apiBase || scriptOrigin,
      topic: script.dataset.topic || "",
      stance: script.dataset.stance || "",
      strengthScore: script.dataset.strengthScore || "",
      condition: script.dataset.condition || "",
      conditionAssignmentSource: script.dataset.conditionAssignmentSource || "",
      conditionAssignedAt: script.dataset.conditionAssignedAt || "",
      respondentId: script.dataset.respondentId || "",
      topicEmbeddedData: script.dataset.topicEmbeddedData || DEFAULT_CONFIG.topicEmbeddedData,
      stanceEmbeddedData: script.dataset.stanceEmbeddedData || DEFAULT_CONFIG.stanceEmbeddedData,
      strengthScoreEmbeddedData:
        script.dataset.strengthScoreEmbeddedData || DEFAULT_CONFIG.strengthScoreEmbeddedData,
      conditionEmbeddedData:
        script.dataset.conditionEmbeddedData || DEFAULT_CONFIG.conditionEmbeddedData,
      conditionAssignmentSourceEmbeddedData:
        script.dataset.conditionAssignmentSourceEmbeddedData ||
        DEFAULT_CONFIG.conditionAssignmentSourceEmbeddedData,
      conditionAssignedAtEmbeddedData:
        script.dataset.conditionAssignedAtEmbeddedData || DEFAULT_CONFIG.conditionAssignedAtEmbeddedData,
      respondentIdEmbeddedData:
        script.dataset.respondentIdEmbeddedData || DEFAULT_CONFIG.respondentIdEmbeddedData,
      topicSelector: script.dataset.topicSelector || "",
      stanceSelector: script.dataset.stanceSelector || "",
      strengthScoreSelector: script.dataset.strengthScoreSelector || "",
      conditionSelector: script.dataset.conditionSelector || "",
      conditionAssignmentSourceSelector: script.dataset.conditionAssignmentSourceSelector || "",
      conditionAssignedAtSelector: script.dataset.conditionAssignedAtSelector || "",
      respondentIdSelector: script.dataset.respondentIdSelector || "",
      requireCompletion: script.dataset.requireCompletion !== "false",
    };
  }

  function getSessionValue(key) {
    try {
      return window.sessionStorage.getItem(key) || "";
    } catch {
      return "";
    }
  }

  function setSessionValue(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      // Qualtrics preview or privacy modes may block session storage.
    }
  }

  function removeSessionValue(key) {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // Qualtrics preview or privacy modes may block session storage.
    }
  }

  function randomId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `qualtrics-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function resolveValue(value) {
    return normalizeText(typeof value === "function" ? value() : value);
  }

  function getRespondentId(config) {
    const configured = readConfiguredValue(
      config,
      "respondentId",
      "respondentIdEmbeddedData",
      "respondentIdSelector",
    );
    if (configured) return configured;
    const existing = getSessionValue(config.respondentStorageKey);
    if (existing) return existing;
    const generated = randomId();
    setSessionValue(config.respondentStorageKey, generated);
    return generated;
  }

  function isValidCondition(value) {
    return value === "treatment" || value === "control";
  }

  function getCondition(config) {
    let condition = normalizeText(
      readConfiguredValue(config, "condition", "conditionEmbeddedData", "conditionSelector"),
    ).toLowerCase();
    let conditionAssignmentSource = readConfiguredValue(
      config,
      "conditionAssignmentSource",
      "conditionAssignmentSourceEmbeddedData",
      "conditionAssignmentSourceSelector",
    );
    let conditionAssignedAt = readConfiguredValue(
      config,
      "conditionAssignedAt",
      "conditionAssignedAtEmbeddedData",
      "conditionAssignedAtSelector",
    );

    if (isValidCondition(condition)) {
      if (!conditionAssignmentSource) conditionAssignmentSource = "preseeded_embedded_data";
    } else {
      condition = normalizeText(getSessionValue(config.conditionStorageKey)).toLowerCase();
      conditionAssignedAt = getSessionValue(config.conditionAssignedAtStorageKey);
      if (isValidCondition(condition)) {
        conditionAssignmentSource = "session_storage";
      }
    }

    if (!isValidCondition(condition)) {
      condition = Math.random() < 0.5 ? "treatment" : "control";
      conditionAssignmentSource = "browser_randomized";
      conditionAssignedAt = new Date().toISOString();
      setSessionValue(config.conditionStorageKey, condition);
      setSessionValue(config.conditionAssignedAtStorageKey, conditionAssignedAt);
    }

    if (!conditionAssignedAt) conditionAssignedAt = new Date().toISOString();

    return {
      condition,
      conditionAssignmentSource,
      conditionAssignedAt,
    };
  }

  function hashString(value) {
    let hash = 0;
    const text = normalizeText(value);
    for (let index = 0; index < text.length; index += 1) {
      hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
    }
    return Math.abs(hash).toString(36);
  }

  function getConversationSetup(config, conditionContext) {
    return {
      condition: conditionContext.condition,
      topic: readConfiguredValue(config, "topic", "topicEmbeddedData", "topicSelector"),
      stance: readConfiguredValue(config, "stance", "stanceEmbeddedData", "stanceSelector"),
      strengthScore: readConfiguredValue(
        config,
        "strengthScore",
        "strengthScoreEmbeddedData",
        "strengthScoreSelector",
      ),
      conditionAssignmentSource: conditionContext.conditionAssignmentSource,
      conditionAssignedAt: conditionContext.conditionAssignedAt,
    };
  }

  function storageKey(config, respondentId, setup) {
    const context = hashString(
      [setup.condition, setup.topic, setup.stance, setup.strengthScore].join("|"),
    );
    return `${config.storagePrefix}.${respondentId || "anonymous"}.${setup.condition}.${context}`;
  }

  function getQualtricsApi(config) {
    if (config.qualtrics) return config.qualtrics;
    if (window.Qualtrics && window.Qualtrics.SurveyEngine) {
      return window.Qualtrics.SurveyEngine;
    }
    return null;
  }

  function readEmbeddedData(config, fieldName) {
    const qualtrics = getQualtricsApi(config);
    if (!fieldName || !qualtrics || typeof qualtrics.getEmbeddedData !== "function") {
      return "";
    }
    return normalizeText(qualtrics.getEmbeddedData(fieldName));
  }

  function readSelectorValue(selector) {
    if (!selector) return "";
    const element = document.querySelector(selector);
    if (!element) return "";
    if ("value" in element) return normalizeText(element.value);
    return normalizeText(element.textContent);
  }

  function readConfiguredValue(config, directName, embeddedDataName, selectorName) {
    return (
      resolveValue(config[directName]) ||
      readEmbeddedData(config, config[embeddedDataName]) ||
      readSelectorValue(config[selectorName])
    );
  }

  function setEmbeddedData(config, key, value) {
    const qualtrics = getQualtricsApi(config);
    if (!qualtrics || typeof qualtrics.setEmbeddedData !== "function") return;
    qualtrics.setEmbeddedData(key, String(value == null ? "" : value));
  }

  function lockNextButton(config) {
    if (!config.requireCompletion || !config.question) return;
    if (typeof config.question.hideNextButton === "function") {
      config.question.hideNextButton();
    }
  }

  function unlockNextButton(config) {
    if (!config.requireCompletion || !config.question) return;
    if (typeof config.question.showNextButton === "function") {
      config.question.showNextButton();
    }
  }

  function mountContainer(config) {
    if (config.container) return config.container;
    if (config.mountSelector) {
      const selected = document.querySelector(config.mountSelector);
      if (selected) return selected;
    }
    if (config.question && typeof config.question.getQuestionContainer === "function") {
      return config.question.getQuestionContainer();
    }
    return document.body;
  }

  function renderShell(root) {
    root.innerHTML = `
      <div class="reflective-qualtrics-chat" data-reflective-chat>
        <div class="reflective-qualtrics-chat__messages" data-role="messages" aria-live="polite"></div>
        <form class="reflective-qualtrics-chat__form" data-role="form">
          <input
            class="reflective-qualtrics-chat__input"
            data-role="input"
            autocomplete="off"
            placeholder="Type your reply..."
            required
          />
          <button class="reflective-qualtrics-chat__button" type="submit">Send</button>
        </form>
        <div class="reflective-qualtrics-chat__status" data-role="status"></div>
      </div>
    `;
    const styleId = "reflective-qualtrics-chat-style";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .reflective-qualtrics-chat {
          display: grid;
          grid-template-rows: minmax(320px, 52vh) auto auto;
          gap: 12px;
          width: 100%;
          color: #1f2933;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .reflective-qualtrics-chat__messages {
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow-y: auto;
          border: 1px solid #d7d9de;
          border-radius: 8px;
          padding: 12px;
          background: #ffffff;
        }
        .reflective-qualtrics-chat__message {
          width: min(76%, 680px);
          border: 1px solid #d7d9de;
          border-radius: 8px;
          padding: 11px 13px;
          line-height: 1.45;
          white-space: pre-wrap;
        }
        .reflective-qualtrics-chat__message--user {
          align-self: flex-end;
          background: #e8f1f0;
        }
        .reflective-qualtrics-chat__message--assistant {
          align-self: flex-start;
          background: #ffffff;
        }
        .reflective-qualtrics-chat__form {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
        }
        .reflective-qualtrics-chat__input {
          min-height: 42px;
          width: 100%;
          border: 1px solid #d7d9de;
          border-radius: 6px;
          padding: 9px 11px;
          font: inherit;
        }
        .reflective-qualtrics-chat__button {
          min-height: 42px;
          border: 1px solid #2f6f6d;
          border-radius: 6px;
          background: #2f6f6d;
          color: #ffffff;
          cursor: pointer;
          font: inherit;
          font-weight: 650;
          padding: 0 16px;
        }
        .reflective-qualtrics-chat__button:disabled,
        .reflective-qualtrics-chat__input:disabled {
          cursor: wait;
          opacity: 0.65;
        }
        .reflective-qualtrics-chat__status {
          min-height: 20px;
          color: #667085;
          font-size: 14px;
        }
        @media (max-width: 760px) {
          .reflective-qualtrics-chat {
            grid-template-rows: minmax(280px, 55vh) auto auto;
          }
          .reflective-qualtrics-chat__message {
            width: 92%;
          }
          .reflective-qualtrics-chat__form {
            grid-template-columns: 1fr;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  function queryParts(root) {
    return {
      messages: root.querySelector('[data-role="messages"]'),
      form: root.querySelector('[data-role="form"]'),
      input: root.querySelector('[data-role="input"]'),
      status: root.querySelector('[data-role="status"]'),
    };
  }

  function renderMessage(parts, message) {
    const item = document.createElement("div");
    item.className = `reflective-qualtrics-chat__message reflective-qualtrics-chat__message--${message.role}`;
    item.innerHTML = escapeHtml(message.content || "");
    parts.messages.appendChild(item);
  }

  function setBusy(parts, busy) {
    parts.input.disabled = busy;
    for (const button of parts.form.querySelectorAll("button")) {
      button.disabled = busy;
    }
  }

  function apiUrl(config, path) {
    const base = config.apiBase.replace(/\/+$/, "");
    return `${base}${path}`;
  }

  async function api(config, respondentId, path, options) {
    const response = await fetch(apiUrl(config, path), {
      credentials: "omit",
      headers: {
        "Content-Type": "application/json",
        "X-Qualtrics-Respondent-Id": respondentId,
        ...((options && options.headers) || {}),
      },
      ...(options || {}),
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    if (!response.ok) {
      throw new Error(data.detail || `Request failed: ${response.status}`);
    }
    return data;
  }

  function writeConversationMetadata(config, conversation, timing) {
    const id = conversation.conversation_id || "";
    const completed = Boolean(conversation.chat_completed || conversation.completed_at);
    const turnCount = conversation.chat_turn_count || 0;
    const minUserTurns = conversation.chat_min_user_turns || "";
    const maxUserTurns = conversation.chat_max_user_turns || "";
    const completionReason = conversation.completion_reason || "";
    const token = conversation.transcript_token || "";
    const transcriptUrl = id && token
      ? apiUrl(
          config,
          `/api/transcripts/${encodeURIComponent(id)}/${encodeURIComponent(token)}`,
        )
      : "";

    setEmbeddedData(config, config.embeddedData.conversationId, id);
    setEmbeddedData(config, config.embeddedData.chatCompleted, completed ? "true" : "false");
    setEmbeddedData(config, config.embeddedData.chatTurnCount, String(turnCount));
    setEmbeddedData(config, config.embeddedData.chatMinUserTurns, String(minUserTurns));
    setEmbeddedData(config, config.embeddedData.chatMaxUserTurns, String(maxUserTurns));
    setEmbeddedData(config, config.embeddedData.completionReason, completionReason);
    setEmbeddedData(config, config.embeddedData.transcriptUrl, transcriptUrl);
    if (timing && timing.startedAt) {
      setEmbeddedData(config, config.embeddedData.chatStartedAt, timing.startedAt);
    }
    if (completed && timing) {
      const completedAt = conversation.completed_at || new Date().toISOString();
      setEmbeddedData(config, config.embeddedData.chatCompletedAt, completedAt);
      if (timing.startedAtMs) {
        setEmbeddedData(
          config,
          config.embeddedData.chatDurationMs,
          String(Math.max(0, Date.now() - timing.startedAtMs)),
        );
      }
    }
  }

  function renderConversation(config, parts, conversation, timing) {
    parts.messages.innerHTML = "";
    if (conversation.opening_message && !(conversation.messages || []).length) {
      renderMessage(parts, { role: "assistant", content: conversation.opening_message });
    }
    for (const message of conversation.messages || []) {
      if (message.role === "user" || message.role === "assistant") {
        renderMessage(parts, message);
      }
    }
    writeConversationMetadata(config, conversation, timing);
    const completed = Boolean(conversation.chat_completed || conversation.completed_at);
    if (completed) {
      parts.status.textContent = "Conversation complete. You can continue the survey.";
      setBusy(parts, true);
      unlockNextButton(config);
    } else {
      parts.status.textContent = "";
      setBusy(parts, false);
      lockNextButton(config);
    }
    parts.messages.scrollTop = parts.messages.scrollHeight;
  }

  async function loadOrCreateConversation(config, respondentId, key, setup) {
    const existingConversationId = getSessionValue(key);
    if (existingConversationId) {
      try {
        return await api(
          config,
          respondentId,
          `/api/conversations/${encodeURIComponent(existingConversationId)}`,
        );
      } catch {
        removeSessionValue(key);
      }
    }

    const { topic, stance, strengthScore, condition } = setup;
    if (!topic || !stance || !strengthScore) {
      throw new Error("Missing topic, stance, or strength_score for the chat setup.");
    }

    const conversation = await api(config, respondentId, "/api/conversations", {
      method: "POST",
      body: JSON.stringify({
        survey: {
          topic,
          stance,
          strength_score: strengthScore,
          condition,
          condition_assignment_source: setup.conditionAssignmentSource,
          condition_assigned_at: setup.conditionAssignedAt,
        },
      }),
    });
    setSessionValue(key, conversation.conversation_id || "");
    return conversation;
  }

  async function mount(rawConfig) {
    const config = mergeConfig({ ...currentScriptConfig(), ...(rawConfig || {}) });
    const respondentId = getRespondentId(config);
    const conditionContext = getCondition(config);
    const setup = getConversationSetup(config, conditionContext);
    setEmbeddedData(config, config.conditionEmbeddedData, setup.condition);
    setEmbeddedData(config, config.conditionAssignmentSourceEmbeddedData, setup.conditionAssignmentSource);
    setEmbeddedData(config, config.conditionAssignedAtEmbeddedData, setup.conditionAssignedAt);
    const key = storageKey(config, respondentId, setup);
    const startedAtKey = `${key}.started_at`;
    let startedAt = getSessionValue(startedAtKey);
    if (!startedAt) {
      startedAt = new Date().toISOString();
      setSessionValue(startedAtKey, startedAt);
    }
    const startedAtMs = Date.parse(startedAt) || Date.now();
    const timing = { startedAt, startedAtMs };
    const root = document.createElement("div");
    mountContainer(config).appendChild(root);
    renderShell(root);
    const parts = queryParts(root);

    lockNextButton(config);
    setBusy(parts, true);
    parts.status.textContent = "Starting conversation...";

    if (!config.apiBase) {
      parts.status.textContent = "Chat backend URL is missing.";
      throw new Error("Reflective chatbot apiBase is required.");
    }

    let conversation;
    try {
      conversation = await loadOrCreateConversation(config, respondentId, key, setup);
    } catch (error) {
      parts.status.textContent = error.message || "Failed to start conversation.";
      throw error;
    }
    renderConversation(config, parts, conversation, timing);

    parts.form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const content = normalizeText(parts.input.value);
      if (!content || !conversation.conversation_id || conversation.completed_at) return;
      parts.input.value = "";
      renderMessage(parts, { role: "user", content });
      parts.status.textContent = "Waiting for reply...";
      setBusy(parts, true);
      try {
        conversation = await api(
          config,
          respondentId,
          `/api/conversations/${encodeURIComponent(conversation.conversation_id)}/messages`,
          {
            method: "POST",
            body: JSON.stringify({ content }),
          },
        );
        renderConversation(config, parts, conversation, timing);
      } catch (error) {
        parts.status.textContent = error.message || "Failed to send message.";
        setBusy(parts, false);
      }
    });

    return {
      conversationId: conversation.conversation_id || "",
      respondentId,
      root,
    };
  }

  window.ReflectiveQualtricsChatbot = {
    mount,
  };
})();
