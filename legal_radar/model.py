from __future__ import annotations

import json
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any


# ── Enums ──

class NhomHanhVi(str, Enum):
    TIN_GIA = "tin_gia"
    BOC_PHOT = "boc_phot"
    KHAC = "khac"


class LoaiChuThe(str, Enum):
    CA_NHAN = "ca_nhan"
    TO_CHUC = "to_chuc"


class NhanPhanLoai(str, Enum):
    DUNG = "dung"
    HIEU_LAM = "hieu_lam"
    CAN_KIEM_CHUNG = "can_kiem_chung"


class NhanNguon(str, Enum):
    CO_NGUON_XAC_NHAN = "co_nguon_xac_nhan"
    CO_BAC_BO_CHINH_THUC = "co_bac_bo_chinh_thuc"
    CHUA_TIM_THAY_NGUON = "chua_tim_thay_nguon"


# ── Frozen dataclasses (nodes) ──

@dataclass(frozen=True)
class VanBan:
    id: str
    so_hieu: str
    ngay_hieu_luc: str
    trang_thai: str


@dataclass(frozen=True)
class DieuKhoan:
    id: str
    van_ban: str
    dieu: int
    khoan: int | None
    diem: str | None
    noi_dung: str

    def __post_init__(self):
        if self.diem is not None and self.khoan is None:
            raise ValueError(f"diem requires khoan (id={self.id})")


@dataclass(frozen=True)
class HanhVi:
    id: str
    mo_ta: str
    nhom: NhomHanhVi

    def __post_init__(self):
        if isinstance(self.nhom, str):
            object.__setattr__(self, 'nhom', NhomHanhVi(self.nhom))


@dataclass(frozen=True)
class ChuThe:
    id: str
    loai: LoaiChuThe
    mo_ta: str


@dataclass(frozen=True)
class MucPhat:
    id: str
    min_vnd: int
    max_vnd: int
    ap_dung_cho: LoaiChuThe

    def __post_init__(self):
        if self.min_vnd < 0 or self.max_vnd < 0:
            raise ValueError(f"min_vnd/max_vnd must be >= 0 (id={self.id})")
        if self.min_vnd > self.max_vnd:
            raise ValueError(f"min_vnd ({self.min_vnd}) > max_vnd ({self.max_vnd}) (id={self.id})")


@dataclass(frozen=True)
class BienPhapKhacPhuc:
    id: str
    mo_ta: str
    pham_vi: str


@dataclass(frozen=True)
class NguonTin:
    id: str
    tier: int
    nguon: str
    tieu_de: str
    noi_dung_tom_tat: str
    ngay_dang: str
    url: str = ""

    def __post_init__(self):
        if self.tier not in (0, 1, 2):
            raise ValueError(f"tier must be 0, 1, or 2 (id={self.id}, got {self.tier})")


# ── Frozen dataclass (edge) ──

@dataclass(frozen=True)
class Edge:
    source: str
    target: str
    loai: str
    thuoc_tinh: dict[str, Any] = field(default_factory=dict)


# ── QueueItem ──

@dataclass
class QueueItem:
    id: str
    comment_id: str
    text: str
    claim: str
    keywords: list[str]
    nhan: NhanPhanLoai
    ly_do: str
    nhan_nguon: NhanNguon = NhanNguon.CHUA_TIM_THAY_NGUON
    priority: int = 0

    def __post_init__(self):
        if isinstance(self.nhan, str):
            self.nhan = NhanPhanLoai(self.nhan)
        if isinstance(self.nhan_nguon, str):
            self.nhan_nguon = NhanNguon(self.nhan_nguon)


# ── KnowledgeGraph container ──

_TYPE_MAP: dict[str, type] = {
    "VanBan": VanBan,
    "DieuKhoan": DieuKhoan,
    "HanhVi": HanhVi,
    "ChuThe": ChuThe,
    "MucPhat": MucPhat,
    "BienPhapKhacPhuc": BienPhapKhacPhuc,
    "NguonTin": NguonTin,
}


class KnowledgeGraph:
    def __init__(self, nodes: list[Any], edges: list[Edge]):
        self._nodes_by_id: dict[str, Any] = {}
        for n in nodes:
            if n.id in self._nodes_by_id:
                raise ValueError(f"Duplicate node id: {n.id}")
            self._nodes_by_id[n.id] = n

        node_ids = set(self._nodes_by_id)
        for e in edges:
            if e.source not in node_ids:
                raise ValueError(f"Edge source missing: {e.source}")
            if e.target not in node_ids:
                raise ValueError(f"Edge target missing: {e.target}")

        self.nodes: list[Any] = list(nodes)
        self.edges: list[Edge] = list(edges)

    def find_node(self, node_id: str) -> Any | None:
        return self._nodes_by_id.get(node_id)

    def get_edges_from(self, source_id: str) -> list[Edge]:
        return [e for e in self.edges if e.source == source_id]

    def get_edges_to(self, target_id: str) -> list[Edge]:
        return [e for e in self.edges if e.target == target_id]

    def get_dieu_khoan_for_hanh_vi(self, hanh_vi_id: str) -> list[DieuKhoan]:
        result = []
        for e in self.get_edges_from(hanh_vi_id):
            if e.loai == "QUY_DINH_TAI":
                node = self.find_node(e.target)
                if isinstance(node, DieuKhoan):
                    result.append(node)
        return result

    def get_muc_phat_for_dieu_khoan(self, dk_id: str) -> list[MucPhat]:
        result = []
        for e in self.get_edges_to(dk_id):
            if e.loai in ("AP_DUNG_CHO", "MUC_PHAT_AP_DUNG"):
                node = self.find_node(e.source)
                if isinstance(node, MucPhat):
                    result.append(node)
        return result

    def get_thay_the(self, dk_id: str) -> list[Edge]:
        return [e for e in self.edges if e.loai == "THAY_THE" and (e.source == dk_id or e.target == dk_id)]


# ── Loader ──

def _build_node(raw: dict[str, Any]) -> Any:
    t = raw.pop("type")
    cls = _TYPE_MAP.get(t)
    if cls is None:
        raise ValueError(f"Unknown node type: {t}")
    return cls(**raw)


def load_kg(nodes_path: Path, edges_path: Path | None = None) -> KnowledgeGraph:
    if edges_path is None:
        data = json.loads(nodes_path.read_text(encoding="utf-8"))
        nodes_raw = data["nodes"]
        edges_raw = data["edges"]
    else:
        nodes_raw = json.loads(nodes_path.read_text(encoding="utf-8"))
        edges_raw = json.loads(edges_path.read_text(encoding="utf-8"))
    nodes = [_build_node(dict(r)) for r in nodes_raw]
    edges = [Edge(**e) for e in edges_raw]
    return KnowledgeGraph(nodes=nodes, edges=edges)


def load_queue(path: Path) -> list[QueueItem]:
    data = json.loads(path.read_text(encoding="utf-8"))
    return [QueueItem(**item) for item in data]


# ── Validation ──

def validate_kg(kg: KnowledgeGraph) -> list[str]:
    errors: list[str] = []
    node_ids = {n.id for n in kg.nodes}

    for n in kg.nodes:
        if isinstance(n, DieuKhoan):
            if n.van_ban not in {vb.id for vb in kg.nodes if isinstance(vb, VanBan)}:
                errors.append(f"DieuKhoan {n.id}: van_ban '{n.van_ban}' not found")

    for e in kg.edges:
        if e.source not in node_ids:
            errors.append(f"Edge source '{e.source}' not found")
        if e.target not in node_ids:
            errors.append(f"Edge target '{e.target}' not found")

    return errors
