import pytest
import json
from pathlib import Path

from backend.legal_radar.model import (
    VanBan, DieuKhoan, HanhVi, ChuThe, MucPhat, BienPhapKhacPhuc,
    NguonTin, Edge, KnowledgeGraph, QueueItem,
    NhomHanhVi, LoaiChuThe, NhanNguon, NhanPhanLoai,
    load_kg, load_queue, validate_kg,
)


# ── VanBan ──

class TestVanBan:
    def test_create(self):
        vb = VanBan(
            id="nd174",
            so_hieu="174/2026/NĐ-CP",
            ngay_hieu_luc="2026-07-01",
            trang_thai="hieu_luc",
        )
        assert vb.id == "nd174"
        assert vb.trang_thai == "hieu_luc"

    def test_frozen(self):
        vb = VanBan(id="nd174", so_hieu="174/2026/NĐ-CP", ngay_hieu_luc="2026-07-01", trang_thai="hieu_luc")
        with pytest.raises(AttributeError):
            vb.so_hieu = "changed"


# ── DieuKhoan ──

class TestDieuKhoan:
    def test_create_full(self):
        dk = DieuKhoan(id="nd174-d95-k1-a", van_ban_id="nd174", dieu=95, khoan=1, diem="a", noi_dung="Cung cấp, chia sẻ thông tin giả mạo...")
        assert dk.id == "nd174-d95-k1-a"
        assert dk.dieu == 95

    def test_diem_requires_khoan(self):
        with pytest.raises(ValueError, match="diem.*khoan"):
            DieuKhoan(id="nd174-d95-a", van_ban_id="nd174", dieu=95, khoan=None, diem="a", noi_dung="test")

    def test_frozen(self):
        dk = DieuKhoan(id="nd174-d95-k1-a", van_ban_id="nd174", dieu=95, khoan=1, diem="a", noi_dung="test")
        with pytest.raises(AttributeError):
            dk.dieu = 96


# ── HanhVi ──

class TestHanhVi:
    def test_create(self):
        hv = HanhVi(id="hv-tin-gia", dieu_khoan_id="nd174-d95-k1-a", mo_ta="Cung cấp, chia sẻ thông tin giả mạo", nhom=NhomHanhVi.TIN_GIA)
        assert hv.nhom == NhomHanhVi.TIN_GIA
        assert hv.dieu_khoan_id == "nd174-d95-k1-a"

    def test_invalid_nhom(self):
        with pytest.raises(ValueError):
            HanhVi(id="hv-x", dieu_khoan_id="nd174-d95-k1-a", mo_ta="test", nhom="invalid_enum")


# ── ChuThe ──

class TestChuThe:
    def test_ca_nhan(self):
        ct = ChuThe(id="ct-ca-nhan", loai=LoaiChuThe.CA_NHAN, mo_ta_nhan_dien="Cá nhân sử dụng MXH")
        assert ct.loai == LoaiChuThe.CA_NHAN

    def test_to_chuc(self):
        ct = ChuThe(id="ct-to-chuc", loai=LoaiChuThe.TO_CHUC, mo_ta_nhan_dien="Tổ chức")
        assert ct.loai == LoaiChuThe.TO_CHUC


# ── MucPhat ──

class TestMucPhat:
    def test_create(self):
        mp = MucPhat(id="mp-d95-k1", dieu_khoan_id="nd174-d95-k1-a", min_vnd=20_000_000, max_vnd=30_000_000, ap_dung_cho=LoaiChuThe.TO_CHUC)
        assert mp.min_vnd == 20_000_000

    def test_min_greater_than_max_raises(self):
        with pytest.raises(ValueError, match="min.*max"):
            MucPhat(id="mp-bad", dieu_khoan_id="nd174-d95-k1-a", min_vnd=50, max_vnd=10, ap_dung_cho=LoaiChuThe.TO_CHUC)

    def test_negative_raises(self):
        with pytest.raises(ValueError):
            MucPhat(id="mp-neg", dieu_khoan_id="nd174-d95-k1-a", min_vnd=-1, max_vnd=10, ap_dung_cho=LoaiChuThe.TO_CHUC)


# ── BienPhapKhacPhuc ──

class TestBienPhapKhacPhuc:
    def test_create(self):
        bp = BienPhapKhacPhuc(id="bp-d95-k1k2", dieu_khoan_id="nd174-d95-k3-a", mo_ta="Gỡ bỏ thông tin", pham_vi="k1_k2")
        assert bp.pham_vi == "k1_k2"


# ── NguonTin ──

class TestNguonTin:
    def test_create(self):
        nt = NguonTin(
            id="nt-sbv-1", tier=0, nguon="SBV",
            tieu_de="SBV bác bỏ tin đồn", noi_dung_tom_tat="Ngân hàng Nhà nước bác bỏ...",
            ngay_dang="2022-10-10", url="https://sbv.gov.vn/...",
        )
        assert nt.tier == 0

    def test_invalid_tier(self):
        with pytest.raises(ValueError, match="tier"):
            NguonTin(id="nt-bad", tier=5, nguon="X", tieu_de="t", noi_dung_tom_tat="n", ngay_dang="2022-01-01")


# ── Edge ──

class TestEdge:
    def test_create(self):
        e = Edge(source="nd15-d101-k1-a", target="nd174-d95-k1-a", loai="THAY_THE", dien_giai="test")
        assert e.loai == "THAY_THE"

    def test_frozen(self):
        e = Edge(source="a", target="b", loai="QUY_DINH_TAI")
        with pytest.raises(AttributeError):
            e.source = "x"

    def test_he_so_optional(self):
        e = Edge(source="mp-d95-k1", target="ct-ca-nhan", loai="AP_DUNG_CHO", he_so=0.5)
        assert e.he_so == 0.5


# ── QueueItem ──

class TestQueueItem:
    def test_create(self):
        qi = QueueItem(
            id="q1", comment_id="c1", text="tin giả bị phạt 30 củ",
            claim="tin giả bị phạt 30 triệu", keywords=["tin giả", "phạt", "30 triệu"],
            nhan=NhanPhanLoai.DUNG, ly_do="Điểm a khoản 1 Điều 95 NĐ174",
            nhan_nguon=NhanNguon.CHUA_TIM_THAY_NGUON, priority=1,
        )
        assert qi.nhan == NhanPhanLoai.DUNG

    def test_invalid_nhan(self):
        with pytest.raises(ValueError):
            QueueItem(id="q1", comment_id="c1", text="t", claim="t", keywords=[], nhan="vi_pham", ly_do="")


# ── KnowledgeGraph + load/validate ──

class TestKnowledgeGraph:
    def _make_kg(self):
        nodes = [
            VanBan(id="nd174", so_hieu="174/2026/NĐ-CP", ngay_hieu_luc="2026-07-01", trang_thai="hieu_luc"),
            DieuKhoan(id="nd174-d95-k1-a", van_ban_id="nd174", dieu=95, khoan=1, diem="a", noi_dung="Thông tin giả mạo"),
            HanhVi(id="hv-tin-gia", dieu_khoan_id="nd174-d95-k1-a", mo_ta="Cung cấp thông tin giả mạo", nhom=NhomHanhVi.TIN_GIA),
            MucPhat(id="mp-d95-k1", dieu_khoan_id="nd174-d95-k1-a", min_vnd=20_000_000, max_vnd=30_000_000, ap_dung_cho=LoaiChuThe.TO_CHUC),
        ]
        edges = [
            Edge(source="hv-tin-gia", target="nd174-d95-k1-a", loai="QUY_DINH_TAI"),
        ]
        return KnowledgeGraph(nodes=nodes, edges=edges)

    def test_build_kg(self):
        kg = self._make_kg()
        assert len(kg.nodes) == 4
        assert len(kg.edges) == 1

    def test_duplicate_node_id_raises(self):
        nodes = [
            VanBan(id="dup", so_hieu="X", ngay_hieu_luc="2026-01-01", trang_thai="hieu_luc"),
            VanBan(id="dup", so_hieu="Y", ngay_hieu_luc="2026-01-01", trang_thai="hieu_luc"),
        ]
        with pytest.raises(ValueError, match="Duplicate"):
            KnowledgeGraph(nodes=nodes, edges=[])

    def test_edge_ref_missing_node_raises(self):
        nodes = [VanBan(id="a", so_hieu="X", ngay_hieu_luc="2026-01-01", trang_thai="hieu_luc")]
        edges = [Edge(source="a", target="MISSING", loai="THAY_THE")]
        with pytest.raises(ValueError, match="missing"):
            KnowledgeGraph(nodes=nodes, edges=edges)

    def test_find_node_by_id(self):
        kg = self._make_kg()
        node = kg.find_node("nd174-d95-k1-a")
        assert isinstance(node, DieuKhoan)
        assert node.dieu == 95

    def test_find_node_missing(self):
        kg = self._make_kg()
        assert kg.find_node("nonexistent") is None

    def test_get_edges_from(self):
        kg = self._make_kg()
        edges = kg.get_edges_from("hv-tin-gia")
        assert len(edges) == 1
        assert edges[0].target == "nd174-d95-k1-a"

    def test_get_dieu_khoan_for_hanh_vi(self):
        kg = self._make_kg()
        dks = kg.get_dieu_khoan_for_hanh_vi("hv-tin-gia")
        assert len(dks) == 1
        assert dks[0].id == "nd174-d95-k1-a"

    def test_get_muc_phat_for_dieu_khoan(self):
        kg = self._make_kg()
        mps = kg.get_muc_phat_for_dieu_khoan("nd174-d95-k1-a")
        assert len(mps) == 1
        assert mps[0].id == "mp-d95-k1"


# ── Load from JSON ──

class TestLoadKG:
    def _write_fixture(self, tmp_path):
        kg_data = {
            "nodes": [
                {"type": "VanBan", "id": "nd174", "so_hieu": "174/2026/NĐ-CP", "ngay_hieu_luc": "2026-07-01", "trang_thai": "hieu_luc"},
                {"type": "DieuKhoan", "id": "nd174-d95-k1-a", "van_ban_id": "nd174", "dieu": 95, "khoan": 1, "diem": "a", "noi_dung": "Thông tin giả mạo"},
                {"type": "HanhVi", "id": "hv-tin-gia", "dieu_khoan_id": "nd174-d95-k1-a", "mo_ta": "Cung cấp thông tin giả mạo", "nhom": "tin_gia"},
                {"type": "MucPhat", "id": "mp-d95-k1", "dieu_khoan_id": "nd174-d95-k1-a", "min_vnd": 20000000, "max_vnd": 30000000, "ap_dung_cho": "to_chuc"},
            ],
            "edges": [
                {"type": "QUY_DINH_TAI", "from_id": "hv-tin-gia", "to_id": "nd174-d95-k1-a"},
            ],
        }
        p = tmp_path / "kg.json"
        p.write_text(json.dumps(kg_data, ensure_ascii=False), encoding="utf-8")
        return p

    def test_load_and_roundtrip(self, tmp_path):
        p = self._write_fixture(tmp_path)
        kg = load_kg(p)
        assert len(kg.nodes) == 4
        assert isinstance(kg.find_node("nd174-d95-k1-a"), DieuKhoan)

    def test_validate_ok(self, tmp_path):
        p = self._write_fixture(tmp_path)
        kg = load_kg(p)
        errors = validate_kg(kg)
        assert errors == []


# ── Enum constraints ──

class TestEnums:
    def test_nhan_phan_loai_values(self):
        assert set(NhanPhanLoai) == {NhanPhanLoai.DUNG, NhanPhanLoai.HIEU_LAM, NhanPhanLoai.CAN_KIEM_CHUNG}

    def test_nhan_nguon_values(self):
        assert set(NhanNguon) == {NhanNguon.CO_NGUON_XAC_NHAN, NhanNguon.CO_BAC_BO_CHINH_THUC, NhanNguon.CHUA_TIM_THAY_NGUON}
