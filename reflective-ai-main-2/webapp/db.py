from __future__ import annotations

import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Any

from runtime_config import DATA_DIR


DB_PATH = DATA_DIR / "webapp.sqlite3"


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def connect() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _columns(conn: sqlite3.Connection, table: str) -> set[str]:
    rows = conn.execute(f"PRAGMA table_info({table})").fetchall()
    return {str(row["name"]) for row in rows}


def _add_column_if_missing(
    conn: sqlite3.Connection, table: str, column: str, definition: str
) -> None:
    if column not in _columns(conn, table):
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")


def init_db(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS conversations (
            conversation_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            completed_at TEXT,
            completion_reason TEXT,
            transcript_token TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS messages (
            message_id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            system_prompt TEXT,
            model TEXT,
            created_at TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS conversation_state (
            conversation_id TEXT PRIMARY KEY,
            condition TEXT NOT NULL DEFAULT 'treatment',
            condition_assignment_source TEXT,
            condition_assigned_at TEXT,
            topic_raw TEXT,
            stance_raw TEXT,
            strength_score INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )

    _add_column_if_missing(conn, "messages", "system_prompt", "TEXT")
    _add_column_if_missing(conn, "messages", "model", "TEXT")
    _add_column_if_missing(conn, "conversations", "completed_at", "TEXT")
    _add_column_if_missing(conn, "conversations", "completion_reason", "TEXT")
    _add_column_if_missing(conn, "conversations", "transcript_token", "TEXT")
    _add_column_if_missing(conn, "conversation_state", "topic_raw", "TEXT")
    _add_column_if_missing(conn, "conversation_state", "stance_raw", "TEXT")
    _add_column_if_missing(conn, "conversation_state", "strength_score", "INTEGER")
    _add_column_if_missing(
        conn, "conversation_state", "condition", "TEXT NOT NULL DEFAULT 'treatment'"
    )
    _add_column_if_missing(conn, "conversation_state", "condition_assignment_source", "TEXT")
    _add_column_if_missing(conn, "conversation_state", "condition_assigned_at", "TEXT")
    _ensure_transcript_tokens(conn)

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id)"
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_messages_convo ON messages(conversation_id, message_id)"
    )
    conn.commit()


def _ensure_transcript_tokens(conn: sqlite3.Connection) -> None:
    rows = conn.execute(
        """
        SELECT conversation_id
        FROM conversations
        WHERE transcript_token IS NULL OR transcript_token = ''
        """
    ).fetchall()
    for row in rows:
        conn.execute(
            "UPDATE conversations SET transcript_token = ? WHERE conversation_id = ?",
            (uuid.uuid4().hex, row["conversation_id"]),
        )


def create_conversation(
    conn: sqlite3.Connection,
    *,
    user_id: str,
    topic: str,
    stance: str,
    strength_score: int,
    condition: str = "treatment",
    condition_assignment_source: str = "",
    condition_assigned_at: str = "",
) -> str:
    conversation_id = str(uuid.uuid4())
    now = _utc_now_iso()
    title = topic if len(topic) <= 64 else topic[:61].rstrip() + "..."
    conn.execute(
        """
        INSERT INTO conversations (
            conversation_id,
            user_id,
            title,
            completed_at,
            completion_reason,
            transcript_token,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (conversation_id, user_id, title, None, None, uuid.uuid4().hex, now, now),
    )
    conn.execute(
        """
        INSERT INTO conversation_state (
            conversation_id,
            condition,
            condition_assignment_source,
            condition_assigned_at,
            topic_raw,
            stance_raw,
            strength_score,
            created_at,
            updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            conversation_id,
            condition,
            condition_assignment_source,
            condition_assigned_at,
            topic,
            stance,
            strength_score,
            now,
            now,
        ),
    )
    conn.commit()
    return conversation_id


def get_conversation(
    conn: sqlite3.Connection, *, user_id: str, conversation_id: str
) -> dict[str, str] | None:
    row = conn.execute(
        """
        SELECT conversation_id, user_id, title, completed_at, completion_reason, transcript_token, created_at, updated_at
        FROM conversations
        WHERE user_id = ? AND conversation_id = ?
        """,
        (user_id, conversation_id),
    ).fetchone()
    if row is None:
        return None
    return {
        "conversation_id": str(row["conversation_id"]),
        "respondent_id": str(row["user_id"]),
        "title": str(row["title"]),
        "completed_at": (
            str(row["completed_at"]) if row["completed_at"] is not None else None
        ),
        "completion_reason": str(row["completion_reason"] or ""),
        "transcript_token": str(row["transcript_token"] or ""),
        "created_at": str(row["created_at"]),
        "updated_at": str(row["updated_at"]),
    }


def get_conversation_by_transcript_token(
    conn: sqlite3.Connection, *, conversation_id: str, transcript_token: str
) -> dict[str, str] | None:
    row = conn.execute(
        """
        SELECT conversation_id, user_id, title, completed_at, completion_reason, transcript_token, created_at, updated_at
        FROM conversations
        WHERE conversation_id = ? AND transcript_token = ?
        """,
        (conversation_id, transcript_token),
    ).fetchone()
    if row is None:
        return None
    return {
        "conversation_id": str(row["conversation_id"]),
        "respondent_id": str(row["user_id"]),
        "title": str(row["title"]),
        "completed_at": (
            str(row["completed_at"]) if row["completed_at"] is not None else None
        ),
        "completion_reason": str(row["completion_reason"] or ""),
        "transcript_token": str(row["transcript_token"] or ""),
        "created_at": str(row["created_at"]),
        "updated_at": str(row["updated_at"]),
    }


def list_messages(
    conn: sqlite3.Connection, *, conversation_id: str
) -> list[dict[str, object]]:
    rows = conn.execute(
        """
        SELECT role, content, system_prompt, model, created_at
        FROM messages
        WHERE conversation_id = ?
        ORDER BY message_id ASC
        """,
        (conversation_id,),
    ).fetchall()
    return [
        {
            "role": str(row["role"]),
            "content": str(row["content"]),
            "system_prompt": (
                str(row["system_prompt"]) if row["system_prompt"] is not None else None
            ),
            "model": str(row["model"]) if row["model"] is not None else None,
            "created_at": str(row["created_at"]),
        }
        for row in rows
    ]


def add_message(
    conn: sqlite3.Connection,
    *,
    conversation_id: str,
    role: str,
    content: str,
    system_prompt: str | None = None,
    model: str | None = None,
) -> int:
    now = _utc_now_iso()
    cursor = conn.execute(
        """
        INSERT INTO messages (conversation_id, role, content, system_prompt, model, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (conversation_id, role, content, system_prompt, model, now),
    )
    conn.execute(
        "UPDATE conversations SET updated_at = ? WHERE conversation_id = ?",
        (now, conversation_id),
    )
    conn.commit()
    if cursor.lastrowid is None:
        raise RuntimeError("Failed to insert message")
    return int(cursor.lastrowid)


def mark_conversation_completed(
    conn: sqlite3.Connection,
    *,
    conversation_id: str,
    completed_at: str | None = None,
    completion_reason: str = "model_tool",
) -> str:
    when = completed_at or _utc_now_iso()
    conn.execute(
        """
        UPDATE conversations
        SET completed_at = ?, completion_reason = ?, updated_at = ?
        WHERE conversation_id = ?
        """,
        (when, completion_reason, when, conversation_id),
    )
    conn.commit()
    return when


def get_conversation_state(
    conn: sqlite3.Connection, *, conversation_id: str
) -> dict[str, object] | None:
    row = conn.execute(
        """
        SELECT condition, condition_assignment_source, condition_assigned_at, topic_raw, stance_raw, strength_score, created_at, updated_at
        FROM conversation_state
        WHERE conversation_id = ?
        """,
        (conversation_id,),
    ).fetchone()
    if row is None:
        return None
    return {
        "condition": str(row["condition"] or "treatment"),
        "condition_assignment_source": str(row["condition_assignment_source"] or ""),
        "condition_assigned_at": str(row["condition_assigned_at"] or ""),
        "topic_raw": str(row["topic_raw"] or ""),
        "stance_raw": str(row["stance_raw"] or ""),
        "strength_score": (
            int(row["strength_score"]) if row["strength_score"] is not None else None
        ),
        "created_at": str(row["created_at"]),
        "updated_at": str(row["updated_at"]),
    }


def delete_conversation(
    conn: sqlite3.Connection, *, user_id: str, conversation_id: str
) -> bool:
    row = conn.execute(
        "SELECT 1 FROM conversations WHERE user_id = ? AND conversation_id = ?",
        (user_id, conversation_id),
    ).fetchone()
    if row is None:
        return False
    conn.execute("DELETE FROM messages WHERE conversation_id = ?", (conversation_id,))
    conn.execute(
        "DELETE FROM conversation_state WHERE conversation_id = ?", (conversation_id,)
    )
    conn.execute(
        "DELETE FROM conversations WHERE user_id = ? AND conversation_id = ?",
        (user_id, conversation_id),
    )
    conn.commit()
    return True


def export_conversation(
    conn: sqlite3.Connection, *, user_id: str, conversation_id: str
) -> dict[str, Any] | None:
    conversation = get_conversation(
        conn, user_id=user_id, conversation_id=conversation_id
    )
    if conversation is None:
        return None
    return {
        **conversation,
        "messages": list_messages(conn, conversation_id=conversation_id),
        "conversation_state": get_conversation_state(
            conn, conversation_id=conversation_id
        ),
    }


def export_conversation_by_transcript_token(
    conn: sqlite3.Connection, *, conversation_id: str, transcript_token: str
) -> dict[str, Any] | None:
    conversation = get_conversation_by_transcript_token(
        conn, conversation_id=conversation_id, transcript_token=transcript_token
    )
    if conversation is None:
        return None
    conversation.pop("transcript_token", None)
    conversation["respondent_id"] = ""
    return {
        **conversation,
        "messages": list_messages(conn, conversation_id=conversation_id),
        "conversation_state": get_conversation_state(
            conn, conversation_id=conversation_id
        ),
    }
