"""Source verification boundary."""

from .model import SourceLabel


def verify_source(_claim: str) -> SourceLabel:
    return SourceLabel.CHUA_TIM_THAY_NGUON

