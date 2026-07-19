import pytest

from backend.legal_radar.auth import InvalidSession, SessionManager


def test_signed_session_round_trip_and_tamper_detection() -> None:
    manager = SessionManager("a-strong-test-secret", ttl_seconds=60)
    token, principal = manager.issue("reviewer-1", "reviewer", now=100)

    assert manager.verify(token, now=120) == principal
    with pytest.raises(InvalidSession):
        manager.verify(token + "tampered", now=120)


def test_signed_session_expires() -> None:
    manager = SessionManager("a-strong-test-secret", ttl_seconds=60)
    token, _ = manager.issue("admin-1", "admin", now=100)

    with pytest.raises(InvalidSession):
        manager.verify(token, now=161)
