import json
from pathlib import Path

from backend.legal_radar.api.main import app

target = Path(__file__).resolve().parents[2] / "contracts" / "openapi.json"
target.write_text(json.dumps(app.openapi(), ensure_ascii=False, indent=2), encoding="utf-8")
print(target)

