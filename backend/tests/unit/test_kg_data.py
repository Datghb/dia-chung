import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data")


def _load(filename):
    path = os.path.join(DATA_DIR, filename)
    with open(path, encoding="utf-8") as f:
        return json.load(f)


class TestKgNodes:
    def setup_method(self):
        self.nodes = _load("kg/kg_nodes.json")

    def test_file_is_list(self):
        assert isinstance(self.nodes, list)
        assert len(self.nodes) > 0

    def test_required_fields_per_type(self):
        required = {
            "VanBan": {"id", "type", "so_hieu", "ngay_hieu_luc", "trang_thai"},
            "DieuKhoan": {"id", "type", "van_ban_id", "dieu", "khoan", "noi_dung"},
            "HanhVi": {"id", "type", "dieu_khoan_id", "mo_ta", "nhom"},
            "ChuThe": {"id", "type", "loai", "mo_ta_nhan_dien"},
            "MucPhat": {"id", "type", "dieu_khoan_id", "min_vnd", "max_vnd", "ap_dung_cho"},
            "BienPhapKhacPhuc": {"id", "type", "dieu_khoan_id", "mo_ta", "pham_vi"},
        }
        for node in self.nodes:
            ntype = node["type"]
            assert ntype in required, f"Unknown type: {ntype}"
            for field in required[ntype]:
                assert field in node, f"Missing '{field}' in {ntype} node {node.get('id')}"

    def test_unique_ids(self):
        ids = [n["id"] for n in self.nodes]
        assert len(ids) == len(set(ids)), f"Duplicate IDs: {[x for x in ids if ids.count(x) > 1]}"

    def test_van_ban_exists(self):
        types = {n["type"] for n in self.nodes}
        assert "VanBan" in types
        van_ban_ids = {n["id"] for n in self.nodes if n["type"] == "VanBan"}
        assert "nd174" in van_ban_ids
        assert "nd15" in van_ban_ids

    def test_dieu_khoan_references_valid_van_ban(self):
        van_ban_ids = {n["id"] for n in self.nodes if n["type"] == "VanBan"}
        for node in self.nodes:
            if node["type"] == "DieuKhoan":
                assert node["van_ban_id"] in van_ban_ids, \
                    f"DieuKhoan {node['id']} references invalid van_ban_id '{node['van_ban_id']}'"

    def test_dieu_khoan_hierarchy(self):
        for node in self.nodes:
            if node["type"] == "DieuKhoan":
                if node.get("diem"):
                    assert node.get("khoan") is not None, \
                        f"DieuKhoan {node['id']} has diem but no khoan"
                if node.get("khoan") is not None:
                    assert node.get("dieu") is not None, \
                        f"DieuKhoan {node['id']} has khoan but no dieu"

    def test_muc_phat_min_le_max(self):
        for node in self.nodes:
            if node["type"] == "MucPhat":
                assert node["min_vnd"] <= node["max_vnd"], \
                    f"MucPhat {node['id']}: min ({node['min_vnd']}) > max ({node['max_vnd']})"

    def test_muc_phat_positive(self):
        for node in self.nodes:
            if node["type"] == "MucPhat":
                assert node["min_vnd"] > 0, f"MucPhat {node['id']} min_vnd <= 0"
                assert node["max_vnd"] > 0, f"MucPhat {node['id']} max_vnd <= 0"

    def test_enum_values(self):
        valid_nhom = {"tin_gia", "boc_phot", "khac"}
        valid_loai = {"ca_nhan", "to_chuc"}
        valid_trang_thai = {"hieu_luc", "het_hieu_luc"}
        valid_ap_dung = {"to_chuc", "ca_nhan"}
        valid_pham_vi = {"k1_k2", "k2_only"}

        for node in self.nodes:
            if node["type"] == "HanhVi":
                assert node["nhom"] in valid_nhom, \
                    f"HanhVi {node['id']}: invalid nhom '{node['nhom']}'"
            if node["type"] == "ChuThe":
                assert node["loai"] in valid_loai, \
                    f"ChuThe {node['id']}: invalid loai '{node['loai']}'"
            if node["type"] == "VanBan":
                assert node["trang_thai"] in valid_trang_thai, \
                    f"VanBan {node['id']}: invalid trang_thai '{node['trang_thai']}'"
            if node["type"] == "MucPhat":
                assert node["ap_dung_cho"] in valid_ap_dung, \
                    f"MucPhat {node['id']}: invalid ap_dung_cho '{node['ap_dung_cho']}'"
            if node["type"] == "BienPhapKhacPhuc":
                assert node["pham_vi"] in valid_pham_vi, \
                    f"BienPhapKhacPhuc {node['id']}: invalid pham_vi '{node['pham_vi']}'"

    def test_nd174_d95_exists(self):
        d95_nodes = [n for n in self.nodes if n["type"] == "DieuKhoan"
                     and n.get("dieu") == 95 and n.get("van_ban_id") == "nd174"]
        assert len(d95_nodes) >= 5, f"Expected >=5 DieuKhoan for Đ95 NĐ174, got {len(d95_nodes)}"

    def test_nd15_d101_exists(self):
        d101_nodes = [n for n in self.nodes if n["type"] == "DieuKhoan"
                      and n.get("dieu") == 101 and n.get("van_ban_id") == "nd15"]
        assert len(d101_nodes) >= 3, f"Expected >=3 DieuKhoan for Đ101 NĐ15, got {len(d101_nodes)}"


class TestKgEdges:
    def setup_method(self):
        self.edges = _load("kg/kg_edges.json")
        self.nodes = _load("kg/kg_nodes.json")
        self.node_ids = {n["id"] for n in self.nodes}

    def test_file_is_list(self):
        assert isinstance(self.edges, list)
        assert len(self.edges) > 0

    def test_required_fields(self):
        required = {"type", "from_id", "to_id"}
        for edge in self.edges:
            for field in required:
                assert field in edge, f"Missing '{field}' in edge {edge}"

    def test_edge_types_valid(self):
        valid_types = {"THAY_THE", "QUY_DINH_TAI", "AP_DUNG_CHO"}
        for edge in self.edges:
            assert edge["type"] in valid_types, f"Invalid edge type: {edge['type']}"

    def test_references_valid_nodes(self):
        for edge in self.edges:
            assert edge["from_id"] in self.node_ids, \
                f"Edge references invalid from_id: '{edge['from_id']}'"
            assert edge["to_id"] in self.node_ids, \
                f"Edge references invalid to_id: '{edge['to_id']}'"

    def test_thay_the_edges_exist(self):
        thay_the = [e for e in self.edges if e["type"] == "THAY_THE"]
        assert len(thay_the) >= 5, f"Expected >=5 THAY_THE edges, got {len(thay_the)}"

    def test_thay_the_has_dien_giai(self):
        for edge in self.edges:
            if edge["type"] == "THAY_THE":
                assert "dien_giai" in edge, \
                    f"THAY_THE edge {edge['from_id']}→{edge['to_id']} missing dien_giai"
                assert len(edge["dien_giai"]) > 10, \
                    f"THAY_THE edge dien_giai too short: '{edge['dien_giai']}'"

    def test_ap_dung_cho_has_he_so(self):
        for edge in self.edges:
            if edge["type"] == "AP_DUNG_CHO":
                assert "he_so" in edge, \
                    f"AP_DUNG_CHO edge {edge['from_id']}→{edge['to_id']} missing he_so"

    def test_rule_half_in_edges(self):
        ap_dung = [e for e in self.edges if e["type"] == "AP_DUNG_CHO"]
        pairs = {}
        for e in ap_dung:
            mp_id = e["from_id"]
            if mp_id not in pairs:
                pairs[mp_id] = {}
            pairs[mp_id][e["to_id"]] = e.get("he_so", 1.0)

        for mp_id, mapping in pairs.items():
            if "ct-to-chuc" in mapping and "ct-ca-nhan" in mapping:
                assert mapping["ct-to-chuc"] == 1.0, \
                    f"{mp_id}: to_chuc he_so should be 1.0"
                assert mapping["ct-ca-nhan"] == 0.5, \
                    f"{mp_id}: ca_nhan he_so should be 0.5"




