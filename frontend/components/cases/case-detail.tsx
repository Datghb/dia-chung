"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUpdateStatusMutation, API_URL } from "../../hooks/use-queries";
import { VerdictBadge } from "../common/badge";
import { Case, Status } from "../../types";

const statuses: Status[] = ["Mới", "Đang xử lý", "Đã xử lý"];

function platformIcon(platform: Case["platform"]) {
  const paths: Record<Case["platform"], string> = {
    Facebook:
      "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z",
    TikTok:
      "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
    YouTube:
      "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
    X: "M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z",
    Forum:
      "M12.103 0C18.666 0 24 5.485 24 11.997c0 6.51-5.33 11.99-11.9 11.99L0 24V11.79C0 5.28 5.532 0 12.103 0zm.116 4.563c-2.593-.003-4.996 1.352-6.337 3.57-1.33 2.208-1.387 4.957-.148 7.22L4.4 19.61l4.794-1.074c2.745 1.225 5.965.676 8.136-1.39 2.17-2.054 2.86-5.228 1.737-7.997-1.135-2.778-3.84-4.59-6.84-4.585h-.008z",
  };
  return (
    <svg
      className={`platform-svg platform-${platform.toLowerCase()}`}
      viewBox="0 0 24 24"
      role="img"
      aria-label={`${platform} logo`}
      style={{ width: 14, height: 14 }}
    >
      <path d={paths[platform]} />
    </svg>
  );
}

export function CaseDetail({ item }: { item: Case }) {
  const router = useRouter();
  const updateStatusMutation = useUpdateStatusMutation();
  const [currentStatus, setCurrentStatus] = useState<Status>(item.status);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  useEffect(() => {
    setCurrentStatus(item.status);
  }, [item.status]);

  const handleBack = () => {
    router.push("/queue");
  };

  const handleStatusChange = async (status: Status) => {
    setCurrentStatus(status);
    if (item.id.startsWith("HS-MVP-")) {
      const saved = sessionStorage.getItem("local_cases");
      if (saved) {
        try {
          const cases = JSON.parse(saved) as Case[];
          const updated = cases.map((c) => (c.id === item.id ? { ...c, status } : c));
          sessionStorage.setItem("local_cases", JSON.stringify(updated));
        } catch {
          // ignore
        }
      }
    } else {
      try {
        await updateStatusMutation.mutateAsync({ id: item.id, status });
      } catch {
        // ignore, state is updated locally
      }
    }
  };

  async function handleStartVerification() {
    setVerifyLoading(true);
    setVerifyError("");
    try {
      if (item.id.startsWith("HS-MVP-")) {
        const saved = sessionStorage.getItem("local_cases");
        if (saved) {
          try {
            const cases = JSON.parse(saved) as Case[];
            const updated = cases.map((c) => (c.id === item.id ? { ...c, status: "Đang xử lý" as Status } : c));
            sessionStorage.setItem("local_cases", JSON.stringify(updated));
          } catch {
            // ignore
          }
        }
        setCurrentStatus("Đang xử lý");
      } else {
        const res = await fetch(`${API_URL}/api/cases/${item.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "reviewing" }),
        });
        if (!res.ok) throw new Error("API error");
        setCurrentStatus("Đang xử lý");
        void handleStatusChange("Đang xử lý");
      }
    } catch {
      setVerifyError("Không thể kết nối API. Trạng thái chỉ cập nhật tạm thời.");
      setCurrentStatus("Đang xử lý");
    } finally {
      setVerifyLoading(false);
    }
  }

  return (
    <div className="monitor-page detail-page">
      <button className="drawer-close" onClick={handleBack} aria-label="Đóng hồ sơ">
        ×
      </button>
      <div className="detail-heading">
        <div>
          <span className="eyebrow">CHI TIẾT HỒ SƠ · {item.id}</span>
          <h1>{item.claim}</h1>
          <p>
            {item.platform} · Công khai · {item.publishedAt}
          </p>
        </div>
        <label className="status-control">
          Trạng thái xử lý
          <select value={currentStatus} onChange={(event) => handleStatusChange(event.target.value as Status)}>
            {statuses.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="detail-grid">
        <div className="detail-primary">
          <section className="detail-card original-card">
            <div className="card-heading">
              <div>
                <span>01</span>
                <div>
                  <small>NỘI DUNG GỐC</small>
                  <h2>Bài viết được giám sát</h2>
                </div>
              </div>
              <em>{item.reach}</em>
            </div>
            <div className="post-author">
              <span className={`platform-logo ${item.platform.toLowerCase()}`}>
                {platformIcon(item.platform)}
              </span>
              <div>
                <strong>{item.account}</strong>
                <small>
                  {item.platform} · {item.publishedAt}
                </small>
              </div>
            </div>
            {item.postUrl && item.postUrl !== "#" && (
              <div className="post-link" style={{ marginBottom: 12 }}>
                <a
                  href={item.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#3b82f6", fontSize: 13, textDecoration: "none" }}
                >
                  🔗 Xem bài viết gốc trên {item.platform} ↗
                </a>
              </div>
            )}
            <blockquote>{"\u201C"}{item.original}{"\u201D"}</blockquote>
            {item.postComments && item.postComments.length > 0 && (
              <div className="post-comments" style={{ marginTop: 16 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <small style={{ color: "#94a3b8", fontSize: 12, letterSpacing: "0.05em" }}>
                    BÌNH LUẬN BÀI VIẾT ({item.postComments.length})
                  </small>
                </div>
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
                  {item.postComments.map((comment, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "#0f172a",
                        borderRadius: 8,
                        padding: "10px 14px",
                        borderLeft: "3px solid #334155",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <strong style={{ fontSize: 13, color: "#e2e8f0" }}>{comment.author || "Ẩn danh"}</strong>
                        <small style={{ color: "#64748b", fontSize: 11 }}>{comment.timestamp || ""}</small>
                      </div>
                      <p style={{ fontSize: 13, color: "#cbd5e1", margin: 0, lineHeight: 1.5 }}>
                        {comment.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="detail-card">
            <div className="card-heading">
              <div>
                <span>02</span>
                <div>
                  <small>PHÂN TÍCH AI</small>
                  <h2>Claim được trích xuất</h2>
                </div>
              </div>
              <VerdictBadge value={item.verdict} />
            </div>
            <div className="claim-quote">“{item.claim}”</div>
            <div className="analysis-reason">
              <small>LÝ DO PHÂN LOẠI</small>
              <p>{item.reason}</p>
            </div>
          </section>

          <section className="detail-card source-card">
            <div className="card-heading">
              <div>
                <span>03</span>
                <div>
                  <small>KIỂM CHỨNG NGUỒN</small>
                  <h2>Đối chiếu nguồn chính thức</h2>
                </div>
              </div>
              <span
                className={`source-result ${
                  item.verdict === "Đúng"
                    ? "confirmed"
                    : item.verdict === "Hiểu lầm"
                    ? "conflict"
                    : "pending"
                }`}
              >
                {item.verdict === "Đúng" ? "✓" : item.verdict === "Hiểu lầm" ? "↯" : "?"} {item.sourceResult}
              </span>
            </div>
            <div className="official-source">
              <div className="agency-mark">CQ</div>
              <div>
                <small>NGUỒN CHÍNH THỨC</small>
                <h3>{item.sourceTitle}</h3>
                <p>{item.sourceAgency}</p>
              </div>
              {item.sourceUrl && item.sourceUrl !== "#" ? (
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                  Mở nguồn ↗
                </a>
              ) : (
                <span className="source-unavailable" aria-disabled="true">
                  Chưa có URL nguồn
                </span>
              )}
            </div>
          </section>
        </div>

        <aside className="detail-aside">
          <section className="decision-card">
            <small>KẾT QUẢ THẨM ĐỊNH AI</small>
            <VerdictBadge value={item.verdict} large />
            <div className="confidence-row">
              <span>Mức rủi ro</span>
              <strong>{item.score}/100</strong>
            </div>
            <div className="confidence-track">
              <i style={{ width: `${item.score}%` }} />
            </div>
            <div className="confidence-row">
              <span>Độ tin cậy</span>
              <strong>{item.confidence}/100</strong>
            </div>
            <div className="confidence-track">
              <i style={{ width: `${item.confidence}%` }} />
            </div>
            <p>Kết quả tự động hỗ trợ sàng lọc, không thay thế kết luận của chuyên viên.</p>
          </section>
          <section className="legal-card-new">
            <div className="legal-title">
              <span>⚖</span>
              <div>
                <small>CĂN CỨ PHÁP LUẬT</small>
                <h2>{item.document}</h2>
              </div>
            </div>
            <dl>
              <div>
                <dt>Điều / khoản / điểm</dt>
                <dd>{item.provision}</dd>
              </div>
              <div>
                <dt>Chủ thể</dt>
                <dd>{item.subject}</dd>
              </div>
              <div>
                <dt>Mức phạt</dt>
                <dd>{item.penalty}</dd>
              </div>
            </dl>
            <div className="legal-note">Cần đối chiếu đầy đủ hành vi, chủ thể và tình tiết thực tế trước khi áp dụng.</div>
          </section>
          <section className="knowledge-card">
            <small>KNOWLEDGE GRAPH</small>
            <div className="knowledge-flow">
              <span>Claim</span>
              <i>→</i>
              <span>Chủ thể</span>
              <i>→</i>
              <span>Điều luật</span>
              <i>→</i>
              <span>Nguồn</span>
            </div>
          </section>
        </aside>
      </div>
      <div className="detail-actions">
        <button onClick={handleBack}>← Quay lại hàng đợi</button>
        <button
          onClick={handleStartVerification}
          disabled={verifyLoading || currentStatus === "Đang xử lý"}
        >
          {verifyLoading
            ? "Đang xử lý…"
            : currentStatus === "Đang xử lý"
            ? "✓ Đang kiểm chứng"
            : "Bắt đầu kiểm chứng →"}
        </button>
      </div>
      {verifyError && (
        <div style={{ padding: "8px 24px", color: "#f59e0b", fontSize: 13 }}>{verifyError}</div>
      )}
    </div>
  );
}
