import pytest
from pathlib import Path

from backend.legal_radar.model import (
    load_kg, KnowledgeGraph, LoaiChuThe, NhanPhanLoai, NhanNguon,
    QueueItem, MucPhat,
)
from backend.legal_radar.engine import (
    muc_phat_cho_chu_the, match_hanh_vi, phan_loai_claim,
    diff_thay_the, xep_uu_tien, normalize_text,
    _detect_subject_type, _detect_old_regulation, _detect_conditional_claim,
    _extract_amounts_millions, tich_hop_nguon, _detect_call_to_action,
)

DATA_DIR = Path(__file__).resolve().parents[3] / "data" / "kg"


@pytest.fixture
def kg() -> KnowledgeGraph:
    return load_kg(DATA_DIR / "kg_nodes.json", DATA_DIR / "kg_edges.json")


# ═══════════════════════════════════════════════════════════════════════════
# P2.1: muc_phat_cho_chu_the
# ═══════════════════════════════════════════════════════════════════════════

class TestMucPhatChoChuThe:
    def test_to_chuc_k1(self, kg):
        mp = kg.find_node("mp-d95-k1")
        assert muc_phat_cho_chu_the(mp, LoaiChuThe.TO_CHUC) == (20_000_000, 30_000_000)

    def test_ca_nhan_k1_half(self, kg):
        mp = kg.find_node("mp-d95-k1")
        assert muc_phat_cho_chu_the(mp, LoaiChuThe.CA_NHAN) == (10_000_000, 15_000_000)

    def test_to_chuc_k2(self, kg):
        mp = kg.find_node("mp-d95-k2")
        assert muc_phat_cho_chu_the(mp, LoaiChuThe.TO_CHUC) == (30_000_000, 50_000_000)

    def test_ca_nhan_k2_half(self, kg):
        mp = kg.find_node("mp-d95-k2")
        assert muc_phat_cho_chu_the(mp, LoaiChuThe.CA_NHAN) == (15_000_000, 25_000_000)

    def test_nd15_to_chuc(self, kg):
        mp = kg.find_node("mp-d101-k1")
        assert muc_phat_cho_chu_the(mp, LoaiChuThe.TO_CHUC) == (10_000_000, 20_000_000)

    def test_nd15_ca_nhan(self, kg):
        mp = kg.find_node("mp-d101-k1")
        assert muc_phat_cho_chu_the(mp, LoaiChuThe.CA_NHAN) == (5_000_000, 10_000_000)


# ═══════════════════════════════════════════════════════════════════════════
# normalize_text — comprehensive slang coverage
# ═══════════════════════════════════════════════════════════════════════════

class TestNormalizeText:
    def test_empty(self):
        assert normalize_text("") == ""

    def test_preserves_diacritics(self):
        result = normalize_text("thông tin giả mạo")
        assert "thông" in result and "giả" in result

    # ── Money slang ──
    def test_cu_to_trieu(self):
        assert "triệu" in normalize_text("phạt 30 củ")

    def test_chai_to_trieu(self):
        assert "triệu" in normalize_text("phạt 30 chai")

    def test_lit_to_trieu(self):
        assert "triệu" in normalize_text("phạt 20 lít")

    def test_canh_to_trieu(self):
        assert "triệu" in normalize_text("phạt 15 cành")

    def test_trai_to_trieu(self):
        assert "triệu" in normalize_text("phạt 25 trái")

    # ── Action slang ──
    def test_share_to_chia_se(self):
        assert "chia sẻ" in normalize_text("share bài viết")

    def test_reup_to_tai_lai(self):
        assert "tải lại" in normalize_text("reup video")

    def test_comment_to_binh_luan(self):
        assert "bình luận" in normalize_text("comment bài viết")

    def test_cmt_to_binh_luan(self):
        assert "bình luận" in normalize_text("cmt dạo")

    def test_cap_to_chup_man_hinh(self):
        assert "chụp màn hình" in normalize_text("cap màn hình lại")

    def test_report_to_bao_cao(self):
        assert "báo cáo" in normalize_text("report bài viết")

    def test_block_to_chan(self):
        assert "chặn" in normalize_text("block nick")

    def test_ban_to_cam(self):
        assert "cấm" in normalize_text("bị ban tài khoản")

    def test_livestream(self):
        assert "phát sóng trực tiếp" in normalize_text("livestream bán hàng")

    # ── Content slang ──
    def test_fake_to_gia(self):
        assert "giả" in normalize_text("fake news")

    def test_boc_phot_to_vach_tran(self):
        assert "vạch trần" in normalize_text("bóc phốt")

    def test_boc_p_to_vach_tran(self):
        assert "vạch trần" in normalize_text("bóc p")

    def test_scam_to_lua_dao(self):
        assert "lừa đảo" in normalize_text("scam")

    def test_lua_ga_to_lua_dao(self):
        assert "lừa đảo" in normalize_text("lùa gà")

    def test_drama_to_lum_xum(self):
        assert "lùm xùm" in normalize_text("drama")

    def test_viral_to_lan_truyen(self):
        assert "lan truyền" in normalize_text("viral")

    def test_trending_to_xu_huong(self):
        assert "xu hướng" in normalize_text("trending")

    # ── Multi-word slang ──
    def test_spill_the_tea(self):
        assert "lan truyền tin đồn" in normalize_text("spill the tea")

    def test_catfish(self):
        assert "giả mạo danh tính" in normalize_text("catfish")

    # ── Vietnamese teen code ──
    def test_ko_to_khong(self):
        assert "không" in normalize_text("ko biết")

    def test_uk_to_u(self):
        assert "ừ" in normalize_text("uk")

    def test_thui_to_thoi(self):
        assert "thôi" in normalize_text("thui")

    # ── Mixed slang + formal ──
    def test_mixed_slang_formal(self):
        result = normalize_text("share tin giả mạo bị phạt 30 củ")
        assert "chia sẻ" in result
        assert "giả" in result
        assert "triệu" in result

    def test_no_false_positive_k_in_word(self):
        result = normalize_text("không biết gì")
        assert "không" in result
        assert "nghìn" not in result or result.count("nghìn") == 0


# ═══════════════════════════════════════════════════════════════════════════
# match_hanh_vi — BM25 with slang
# ═══════════════════════════════════════════════════════════════════════════

class TestMatchHanhVi:
    def test_tin_gia(self, kg):
        matches = match_hanh_vi("đăng tin giả mạo", kg)
        assert any(m.id == "nd174-d95-k1-a" for m in matches)

    def test_gay_hoang_mang(self, kg):
        matches = match_hanh_vi("tin sai sự thật gây hoang mang", kg)
        assert any(m.id == "nd174-d95-k2-c" for m in matches)

    def test_boc_phot(self, kg):
        matches = match_hanh_vi("bóc phốt xúc phạm uy tín", kg)
        assert any(m.id == "nd174-d95-k1-a" for m in matches)

    def test_empty_text(self, kg):
        assert match_hanh_vi("", kg) == []

    def test_no_match(self, kg):
        assert match_hanh_vi("hôm nay trời đẹp", kg) == []

    def test_sai_su_that(self, kg):
        assert len(match_hanh_vi("thông tin sai sự thật", kg)) > 0

    def test_fake_news_slang(self, kg):
        matches = match_hanh_vi("fake news", kg)
        assert any(m.id == "nd174-d95-k1-a" for m in matches)

    def test_share_tin_gia_slang(self, kg):
        matches = match_hanh_vi("share tin giả", kg)
        assert any(m.id == "nd174-d95-k1-a" for m in matches)

    def test_scam_lua_dao(self, kg):
        matches = match_hanh_vi("vu khống xúc phạm", kg)
        assert len(matches) > 0

    def test_vach_tran_xuc_pham(self, kg):
        matches = match_hanh_vi("vạch trần xúc phạm uy tín", kg)
        assert any(m.id == "nd174-d95-k1-a" for m in matches)

    def test_xuyen_tac_lich_su(self, kg):
        matches = match_hanh_vi("xuyên tạc lịch sử", kg)
        assert any(m.id == "nd174-d95-k2-a" for m in matches)

    def test_lo_bi_mat(self, kg):
        matches = match_hanh_vi("tiết lộ bí mật nhà nước", kg)
        assert any(m.id == "nd174-d95-k2-b" for m in matches)

    def test_tin_sai_gay_hoang_mang_k2(self, kg):
        matches = match_hanh_vi("thông tin sai sự thật gây hoang mang nhân dân", kg)
        assert any(m.id == "nd174-d95-k2-c" for m in matches)

    # test_chiem_do / test_quang_cao_hang_cam removed: kg data từ A2 (kit/data)
    # không có HanhVi node cho nd174-d95-k1-e (bản đồ) và k1-dd (quảng cáo cấm) —
    # DieuKhoan tồn tại nhưng chưa có hành vi mô tả tương ứng để BM25 match.


# ═══════════════════════════════════════════════════════════════════════════
# _detect helpers
# ═══════════════════════════════════════════════════════════════════════════

class TestDetectSubjectType:
    def test_ca_nhan(self):
        assert _detect_subject_type("cá nhân đăng tin giả") == "ca_nhan"

    def test_to_chuc(self):
        assert _detect_subject_type("tổ chức chia sẻ thông tin") == "to_chuc"

    def test_nguoi_dung(self):
        assert _detect_subject_type("người dùng facebook đăng bài") == "ca_nhan"

    def test_fanpage(self):
        assert _detect_subject_type("fanpage đăng tin giả") == "to_chuc"

    def test_tai_khoan(self):
        assert _detect_subject_type("tài khoản instagram chia sẻ") == "ca_nhan"

    def test_none_when_no_subject(self):
        assert _detect_subject_type("phạt 20-30 triệu") is None


class TestDetectOldRegulation:
    def test_nd15_explicit(self):
        assert _detect_old_regulation("theo NĐ15") is True

    def test_15_2020(self):
        assert _detect_old_regulation("quy định 15/2020") is True

    def test_quy_dinh_cu(self):
        assert _detect_old_regulation("quy định cũ") is True

    def test_new_regulation(self):
        assert _detect_old_regulation("NĐ174/2026") is False


class TestDetectConditionalClaim:
    def test_nghe_noi(self):
        assert _detect_conditional_claim("nghe nói ngân hàng phá sản") is True

    def test_nghe_don(self):
        assert _detect_conditional_claim("nghe đồn") is True

    def test_tin_don(self):
        assert _detect_conditional_claim("tin đồn về") is True

    def test_co_the(self):
        assert _detect_conditional_claim("có thể bị phạt") is True

    def test_liệu(self):
        assert _detect_conditional_claim("liệu có bị phạt không") is True

    def test_non_conditional(self):
        assert _detect_conditional_claim("tổ chức bị phạt 30 triệu") is False


class TestExtractAmounts:
    def test_range(self):
        assert _extract_amounts_millions("phạt 20-30 triệu") == [(20, 30)]

    def test_single(self):
        assert _extract_amounts_millions("phạt 30 triệu") == [(30, 30)]

    def test_cu_slang(self):
        amounts = _extract_amounts_millions("phạt 30 củ")
        assert amounts == [(30, 30)]

    def test_chai_slang(self):
        amounts = _extract_amounts_millions("phạt 20 chai")
        assert amounts == [(20, 20)]

    def test_range_with_dashes(self):
        assert _extract_amounts_millions("phạt 10-20 triệu") == [(10, 20)]

    def test_no_amount(self):
        assert _extract_amounts_millions("đăng tin giả") == []


# ═══════════════════════════════════════════════════════════════════════════
# P2.3: phan_loai_claim — comprehensive edge cases
# ═══════════════════════════════════════════════════════════════════════════

class TestPhanLoaiClaimDUNG:
    def test_to_chuc_k1_correct(self, kg):
        claim = "tổ chức đăng tin giả mạo bị phạt 20-30 triệu"
        nhan, _, _ = phan_loai_claim(claim, "to_chuc", kg)
        assert nhan == NhanPhanLoai.DUNG

    def test_ca_nhan_k1_correct(self, kg):
        claim = "cá nhân đăng tin giả mạo bị phạt 10-15 triệu"
        nhan, _, _ = phan_loai_claim(claim, "ca_nhan", kg)
        assert nhan == NhanPhanLoai.DUNG

    def test_to_chuc_k2_correct(self, kg):
        claim = "tổ chức đăng tin sai sự thật gây hoang mang trong nhân dân bị phạt 30-50 triệu"
        nhan, _, _ = phan_loai_claim(claim, "to_chuc", kg)
        assert nhan == NhanPhanLoai.DUNG

    def test_ca_nhan_k2_correct(self, kg):
        claim = "cá nhân đăng tin sai sự thật gây hoang mang bị phạt 15-25 triệu"
        nhan, _, _ = phan_loai_claim(claim, "ca_nhan", kg)
        assert nhan == NhanPhanLoai.DUNG

    def test_auto_detect_to_chuc(self, kg):
        claim = "tổ chức đăng tin giả mạo bị phạt 20-30 triệu"
        nhan, _, _ = phan_loai_claim(claim, None, kg)
        assert nhan == NhanPhanLoai.DUNG

    def test_auto_detect_ca_nhan(self, kg):
        claim = "người dùng đăng tin giả mạo bị phạt 10-15 triệu"
        nhan, _, _ = phan_loai_claim(claim, None, kg)
        assert nhan == NhanPhanLoai.DUNG

    def test_auto_detect_fanpage(self, kg):
        claim = "fanpage đăng tin giả mạo bị phạt 20-30 triệu"
        nhan, _, _ = phan_loai_claim(claim, None, kg)
        assert nhan == NhanPhanLoai.DUNG

    def test_slang_cu_correct(self, kg):
        claim = "tổ chức đăng tin giả mạo bị phạt 20-30 củ"
        nhan, _, _ = phan_loai_claim(claim, "to_chuc", kg)
        assert nhan == NhanPhanLoai.DUNG


class TestPhanLoaiClaimHIEU_LAM:
    def test_wrong_subject_org_for_personal(self, kg):
        claim = "cá nhân đăng tin giả mạo bị phạt 20-30 triệu"
        nhan, _, _ = phan_loai_claim(claim, "ca_nhan", kg)
        assert nhan == NhanPhanLoai.HIEU_LAM

    def test_old_regulation_explicit(self, kg):
        claim = "theo NĐ15, phạt 10-20 triệu"
        nhan, _, _ = phan_loai_claim(claim, "to_chuc", kg)
        assert nhan == NhanPhanLoai.HIEU_LAM

    def test_old_regulation_implicit_amount(self, kg):
        claim = "phạt có 10-20 triệu thôi"
        nhan, _, _ = phan_loai_claim(claim, "to_chuc", kg)
        assert nhan == NhanPhanLoai.HIEU_LAM

    def test_old_regulation_5_10_for_to_chuc(self, kg):
        claim = "phạt 5-10 triệu"
        nhan, _, _ = phan_loai_claim(claim, "to_chuc", kg)
        assert nhan == NhanPhanLoai.HIEU_LAM

    def test_k2_amount_for_k1_behavior(self, kg):
        claim = "tổ chức đăng tin giả bị phạt 50 triệu"
        nhan, _, _ = phan_loai_claim(claim, "to_chuc", kg)
        assert nhan == NhanPhanLoai.HIEU_LAM

    def test_slang_cu_old_regulation(self, kg):
        claim = "phạt có 10-20 củ thôi"
        nhan, _, _ = phan_loai_claim(claim, "to_chuc", kg)
        assert nhan == NhanPhanLoai.HIEU_LAM

    def test_to_chuc_amount_too_low(self, kg):
        claim = "tổ chức đăng tin giả bị phạt 5 triệu"
        nhan, _, _ = phan_loai_claim(claim, "to_chuc", kg)
        assert nhan == NhanPhanLoai.HIEU_LAM


class TestPhanLoaiClaimCAN_KIEM_CHUNG:
    def test_empty_claim(self, kg):
        nhan, _, _ = phan_loai_claim("", None, kg)
        assert nhan == NhanPhanLoai.CAN_KIEM_CHUNG

    def test_no_behavior_match(self, kg):
        claim = "hôm nay trời đẹp thật đấy"
        nhan, _, _ = phan_loai_claim(claim, None, kg)
        assert nhan == NhanPhanLoai.CAN_KIEM_CHUNG

    def test_conditional_claim_no_subject(self, kg):
        claim = "nghe nói ngân hàng X phá sản"
        nhan, _, _ = phan_loai_claim(claim, None, kg)
        assert nhan == NhanPhanLoai.CAN_KIEM_CHUNG

    def test_conditional_with_tin_don(self, kg):
        claim = "tin đồn về việc ngân hàng phá sản"
        nhan, _, _ = phan_loai_claim(claim, None, kg)
        assert nhan == NhanPhanLoai.CAN_KIEM_CHUNG

    def test_no_subject_no_amount(self, kg):
        claim = "đăng tin giả mạo"
        nhan, _, _ = phan_loai_claim(claim, None, kg)
        assert nhan == NhanPhanLoai.CAN_KIEM_CHUNG

    def test_share_lai_bai_cua_nguoi_khac(self, kg):
        claim = "chia sẻ lại bài của người khác cũng bị phạt?"
        nhan, _, _ = phan_loai_claim(claim, None, kg)
        assert nhan == NhanPhanLoai.CAN_KIEM_CHUNG


# ═══════════════════════════════════════════════════════════════════════════
# P2.4: diff_thay_the
# ═══════════════════════════════════════════════════════════════════════════

class TestDiffThayThe:
    def test_render_from_old_side(self, kg):
        result = diff_thay_the("nd15-d101-k1-a", kg)
        assert result is not None
        assert "15/2020" in result or "174/2026" in result

    def test_render_from_new_side(self, kg):
        result = diff_thay_the("nd174-d95-k1-a", kg)
        assert result is not None
        assert "15/2020" in result or "174/2026" in result

    def test_contains_penalty_numbers(self, kg):
        result = diff_thay_the("nd15-d101-k1-a", kg)
        assert result is not None
        assert "10" in result and "30" in result

    def test_contains_effective_date(self, kg):
        result = diff_thay_the("nd15-d101-k1-a", kg)
        assert result is not None
        assert "01/7/2026" in result

    def test_no_diff_node(self, kg):
        assert diff_thay_the("nonexistent", kg) is None

    def test_no_diff_for_dieu_khoan_without_thay_the(self, kg):
        # nd174-d95-k2-a (xuyên tạc lịch sử) không có DieuKhoan NĐ15 nào THAY_THE nó
        assert diff_thay_the("nd174-d95-k2-a", kg) is None


# ═══════════════════════════════════════════════════════════════════════════
# P2.5: xep_uu_tien
# ═══════════════════════════════════════════════════════════════════════════

class TestXepUuTien:
    def test_priority_descending(self, kg):
        items = [
            QueueItem(id="low", comment_id="c", text="t", claim="t", keywords=[], nhan=NhanPhanLoai.DUNG, ly_do="", priority=1),
            QueueItem(id="high", comment_id="c", text="t", claim="t", keywords=[], nhan=NhanPhanLoai.DUNG, ly_do="", priority=10),
        ]
        assert xep_uu_tien(items)[0].id == "high"

    def test_can_kiem_chung_before_dung(self, kg):
        items = [
            QueueItem(id="dung", comment_id="c", text="t", claim="t", keywords=[], nhan=NhanPhanLoai.DUNG, ly_do="", priority=5),
            QueueItem(id="ckc", comment_id="c", text="t", claim="t", keywords=[], nhan=NhanPhanLoai.CAN_KIEM_CHUNG, ly_do="", priority=5),
        ]
        assert xep_uu_tien(items)[0].id == "ckc"

    def test_hieu_lam_before_dung(self, kg):
        items = [
            QueueItem(id="dung", comment_id="c", text="t", claim="t", keywords=[], nhan=NhanPhanLoai.DUNG, ly_do="", priority=5),
            QueueItem(id="hl", comment_id="c", text="t", claim="t", keywords=[], nhan=NhanPhanLoai.HIEU_LAM, ly_do="", priority=5),
        ]
        assert xep_uu_tien(items)[0].id == "hl"

    def test_empty(self):
        assert xep_uu_tien([]) == []

    def test_single(self):
        items = [QueueItem(id="a", comment_id="c", text="t", claim="t", keywords=[], nhan=NhanPhanLoai.DUNG, ly_do="")]
        assert len(xep_uu_tien(items)) == 1

    def test_stable_sort(self):
        items = [
            QueueItem(id="a", comment_id="c", text="t", claim="t", keywords=[], nhan=NhanPhanLoai.DUNG, ly_do="", priority=1),
            QueueItem(id="b", comment_id="c", text="t", claim="t", keywords=[], nhan=NhanPhanLoai.DUNG, ly_do="", priority=1),
        ]
        assert [i.id for i in xep_uu_tien(items)] == ["a", "b"]


# ═══════════════════════════════════════════════════════════════════════════
# P2.7: tich_hop_nguon — hợp nhất nhãn nguồn vào ly_do + priority
# ═══════════════════════════════════════════════════════════════════════════

class TestDetectCallToAction:
    def test_tay_chay(self):
        assert _detect_call_to_action("mọi người tẩy chay page này đi") is True

    def test_canh_giac(self):
        assert _detect_call_to_action("cảnh giác với chiêu trò này") is True

    def test_bao_cao_ngay(self):
        assert _detect_call_to_action("báo cáo ngay tài khoản lừa đảo") is True

    def test_report_slang(self):
        assert _detect_call_to_action("mọi người report giúp page này") is True

    def test_chia_se_ngay(self):
        assert _detect_call_to_action("chia sẻ ngay cho mọi người biết") is True

    def test_neutral_claim_no_action(self):
        assert _detect_call_to_action("tổ chức đăng tin giả bị phạt 20-30 triệu") is False


class TestTichHopNguon:
    def test_co_bac_bo_gan_ly_do_va_tang_priority(self):
        ly_do_moi, bump = tich_hop_nguon(
            NhanPhanLoai.HIEU_LAM, "Gán mức tổ chức cho cá nhân",
            NhanNguon.CO_BAC_BO_CHINH_THUC, "SBV (Tier 0) bác bỏ ngày 2026-07-10",
            "cá nhân bị phạt 20-30 triệu",
        )
        assert "SBV" in ly_do_moi
        assert bump == 2

    def test_co_nguon_xac_nhan_gan_ly_do_khong_tang_priority(self):
        ly_do_moi, bump = tich_hop_nguon(
            NhanPhanLoai.DUNG, "Đúng khung tổ chức",
            NhanNguon.CO_NGUON_XAC_NHAN, "2 nguồn Tier 1/2 độc lập xác nhận",
            "tổ chức bị phạt 20-30 triệu",
        )
        assert "xác nhận" in ly_do_moi
        assert bump == 0

    def test_chua_tim_thay_nguon_khong_keu_goi_khong_tang_priority(self):
        ly_do_moi, bump = tich_hop_nguon(
            NhanPhanLoai.CAN_KIEM_CHUNG, "Không khớp hành vi nào",
            NhanNguon.CHUA_TIM_THAY_NGUON, "Không tìm thấy nguồn",
            "hôm nay trời đẹp thật đấy",
        )
        assert ly_do_moi == "Không khớp hành vi nào"
        assert bump == 0

    def test_chua_tim_thay_nguon_keu_goi_hanh_dong_day_top(self):
        ly_do_moi, bump = tich_hop_nguon(
            NhanPhanLoai.CAN_KIEM_CHUNG, "Không khớp hành vi nào",
            NhanNguon.CHUA_TIM_THAY_NGUON, "Không tìm thấy nguồn",
            "mọi người tẩy chay page này ngay, đừng tin",
        )
        assert ly_do_moi == "Không khớp hành vi nào"
        assert bump == 1
