import pytest

from backend.legal_radar.resilience import CircuitBreaker, CircuitOpen, call_with_retry


def test_retry_opens_circuit_after_repeated_provider_failures() -> None:
    breaker = CircuitBreaker(failure_threshold=2, recovery_seconds=30)
    attempts = 0

    def fail() -> None:
        nonlocal attempts
        attempts += 1
        raise TimeoutError("provider timed out")

    with pytest.raises(TimeoutError):
        call_with_retry(
            fail,
            breaker=breaker,
            attempts=2,
            retry_on=(TimeoutError,),
            sleep=lambda _: None,
        )
    with pytest.raises(CircuitOpen):
        call_with_retry(
            fail,
            breaker=breaker,
            attempts=2,
            retry_on=(TimeoutError,),
            sleep=lambda _: None,
        )
    assert attempts == 2
