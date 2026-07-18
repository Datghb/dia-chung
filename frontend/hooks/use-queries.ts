import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Case, ApiQueueItem, StudyCase, Verdict, Priority, Status } from "../types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.theoria-lab.io.vn";

export function mapApiCase(item: ApiQueueItem): Case {
  const verdictMap: Record<ApiQueueItem["label"], Verdict> = {
    dung: "Đúng",
    hieu_lam: "Hiểu lầm",
    can_kiem_chung: "Cần kiểm chứng",
  };
  const priority: Priority =
    item.priority >= 2
      ? "Khẩn cấp"
      : item.priority === 1
      ? "Cao"
      : item.reach >= 150
      ? "Trung bình"
      : "Thấp";
  const platform = (["Facebook", "TikTok", "YouTube", "X", "Forum"].includes(item.platform)
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
    priority,
    score: item.score ?? Math.min(95, 30 + item.priority * 20 + Math.min(25, Math.round(item.reach / 10))),
    confidence: item.confidence ?? 50,
    verdict: verdictMap[item.label],
    status: item.status === "resolved" ? "Đã xử lý" : item.status === "reviewing" ? "Đang xử lý" : "Mới",
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
    postComments: item.comments || [],
  };
}

export function useQueueQuery() {
  return useQuery<Case[]>({
    queryKey: ["queue"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/queue?_=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!response.ok) throw new Error("Queue API unavailable");
      const queue = (await response.json()) as ApiQueueItem[];
      return queue.map(mapApiCase);
    },
    refetchInterval: 30000, // automatic polling every 30 seconds
  });
}

export function useVerifyQuery() {
  return useQuery<StudyCase[]>({
    queryKey: ["verify"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/verify`, { cache: "no-store" });
      if (!response.ok) throw new Error("Verify API unavailable");
      const data = (await response.json()) as { cases: StudyCase[] };
      return data.cases || [];
    },
  });
}

export function useUpdateStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const statusMap: Record<Status, string> = {
        Mới: "new",
        "Đang xử lý": "reviewing",
        "Đã xử lý": "resolved",
      };
      const response = await fetch(`${API_URL}/api/cases/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusMap[status] }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      return response.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["queue"] });
    },
  });
}

export function useClearQueueMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/api/queue`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to clear queue");
      return response.json() as Promise<{ deleted: number; message: string }>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["queue"] });
    },
  });
}
