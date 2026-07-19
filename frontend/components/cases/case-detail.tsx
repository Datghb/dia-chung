"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ReviewDecision,
  ReviewLabel,
  createReviewerSession,
  useAuditQuery,
  useReviewCaseMutation,
  useUpdateStatusMutation,
} from "../../hooks/use-queries";
import { VerdictBadge } from "../common/badge";
import { Case, Status, AuditEntry } from "../../types";
import {
  ExternalLink, Check, HelpCircle, Scale, ArrowRight, ArrowLeft, X, AlertTriangle, ClipboardCheck, Clock, ThumbsUp, Flag
} from "lucide-react";

const statuses: Status[] = ["Mới", "Đang xử lý", "Đã xử lý"];

function platformIcon(platform: Case["platform"]) {
  const paths: Record<Case["platform"], string> = {
    Facebook:
      "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z",
    TikTok:
      "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
    YouTube:
      "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
    Web: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.92 6h-3.03a15.7 15.7 0 0 0-1.38-3.56A8.06 8.06 0 0 1 18.92 8ZM12 4c.83 1.2 1.47 2.53 1.82 4h-3.64C10.53 6.53 11.17 5.2 12 4ZM4.26 14a7.8 7.8 0 0 1 0-4h3.39a16.5 16.5 0 0 0 0 4H4.26Zm.82 2h3.03c.3 1.26.77 2.45 1.38 3.56A8.06 8.06 0 0 1 5.08 16ZM12 20c-.83-1.2-1.47-2.53-1.82-4h3.64c-.35 1.47-.99 2.8-1.82 4Zm2.21-6H9.79a14.3 14.3 0 0 1 0-4h4.42a14.3 14.3 0 0 1 0 4Zm.3 5.56A15.7 15.7 0 0 0 15.89 16h3.03a8.06 8.06 0 0 1-4.41 3.56ZM16.35 14a16.5 16.5 0 0 0 0-4h3.39a7.8 7.8 0 0 1 0 4h-3.39Z",
    Forum:
      "M12.103 0C18.666 0 24 5.485 24 11.997c0 6.51-5.33 11.99-11.9 11.99L0 24V11.79C0 5.28 5.532 0 12.103 0zm.116 4.563c-2.593-.003-4.996 1.352-6.337 3.57-1.33 2.208-1.387 4.957-.148 7.22L4.4 19.61l4.794-1.074c2.745 1.225 5.965.676 8.136-1.39 2.17-2.054 2.86-5.228 1.737-7.997-1.135-2.778-3.84-4.59-6.84-4.585h-.008z",
  };
  const colors: Record<Case["platform"], string> = {
    Facebook: "text-[#1877f2]",
    TikTok: "text-[#111]",
    YouTube: "text-[#ff0033]",
    Web: "text-[#16a36a]",
    Forum: "text-[#aeb6c2]",
  };
  return (
    <svg
      className={`block fill-current ${colors[platform]}`}
      viewBox="0 0 24 24"
      role="img"
      aria-label={`${platform} logo`}
      style={{ width: 14, height: 14 }}
    >
      <path d={paths[platform]} />
    </svg>
  );
}

const platformBg: Record<Case["platform"], string> = {
  Facebook: "bg-[#e8f0f8] text-[#286298]",
  TikTok: "bg-[#202a34] text-white",
  YouTube: "bg-[#ffebe9] text-[#c54137]",
  Web: "bg-[#e8f8ee] text-[#147a49]",
  Forum: "bg-[#e8f0f8] text-[#286298]",
};

function statusLabel(s: string): string {
  return s === "new" ? "Mới" : s === "reviewing" ? "Đang xử lý" : s === "resolved" ? "Đã xử lý" : s;
}
function labelLabel(l: string): string {
  return l === "dung" ? "Đúng" : l === "hieu_lam" ? "Hiểu lầm" : l === "can_kiem_chung" ? "Cần kiểm chứng" : l || "—";
}

const detailCard = "rounded-[13px] border border-[#e8eaf1] bg-white p-4";
const cardLabel = "block text-[10px] tracking-[.9px] text-[#8090a0]";
const cardHeading = "flex items-center justify-between border-b border-[#eff0f5] pb-[11px]";
const cardHeadingIcon =
  "grid h-[25px] w-[25px] place-items-center rounded-full bg-linear-145 from-[#fff0fb] to-[#f2e8ff] text-[9px] font-extrabold text-[#ba1eaa]";
const cardHeadingTitle = "mt-[3px] text-[14px] font-[750] text-[#293149]";
const confidenceRow = "flex text-[12px] text-[#788499]";
const confidenceTrack = "mt-2 mb-3 h-[5px] overflow-hidden rounded-[5px] bg-[#f0e8f0]";
const flowStep = "flex-1 rounded-[9px] px-[5px] py-[11px] text-center text-[8px] font-extrabold";

export function CaseDetail({ item, onClose }: { item: Case; onClose?: () => void }) {
  const router = useRouter();
  const updateStatusMutation = useUpdateStatusMutation();
  const reviewMutation = useReviewCaseMutation();
  const [currentStatus, setCurrentStatus] = useState<Status>(item.status);
  const [currentVersion, setCurrentVersion] = useState(item.version ?? 1);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(true);
  const [reviewDecision, setReviewDecision] = useState<ReviewDecision>("accepted");
  const [correctedLabel, setCorrectedLabel] = useState<ReviewLabel>("can_kiem_chung");
  const [reviewNote, setReviewNote] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewerLabel, setReviewerLabel] = useState(item.reviewerLabel || "");
  const [reviewerReason, setReviewerReason] = useState(item.reviewerReason || "");
  const [reviewerNote, setReviewerNote] = useState(item.reviewerNote || "");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewSaved, setReviewSaved] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const auditQuery = useAuditQuery(item.id, Boolean(csrfToken));

  async function ensureSession(): Promise<string> {
    if (csrfToken) return csrfToken;
    if (!adminKey.trim()) {
      throw new Error("Nhập khóa quản trị để mở phiên chuyên viên.");
    }
    const token = await createReviewerSession(adminKey.trim());
    setCsrfToken(token);
    setAdminKey("");
    return token;
  }

  const handleBack = () => {
    if (onClose) onClose();
    else router.push("/queue");
  };

  const handleStatusChange = async (status: Status) => {
    setVerifyError("");
    try {
      const token = await ensureSession();
      const updated = await updateStatusMutation.mutateAsync({
        id: item.id,
        status,
        csrfToken: token,
        expectedVersion: currentVersion,
      });
      setCurrentVersion(updated.version ?? currentVersion + 1);
      setCurrentStatus(status);
    } catch {
      setVerifyError("Không thể cập nhật trạng thái. Kiểm tra khóa quản trị và kết nối API.");
    }
  };

  async function handleStartVerification() {
    setVerifyLoading(true);
    setVerifyError("");
    try {
      await handleStatusChange("Đang xử lý");
    } catch {
      setVerifyError("Không thể kết nối API.");
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handleReviewSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReviewMessage("");
    if (reviewDecision !== "accepted" && !reviewNote.trim()) {
      setReviewMessage("Cần ghi lý do khi sửa hoặc bác bỏ kết quả AI.");
      return;
    }
    try {
      const token = await ensureSession();
      const updated = await reviewMutation.mutateAsync({
        id: item.id,
        decision: reviewDecision,
        note: reviewNote.trim(),
        correctedLabel: reviewDecision === "corrected" ? correctedLabel : undefined,
        csrfToken: token,
        expectedVersion: currentVersion,
      });
      setCurrentVersion(updated.version ?? currentVersion + 1);
      setCurrentStatus("Đã xử lý");
      setReviewMessage("Đã lưu quyết định và ghi nhật ký kiểm toán.");
    } catch (error) {
      setReviewMessage(
        error instanceof Error ? error.message : "Không thể lưu kết quả thẩm định.",
      );
    }
  }

  async function handleReview(action: "approve" | "escalate") {
    setReviewLoading(true);
    try {
      const token = await ensureSession();
      if (action === "approve") {
        const updated = await reviewMutation.mutateAsync({
          id: item.id,
          decision: "accepted",
          note: "",
          csrfToken: token,
          expectedVersion: currentVersion,
        });
        setCurrentVersion(updated.version ?? currentVersion + 1);
        setCurrentStatus("Đã xử lý");
      } else if (action === "escalate") {
        await handleStatusChange("Đang xử lý");
      }
    } catch {
      setVerifyError("Không thể lưu quyết định thẩm định.");
    } finally {
      setReviewLoading(false);
    }
  }

  async function handleSaveReview(andResolve: boolean) {
    setReviewSaving(true);
    try {
      const token = await ensureSession();
      const targetStatus: Status = andResolve ? "Đã xử lý" : currentStatus;
      const updated = await updateStatusMutation.mutateAsync({
        id: item.id,
        status: targetStatus,
        csrfToken: token,
        expectedVersion: currentVersion,
        reviewerLabel,
        reviewerReason,
        reviewerNote,
      });
      setCurrentVersion(updated.version ?? currentVersion + 1);
      if (andResolve) setCurrentStatus("Đã xử lý");
      setReviewSaved(true);
      setTimeout(() => setReviewSaved(false), 2000);
      void auditQuery.refetch();
    } catch {
      // ignore
    } finally {
      setReviewSaving(false);
    }
  }

  return (
    <>
      <button
        className="fixed inset-0 z-[70] border-0 bg-[#1e24465c] backdrop-blur-[3px]"
        onClick={handleBack}
        aria-label="Đóng hồ sơ"
      />
      <div className="fixed inset-y-0 right-0 z-[80] w-[min(590px,100vw)] overflow-y-auto bg-white px-[26px] pt-[26px] pb-[86px] shadow-[-18px_0_55px_#1e294426] max-[700px]:px-4 max-[700px]:pt-[22px]">
      <button
        className="absolute top-[17px] right-[18px] grid h-[34px] w-[34px] place-items-center rounded-full border-0 bg-[#f7f3f7] text-[#4e5970]"
        onClick={handleBack}
        aria-label="Đóng hồ sơ"
      >
        <X size={22} />
      </button>
      <div className="mb-[15px] border-b border-[#e8eaf1] pt-1 pr-[42px] pb-[18px]">
        <div>
          <span className="text-[10px] font-extrabold tracking-[1.5px] text-[#c01cad]">
            CHI TIẾT HỒ SƠ · {item.id}
          </span>
          <h1 className="my-[9px] text-[19px] font-[760] leading-[1.35] tracking-[-.4px] text-[#202944]">
            {item.claim}
          </h1>
        </div>
        <label className="mt-[15px] flex items-center gap-3 text-[10px] font-bold tracking-[.7px] text-[#728194]">
          Trạng thái xử lý
          <select
            className="flex-1 rounded-[10px] border border-[#e7e9f0] bg-[#fafbfe] px-3 py-2.5 text-[13px] text-[#35495e] outline-none focus:border-[#d638b5] focus:shadow-[0_0_0_3px_#d638b512]"
            value={currentStatus}
            onChange={(event) => handleStatusChange(event.target.value as Status)}
          >
            {statuses.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <div className="grid gap-[13px]">
          <section className={detailCard}>
            <div className={cardHeading}>
              <div className="flex items-center gap-[11px]">
                <span className={cardHeadingIcon}>01</span>
                <div>
                  <small className={cardLabel}>NỘI DUNG GỐC</small>
                  <h2 className={cardHeadingTitle}>Bài viết được giám sát</h2>
                </div>
              </div>
              <em className="text-[11px] not-italic text-[#778698]">{item.reach}</em>
            </div>
            <div className="flex items-center pt-4 pb-[5px]">
              <span
                className={`mr-[7px] inline-grid h-[25px] w-[25px] place-items-center rounded-full font-extrabold shadow-[inset_0_0_0_1px_#ffffff90] ${platformBg[item.platform]}`}
              >
                {platformIcon(item.platform)}
              </span>
              <div>
                <strong className="block text-[13px]">{item.account}</strong>
                <small className="mt-[3px] block text-[11px] text-[#8593a1]">
                  {item.platform} · {item.publishedAt}
                </small>
              </div>
            </div>
            {item.postUrl && item.postUrl !== "#" && (
              <div style={{ marginBottom: 12 }}>
                <a
                  href={item.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#3b82f6", fontSize: 13, textDecoration: "none" }}
                >
                  <ExternalLink size={14} className="mr-1 inline align-[-2px]" /> Xem bài viết gốc trên {item.platform}
                </a>
              </div>
            )}
            <blockquote className="my-3 rounded-r-xl border-l-[3px] border-[#d721ac] bg-[#fdf8ff] p-[13px] font-[Georgia] text-[13px] leading-[1.55] text-[#283d52]">
              {"\u201C"}
              {item.original}
              {"\u201D"}
            </blockquote>
            <div style={{ marginTop: 16 }}>
              {(() => {
                const allComments = item.postComments || item.comments || [];
                const flaggedComments = allComments.filter(
                  (c) => c.label === "hieu_lam" || c.label === "can_kiem_chung"
                );
                const displayComments = showFlaggedOnly ? flaggedComments : allComments;
                return (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 12,
                      }}
                    >
                      <small style={{ color: "#94a3b8", fontSize: 12, letterSpacing: "0.05em" }}>
                        BÌNH LUẬN BÀI VIẾT ({flaggedComments.length}/{allComments.length} cần chú ý)
                      </small>
                      <button
                        onClick={() => setShowFlaggedOnly(!showFlaggedOnly)}
                        style={{
                          background: showFlaggedOnly ? "#1e293b" : "#334155",
                          color: "#94a3b8",
                          border: "1px solid #475569",
                          borderRadius: 6,
                          padding: "4px 10px",
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        {showFlaggedOnly ? "Hiện tất cả" : "Chỉ flagged"}
                      </button>
                    </div>
                    {displayComments.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          maxHeight: 400,
                          overflowY: "auto",
                          paddingRight: 4,
                        }}
                      >
                        {displayComments.map((comment, idx) => {
                          const labelColors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
                            hieu_lam: { bg: "#1a0a0a", border: "#dc2626", text: "#fca5a5", badge: "Hiểu lầm" },
                            can_kiem_chung: { bg: "#1a1500", border: "#d97706", text: "#fcd34d", badge: "Cần kiểm chứng" },
                            dung: { bg: "#0a1a0a", border: "#16a34a", text: "#86efac", badge: "Đúng" },
                          };
                          const lc = comment.label ? labelColors[comment.label] : null;
                          return (
                            <div
                              key={idx}
                              style={{
                                background: lc?.bg || "#0f172a",
                                borderRadius: 8,
                                padding: "10px 14px",
                                borderLeft: `3px solid ${lc?.border || "#334155"}`,
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <strong style={{ fontSize: 13, color: "#e2e8f0" }}>{comment.author || "Ẩn danh"}</strong>
                                  {lc && (
                                    <span
                                      style={{
                                        fontSize: 9,
                                        fontWeight: 700,
                                        color: lc.text,
                                        background: `${lc.border}22`,
                                        padding: "2px 6px",
                                        borderRadius: 4,
                                      }}
                                    >
                                      {lc.badge}
                                    </span>
                                  )}
                                </div>
                                <small style={{ color: "#64748b", fontSize: 11 }}>{comment.timestamp || ""}</small>
                              </div>
                              <p style={{ fontSize: 13, color: "#cbd5e1", margin: 0, lineHeight: 1.5 }}>
                                {comment.text}
                              </p>
                              {comment.label_reason && comment.label !== "dung" && (
                                <p style={{ fontSize: 11, color: lc?.text || "#94a3b8", margin: "4px 0 0", fontStyle: "italic" }}>
                                  {comment.label_reason}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>
                        {showFlaggedOnly
                          ? "Không có bình luận nào cần chú ý"
                          : "Chưa có bình luận"}
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          </section>

          <section className={detailCard}>
            <div className={cardHeading}>
              <div className="flex items-center gap-[11px]">
                <span className={cardHeadingIcon}>02</span>
                <div>
                  <small className={cardLabel}>PHÂN TÍCH AI</small>
                  <h2 className={cardHeadingTitle}>Claim được trích xuất</h2>
                </div>
              </div>
              <VerdictBadge value={item.verdict} />
            </div>
            <div className="my-3 rounded-[7px] bg-linear-145 from-[#faf6ff] to-[#f6f7fc] p-[13px] font-[Georgia] text-[14px] font-semibold leading-[1.5] text-[#292e4a]">
              “{item.claim}”
            </div>
            <div className="border-l-2 border-[#d929b2] pl-3">
              <small className={cardLabel}>LÝ DO PHÂN LOẠI</small>
              <p className="mt-[6px] mb-0 text-[11px] leading-[1.6] text-[#586a7c]">{item.reason}</p>
            </div>
          </section>

          <section className={detailCard}>
            <div className={cardHeading}>
              <div className="flex items-center gap-[11px]">
                <span className={cardHeadingIcon}>03</span>
                <div>
                  <small className={cardLabel}>KIỂM CHỨNG NGUỒN</small>
                  <h2 className={cardHeadingTitle}>Đối chiếu nguồn chính thức</h2>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-[9px] px-2.5 py-[7px] text-[11px] font-[750] whitespace-nowrap ${
                  item.verdict === "Đúng"
                    ? "bg-[#e8f5ef] text-[#247656]"
                    : item.verdict === "Hiểu lầm"
                    ? "bg-[#ffebe8] text-[#a63b35]"
                    : "bg-[#fff4d9] text-[#90621a]"
                }`}
              >
                {item.verdict === "Đúng" ? <Check size={14} className="inline align-[-2px]" /> : item.verdict === "Hiểu lầm" ? <AlertTriangle size={14} className="inline align-[-2px]" /> : <HelpCircle size={14} className="inline align-[-2px]" />} {item.sourceResult}
              </span>
            </div>
            <div className="flex items-center gap-3 pt-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-linear-145 from-[#3d4774] to-[#202a53] font-[Georgia] text-[12px] font-semibold text-white shadow-[0_7px_15px_#20294b25]">
                CQ
              </div>
              <div>
                <small className={cardLabel}>NGUỒN CHÍNH THỨC</small>
                <h3 className="my-[3px] text-[14px]">{item.sourceTitle}</h3>
                <p className="m-0 text-[11px] text-[#83909e]">{item.sourceAgency}</p>
              </div>
              {item.sourceUrl && item.sourceUrl !== "#" ? (
                <a
                  className="ml-auto rounded-[9px] bg-[#fbf0fb] px-2.5 py-2 text-[12px] text-[#b51aa8] no-underline"
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Mở nguồn <ExternalLink size={14} className="inline align-[-2px]" />
                </a>
              ) : (
                <span
                  className="ml-auto rounded-[9px] bg-[#f3f4f7] px-2.5 py-2 text-[11px] whitespace-nowrap text-[#9aa2b1]"
                  aria-disabled="true"
                >
                  Chưa có URL nguồn
                </span>
              )}
            </div>
          </section>
        </div>

        <aside className="mt-[13px] grid gap-[13px]">
          <section className={detailCard}>
            <small className="block text-[10px] tracking-[.9px] text-[#788499]">KẾT QUẢ THẨM ĐỊNH AI</small>
            <VerdictBadge value={item.verdict} large />
            <div className={confidenceRow}>
              <span>Mức rủi ro lan truyền</span>
              <strong className="ml-auto text-[#1d2940]">{item.spreadRisk}/100</strong>
            </div>
            <div className={confidenceTrack}>
              <i
                className="block h-full rounded-[5px] bg-linear-90 from-[#ff4cb7] to-[#b731e3]"
                style={{ width: `${item.spreadRisk}%` }}
              />
            </div>
            <div className={confidenceRow}>
              <span>Độ chính xác AI</span>
              <strong className="ml-auto text-[#1d2940]">{item.aiAccuracy}/100</strong>
            </div>
            <div className={confidenceTrack}>
              <i
                className="block h-full rounded-[5px] bg-linear-90 from-[#4cb7ff] to-[#31b7e3]"
                style={{ width: `${item.aiAccuracy}%` }}
              />
            </div>
            <div className={confidenceRow}>
              <span>Độ tin cậy nguồn</span>
              <strong className="ml-auto text-[#1d2940]">{item.sourceReliability}/100</strong>
            </div>
            <div className={confidenceTrack}>
              <i
                className="block h-full rounded-[5px] bg-linear-90 from-[#32be7a] to-[#11975c]"
                style={{ width: `${item.sourceReliability}%` }}
              />
            </div>
            <p className="m-0 text-[11px] leading-[1.5] text-[#788499]">
              Kết quả tự động hỗ trợ sàng lọc, không thay thế kết luận của chuyên viên.
            </p>
          </section>
          <section className={detailCard} aria-labelledby="human-review-title">
            <small className={cardLabel}>HUMAN REVIEW</small>
            <h2 id="human-review-title" className={`${cardHeadingTitle} mb-3`}>
              Quyết định của chuyên viên
            </h2>
            <form className="grid gap-3" onSubmit={handleReviewSubmit}>
              <div className="grid grid-cols-3 gap-2" role="group" aria-label="Quyết định thẩm định">
                {[
                  ["accepted", "Chấp nhận kết quả AI"],
                  ["corrected", "Sửa kết luận"],
                  ["rejected", "Bác bỏ kết quả"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`rounded-[9px] border px-2 py-2.5 text-[10px] font-bold ${
                      reviewDecision === value
                        ? "border-[#c524ad] bg-[#fff2fc] text-[#a51698]"
                        : "border-[#e2e5ec] bg-white text-[#657186]"
                    }`}
                    aria-pressed={reviewDecision === value}
                    onClick={() => setReviewDecision(value as ReviewDecision)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {reviewDecision === "corrected" && (
                <label className="grid gap-1.5 text-[10px] font-bold text-[#667389]">
                  Kết luận đã hiệu chỉnh
                  <select
                    className="rounded-[9px] border border-[#e0e4eb] bg-white px-3 py-2.5 text-[12px]"
                    value={correctedLabel}
                    onChange={(event) => setCorrectedLabel(event.target.value as ReviewLabel)}
                  >
                    <option value="dung">Đúng</option>
                    <option value="hieu_lam">Hiểu lầm</option>
                    <option value="can_kiem_chung">Cần kiểm chứng</option>
                  </select>
                </label>
              )}
              <label className="grid gap-1.5 text-[10px] font-bold text-[#667389]">
                Ghi chú thẩm định {reviewDecision !== "accepted" ? "(bắt buộc)" : "(không bắt buộc)"}
                <textarea
                  className="min-h-20 rounded-[9px] border border-[#e0e4eb] px-3 py-2.5 text-[12px] leading-[1.5]"
                  maxLength={1000}
                  value={reviewNote}
                  onChange={(event) => setReviewNote(event.target.value)}
                  placeholder="Nêu căn cứ chấp nhận, hiệu chỉnh hoặc bác bỏ…"
                />
              </label>
              <label className="grid gap-1.5 text-[10px] font-bold text-[#667389]">
                Khóa quản trị (chỉ dùng để mở phiên)
                <input
                  className="rounded-[9px] border border-[#e0e4eb] px-3 py-2.5 text-[12px]"
                  type="password"
                  autoComplete="off"
                  value={adminKey}
                  onChange={(event) => setAdminKey(event.target.value)}
                  placeholder={csrfToken ? "Phiên chuyên viên đang hoạt động" : "Không lưu trong trình duyệt"}
                  disabled={Boolean(csrfToken)}
                />
              </label>
              <button
                type="submit"
                className="rounded-[9px] border-0 bg-[#25364d] px-3 py-2.5 text-[11px] font-bold text-white disabled:opacity-50"
                disabled={reviewMutation.isPending}
              >
                {reviewMutation.isPending ? "Đang lưu quyết định…" : "Ký và hoàn tất thẩm định"}
              </button>
              {reviewMessage && (
                <p className="m-0 text-[11px] leading-[1.4] text-[#6c5871]" role="status">
                  {reviewMessage}
                </p>
              )}
            </form>
          </section>
          <section className={detailCard}>
            <div className={cardHeading}>
              <div className="flex items-center gap-[11px]">
                <span className={cardHeadingIcon}>04</span>
                <div>
                  <small className={cardLabel}>ĐÁNH GIÁ CÁN BỘ</small>
                  <h2 className={cardHeadingTitle}>Nhận xét &amp; ghi chú</h2>
                </div>
              </div>
              {reviewSaved && (
                <span className="text-[11px] font-bold text-[#16a34a]">Đã lưu</span>
              )}
            </div>
            <div className="pt-3">
              <small className={cardLabel}>NHÃN CÁN BỘ (GHI ĐÈ NHÃN AI)</small>
              <div className="mt-2 flex gap-2 flex-wrap">
                {(["dung", "hieu_lam", "can_kiem_chung"] as const).map((lbl) => {
                  const display = lbl === "dung" ? "Đúng" : lbl === "hieu_lam" ? "Hiểu lầm" : "Cần kiểm chứng";
                  const active = reviewerLabel === lbl;
                  return (
                    <button
                      key={lbl}
                      onClick={() => setReviewerLabel(active ? "" : lbl)}
                      className={`rounded-[9px] px-3 py-2 text-[12px] font-bold border-0 cursor-pointer transition-colors ${
                        active
                          ? lbl === "dung"
                            ? "bg-[#16a34a] text-white"
                            : lbl === "hieu_lam"
                            ? "bg-[#dc2626] text-white"
                            : "bg-[#d97706] text-white"
                          : "bg-[#f1f5f9] text-[#64748b]"
                      }`}
                    >
                      {display}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-3">
              <small className={cardLabel}>LÝ DO OVERRIDE</small>
              <textarea
                className="mt-1 w-full rounded-[9px] border border-[#e7e9f0] bg-[#fafbfe] px-3 py-2 text-[13px] text-[#35495e] outline-none focus:border-[#d638b5] resize-y min-h-[60px]"
                placeholder="Lý do cán bộ ghi đè nhãn AI..."
                value={reviewerReason}
                onChange={(e) => setReviewerReason(e.target.value)}
              />
            </div>
            <div className="mt-3">
              <small className={cardLabel}>GHI CHÚ</small>
              <textarea
                className="mt-1 w-full rounded-[9px] border border-[#e7e9f0] bg-[#fafbfe] px-3 py-2 text-[13px] text-[#35495e] outline-none focus:border-[#d638b5] resize-y min-h-[60px]"
                placeholder="Ghi chú thêm (không bắt buộc)..."
                value={reviewerNote}
                onChange={(e) => setReviewerNote(e.target.value)}
              />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                className="rounded-[9px] border border-[#dfe2e9] bg-white px-3 py-2 text-[11px] font-bold text-[#5c687c] cursor-pointer disabled:opacity-50"
                onClick={() => handleSaveReview(false)}
                disabled={reviewSaving || (!reviewerLabel && !reviewerReason && !reviewerNote)}
              >
                <ClipboardCheck size={14} className="mr-1 inline align-[-2px]" /> Lưu đánh giá
              </button>
              <button
                className="rounded-[9px] border-0 bg-linear-90 from-[#16a34a] to-[#15803d] px-3 py-2 text-[11px] font-bold text-white cursor-pointer disabled:opacity-50"
                onClick={() => handleSaveReview(true)}
                disabled={reviewSaving || currentStatus === "Đã xử lý"}
              >
                <Check size={14} className="mr-1 inline align-[-2px]" /> Đánh dấu đã xử lý
              </button>
            </div>
            {(item.reviewerLabel || item.reviewedAt) && (
              <div className="mt-3 rounded-[9px] bg-[#f0fdf4] p-3 border border-[#bbf7d0]">
                <small className={cardLabel}>ĐÃ REVIEW</small>
                {item.reviewerLabel && (
                  <p className="m-0 mt-1 text-[12px] text-[#166534]">
                    Nhãn override: <strong>{item.reviewerLabel === "dung" ? "Đúng" : item.reviewerLabel === "hieu_lam" ? "Hiểu lầm" : "Cần kiểm chứng"}</strong>
                  </p>
                )}
                {item.reviewerReason && (
                  <p className="m-0 mt-1 text-[11px] text-[#166534]">Lý do: {item.reviewerReason}</p>
                )}
                {item.reviewedAt && (
                  <p className="m-0 mt-1 text-[10px] text-[#4ade80]">
                    <Clock size={10} className="inline align-[-1px]" /> {new Date(item.reviewedAt).toLocaleString("vi-VN")}
                  </p>
                )}
              </div>
            )}
          </section>
          <section className={detailCard}>
            <div className="flex gap-2.5 border-b border-[#e7ebef] pb-[14px]">
              <Scale size={20} className="text-[#c524ad]" />
              <div>
                <small className={cardLabel}>CĂN CỨ PHÁP LUẬT</small>
                <h2 className={cardHeadingTitle}>{item.document}</h2>
              </div>
            </div>
            <dl className="m-0">
              <div className="border-b border-[#edf0f3] py-3">
                <dt className="mb-[5px] text-[10px] text-[#8693a0]">Điều / khoản / điểm</dt>
                <dd className="m-0 text-[13px] font-[650] leading-[1.45] text-[#30465b]">{item.provision}</dd>
              </div>
              <div className="border-b border-[#edf0f3] py-3">
                <dt className="mb-[5px] text-[10px] text-[#8693a0]">Chủ thể</dt>
                <dd className="m-0 text-[13px] font-[650] leading-[1.45] text-[#30465b]">{item.subject}</dd>
              </div>
              <div className="border-b border-[#edf0f3] py-3">
                <dt className="mb-[5px] text-[10px] text-[#8693a0]">Mức phạt</dt>
                <dd className="m-0 text-[13px] font-[650] leading-[1.45] text-[#30465b]">{item.penalty}</dd>
              </div>
            </dl>
            <div className="mt-[13px] rounded-[11px] bg-[#fff6e7] p-2.5 text-[11px] leading-[1.5] text-[#78633e]">
              Cần đối chiếu đầy đủ hành vi, chủ thể và tình tiết thực tế trước khi áp dụng.
            </div>
          </section>
          <section className={detailCard}>
            <small className="text-[9px] font-extrabold text-[#65738a]">KNOWLEDGE GRAPH</small>
            <div className="mt-[14px] flex items-center justify-between gap-1.5">
              <span className={`${flowStep} bg-[#fff0f7] text-[#c31b80]`}>Claim</span>
              <ArrowRight size={14} className="text-[#c3c9d3]" />
              <span className={`${flowStep} bg-[#fff4e4] text-[#ad7314]`}>Chủ thể</span>
              <ArrowRight size={14} className="text-[#c3c9d3]" />
              <span className={`${flowStep} bg-[#eaf8ee] text-[#24865a]`}>Điều luật</span>
              <ArrowRight size={14} className="text-[#c3c9d3]" />
              <span className={`${flowStep} bg-[#edf4fc] text-[#3970ad]`}>Nguồn</span>
            </div>
          </section>
          {auditQuery.data && auditQuery.data.length > 0 && (
            <section className={detailCard}>
              <small className="text-[9px] font-extrabold text-[#65738a]">LỊCH SỬ THAY ĐỔI</small>
              <div className="mt-3 flex flex-col gap-2">
                {auditQuery.data.map((entry: AuditEntry, idx: number) => {
                  const time = entry.timestamp
                    ? new Date(entry.timestamp).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
                    : "";
                  const actionLabel =
                    entry.action === "status_change"
                      ? `${statusLabel(entry.old_value)} → ${statusLabel(entry.new_value)}`
                      : entry.action === "label_override"
                      ? `Override nhãn: ${labelLabel(entry.old_value)} → ${labelLabel(entry.new_value)}`
                      : entry.action === "note_added"
                      ? "Thêm ghi chú"
                      : entry.action;
                  return (
                    <div key={idx} className="flex items-start gap-2 text-[11px] text-[#586a7c]">
                      <span className="mt-[3px] block h-[6px] w-[6px] flex-shrink-0 rounded-full bg-[#c524ad]" />
                      <div>
                        <span className="text-[#94a3b8]">{time}</span>
                        {" — "}
                        <span>{actionLabel}</span>
                        {entry.note && <span className="text-[#94a3b8]"> ({entry.note})</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </aside>
      </div>
      <div className="fixed right-0 bottom-0 z-[82] grid w-[min(590px,100vw)] grid-cols-3 gap-2.5 border-t border-[#e8eaf1] bg-white px-[26px] py-[14px] max-[700px]:px-4 max-[700px]:py-3">
        <button
          className="rounded-[9px] border border-[#dfe2e9] bg-white p-[11px] text-[11px] font-[750] text-[#5c687c]"
          onClick={handleBack}
        >
          <ArrowLeft size={14} className="mr-1 inline align-[-2px]" /> Quay lại
        </button>
        {currentStatus === "Đang xử lý" ? (
          <>
            <button
              className="rounded-[9px] border-0 bg-[#10b981] p-[11px] text-[11px] font-[750] text-white disabled:opacity-50"
              onClick={() => handleReview("approve")}
              disabled={reviewLoading}
            >
              <ThumbsUp size={14} className="mr-1 inline align-[-2px]" /> Xác nhận
            </button>
            <button
              className="rounded-[9px] border-0 bg-[#f59e0b] p-[11px] text-[11px] font-[750] text-white disabled:opacity-50"
              onClick={() => handleReview("escalate")}
              disabled={reviewLoading}
            >
              <Flag size={14} className="mr-1 inline align-[-2px]" /> ESC
            </button>
          </>
        ) : (
          <button
            className="col-span-2 rounded-[9px] border-0 bg-linear-90 from-[#e213aa] to-[#a20ac1] p-[11px] text-[11px] font-[750] text-white"
            onClick={handleStartVerification}
            disabled={verifyLoading}
          >
            {verifyLoading
              ? "Đang xử lý…"
              : <>Bắt đầu kiểm chứng <ArrowRight size={14} className="ml-1 inline align-[-2px]" /></>}
          </button>
        )}
      </div>
      {verifyError && (
        <div style={{ padding: "8px 24px", color: "#f59e0b", fontSize: 13 }}>{verifyError}</div>
      )}
    </div>
    </>
  );
}
