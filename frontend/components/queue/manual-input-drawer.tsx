"use client";

// Force IDE file watcher registration
import { useState } from "react";
import Papa from "papaparse";
import { Case, ApiQueueItem } from "../../types";
import { API_URL, mapApiCase } from "../../utils/api";
import { X, FileText, MessageCircle, Check, Upload, ArrowRight, Info } from "lucide-react";

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
    const allowedPlatforms: Case["platform"][] = ["Facebook", "TikTok", "YouTube", "Web"];
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

  const fieldLabel = "block text-[12px] font-[750] text-[#525d72] mb-2";
  const fieldControl =
    "w-full rounded-[11px] border border-[#e0e3eb] bg-[#fafbfe] px-[13px] py-3 text-[14px] text-[#293349] outline-0 focus:border-[#d638b5] focus:bg-white focus:shadow-[0_0_0_3px_#d638b512]";
  const typeTabBase =
    "flex items-center gap-2.5 rounded-xl border p-3 text-left";
  const typeTabIconBase = "grid h-8 w-8 place-items-center rounded-[9px] text-[15px]";

  return (
    <>
      <button
        className="fixed inset-0 z-[80] border-0 bg-[#1e24465c] backdrop-blur-[3px]"
        onClick={onClose}
        aria-label="Đóng form nhập nội dung"
      />
      <aside
        className="fixed inset-y-0 right-0 z-[90] w-[min(570px,100vw)] overflow-auto bg-white p-[30px] shadow-[-20px_0_60px_#22294422] max-[700px]:px-[17px] max-[700px]:py-[22px]"
        aria-labelledby="manual-input-title"
      >
        <div className="flex justify-between gap-5 border-b border-[#eceef4] pb-[22px]">
          <div>
            <span className="text-[10px] font-extrabold tracking-[1.5px] text-[#c01cad]">MVP · NHẬP THỦ CÔNG</span>
            <h2 id="manual-input-title" className="my-[7px] text-[27px] tracking-[-.7px] text-[#252d48]">
              Thêm nội dung giám sát
            </h2>
            <p className="m-0 text-[13px] text-[#788397]">
              Nhập nguyên văn bài đăng để tạo hồ sơ mới trong hàng đợi.
            </p>
          </div>
          <button
            className="h-9 w-9 flex-none rounded-full border-0 bg-[#f5f2f7] text-[#8e4890] grid place-items-center"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={22} />
          </button>
        </div>
        <form onSubmit={submit} className="grid gap-5 pt-[23px]">
          <div className="grid grid-cols-2 rounded-[11px] bg-[#f2f3f7] p-1">
            <button
              type="button"
              className={`rounded-lg border-0 p-[9px] text-[12px] font-bold ${
                inputMode === "manual"
                  ? "bg-white text-[#a820a5] shadow-[0_3px_10px_#262d4d12]"
                  : "bg-transparent text-[#7b8495]"
              }`}
              onClick={() => setInputMode("manual")}
            >
              Nhập thủ công
            </button>
            <button
              type="button"
              className={`rounded-lg border-0 p-[9px] text-[12px] font-bold ${
                inputMode === "file"
                  ? "bg-white text-[#a820a5] shadow-[0_3px_10px_#262d4d12]"
                  : "bg-transparent text-[#7b8495]"
              }`}
              onClick={() => setInputMode("file")}
            >
              Tải file hàng loạt
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2.5 max-[520px]:grid-cols-1" role="tablist" aria-label="Loại nội dung">
            <button
              type="button"
              role="tab"
              aria-selected={contentType === "post"}
              className={`${typeTabBase} ${
                contentType === "post"
                  ? "border-[#d63ab7] bg-[#fff8fd] text-[#717b8f] shadow-[0_0_0_3px_#d638b50d]"
                  : "border-[#e2e5ed] bg-[#fafbfe] text-[#717b8f]"
              }`}
              onClick={() => setContentType("post")}
            >
              <span
                className={`${typeTabIconBase} ${
                  contentType === "post"
                    ? "bg-linear-145 from-[#ef35ad] to-[#a921cf] text-white"
                    : "bg-[#f0edf4]"
                }`}
              >
                <FileText size={15} />
              </span>
              <div>
                <strong className={`block text-[13px] ${contentType === "post" ? "text-[#a721a5]" : "text-[#3f485e]"}`}>
                  Bài viết
                </strong>
                <small className="mt-[3px] block text-[10px]">Nhập nội dung bài đăng độc lập</small>
              </div>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={contentType === "comment"}
              className={`${typeTabBase} ${
                contentType === "comment"
                  ? "border-[#d63ab7] bg-[#fff8fd] text-[#717b8f] shadow-[0_0_0_3px_#d638b50d]"
                  : "border-[#e2e5ed] bg-[#fafbfe] text-[#717b8f]"
              }`}
              onClick={() => setContentType("comment")}
            >
              <span
                className={`${typeTabIconBase} ${
                  contentType === "comment"
                    ? "bg-linear-145 from-[#ef35ad] to-[#a921cf] text-white"
                    : "bg-[#f0edf4]"
                }`}
              >
                <MessageCircle size={15} />
              </span>
              <div>
                <strong
                  className={`block text-[13px] ${contentType === "comment" ? "text-[#a721a5]" : "text-[#3f485e]"}`}
                >
                  Bình luận
                </strong>
                <small className="mt-[3px] block text-[10px]">Nhập comment và ngữ cảnh bài gốc</small>
              </div>
            </button>
          </div>
          {inputMode === "file" ? (
            <>
              <label
                className={`flex min-h-[175px] cursor-pointer flex-col items-center justify-center rounded-[15px] border-2 border-dashed p-[25px] text-center transition duration-[180ms] hover:border-[#d13ab3] hover:bg-[#fff8fd] ${
                  parsedRows.length ? "border-[#d13ab3] bg-[#fff8fd]" : "border-[#d9dce6] bg-[#fafbfe]"
                }`}
              >
                <input
                  className="pointer-events-none absolute opacity-0"
                  type="file"
                  accept=".csv,.json,.txt,text/csv,application/json,text/plain"
                  onChange={(event) => readFile(event.target.files?.[0])}
                />
                <span
                  className={`mb-2.5 grid h-[42px] w-[42px] place-items-center rounded-xl text-[20px] ${
                    parsedRows.length
                      ? "bg-[#e8f7f1] text-[#278164]"
                      : "bg-linear-145 from-[#f6e8f7] to-[#eee7fa] text-[#b421ac]"
                  }`}
                >
                  {parsedRows.length ? <Check size={20} /> : <Upload size={20} />}
                </span>
                <strong className="text-[14px] text-[#3c465b]">
                  {fileName || `Chọn file ${contentType === "post" ? "bài viết" : "bình luận"}`}
                </strong>
                <small className="mt-[5px] text-[11px] text-[#9299a8]">
                  CSV, JSON hoặc TXT · tối đa theo khả năng trình duyệt
                </small>
              </label>
              {parsedRows.length > 0 && (
                <div className="flex items-center rounded-[11px] bg-[#eaf8f3] px-[14px] py-3 text-[#28795f]">
                  <strong className="text-[13px]">{parsedRows.length} bản ghi hợp lệ</strong>
                  <span className="ml-auto text-[11px]">Sẵn sàng đưa vào hàng đợi giám sát</span>
                </div>
              )}
              {fileError && (
                <div className="rounded-[10px] bg-[#fff0f2] px-[13px] py-[11px] text-[12px] text-[#b63b52]">
                  {fileError}
                </div>
              )}
              <div className="rounded-[11px] bg-[#f5f6fa] p-[13px]">
                <strong className="mb-[7px] block text-[11px] text-[#606b7d]">Cấu trúc gợi ý</strong>
                <code className="block rounded-[7px] border border-[#e6e8ee] bg-white p-[9px] font-(family-name:--font-mono) text-[11px] whitespace-normal text-[#9a258f]">
                  {contentType === "post"
                    ? "content, platform, account, publishedAt, reach"
                    : "comment, parentContent, platform, account, publishedAt, reach"}
                </code>
                <p className="mt-[7px] text-[10px] text-[#8b93a2]">
                  File TXT: mỗi dòng được xem là một bài viết hoặc bình luận.
                </p>
              </div>
            </>
          ) : (
            <>
              {contentType === "comment" && (
                <label className="relative block">
                  <span className={fieldLabel}>Ngữ cảnh bài viết gốc</span>
                  <textarea
                    className={`${fieldControl} h-[105px] resize-y leading-[1.55]`}
                    value={parentContent}
                    onChange={(event) => setParentContent(event.target.value)}
                    placeholder="Dán nội dung hoặc tóm tắt bài viết chứa bình luận…"
                  />
                </label>
              )}
              <label className="relative block">
                <span className={fieldLabel}>
                  {contentType === "post" ? "Nội dung bài viết" : "Nội dung bình luận"}{" "}
                  <b className="text-[#d52aa8]">*</b>
                </span>
                <textarea
                  className={`${fieldControl} h-[190px] resize-y leading-[1.55]`}
                  required
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder={
                    contentType === "post"
                      ? "Dán nguyên văn nội dung bài viết cần kiểm tra…"
                      : "Dán nguyên văn bình luận cần kiểm tra…"
                  }
                />
                <small className="absolute right-[11px] bottom-[9px] text-[10px] text-[#9ba1af]">
                  {content.length} / 5.000 ký tự
                </small>
              </label>
            </>
          )}
          {inputMode === "manual" && (
            <>
              <div className="grid grid-cols-2 gap-[14px] max-[700px]:grid-cols-1">
                <label className="relative block">
                  <span className={fieldLabel}>Nền tảng</span>
                  <select
                    className={fieldControl}
                    value={platform}
                    onChange={(event) => setPlatform(event.target.value as Case["platform"])}
                  >
                    <option>Facebook</option>
                    <option>TikTok</option>
                    <option>YouTube</option>
                    <option>X</option>
                  </select>
                </label>
                <label className="relative block">
                  <span className={fieldLabel}>{contentType === "post" ? "Tài khoản đăng" : "Người bình luận"}</span>
                  <input
                    className={fieldControl}
                    value={account}
                    onChange={(event) => setAccount(event.target.value)}
                    placeholder={
                      contentType === "post" ? "Tên tài khoản hoặc kênh" : "Tên tài khoản bình luận"
                    }
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-[14px] max-[700px]:grid-cols-1">
                <label className="relative block">
                  <span className={fieldLabel}>Thời gian đăng</span>
                  <input
                    className={fieldControl}
                    type="datetime-local"
                    value={publishedAt}
                    onChange={(event) => setPublishedAt(event.target.value)}
                  />
                </label>
                <label className="relative block">
                  <span className={fieldLabel}>Lượt tương tác</span>
                  <input
                    className={fieldControl}
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
          <div className="flex gap-[11px] rounded-xl bg-[#f8f2fb] p-[13px] text-[#686079]">
            <span className="grid h-[21px] w-[21px] place-items-center rounded-full bg-[#bd25b1] text-white">
              <Info size={14} />
            </span>
            <p className="m-0 text-[11px] leading-normal">
              <strong className="block text-[#4c3a57]">Luồng MVP</strong> Sau khi lưu, hệ thống tạo hồ sơ với kết quả
              “Cần kiểm chứng”. Dữ liệu chỉ tồn tại trong phiên trình duyệt hiện tại.
            </p>
          </div>
          <div className="flex justify-end gap-[9px] pt-[5px] max-[700px]:grid max-[700px]:grid-cols-2">
            <button
              type="button"
              className="rounded-[10px] border border-[#e0e3ea] bg-white px-[15px] py-[11px] text-[13px] font-bold text-[#687286]"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-[10px] border-0 bg-linear-145 from-[#ef35ad] to-[#a921cf] px-[15px] py-[11px] text-[13px] font-bold text-white shadow-[0_7px_16px_#c626aa2c] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
              disabled={submitting || (inputMode === "manual" ? !content.trim() : !parsedRows.length)}
            >
              {submitting
                ? "Đang phân tích…"
                : inputMode === "file"
                ? <>Nhập {parsedRows.length || ""} hồ sơ <ArrowRight size={14} className="inline align-[-2px]" /></>
                : <>Tạo hồ sơ & phân tích <ArrowRight size={14} className="inline align-[-2px]" /></>}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
