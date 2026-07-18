import json
from pathlib import Path

from backend.legal_radar.model import (
    load_kg, validate_kg, KnowledgeGraph,
    VanBan, DieuKhoan, HanhVi, MucPhat, BienPhapKhacPhuc,
    NhomHanhVi, LoaiChuThe,
)

DATA_DIR = Path(__file__).resolve().parents[3] / "data" / "kg"


class TestKGLoad:
    def test_load_nodes_and_edges(self):
        kg = load_kg(DATA_DIR / "kg_nodes.json", DATA_DIR / "kg_edges.json")
        assert len(kg.nodes) > 30
        assert len(kg.edges) > 15

    def test_no_validation_errors(self):
        kg = load_kg(DATA_DIR / "kg_nodes.json", DATA_DIR / "kg_edges.json")
        errors = validate_kg(kg)
        assert errors == []

    def test_van_ban_count(self):
        kg = load_kg(DATA_DIR / "kg_nodes.json", DATA_DIR / "kg_edges.json")
        van_bans = [n for n in kg.nodes if isinstance(n, VanBan)]
        assert len(van_bans) == 2

    def test_dieu_khoan_count(self):
        kg = load_kg(DATA_DIR / "kg_nodes.json", DATA_DIR / "kg_edges.json")
        dks = [n for n in kg.nodes if isinstance(n, DieuKhoan)]
        assert len(dks) >= 13

    def test_hanh_vi_count(self):
        kg = load_kg(DATA_DIR / "kg_nodes.json", DATA_DIR / "kg_edges.json")
        hvs = [n for n in kg.nodes if isinstance(n, HanhVi)]
        assert len(hvs) >= 8


class TestKGVerify:
    """Cross-check 3 node mẫu với text gốc nd174_trich.md"""

    def test_nd174_d95_k1_a_exact_text(self):
        kg = load_kg(DATA_DIR / "kg_nodes.json", DATA_DIR / "kg_edges.json")
        node = kg.find_node("nd174-d95-k1-a")
        assert isinstance(node, DieuKhoan)
        assert "giả mạo" in node.noi_dung
        assert "sai sự thật" in node.noi_dung
        assert "xuyên tạc" in node.noi_dung
        assert "vu khống" in node.noi_dung
        assert node.dieu == 95
        assert node.khoan == 1
        assert node.diem == "a"

    def test_nd174_d95_k2_c_exact_text(self):
        kg = load_kg(DATA_DIR / "kg_nodes.json", DATA_DIR / "kg_edges.json")
        node = kg.find_node("nd174-d95-k2-c")
        assert isinstance(node, DieuKhoan)
        assert "hoang mang" in node.noi_dung
        assert "thiệt hại" in node.noi_dung
        assert node.khoan == 2

    def test_muc_phat_k1_range(self):
        kg = load_kg(DATA_DIR / "kg_nodes.json", DATA_DIR / "kg_edges.json")
        mp = kg.find_node("mp-d95-k1")
        assert isinstance(mp, MucPhat)
        assert mp.min_vnd == 20_000_000
        assert mp.max_vnd == 30_000_000

    def test_muc_phat_k2_range(self):
        kg = load_kg(DATA_DIR / "kg_nodes.json", DATA_DIR / "kg_edges.json")
        mp = kg.find_node("mp-d95-k2")
        assert isinstance(mp, MucPhat)
        assert mp.min_vnd == 30_000_000
        assert mp.max_vnd == 50_000_000

    def test_thay_the_edge_nd15_nd174(self):
        kg = load_kg(DATA_DIR / "kg_nodes.json", DATA_DIR / "kg_edges.json")
        edges = kg.get_thay_the("nd15-d101-k1-a")
        assert len(edges) == 1
        assert edges[0].target == "nd174-d95-k1-a"
        assert "01/7/2026" in edges[0].dien_giai

    def test_bien_phap_go_bo(self):
        kg = load_kg(DATA_DIR / "kg_nodes.json", DATA_DIR / "kg_edges.json")
        bp = kg.find_node("bp-d95-k1k2")
        assert isinstance(bp, BienPhapKhacPhuc)
        assert "k1_k2" in bp.pham_vi

    def test_bien_phap_khoa_tk_only_k2(self):
        kg = load_kg(DATA_DIR / "kg_nodes.json", DATA_DIR / "kg_edges.json")
        bp = kg.find_node("bp-d95-k2-only")
        assert isinstance(bp, BienPhapKhacPhuc)
        assert bp.pham_vi == "k2_only"

    def test_hanh_vi_tin_gia_nhom(self):
        kg = load_kg(DATA_DIR / "kg_nodes.json", DATA_DIR / "kg_edges.json")
        hv = kg.find_node("hv-tin-gia")
        assert isinstance(hv, HanhVi)
        assert hv.nhom == NhomHanhVi.TIN_GIA

    def test_muc_phat_nguon_luon_to_chuc(self):
        kg = load_kg(DATA_DIR / "kg_nodes.json", DATA_DIR / "kg_edges.json")
        mps = [n for n in kg.nodes if isinstance(n, MucPhat)]
        for mp in mps:
            assert mp.ap_dung_cho == LoaiChuThe.TO_CHUC, f"{mp.id} should be to_chuc"
