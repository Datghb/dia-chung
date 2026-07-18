"use client";

// Force IDE file watcher registration
import { useState } from "react";
import Papa from "papaparse";
import { Case, ApiQueueItem } from "../../types";
import { API_URL, mapApiCase } from "../../hooks/use-queries";

export function ManualInputDrawer({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (items: Case[]) => void;
}) {
  const [inputMode, setInputMode] = useState<"manual" | "file">("manual");
  const [contentType, setContentType] = useState<"post" | "comment">("post");
  const [content, setContent] = useState("");
  const [parentContent, setParentContent] = useState("");
  const [platform, setPlatform] = useState<Case["platform"]>("Facebook");
  const [account, setAccount] = useState("");
  const [publishedAt, setPublishedAt] = useState("");
  const [reach, setReach] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function buildCase(row: Record<string, string>, index = 0): Case {
    const rawContent = (row.content || row.comment || row.text || content).trim().replace(/\s+/g, " ");
    const claim = rawContent.split(/[.!?]/)[0].slice(0, 150) || rawContent.slice(0, 150);
    const rowType = row.type === "comment" || contentType === "comment" ? "comment" : "post";
    const allowedPlatforms: Case["platform"][] = ["Facebook", "TikTok", "YouTube", "X"];
    const rowPlatform =
      allowedPlatforms.find((value) => value.toLowerCase() === (row.platform || platform).toLowerCase()) ||
      platform;
    return {
      id: `HS-MVP-${Date.now().toString().slice(-6)}-${index + 1}`,
      claim,
      original: rawContent,
      platform: rowPlatform,
      account: (row.account || row.author || account).trim() || "Chưa xác định",
      publishedAt:
        row.publishedAt ||
        row.published_at ||
        (publishedAt ? new Date(publishedAt).toLocaleString("vi-VN") : "Vừa nhập"),
      priority: "Cao",
      score: 75,
      confidence: 50,
      verdict: "Cần kiểm chứng",
      status: "Mới",
      reason:
        "Nội dung vừa được nhập bằng file và đang chờ đối chiếu với nguồn chính thức. Kết quả hiện tại là dữ liệu mô phỏng cho luồng MVP.",
      document: "Đang xác định",
      provision: "Chờ ánh xạ điều / khoản / điểm",
      subject: "Chủ thể đăng tải nội dung",
      penalty: "Chưa đủ căn cứ xác định",
      sourceTitle: "Chưa có nguồn đối chiếu",
      sourceAgency: "Đang chờ kiểm chứng",
      sourceUrl: "#",
      postUrl: row.url || row.postUrl || "#",
      sourceResult: "Chưa đủ bằng chứng",
      reach: (row.reach || reach).trim() ? `${(row.reach || reach).trim()} lượt tương tác` : "Chưa có số liệu tương tác",
      contentType: rowType,
      parentContent: rowType === "comment" ? (row.parentContent || row.parent_content || parentContent).trim() : undefined,
    };
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inputMode === "file") {
      const validRows = parsedRows.filter((row) => (row.content || row.comment || row.text || "").trim());
      if (validRows.length) onSave(validRows.map((row, index) => buildCase(row, index)));
      return;
    }
    const compact = content.trim().replace(/\s+/g, " ");
    if (!compact) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/qa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: compact }),
      });
      if (res.ok) {
        const item = (await res.json()) as ApiQueueItem;
        onSave([mapApiCase(item)]);
      } else {
        onSave([buildCase({ content: compact })]);
      }
    } catch {
      onSave([buildCase({ content: compact })]);
    } finally {
      setSubmitting(false);
    }
  }

  async function readFile(file?: File) {
    if (!file) return;
    setFileName(file.name);
    setFileError("");
    setParsedRows([]);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (extension === "csv") {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results: Papa.ParseResult<any>) => {
            const rows = results.data as Record<string, string>[];
            const valid = rows.filter((row) => (row.content || row.comment || row.text || "").trim());
            if (!valid.length) {
              setFileError("Không tìm thấy nội dung hợp lệ trong file CSV.");
              return;
            }
            setParsedRows(valid);
          },
          error: () => {
            setFileError("Không đọc được file CSV.");
          },
        });
      } else if (extension === "json") {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const rows = (Array.isArray(parsed) ? parsed : [parsed]).map((row) =>
          Object.fromEntries(Object.entries(row).map(([key, value]) => [key, String(value ?? "")]))
        );
        const valid = rows.filter((row) => (row.content || row.comment || row.text || "").trim());
        if (!valid.length) throw new Error("Không tìm thấy nội dung hợp lệ.");
        setParsedRows(valid);
      } else {
        const text = await file.text();
        const rows = text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => ({ content: line, type: contentType }));
        setParsedRows(rows);
      }
    } catch {
      setFileError("Không đọc được file. Kiểm tra lại định dạng.");
    }
  }

  return (
    <>
      <button className="input-backdrop" onClick={onClose} aria-label="Đóng form nhập nội dung" />
      <aside className="input-drawer" aria-labelledby="manual-input-title">
        <div className="input-drawer-head">
          <div>
            <span className="eyebrow">MVP · NHẬP THỦ CÔNG</span>
            <h2 id="manual-input-title">Thêm nội dung giám sát</h2>
            <p>Nhập nguyên văn bài đăng để tạo hồ sơ mới trong hàng đợi.</p>
          </div>
          <button onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="input-mode-switch">
            <button
              type="button"
              className={inputMode === "manual" ? "active" : ""}
              onClick={() => setInputMode("manual")}
            >
              Nhập thủ công
            </button>
            <button
              type="button"
              className={inputMode === "file" ? "active" : ""}
              onClick={() => setInputMode("file")}
            >
              Tải file hàng loạt
            </button>
          </div>
          <div className="input-type-tabs" role="tablist" aria-label="Loại nội dung">
            <button
              type="button"
              role="tab"
              aria-selected={contentType === "post"}
              className={contentType === "post" ? "active" : ""}
              onClick={() => setContentType("post")}
            >
              <span>▤</span>
              <div>
                <strong>Bài viết</strong>
                <small>Nhập nội dung bài đăng độc lập</small>
              </div>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={contentType === "comment"}
              className={contentType === "comment" ? "active" : ""}
              onClick={() => setContentType("comment")}
            >
              <span>◌</span>
              <div>
                <strong>Bình luận</strong>
                <small>Nhập comment và ngữ cảnh bài gốc</small>
              </div>
            </button>
          </div>
          {inputMode === "file" ? (
            <>
              <label className={`file-drop ${parsedRows.length ? "ready" : ""}`}>
                <input
                  type="file"
                  accept=".csv,.json,.txt,text/csv,application/json,text/plain"
                  onChange={(event) => readFile(event.target.files?.[0])}
                />
                <span>{parsedRows.length ? "✓" : "⇧"}</span>
                <strong>
                  {fileName || `Chọn file ${contentType === "post" ? "bài viết" : "bình luận"}`}
                </strong>
                <small>CSV, JSON hoặc TXT · tối đa theo khả năng trình duyệt</small>
              </label>
              {parsedRows.length > 0 && (
                <div className="file-result">
                  <strong>{parsedRows.length} bản ghi hợp lệ</strong>
                  <span>Sẵn sàng đưa vào hàng đợi giám sát</span>
                </div>
              )}
              {fileError && <div className="file-error">{fileError}</div>}
              <div className="file-format">
                <strong>Cấu trúc gợi ý</strong>
                <code>
                  {contentType === "post"
                    ? "content, platform, account, publishedAt, reach"
                    : "comment, parentContent, platform, account, publishedAt, reach"}
                </code>
                <p>File TXT: mỗi dòng được xem là một bài viết hoặc bình luận.</p>
              </div>
            </>
          ) : (
            <>
              {contentType === "comment" && (
                <label className="manual-field">
                  <span>Ngữ cảnh bài viết gốc</span>
                  <textarea
                    className="context-textarea"
                    value={parentContent}
                    onChange={(event) => setParentContent(event.target.value)}
                    placeholder="Dán nội dung hoặc tóm tắt bài viết chứa bình luận…"
                  />
                </label>
              )}
              <label className="manual-field">
                <span>
                  {contentType === "post" ? "Nội dung bài viết" : "Nội dung bình luận"} <b>*</b>
                </span>
                <textarea
                  required
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder={
                    contentType === "post"
                      ? "Dán nguyên văn nội dung bài viết cần kiểm tra…"
                      : "Dán nguyên văn bình luận cần kiểm tra…"
                  }
                />
                <small>{content.length} / 5.000 ký tự</small>
              </label>
            </>
          )}
          {inputMode === "manual" && (
            <>
              <div className="manual-grid">
                <label className="manual-field">
                  <span>Nền tảng</span>
                  <select
                    value={platform}
                    onChange={(event) => setPlatform(event.target.value as Case["platform"])}
                  >
                    <option>Facebook</option>
                    <option>TikTok</option>
                    <option>YouTube</option>
                    <option>X</option>
                  </select>
                </label>
                <label className="manual-field">
                  <span>{contentType === "post" ? "Tài khoản đăng" : "Người bình luận"}</span>
                  <input
                    value={account}
                    onChange={(event) => setAccount(event.target.value)}
                    placeholder={
                      contentType === "post" ? "Tên tài khoản hoặc kênh" : "Tên tài khoản bình luận"
                    }
                  />
                </label>
              </div>
              <div className="manual-grid">
                <label className="manual-field">
                  <span>Thời gian đăng</span>
                  <input
                    type="datetime-local"
                    value={publishedAt}
                    onChange={(event) => setPublishedAt(event.target.value)}
                  />
                </label>
                <label className="manual-field">
                  <span>Lượt tương tác</span>
                  <input
                    type="number"
                    min="0"
                    value={reach}
                    onChange={(event) => setReach(event.target.value)}
                    placeholder="Ví dụ: 12500"
                  />
                </label>
              </div>
            </>
          )}
          <div className="manual-note">
            <span>i</span>
            <p>
              <strong>Luồng MVP</strong> Sau khi lưu, hệ thống tạo hồ sơ với kết quả “Cần kiểm chứng”. Dữ
              liệu chỉ tồn tại trong phiên trình duyệt hiện tại.
            </p>
          </div>
          <div className="manual-actions">
            <button type="button" onClick={onClose}>
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || (inputMode === "manual" ? !content.trim() : !parsedRows.length)}
            >
              {submitting
                ? "Đang phân tích…"
                : inputMode === "file"
                ? `Nhập ${parsedRows.length || ""} hồ sơ →`
                : "Tạo hồ sơ & phân tích →"}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
