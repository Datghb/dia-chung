import type { ApiQueueItem, Case } from "@/types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.theoria-lab.io.vn";

export function mapApiCase(item: ApiQueueItem): Case {
  const verdictMap: Record<ApiQueueItem["label"], Case["verdict"]> = {
    dung: "Đúng",
    hieu_lam: "Hiểu lầm",
    can_kiem_chung: "Cần kiểm chứng",
  };
  const platform = (["Facebook", "TikTok", "YouTube", "Web", "Forum"].includes(
    item.platform,
  )
    ? item.platform
    : "Forum") as Case["platform"];
  const sourceResult =
    item.source_label === "co_nguon_xac_nhan"
      ? "Có nguồn chính thức xác nhận"
      : item.source_label === "co_bac_bo_chinh_thuc"
        ? "Có nguồn chính thức bác bỏ"
        : "Chưa tìm thấy nguồn phù hợp";
  return {
    id: item.id,
    claim: item.claim,
    original: item.text || item.claim,
    platform,
    account: item.account,
    publishedAt: item.published_at || "Chưa xác định",
    createdAt: item.created_at || item.published_at || "",
    priority:
      item.priority >= 2
        ? "Khẩn cấp"
        : item.priority === 1
          ? "Cao"
          : item.reach >= 150
            ? "Trung bình"
            : "Thấp",
    score:
      item.score ??
      Math.min(95, 30 + item.priority * 20 + Math.min(25, Math.round(item.reach / 10))),
    confidence: item.confidence ?? 50,
    spreadRisk: item.spread_risk ?? 0,
    aiAccuracy: item.ai_accuracy ?? 0,
    sourceReliability: item.source_reliability ?? 0,
    verdict: verdictMap[item.label],
    status:
      item.status === "resolved"
        ? "Đã xử lý"
        : item.status === "reviewing"
          ? "Đang xử lý"
          : "Mới",
    reason: item.reason,
    document: item.document || "Nghị định 174/2026/NĐ-CP",
    provision: item.provision || "Điều 95 — cần đối chiếu",
    subject: item.subject || "Chưa xác định",
    penalty: item.penalty || "Cần xác định chủ thể",
    sourceTitle: item.source_title || sourceResult,
    sourceAgency: item.source_agency || "",
    sourceUrl: item.source_url || "",
    postUrl: item.url || "",
    sourceResult,
    reach: `${item.reach.toLocaleString("vi-VN")} lượt tương tác`,
    contentType: "post",
    keywords: item.keywords || [],
    comments: item.comments || item.post_comments || [],
    humanLabel: item.human_label || undefined,
    humanSourceLabel: item.human_source_label || undefined,
    reviewerNotes: item.reviewer_notes || undefined,
    reviewerLabel: item.reviewer_label || "",
    reviewerReason: item.reviewer_reason || "",
    reviewerNote: item.reviewer_note || "",
    reviewedAt: item.reviewed_at || "",
  };
}

export async function fetchQueue(): Promise<Case[]> {
  const response = await fetch(`${API_URL}/api/queue?_=${Date.now()}`, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });
  if (!response.ok) throw new Error("Queue API unavailable");
  const queue = (await response.json()) as ApiQueueItem[];
  return queue.map(mapApiCase);
}

export async function reviewCase(
  caseId: string,
  body: {
    human_label?: string;
    human_source_label?: string;
    reviewer_notes?: string;
    action?: "approve" | "reject" | "escalate";
  },
): Promise<ApiQueueItem> {
  const response = await fetch(`${API_URL}/api/cases/${caseId}/review`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("Review API failed");
  return response.json();
}
