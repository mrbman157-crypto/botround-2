const state = {
  conversationId: "",
  isComplete: false,
  openingMessage: "",
};

const CONVERSATION_STORAGE_KEYS = ["reflective_sandbox.conversation_id"];
const LEGACY_CONVERSATION_STORAGE_PREFIXES = ["reflective_chatbot.active_conversation_id"];

const el = {
  modelLabel: document.getElementById("model-label"),
  newConversation: document.getElementById("new-conversation"),
  setupPanel: document.getElementById("setup-panel"),
  setupForm: document.getElementById("setup-form"),
  setupSubmit: document.getElementById("setup-submit"),
  conditionInput: document.getElementById("condition-input"),
  topicInput: document.getElementById("topic-input"),
  stanceInput: document.getElementById("stance-input"),
  strengthInput: document.getElementById("strength-input"),
  setupError: document.getElementById("setup-error"),
  chatPanel: document.getElementById("chat-panel"),
  contextLine: document.getElementById("context-line"),
  messages: document.getElementById("messages"),
  completionBanner: document.getElementById("completion-banner"),
  messageForm: document.getElementById("message-form"),
  messageInput: document.getElementById("message-input"),
  chatStatus: document.getElementById("chat-status"),
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(data.detail || `Request failed: ${response.status}`);
  }
  return data;
}

function setBusy(form, busy) {
  form.setAttribute("aria-busy", String(busy));
  for (const button of form.querySelectorAll("button")) {
    button.disabled = busy;
  }
}

function setComposerEnabled(enabled) {
  el.messageInput.disabled = !enabled;
  for (const button of el.messageForm.querySelectorAll("button")) {
    button.disabled = !enabled;
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInlineMarkdown(value) {
  let html = escapeHtml(value);
  html = html.replace(/\*\*\*([^*\n][\s\S]*?[^*\n])\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*([^*\n][\s\S]*?[^*\n])\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*\n][\s\S]*?[^*\n])\*/g, "<em>$1</em>");
  html = html.replace(/___([^_\n][\s\S]*?[^_\n])___/g, "<strong><em>$1</em></strong>");
  html = html.replace(/__([^_\n][\s\S]*?[^_\n])__/g, "<strong>$1</strong>");
  html = html.replace(/(^|[\s(])_([^_\n][\s\S]*?[^_\n])_(?=$|[\s).,!?:;])/g, "$1<em>$2</em>");
  return html;
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    el.messages.scrollTop = el.messages.scrollHeight;
    requestAnimationFrame(() => {
      el.messages.scrollTop = el.messages.scrollHeight;
    });
  });
}

function renderMessage(message) {
  const item = document.createElement("div");
  item.className = `message ${message.role}`;
  item.innerHTML = renderInlineMarkdown(message.content || "");
  el.messages.appendChild(item);
  scrollToBottom();
  return item;
}

function renderTypingBubble() {
  const item = document.createElement("div");
  item.className = "message assistant typing";
  item.setAttribute("aria-label", "Assistant is thinking");
  item.innerHTML = `
    <span class="typing-label">Thinking</span>
    <span class="typing-dots" aria-hidden="true">
      <span></span>
      <span></span>
      <span></span>
    </span>
  `;
  el.messages.appendChild(item);
  scrollToBottom();
  return item;
}

function setupValidationMessage() {
  if (!el.topicInput.value.trim()) return "Add a topic before starting the chat.";
  if (!el.stanceInput.value.trim()) {
    return "Add your view or preference before starting the chat.";
  }
  if (!el.strengthInput.value.trim()) {
    return "Add a strength or enjoyment score from 0 to 100 before starting the chat.";
  }
  if (!el.strengthInput.validity.valid) {
    return "Strength or enjoyment must be a whole number from 0 to 100.";
  }
  return "";
}

function renderConversation(conversation) {
  const setup = conversation.conversation_state || {};
  state.conversationId = conversation.conversation_id || "";
  state.isComplete = Boolean(conversation.completed_at);
  state.openingMessage = conversation.opening_message || state.openingMessage;

  el.setupPanel.hidden = true;
  el.chatPanel.hidden = false;
  el.contextLine.textContent = `Condition: ${setup.condition || "treatment"} | Topic: ${setup.topic_raw || ""} | Stance/preference: ${setup.stance_raw || ""} | Strength/enjoyment: ${setup.strength_score ?? ""}/100`;
  el.messages.innerHTML = "";

  if (state.openingMessage && !(conversation.messages || []).length) {
    renderMessage({ role: "assistant", content: state.openingMessage });
  }
  for (const message of conversation.messages || []) {
    renderMessage(message);
  }
  setComposerEnabled(!state.isComplete);
  if (state.isComplete) {
    el.completionBanner.hidden = false;
    el.chatStatus.textContent = "";
  } else {
    el.completionBanner.hidden = true;
    el.chatStatus.textContent = "";
  }
  scrollToBottom();
}

function clearStoredConversationArtifacts() {
  try {
    for (const key of CONVERSATION_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
    }

    const legacyKeys = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (
        key &&
        LEGACY_CONVERSATION_STORAGE_PREFIXES.some(
          (prefix) => key === prefix || key.startsWith(`${prefix}.`),
        )
      ) {
        legacyKeys.push(key);
      }
    }
    for (const key of legacyKeys) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Storage can be unavailable in restricted browser modes.
  }
}

function resetConversation() {
  state.conversationId = "";
  state.isComplete = false;
  clearStoredConversationArtifacts();
  el.setupForm.reset();
  el.setupPanel.hidden = false;
  el.chatPanel.hidden = true;
  el.contextLine.textContent = "";
  el.completionBanner.hidden = true;
  el.setupError.textContent = "";
  el.chatStatus.textContent = "";
  el.messages.innerHTML = "";
  el.messageInput.value = "";
  setComposerEnabled(true);
  el.topicInput.focus();
}

async function loadMe() {
  const data = await api("/api/me");
  state.openingMessage = data.opening_message || "";
  el.modelLabel.textContent = data.chat_model ? `Model: ${data.chat_model}` : "";
}

el.setupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  el.setupError.textContent = "";
  const validationMessage = setupValidationMessage();
  if (validationMessage) {
    el.setupError.textContent = validationMessage;
    el.setupForm.reportValidity();
    return;
  }
  setBusy(el.setupForm, true);
  el.setupSubmit.textContent = "Starting...";
  try {
    const conversation = await api("/api/conversations", {
      method: "POST",
      body: JSON.stringify({
        survey: {
          condition: el.conditionInput.value,
          topic: el.topicInput.value,
          stance: el.stanceInput.value,
          strength_score: el.strengthInput.value,
        },
      }),
    });
    renderConversation(conversation);
    el.messageInput.focus();
  } catch (error) {
    el.setupError.textContent = error.message || "Failed to start conversation.";
  } finally {
    setBusy(el.setupForm, false);
    el.setupSubmit.textContent = "Start chat";
  }
});

for (const input of [el.topicInput, el.stanceInput, el.strengthInput]) {
  input.addEventListener("input", () => {
    if (el.setupError.textContent) {
      el.setupError.textContent = setupValidationMessage();
    }
  });
}

el.messageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const content = el.messageInput.value.trim();
  if (!content || !state.conversationId || state.isComplete) return;
  el.chatStatus.textContent = "";
  el.messageInput.value = "";
  renderMessage({ role: "user", content });
  const typingBubble = renderTypingBubble();
  setBusy(el.messageForm, true);
  try {
    const conversation = await api(
      `/api/conversations/${encodeURIComponent(state.conversationId)}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      },
    );
    renderConversation(conversation);
    el.chatStatus.textContent = "";
    el.messageInput.focus();
  } catch (error) {
    typingBubble.remove();
    el.chatStatus.textContent = error.message || "Failed to send message.";
    scrollToBottom();
  } finally {
    if (state.isComplete) {
      setComposerEnabled(false);
    } else {
      setBusy(el.messageForm, false);
    }
  }
});

el.newConversation.addEventListener("click", resetConversation);

loadMe()
  .then(resetConversation)
  .catch((error) => {
    el.setupError.textContent = error.message || "Failed to initialize app.";
  });
