export type ClaimLabel = "dung" | "hieu_lam" | "can_kiem_chung";
export type SourceLabel =
  | "co_nguon_xac_nhan"
  | "co_bac_bo_chinh_thuc"
  | "chua_tim_thay_nguon";

export interface QueueItem {
  id: string;
  claim: string;
  label: ClaimLabel;
  source_label: SourceLabel;
  reason: string;
}
