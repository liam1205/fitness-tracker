"""Export the OpenAPI schema to a JSON file.

Run from the Backend directory:

    python -m scripts.export_openapi

The generated ``openapi.json`` can be committed and/or consumed by the frontend
(e.g. orval) to generate a typed API client without the server needing to run.
"""

import json
from pathlib import Path

from app.main import app

OUTPUT_PATH = Path(__file__).resolve().parent.parent / "openapi.json"


def main() -> None:
    schema = app.openapi()
    OUTPUT_PATH.write_text(json.dumps(schema, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote OpenAPI schema to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
