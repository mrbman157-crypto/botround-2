import math
import os
from pathlib import Path


def load_env_file(env_path: Path) -> None:
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


ROOT_DIR = Path(__file__).parent
load_env_file(ROOT_DIR / ".env")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_API_BASE", "").strip()
ENFORCED_MODEL = os.getenv("CHAT_MODEL", "anthropic/claude-sonnet-4.6").strip()
DEFAULT_MODEL = ENFORCED_MODEL
CHAT_MODEL = ENFORCED_MODEL

DATA_DIR = Path(os.getenv("DATA_DIR", str(ROOT_DIR / "data"))).expanduser()


def _csv_env(name: str) -> tuple[str, ...]:
    raw = os.getenv(name, "")
    return tuple(value.strip() for value in raw.split(",") if value.strip())


QUALTRICS_ALLOWED_ORIGINS = _csv_env("QUALTRICS_ALLOWED_ORIGINS")
RECAPTCHA_SECRET = os.getenv("RECAPTCHA_SECRET", "").strip()


def _float_env(name: str, default: float, *, minimum: float, maximum: float) -> float:
    raw = os.getenv(name, "").strip()
    if not raw:
        return default
    try:
        value = float(raw)
    except ValueError:
        return default
    if not math.isfinite(value):
        return default
    return min(max(value, minimum), maximum)


RECAPTCHA_MIN_SCORE = _float_env("RECAPTCHA_MIN_SCORE", 0.5, minimum=0.0, maximum=1.0)
