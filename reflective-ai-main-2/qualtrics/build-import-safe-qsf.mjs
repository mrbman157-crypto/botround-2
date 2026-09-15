import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const qsfPath = join(root, "reflective-ai-survey-shell.qsf");
const qsf = JSON.parse(readFileSync(qsfPath, "utf8"));

qsf.SurveyEntry = {
  ...qsf.SurveyEntry,
  SurveyID: "SV_8hR4nKp2LmQ7zXa",
  SurveyOwnerID: null,
  SurveyBrandID: null,
  CreatorID: null,
  SurveyActiveResponseSet: "RS_5uKqT9aLm3ZxP2B",
};

for (const element of qsf.SurveyElements) {
  element.SurveyID = qsf.SurveyEntry.SurveyID;
  if (element.Element === "SQ" && element.Payload) {
    delete element.Payload.QuestionJS;
  }
}

const flowElement = qsf.SurveyElements.find((element) => element.Element === "FL");
const blocksElement = qsf.SurveyElements.find((element) => element.Element === "BL");
const studyBlock = Object.values(blocksElement.Payload).find(
  (block) => block.Description === "Reflective AI Study Shell",
);
flowElement.Payload.Flow = [
  {
    Type: "Standard",
    ID: studyBlock.ID,
    FlowID: "FL_2",
    Autofill: [],
  },
];

const surveyOptions = qsf.SurveyElements.find((element) => element.Element === "SO");
if (surveyOptions?.Payload) {
  surveyOptions.Payload.EOSRedirectURL = "";
  surveyOptions.Payload.EOSMessage = "";
  surveyOptions.Payload.EOSMessageLibrary = "";
  surveyOptions.Payload.SkinLibrary = "qualtrics";
  surveyOptions.Payload.SurveyTitle = "Reflective AI Survey Shell";
  surveyOptions.Payload.SurveyMetaDescription = "Importable shell for the reflective AI chatbot study.";
  surveyOptions.Payload.RecaptchaV3 = "false";
  surveyOptions.Payload.ConfirmStart = false;
  surveyOptions.Payload.AutoConfirmStart = false;
}

flowElement.Payload.Properties.Count = flowElement.Payload.Flow.length + 1;

writeFileSync(qsfPath, `${JSON.stringify(qsf)}\n`);

const readme = `# Reflective AI Qualtrics Artifacts

## Upload File

Upload only \`reflective-ai-survey-shell.qsf\` to Qualtrics.

This is an import-safe single-file survey shell. It intentionally contains no \`QuestionJS\` and no Survey Flow \`WebService\` element, because those were the likely causes of Qualtrics project creation failures.

## What Is Included In The QSF

- Consent placeholder: \`{{CONSENT_HTML}}\`
- Study overview placeholder: \`{{STUDY_OVERVIEW_HTML}}\`
- Background, activity, political issue, post-chat, motive attribution, and allocation questions
- Hidden pre-chat routing hook and participant-facing chatbot page placeholder
- Control-ready activity/hobby setup and treatment political setup
- Post-chat transition before political outcome questions

## What Is Deferred Until After Import

These pieces are not embedded in the upload QSF so Qualtrics can create the project:

- Chatbot mount JavaScript
- Invisible reCAPTCHA v3 JavaScript and backend `/api/recaptcha/verify` verification mapping
- Typing telemetry JavaScript
- Attention-check pass/fail JavaScript
- Motive-total JavaScript validation
- Allocation label-order randomization and computed embedded data
- Prolific URL parameter fallback JavaScript for participant, study, and session IDs
- Browser-side treatment/control assignment when condition is not pre-seeded
- Pre-chat routing that prefers typed \`Other\` topic text, writes \`chat_topic_type\`, and preserves condition assignment audit metadata
- Chatbot condition assignment metadata handoff, completion gating, transcript metadata writes, and timing/duration exports
- Post-chat widget Embedded Data defaults for \`motive_total\`, \`allocation_label_order\`, \`allocation_democrat\`, \`allocation_republican\`, and \`allocation_interacted\`

Treatment chats use the reflective political prompt. Control chats use the selected hobby or interest, avoid political and reflective mechanisms, and target the same 8-10 user-turn conversation length.

If condition Embedded Data is unavailable at chatbot mount time, the post-import chatbot embed reuses the browser-session assignment or browser-randomizes treatment/control 50/50, then writes \`condition\`, \`condition_assignment_source\`, and \`condition_assigned_at\` back to Embedded Data before creating the backend conversation.

Audit/post-import snippets remain in \`snippets/\`. They are not upload dependencies.

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

## Remaining Placeholders

- \`{{CONSENT_HTML}}\`
- \`{{STUDY_OVERVIEW_HTML}}\`
- \`{{AI_TOOL_NAME}}\`
- \`{{BACKEND_HOST}}\`
- \`{{PAYMENT_RECEIPT_HTML}}\`
- \`{{PROLIFIC_COMPLETION_CODE}}\`

\`{{RECAPTCHA_SITE_KEY}}\` is intentionally absent from the import-safe QSF. Add the site key only to the post-import browser snippet after the project imports successfully. Keep \`RECAPTCHA_SECRET\` backend-only; never add the secret to the QSF, browser JavaScript, or Qualtrics-visible placeholder text.
Replace \`{{BACKEND_HOST}}\` in the chatbot snippet with the deployed backend host before launch.
`;

writeFileSync(join(root, "README.md"), readme);
