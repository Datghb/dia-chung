export type Verdict = "SUPPORTED" | "CONTRADICTED" | "MISSING_CONTEXT" | "INSUFFICIENT_EVIDENCE";
export type Risk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ReviewStatus = "New" | "Reviewing" | "Resolved" | "Dismissed";

export interface Claim {
  id: string;
  text: string;
  entity: string;
  verdict: Verdict;
  risk: Risk;
  confidence: number;
  provision: string;
  source: string;
}

export interface Alert {
  id: string;
  claim: string;
  platform: string;
  reach: string;
  score: number;
  reason: string;
  provision: string;
  owner: string;
  status: ReviewStatus;
}
