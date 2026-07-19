import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiQueueItem, AuditEntry, Case, Status, StudyCase } from "../types";
import { API_URL, mapApiCase } from "../utils/api";

export type ReviewDecision = "accepted" | "corrected" | "rejected";
export type ReviewLabel = "dung" | "hieu_lam" | "can_kiem_chung";

export async function createReviewerSession(adminKey: string): Promise<string> {
  const response = await fetch(`${API_URL}/api/auth/session`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": adminKey,
    },
    body: JSON.stringify({ actor: "web-reviewer", role: "reviewer" }),
  });
  if (!response.ok) throw new Error("Khóa quản trị không hợp lệ");
  const session = (await response.json()) as { csrf_token: string };
  return session.csrf_token;
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
    refetchInterval: 30000,
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
    mutationFn: async ({
      id,
      status,
      csrfToken,
      expectedVersion,
      reviewerLabel,
      reviewerReason,
      reviewerNote,
    }: {
      id: string;
      status: Status;
      csrfToken: string;
      expectedVersion?: number;
      reviewerLabel?: string;
      reviewerReason?: string;
      reviewerNote?: string;
    }) => {
      const statusMap: Record<Status, string> = {
        Mới: "new",
        "Đang xử lý": "reviewing",
        "Đã xử lý": "resolved",
      };
      const body: Record<string, string | number> = {
        status: statusMap[status],
      };
      if (expectedVersion) body.expected_version = expectedVersion;
      if (reviewerLabel) body.reviewer_label = reviewerLabel;
      if (reviewerReason) body.reviewer_reason = reviewerReason;
      if (reviewerNote) body.reviewer_note = reviewerNote;
      const response = await fetch(`${API_URL}/api/cases/${id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("Failed to update status");
      return response.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["queue"] });
    },
  });
}

export function useReviewCaseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      decision,
      note,
      correctedLabel,
      csrfToken,
      expectedVersion,
    }: {
      id: string;
      decision: ReviewDecision;
      note: string;
      correctedLabel?: ReviewLabel;
      csrfToken: string;
      expectedVersion: number;
    }) => {
      const response = await fetch(`${API_URL}/api/cases/${id}/review`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          decision,
          note,
          corrected_label: correctedLabel,
          expected_version: expectedVersion,
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(body?.detail || "Không thể lưu kết quả thẩm định");
      }
      return mapApiCase((await response.json()) as ApiQueueItem);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["queue"] });
    },
  });
}

export function useAuditQuery(caseId: string, sessionReady: boolean) {
  return useQuery<AuditEntry[]>({
    queryKey: ["audit", caseId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/cases/${caseId}/audit`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Audit API unavailable");
      return response.json();
    },
    enabled: Boolean(caseId && sessionReady),
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
