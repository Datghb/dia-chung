from backend.legal_radar.normalization import normalize_text


def test_normalize_text_removes_marks_and_extra_spaces() -> None:
    assert normalize_text("  Chia sẻ TIN GIẢ  ") == "chia se tin gia"





