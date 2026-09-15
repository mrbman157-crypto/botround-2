# Reflective Sandbox

This repository contains one Flask app: a sandbox chat interface for testing a fixed reflective-dialogue system prompt.

## Project Layout

- `webapp/`: Flask API, SQLite persistence, fixed prompt, and static frontend.
- `data/`: local runtime data. SQLite and generated JSONL files are ignored.
- `tests/`: focused sandbox API tests and LLM client tests.

## Prerequisites

- Python 3.10+
- OpenRouter credentials in your shell or a local `.env` file:

```bash
OPENROUTER_API_KEY=your_key_here
OPENROUTER_API_BASE=https://openrouter.ai/api/v1
```

Live requests use `CHAT_MODEL` when set, otherwise they default to `google/gemini-3.1-flash-lite-preview`.

## Run

Install dependencies:

```bash
python3 -m pip install -r requirements.txt
```

Start the server:

```bash
python3 -m webapp
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000).

## Behavior

The app has a single screen. A user enters:

- topic
- stance
- strength from 0 to 100

The server stores that setup, then every chat turn sends the bundled `DEFAULT_SANDBOX_PROMPT` with these variables interpolated:

- `{{topic}}`
- `{{stance}}`
- `{{strength}}`
- `{{turn_number}}`

There is no prompt editor, guardrail editor, eval runner, transcript viewer, mobile variant, or peer-testing pipeline.

## Persistence

- SQLite DB: `data/webapp.sqlite3`
- Browser-scoped user id cookie: `rid_user`
- Optional override via env var: `DATA_DIR=/path/to/persistent/folder`

The database initializer creates or extends only the tables it needs. It does not wipe existing data.

## API

- `GET /api/me`
- `POST /api/conversations`
- `GET /api/conversations/<conversation_id>`
- `POST /api/conversations/<conversation_id>/messages`
- `DELETE /api/conversations/<conversation_id>`
- `GET /api/transcripts/<conversation_id>/<transcript_token>`

## Qualtrics

The chatbot can be embedded in a Qualtrics question with `webapp/static/qualtrics-chatbot.js`. Configure the deployed backend with `QUALTRICS_ALLOWED_ORIGINS=https://umich.qualtrics.com` so Qualtrics can call the API over CORS, and pass survey fields through Qualtrics Embedded Data.

See `docs/qualtrics.md` for the survey setup and custom JavaScript snippet. An importable survey shell and companion snippets are in `qualtrics/`.

## Test

```bash
python3 -m compileall -q webapp llm_client.py runtime_config.py tests
python3 -m pytest -q
```
