from __future__ import annotations

import os

from webapp.main import app


def main() -> None:
    debug = os.getenv("FLASK_DEBUG", "").strip().lower() in {"1", "true", "yes"}
    app.run(host="127.0.0.1", port=8000, debug=debug)


if __name__ == "__main__":
    main()
