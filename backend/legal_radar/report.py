"""Report generation helpers."""

import json
from dataclasses import asdict

from .model import QueueItem


def render_json(item: QueueItem) -> str:
    return json.dumps(asdict(item), ensure_ascii=False)

