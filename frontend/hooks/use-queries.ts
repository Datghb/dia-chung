import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Case, ApiQueueItem, StudyCase, Status, AuditEntry } from "../types";
import { API_URL, mapApiCase } from "../utils/api";

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
    mutationFn: async ({ id, status, reviewerLabel, reviewerReason, reviewerNote }: {
      id: string;
      status: Status;
      reviewerLabel?: string;
      reviewerReason?: string;
      reviewerNote?: string;
    }) => {
      const statusMap: Record<Status, string> = {
        Mới: "new",
        "Đang xử lý": "reviewing",
        "Đã xử lý": "resolved",
      };
      const body: Record<string, string> = { status: statusMap[status] };
      if (reviewerLabel) body.reviewer_label = reviewerLabel;
      if (reviewerReason) body.reviewer_reason = reviewerReason;
      if (reviewerNote) body.reviewer_note = reviewerNote;
      const response = await fetch(`${API_URL}/api/cases/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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

export function useAuditQuery(caseId: string) {
  return useQuery<AuditEntry[]>({
    queryKey: ["audit", caseId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/cases/${caseId}/audit`);
      if (!response.ok) throw new Error("Audit API unavailable");
      return response.json();
    },
    enabled: !!caseId,
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
