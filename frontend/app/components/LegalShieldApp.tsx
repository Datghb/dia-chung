"use client";

import { useEffect, useMemo, useState } from "react";

type Verdict = "Đúng" | "Hiểu lầm" | "Cần kiểm chứng";
type Status = "Mới" | "Đang xử lý" | "Đã xử lý";
type Priority = "Khẩn cấp" | "Cao" | "Trung bình" | "Thấp";

type Case = {
  id: string;
  claim: string;
  original: string;
  platform: "Facebook" | "TikTok" | "YouTube" | "X" | "Forum";
  account: string;
  publishedAt: string;
  priority: Priority;
  score: number;
  verdict: Verdict;
  status: Status;
  reason: string;
  document: string;
  provision: string;
  subject: string;
  penalty: string;
  sourceTitle: string;
  sourceAgency: string;
  sourceUrl: string;
  sourceResult: string;
  reach: string;
  contentType?: "post" | "comment";
  parentContent?: string;
};

type ApiQueueItem = {
  id: string; text: string; claim: string; label: "dung" | "hieu_lam" | "can_kiem_chung";
  source_label: string; reason: string; priority: number; platform: string; account: string;
  published_at: string; reach: number; status: string;
};

type StudyCase = {
  id: string; ten_vu: string; nguon_cong_bo: string; ngay_quyet_dinh: string;
  hanh_vi: string; dieu_khoan_vien_dan: string; muc_phat: number; chu_the: string;
  bien_phap_khac_phuc: string; nguon_url: string; an_danh: string;
  expected_he_thong: { dieu_khoan_moi: string; nhan: string; ghi_chu: string };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const cases: Case[] = [
  {
    id: "HS-2026-0717-01",
    claim: "Ngân hàng An Việt sắp phá sản và người dân phải rút tiền trước ngày mai.",
    original: "TIN NỘI BỘ: Ngân hàng An Việt sắp phá sản, mọi người phải rút toàn bộ tiền trước ngày mai. Tôi nghe người quen bên trong nói vậy, chia sẻ gấp cho người thân!",
    platform: "Facebook",
    account: "Tin Nhanh 24h",
    publishedAt: "17/07/2026 · 08:14",
    priority: "Khẩn cấp",
    score: 96,
    verdict: "Hiểu lầm",
    status: "Mới",
    reason: "Nội dung khẳng định một sự kiện chưa xảy ra như một sự thật chắc chắn. Thông cáo của cơ quan quản lý xác nhận ngân hàng vẫn hoạt động bình thường và bảo đảm các tỷ lệ an toàn.",
    document: "Nghị định 174/2026/NĐ-CP",
    provision: "Điểm c khoản 2 Điều 95",
    subject: "Cá nhân đăng và chia sẻ thông tin",
    penalty: "10–15 triệu đồng (mức tham khảo)",
    sourceTitle: "Thông cáo về hoạt động của Ngân hàng An Việt",
    sourceAgency: "Ngân hàng Nhà nước Việt Nam",
    sourceUrl: "https://www.sbv.gov.vn/",
    sourceResult: "Mâu thuẫn trực tiếp với claim",
    reach: "28,4K lượt tương tác",
  },
  {
    id: "HS-2026-0717-02",
    claim: "Từ tháng 8, mọi công dân phải đổi căn cước nếu không sẽ bị phạt.",
    original: "Từ 01/08 tất cả mọi người bắt buộc đổi căn cước. Ai chưa đổi sẽ bị phạt đến 5 triệu đồng.",
    platform: "TikTok",
    account: "@thongtinmoi",
    publishedAt: "17/07/2026 · 07:32",
    priority: "Cao",
    score: 84,
    verdict: "Hiểu lầm",
    status: "Đang xử lý",
    reason: "Quy định chỉ áp dụng cho một số trường hợp cụ thể, không áp dụng đồng loạt cho mọi công dân.",
    document: "Luật Căn cước 2023",
    provision: "Điều 24",
    subject: "Cá nhân truyền tải thông tin",
    penalty: "Đánh giá theo bối cảnh cụ thể",
    sourceTitle: "Những trường hợp phải cấp đổi thẻ căn cước",
    sourceAgency: "Cổng Thông tin điện tử Chính phủ",
    sourceUrl: "https://xaydungchinhsach.chinhphu.vn/",
    sourceResult: "Claim thiếu điều kiện áp dụng",
    reach: "16,2K lượt tương tác",
  },
  {
    id: "HS-2026-0716-08",
    claim: "Bảo hiểm y tế sẽ ngừng chi trả thuốc ngoại trú từ quý IV.",
    original: "Nghe nói quý IV năm nay BHYT sẽ không còn thanh toán thuốc ngoại trú nữa.",
    platform: "YouTube",
    account: "Sức khỏe mỗi ngày",
    publishedAt: "16/07/2026 · 21:05",
    priority: "Cao",
    score: 78,
    verdict: "Cần kiểm chứng",
    status: "Mới",
    reason: "Chưa tìm thấy văn bản hoặc thông báo chính thức đủ mới để khẳng định hay bác bỏ toàn bộ nội dung.",
    document: "Luật Bảo hiểm y tế",
    provision: "Điều 21 và văn bản hướng dẫn",
    subject: "Chủ thể phát hành nội dung",
    penalty: "Chưa đủ căn cứ xác định",
    sourceTitle: "Phạm vi quyền lợi của người tham gia BHYT",
    sourceAgency: "Bảo hiểm xã hội Việt Nam",
    sourceUrl: "https://baohiemxahoi.gov.vn/",
    sourceResult: "Chưa đủ bằng chứng",
    reach: "9,7K lượt tương tác",
  },
  {
    id: "HS-2026-0716-05",
    claim: "Cổng dịch vụ công đã cho phép nộp hồ sơ cấp hộ chiếu hoàn toàn trực tuyến.",
    original: "Giờ có thể làm hộ chiếu online toàn trình trên Cổng Dịch vụ công, không cần đến nộp hồ sơ giấy.",
    platform: "X",
    account: "@govtechvn",
    publishedAt: "16/07/2026 · 16:48",
    priority: "Trung bình",
    score: 61,
    verdict: "Đúng",
    status: "Đã xử lý",
    reason: "Thông tin phù hợp với hướng dẫn thủ tục đang được công bố trên Cổng Dịch vụ công Bộ Công an.",
    document: "Quyết định 3191/QĐ-BCA",
    provision: "Thủ tục cấp hộ chiếu phổ thông",
    subject: "Không phát hiện dấu hiệu vi phạm",
    penalty: "Không áp dụng",
    sourceTitle: "Hướng dẫn cấp hộ chiếu phổ thông trực tuyến",
    sourceAgency: "Cổng Dịch vụ công Bộ Công an",
    sourceUrl: "https://dichvucong.bocongan.gov.vn/",
    sourceResult: "Được nguồn chính thức xác nhận",
    reach: "4,1K lượt tương tác",
  },
  {
    id: "HS-2026-0715-11",
    claim: "Người lao động được nghỉ thêm hai ngày dịp Quốc khánh năm nay.",
    original: "Lịch nghỉ lễ mới: Quốc khánh năm nay người lao động được nghỉ thêm 2 ngày.",
    platform: "Facebook",
    account: "Việc làm hôm nay",
    publishedAt: "15/07/2026 · 18:20",
    priority: "Thấp",
    score: 39,
    verdict: "Cần kiểm chứng",
    status: "Đã xử lý",
    reason: "Bài đăng không nêu rõ nhóm người lao động và phương án nghỉ do người sử dụng lao động lựa chọn.",
    document: "Bộ luật Lao động 2019",
    provision: "Điều 112",
    subject: "Cá nhân đăng tải thông tin",
    penalty: "Chưa đủ căn cứ xác định",
    sourceTitle: "Thông báo lịch nghỉ lễ Quốc khánh",
    sourceAgency: "Bộ Nội vụ",
    sourceUrl: "https://moha.gov.vn/",
    sourceResult: "Cần bổ sung bối cảnh",
    reach: "2,8K lượt tương tác",
  },
];

const verdicts: Array<"Tất cả" | Verdict> = ["Tất cả", "Đúng", "Hiểu lầm", "Cần kiểm chứng"];
const statuses: Array<"Tất cả" | Status> = ["Tất cả", "Mới", "Đang xử lý", "Đã xử lý"];
const priorityRank: Record<Priority, number> = { "Khẩn cấp": 4, Cao: 3, "Trung bình": 2, Thấp: 1 };

export function LegalShieldApp() {
  const [caseItems, setCaseItems] = useState<Case[]>(cases);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [verdictFilter, setVerdictFilter] = useState<(typeof verdicts)[number]>("Tất cả");
  const [statusFilter, setStatusFilter] = useState<(typeof statuses)[number]>("Tất cả");
  const [sortDesc, setSortDesc] = useState(true);
  const [statusById, setStatusById] = useState<Record<string, Status>>({});
  const [query, setQuery] = useState("");
  const [activeView, setActiveView] = useState<"queue" | "report" | "sources" | "verify">("queue");
  const [studyCases, setStudyCases] = useState<StudyCase[]>([]);
  const [dataSource, setDataSource] = useState<"api" | "fallback">("fallback");

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(`${API_URL}/api/queue`).then((response) => {
        if (!response.ok) throw new Error("Queue API unavailable");
        return response.json() as Promise<ApiQueueItem[]>;
      }),
      fetch(`${API_URL}/api/verify`).then((response) => {
        if (!response.ok) throw new Error("Verify API unavailable");
        return response.json() as Promise<{ cases: StudyCase[] }>;
      }),
    ]).then(([queue, verify]) => {
      if (!active) return;
      if (queue.length) setCaseItems(queue.map(mapApiCase));
      setStudyCases(verify.cases);
      setDataSource("api");
    }).catch(() => {
      if (active) setDataSource("fallback");
    });
    return () => { active = false; };
  }, []);

  const data = useMemo(
    () =>
      caseItems
        .map((item) => ({ ...item, status: statusById[item.id] ?? item.status }))
        .filter((item) => verdictFilter === "Tất cả" || item.verdict === verdictFilter)
        .filter((item) => statusFilter === "Tất cả" || item.status === statusFilter)
        .filter((item) => `${item.claim} ${item.platform} ${item.id}`.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => (priorityRank[b.priority] - priorityRank[a.priority]) * (sortDesc ? 1 : -1)),
    [caseItems, query, sortDesc, statusById, statusFilter, verdictFilter],
  );

  const selected = selectedId
    ? caseItems.find((item) => item.id === selectedId)
    : null;
  const selectedWithStatus = selected
    ? { ...selected, status: statusById[selected.id] ?? selected.status }
    : null;

  return (
    <div className="monitor-app">
      <aside className="monitor-sidebar">
        <div className="monitor-brand">
          <span className="monitor-brand-mark">L</span>
          <div><strong>Legal Radar</strong><small>TRUNG TÂM GIÁM SÁT</small></div>
        </div>
        <nav aria-label="Điều hướng chính">
          <button className={activeView === "queue" ? "active" : ""} onClick={() => { setActiveView("queue"); setSelectedId(null); }}><span>▦</span> Hàng đợi giám sát <b>{caseItems.filter((x) => (statusById[x.id] ?? x.status) !== "Đã xử lý").length}</b></button>
          <button className={activeView === "report" ? "active" : ""} onClick={() => { setActiveView("report"); setSelectedId(null); }}><span>◎</span> Báo cáo tổng hợp</button>
          <button className={activeView === "sources" ? "active" : ""} onClick={() => { setActiveView("sources"); setSelectedId(null); }}><span>⌘</span> Nguồn chính thức</button>
          <button className={activeView === "verify" ? "active" : ""} onClick={() => { setActiveView("verify"); setSelectedId(null); }}><span>✓</span> Tầng kiểm chứng</button>
        </nav>
        <div className="monitor-system"><i /> Hệ thống đang giám sát<small>Cập nhật 30 giây trước</small></div>
      </aside>

      <main className="monitor-main">
        <header className="monitor-topbar">
          <div className="monitor-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm claim hoặc mã hồ sơ…" aria-label="Tìm kiếm hồ sơ" /></div>
          <div className={`monitor-live ${dataSource}`}><i /> {dataSource === "api" ? "Dữ liệu API trực tiếp" : "Dữ liệu mẫu dự phòng"}</div>
          <button className="monitor-avatar" aria-label="Tài khoản Minh Anh">MA</button>
        </header>

        {activeView === "report" ? (
          <ReportView allItems={caseItems} statusById={statusById} />
        ) : activeView === "sources" ? (
          <SourcesView />
        ) : activeView === "verify" ? (
          <VerificationView cases={studyCases} apiConnected={dataSource === "api"} />
        ) : selectedWithStatus ? (
          <CaseDetail
            item={selectedWithStatus}
            onBack={() => setSelectedId(null)}
            onStatusChange={(status) => setStatusById((current) => ({ ...current, [selectedWithStatus.id]: status }))}
          />
        ) : (
          <Queue
            rows={data}
            allItems={caseItems}
            verdictFilter={verdictFilter}
            statusFilter={statusFilter}
            sortDesc={sortDesc}
            onVerdictFilter={setVerdictFilter}
            onStatusFilter={setStatusFilter}
            onSort={() => setSortDesc((value) => !value)}
            onOpen={setSelectedId}
            onCreate={() => setShowInput(true)}
          />
        )}
      </main>
      {showInput && (
        <ManualInput
          onClose={() => setShowInput(false)}
          onSave={(items) => {
            setCaseItems((current) => [...items, ...current]);
            setShowInput(false);
            setSelectedId(items.length === 1 ? items[0].id : null);
          }}
        />
      )}
    </div>
  );
}

function Queue({
  rows, allItems, verdictFilter, statusFilter, sortDesc, onVerdictFilter, onStatusFilter, onSort, onOpen, onCreate,
}: {
  rows: Case[];
  allItems: Case[];
  verdictFilter: (typeof verdicts)[number];
  statusFilter: (typeof statuses)[number];
  sortDesc: boolean;
  onVerdictFilter: (value: (typeof verdicts)[number]) => void;
  onStatusFilter: (value: (typeof statuses)[number]) => void;
  onSort: () => void;
  onOpen: (id: string) => void;
  onCreate: () => void;
}) {
  const openCount = allItems.filter((item) => item.status !== "Đã xử lý").length;
  return (
    <div className="monitor-page">
      <div className="queue-heading">
        <div><span className="eyebrow">ĐIỀU PHỐI NỘI DUNG</span><h1>Hàng đợi giám sát</h1><p>Nhập thủ công nội dung cần theo dõi, sau đó rà soát kết quả phân tích của AI.</p></div>
        <div className="queue-summary"><small>CẦN XỬ LÝ</small><strong>{String(openCount).padStart(2, "0")}</strong><span>hồ sơ đang mở</span></div>
      </div>

      <section className="queue-card">
        <div className="queue-toolbar">
          <div className="filter-group">
            <label>Kết quả AI<select value={verdictFilter} onChange={(event) => onVerdictFilter(event.target.value as (typeof verdicts)[number])}>{verdicts.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label>Trạng thái<select value={statusFilter} onChange={(event) => onStatusFilter(event.target.value as (typeof statuses)[number])}>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label>
          </div>
          <div className="queue-actions"><button className="sort-button" onClick={onSort}>↕ Mức ưu tiên: {sortDesc ? "cao trước" : "thấp trước"}</button><button className="create-button" onClick={onCreate}>＋ Nhập nội dung mới</button></div>
        </div>
        <div className="queue-table-wrap">
          <table className="queue-table">
            <thead><tr><th>CLAIM</th><th>NỀN TẢNG</th><th>MỨC ƯU TIÊN</th><th>KẾT QUẢ AI</th><th>TRẠNG THÁI</th><th /></tr></thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} onClick={() => onOpen(item.id)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onOpen(item.id); }}>
                  <td><strong>{item.claim}</strong><small>{item.id} · {item.publishedAt}</small></td>
                  <td><span className={`platform-logo ${item.platform.toLowerCase()}`}>{platformIcon(item.platform)}</span>{item.platform}</td>
                  <td><span className={`priority-badge ${slug(item.priority)}`}><i />{item.priority}</span><small className="score-copy">AI score {item.score}/100</small></td>
                  <td><VerdictBadge value={item.verdict} /></td>
                  <td><StatusBadge value={item.status} /></td>
                  <td><button className="row-arrow" aria-label={`Mở hồ sơ ${item.id}`}>→</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <div className="queue-empty"><strong>Không có hồ sơ phù hợp</strong><span>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</span></div>}
        </div>
        <footer className="queue-footer">Hiển thị <strong>{rows.length}</strong> / {allItems.length} hồ sơ <span>Dữ liệu mock · nội dung nhập mới chỉ lưu trong phiên hiện tại</span></footer>
      </section>
    </div>
  );
}

function ManualInput({ onClose, onSave }: { onClose: () => void; onSave: (items: Case[]) => void }) {
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

  function buildCase(row: Record<string, string>, index = 0): Case {
    const rawContent = (row.content || row.comment || row.text || content).trim().replace(/\s+/g, " ");
    const claim = rawContent.split(/[.!?]/)[0].slice(0, 150) || rawContent.slice(0, 150);
    const rowType = (row.type === "comment" || contentType === "comment") ? "comment" : "post";
    const allowedPlatforms: Case["platform"][] = ["Facebook", "TikTok", "YouTube", "X"];
    const rowPlatform = allowedPlatforms.find((value) => value.toLowerCase() === (row.platform || platform).toLowerCase()) || platform;
    return {
      id: `HS-MVP-${Date.now().toString().slice(-6)}-${index + 1}`,
      claim,
      original: rawContent,
      platform: rowPlatform,
      account: (row.account || row.author || account).trim() || "Chưa xác định",
      publishedAt: row.publishedAt || row.published_at || (publishedAt ? new Date(publishedAt).toLocaleString("vi-VN") : "Vừa nhập"),
      priority: "Cao",
      score: 75,
      verdict: "Cần kiểm chứng",
      status: "Mới",
      reason: "Nội dung vừa được nhập bằng file và đang chờ đối chiếu với nguồn chính thức. Kết quả hiện tại là dữ liệu mô phỏng cho luồng MVP.",
      document: "Đang xác định",
      provision: "Chờ ánh xạ điều / khoản / điểm",
      subject: "Chủ thể đăng tải nội dung",
      penalty: "Chưa đủ căn cứ xác định",
      sourceTitle: "Chưa có nguồn đối chiếu",
      sourceAgency: "Đang chờ kiểm chứng",
      sourceUrl: "#",
      sourceResult: "Chưa đủ bằng chứng",
      reach: (row.reach || reach).trim() ? `${(row.reach || reach).trim()} lượt tương tác` : "Chưa có số liệu tương tác",
      contentType: rowType,
      parentContent: rowType === "comment" ? (row.parentContent || row.parent_content || parentContent).trim() : undefined,
    };
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inputMode === "file") {
      const validRows = parsedRows.filter((row) => (row.content || row.comment || row.text || "").trim());
      if (validRows.length) onSave(validRows.map((row, index) => buildCase(row, index)));
      return;
    }
    const compact = content.trim().replace(/\s+/g, " ");
    if (compact) onSave([buildCase({ content: compact })]);
  }

  async function readFile(file?: File) {
    if (!file) return;
    setFileName(file.name); setFileError(""); setParsedRows([]);
    try {
      const text = await file.text();
      const extension = file.name.split(".").pop()?.toLowerCase();
      let rows: Record<string, string>[] = [];
      if (extension === "json") {
        const parsed = JSON.parse(text);
        rows = (Array.isArray(parsed) ? parsed : [parsed]).map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, String(value ?? "")])));
      } else if (extension === "csv") {
        rows = parseCsv(text);
      } else {
        rows = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => ({ content: line, type: contentType }));
      }
      const valid = rows.filter((row) => (row.content || row.comment || row.text || "").trim());
      if (!valid.length) throw new Error("Không tìm thấy nội dung hợp lệ.");
      setParsedRows(valid);
    } catch {
      setFileError("Không đọc được file. Kiểm tra lại định dạng và tên cột.");
    }
  }

  return (
    <>
      <button className="input-backdrop" onClick={onClose} aria-label="Đóng form nhập nội dung" />
      <aside className="input-drawer" aria-labelledby="manual-input-title">
        <div className="input-drawer-head"><div><span className="eyebrow">MVP · NHẬP THỦ CÔNG</span><h2 id="manual-input-title">Thêm nội dung giám sát</h2><p>Nhập nguyên văn bài đăng để tạo hồ sơ mới trong hàng đợi.</p></div><button onClick={onClose} aria-label="Đóng">×</button></div>
        <form onSubmit={submit}>
          <div className="input-mode-switch"><button type="button" className={inputMode === "manual" ? "active" : ""} onClick={() => setInputMode("manual")}>Nhập thủ công</button><button type="button" className={inputMode === "file" ? "active" : ""} onClick={() => setInputMode("file")}>Tải file hàng loạt</button></div>
          <div className="input-type-tabs" role="tablist" aria-label="Loại nội dung">
            <button type="button" role="tab" aria-selected={contentType === "post"} className={contentType === "post" ? "active" : ""} onClick={() => setContentType("post")}><span>▤</span><div><strong>Bài viết</strong><small>Nhập nội dung bài đăng độc lập</small></div></button>
            <button type="button" role="tab" aria-selected={contentType === "comment"} className={contentType === "comment" ? "active" : ""} onClick={() => setContentType("comment")}><span>◌</span><div><strong>Bình luận</strong><small>Nhập comment và ngữ cảnh bài gốc</small></div></button>
          </div>
          {inputMode === "file" ? (
            <>
              <label className={`file-drop ${parsedRows.length ? "ready" : ""}`}><input type="file" accept=".csv,.json,.txt,text/csv,application/json,text/plain" onChange={(event) => readFile(event.target.files?.[0])} /><span>{parsedRows.length ? "✓" : "⇧"}</span><strong>{fileName || `Chọn file ${contentType === "post" ? "bài viết" : "bình luận"}`}</strong><small>CSV, JSON hoặc TXT · tối đa theo khả năng trình duyệt</small></label>
              {parsedRows.length > 0 && <div className="file-result"><strong>{parsedRows.length} bản ghi hợp lệ</strong><span>Sẵn sàng đưa vào hàng đợi giám sát</span></div>}
              {fileError && <div className="file-error">{fileError}</div>}
              <div className="file-format"><strong>Cấu trúc gợi ý</strong><code>{contentType === "post" ? "content, platform, account, publishedAt, reach" : "comment, parentContent, platform, account, publishedAt, reach"}</code><p>File TXT: mỗi dòng được xem là một bài viết hoặc bình luận.</p></div>
            </>
          ) : (
            <>
              {contentType === "comment" && <label className="manual-field"><span>Ngữ cảnh bài viết gốc</span><textarea className="context-textarea" value={parentContent} onChange={(event) => setParentContent(event.target.value)} placeholder="Dán nội dung hoặc tóm tắt bài viết chứa bình luận…" /></label>}
              <label className="manual-field"><span>{contentType === "post" ? "Nội dung bài viết" : "Nội dung bình luận"} <b>*</b></span><textarea required value={content} onChange={(event) => setContent(event.target.value)} placeholder={contentType === "post" ? "Dán nguyên văn nội dung bài viết cần kiểm tra…" : "Dán nguyên văn bình luận cần kiểm tra…"} /><small>{content.length} / 5.000 ký tự</small></label>
            </>
          )}
          {inputMode === "manual" && <>
          <div className="manual-grid">
            <label className="manual-field"><span>Nền tảng</span><select value={platform} onChange={(event) => setPlatform(event.target.value as Case["platform"])}><option>Facebook</option><option>TikTok</option><option>YouTube</option><option>X</option></select></label>
            <label className="manual-field"><span>{contentType === "post" ? "Tài khoản đăng" : "Người bình luận"}</span><input value={account} onChange={(event) => setAccount(event.target.value)} placeholder={contentType === "post" ? "Tên tài khoản hoặc kênh" : "Tên tài khoản bình luận"} /></label>
          </div>
          <div className="manual-grid">
            <label className="manual-field"><span>Thời gian đăng</span><input type="datetime-local" value={publishedAt} onChange={(event) => setPublishedAt(event.target.value)} /></label>
            <label className="manual-field"><span>Lượt tương tác</span><input type="number" min="0" value={reach} onChange={(event) => setReach(event.target.value)} placeholder="Ví dụ: 12500" /></label>
          </div>
          </>}
          <div className="manual-note"><span>i</span><p><strong>Luồng MVP</strong> Sau khi lưu, hệ thống tạo hồ sơ với kết quả “Cần kiểm chứng”. Dữ liệu chỉ tồn tại trong phiên trình duyệt hiện tại.</p></div>
          <div className="manual-actions"><button type="button" onClick={onClose}>Hủy</button><button type="submit" disabled={inputMode === "manual" ? !content.trim() : !parsedRows.length}>{inputMode === "file" ? `Nhập ${parsedRows.length || ""} hồ sơ →` : "Tạo hồ sơ & phân tích →"}</button></div>
        </form>
      </aside>
    </>
  );
}

function CaseDetail({ item, onBack, onStatusChange }: { item: Case; onBack: () => void; onStatusChange: (status: Status) => void }) {
  return (
    <div className="monitor-page detail-page">
      <button className="back-button" onClick={onBack}>← Quay lại hàng đợi</button>
      <div className="detail-heading">
        <div><span className="eyebrow">HỒ SƠ NỘI DUNG · {item.id}</span><h1>Thẩm định nội dung giám sát</h1><p>Phát hiện tự động lúc {item.publishedAt}</p></div>
        <label className="status-control">Trạng thái xử lý<select value={item.status} onChange={(event) => onStatusChange(event.target.value as Status)}>{statuses.slice(1).map((value) => <option key={value}>{value}</option>)}</select></label>
      </div>

      <div className="detail-grid">
        <div className="detail-primary">
          <section className="detail-card original-card">
            <div className="card-heading"><div><span>01</span><div><small>NỘI DUNG GỐC</small><h2>{item.contentType === "comment" ? "Bình luận được giám sát" : "Bài viết được giám sát"}</h2></div></div><em>{item.reach}</em></div>
            <div className="post-author"><span className={`platform-logo ${item.platform.toLowerCase()}`}>{platformIcon(item.platform)}</span><div><strong>{item.account}</strong><small>{item.platform} · {item.publishedAt}</small></div></div>
            {item.contentType === "comment" && item.parentContent && <div className="parent-context"><small>NGỮ CẢNH BÀI VIẾT GỐC</small><p>{item.parentContent}</p></div>}
            <blockquote>“{item.original}”</blockquote>
          </section>

          <section className="detail-card">
            <div className="card-heading"><div><span>02</span><div><small>PHÂN TÍCH AI</small><h2>Claim được trích xuất</h2></div></div><VerdictBadge value={item.verdict} /></div>
            <div className="claim-quote">“{item.claim}”</div>
            <div className="analysis-reason"><small>LÝ DO PHÂN LOẠI</small><p>{item.reason}</p></div>
          </section>

          <section className="detail-card source-card">
            <div className="card-heading"><div><span>03</span><div><small>KIỂM CHỨNG NGUỒN</small><h2>Đối chiếu nguồn chính thức</h2></div></div><span className={`source-result ${item.verdict === "Đúng" ? "confirmed" : item.verdict === "Hiểu lầm" ? "conflict" : "pending"}`}>{item.verdict === "Đúng" ? "✓" : item.verdict === "Hiểu lầm" ? "↯" : "?"} {item.sourceResult}</span></div>
            <div className="official-source"><div className="agency-mark">CQ</div><div><small>NGUỒN CHÍNH THỨC</small><h3>{item.sourceTitle}</h3><p>{item.sourceAgency}</p></div><a href={item.sourceUrl} target="_blank" rel="noreferrer">Mở nguồn ↗</a></div>
          </section>
        </div>

        <aside className="detail-aside">
          <section className="decision-card">
            <small>KẾT QUẢ THẨM ĐỊNH AI</small><VerdictBadge value={item.verdict} large /><div className="confidence-row"><span>Độ ưu tiên</span><strong>{item.score}/100</strong></div><div className="confidence-track"><i style={{ width: `${item.score}%` }} /></div><p>Kết quả tự động hỗ trợ sàng lọc, không thay thế kết luận của chuyên viên.</p>
          </section>
          <section className="legal-card-new">
            <div className="legal-title"><span>⚖</span><div><small>CĂN CỨ PHÁP LUẬT</small><h2>{item.document}</h2></div></div>
            <dl>
              <div><dt>Điều / khoản / điểm</dt><dd>{item.provision}</dd></div>
              <div><dt>Chủ thể</dt><dd>{item.subject}</dd></div>
              <div><dt>Mức phạt</dt><dd>{item.penalty}</dd></div>
            </dl>
            <div className="legal-note">Cần đối chiếu đầy đủ hành vi, chủ thể và tình tiết thực tế trước khi áp dụng.</div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function VerdictBadge({ value, large = false }: { value: Verdict; large?: boolean }) {
  return <span className={`verdict-new ${slug(value)} ${large ? "large" : ""}`}><i />{value}</span>;
}

function StatusBadge({ value }: { value: Status }) {
  return <span className={`status-new ${slug(value)}`}><i />{value}</span>;
}

function slug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "-");
}

function platformIcon(platform: Case["platform"]) {
  return platform === "Facebook" ? "f" : platform === "TikTok" ? "♪" : platform === "YouTube" ? "▶" : platform === "X" ? "𝕏" : "◉";
}

function mapApiCase(item: ApiQueueItem): Case {
  const verdictMap: Record<ApiQueueItem["label"], Verdict> = {
    dung: "Đúng", hieu_lam: "Hiểu lầm", can_kiem_chung: "Cần kiểm chứng",
  };
  const priority: Priority = item.priority >= 2 ? "Khẩn cấp" : item.priority === 1 ? "Cao" : item.reach >= 150 ? "Trung bình" : "Thấp";
  const platform = (["Facebook", "TikTok", "YouTube", "X", "Forum"].includes(item.platform) ? item.platform : "Forum") as Case["platform"];
  const sourceResult = item.source_label === "co_nguon_xac_nhan" ? "Có nguồn chính thức xác nhận" : item.source_label === "co_bac_bo_chinh_thuc" ? "Có nguồn chính thức bác bỏ" : "Chưa tìm thấy nguồn phù hợp";
  return {
    id: item.id,
    claim: item.claim,
    original: item.text || item.claim,
    platform,
    account: item.account,
    publishedAt: item.published_at || "Chưa xác định",
    priority,
    score: Math.min(98, 55 + item.priority * 18 + Math.min(20, Math.round(item.reach / 20))),
    verdict: verdictMap[item.label],
    status: item.status === "resolved" ? "Đã xử lý" : item.status === "reviewing" ? "Đang xử lý" : "Mới",
    reason: item.reason,
    document: "Nghị định 174/2026/NĐ-CP",
    provision: "Điều 95 — cần đối chiếu claim cụ thể",
    subject: "Cá nhân hoặc tổ chức đăng tải",
    penalty: "Cần xác định chủ thể trước khi tính mức phạt",
    sourceTitle: sourceResult,
    sourceAgency: "Hệ thống xác thực nguồn động",
    sourceUrl: "#",
    sourceResult,
    reach: `${item.reach.toLocaleString("vi-VN")} lượt tương tác`,
    contentType: "comment",
  };
}

function VerificationView({ cases, apiConnected }: { cases: StudyCase[]; apiConnected: boolean }) {
  return (
    <div className="monitor-page">
      <div className="queue-heading">
        <div><span className="eyebrow">ĐỐI CHIẾU THỰC TẾ</span><h1>Tầng kiểm chứng</h1><p>So sánh kết quả hệ thống với các quyết định xử phạt đã được công bố.</p></div>
        <div className={`verify-state ${apiConnected ? "connected" : ""}`}><i />{apiConnected ? `${cases.length} study case từ API` : "Đang chờ Backend API"}</div>
      </div>
      {!cases.length ? <section className="queue-card verify-empty"><strong>Chưa tải được study case</strong><p>Khởi động backend tại cổng 8000 để xem dữ liệu kiểm chứng thật.</p></section> :
        <div className="verify-list">{cases.map((item) => <article className="verify-card" key={item.id}>
          <header><div><small>{item.id} · {item.ngay_quyet_dinh}</small><h2>{item.ten_vu}</h2><p>{item.nguon_cong_bo}</p></div><span>KHỚP CASE THẬT</span></header>
          <div className="verify-columns"><div><small>HÀNH VI THỰC TẾ</small><p>{item.hanh_vi}</p><dl><div><dt>Chủ thể</dt><dd>{item.chu_the}</dd></div><div><dt>Mức phạt thực tế</dt><dd>{item.muc_phat.toLocaleString("vi-VN")} đồng</dd></div><div><dt>Điều khoản viện dẫn</dt><dd>{item.dieu_khoan_vien_dan}</dd></div></dl></div><div><small>KỲ VỌNG HỆ THỐNG</small><p className="expected-label">✓ {item.expected_he_thong.nhan}</p><strong>{item.expected_he_thong.dieu_khoan_moi}</strong><p>{item.expected_he_thong.ghi_chu}</p></div></div>
          <footer><span>Biện pháp: {item.bien_phap_khac_phuc}</span><a href={item.nguon_url} target="_blank" rel="noreferrer">Mở nguồn công bố ↗</a></footer>
        </article>)}</div>}
    </div>
  );
}

function ReportView({ allItems, statusById }: { allItems: Case[]; statusById: Record<string, Status> }) {
  const total = allItems.length;
  const dung = allItems.filter((i) => i.verdict === "Đúng").length;
  const hieuLam = allItems.filter((i) => i.verdict === "Hiểu lầm").length;
  const canKC = allItems.filter((i) => i.verdict === "Cần kiểm chứng").length;
  const open = allItems.filter((i) => (statusById[i.id] ?? i.status) !== "Đã xử lý").length;

  return (
    <div className="monitor-page">
      <div className="queue-heading">
        <div><span className="eyebrow">BÁO CÁO</span><h1>Báo cáo tổng hợp</h1><p>Tổng hợp kết quả phân tích AI trên tất cả hồ sơ giám sát.</p></div>
      </div>

      <section className="queue-card" style={{ marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, padding: 24 }}>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 32, fontWeight: 700 }}>{total}</div><small>Tổng hồ sơ</small></div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 32, fontWeight: 700, color: "#22c55e" }}>{dung}</div><small>Đúng</small></div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 32, fontWeight: 700, color: "#f97316" }}>{hieuLam}</div><small>Hiểu lầm</small></div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 32, fontWeight: 700, color: "#eab308" }}>{canKC}</div><small>Cần kiểm chứng</small></div>
        </div>
      </section>

      <section className="queue-card" style={{ marginBottom: 24 }}>
        <div style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 12 }}>Top hiểu lầm lặp lại</h3>
          <table className="queue-table">
            <thead><tr><th>STT</th><th>NHÓM HIỂU LẦM</th><th>SỐ LẦN</th></tr></thead>
            <tbody>
              <tr><td>1</td><td>Nhầm chủ thể tổ chức ↔ cá nhân</td><td>{hieuLam}</td></tr>
              <tr><td>2</td><td>Nhầm quy định cũ NĐ15/2020</td><td>0</td></tr>
              <tr><td>3</td><td>Nhầm khoản k1 ↔ k2 Điều 95</td><td>0</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="queue-card">
        <div style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 12 }}>Hồ sơ đang mở: {open}</h3>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>Báo cáo được tính trực tiếp từ dữ liệu hàng đợi hiện đang hiển thị.</p>
        </div>
      </section>
    </div>
  );
}

function SourcesView() {
  const sources = [
    { tier: 0, name: "Ngân hàng Nhà nước (SBV)", domain: "sbv.gov.vn", desc: "Cơ quan quản lý ngân hàng — thẩm quyền xác nhận/bác bỏ tin đồn tài chính" },
    { tier: 0, name: "Bộ Y tế", domain: "moh.gov.vn", desc: "Cơ quan phát ngôn về dịch bệnh, y tế công cộng" },
    { tier: 0, name: "Bộ Công an", domain: "bocongan.gov.vn", desc: "Cơ quan phát ngôn về an ninh, trật tự" },
    { tier: 0, name: "Cổng TTĐT Chính phủ", domain: "chinhphu.vn", desc: "Công bố chính sách, quyết định chính thức" },
    { tier: 1, name: "TTXVN", domain: "baotintuc.vn", desc: "Thông tấn xã — nguồn tin chính thống quốc gia" },
    { tier: 1, name: "VTV", domain: "vtv.vn", desc: "Đài Truyền hình Việt Nam" },
    { tier: 1, name: "Nhân Dân", domain: "nhandan.vn", desc: "Cơ quan ngôn luận của Đảng" },
    { tier: 2, name: "VnExpress", domain: "vnexpress.net", desc: "Báo lớn — corroboration, không đơn phương quyết định" },
    { tier: 2, name: "Tuổi Trẻ", domain: "tuoitre.vn", desc: "Báo lớn — corroboration" },
    { tier: 2, name: "Thanh Niên", domain: "thanhnien.vn", desc: "Báo lớn — corroboration" },
  ];

  return (
    <div className="monitor-page">
      <div className="queue-heading">
        <div><span className="eyebrow">NGUỒN TIN</span><h1>Nguồn chính thức</h1><p>Danh sách whitelist nguồn tin theo tầng thẩm quyền — hệ thống chỉ dùng các nguồn này để xác minh nội dung.</p></div>
      </div>

      {[0, 1, 2].map((tier) => (
        <section key={tier} className="queue-card" style={{ marginBottom: 24 }}>
          <div style={{ padding: 24 }}>
            <h3 style={{ marginBottom: 4 }}>
              Tier {tier}: {tier === 0 ? "Cơ quan chính phủ (1 mình đủ)" : tier === 1 ? "Báo chí chính thống (cần ≥2 độc lập)" : "Báo lớn (chỉ corroboration)"}
            </h3>
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16 }}>
              {tier === 0 ? "Một mình Tier 0 xác nhận/bác bỏ là đủ — không cần nguồn khác." : tier === 1 ? "Cần ≥2 nguồn Tier 1/2 độc lập xác nhận. Bác bỏ hợp lệ khi dẫn lời Tier 0." : "Chỉ dùng để bổ sung — không đơn phương quyết định."}
            </p>
            <table className="queue-table">
              <thead><tr><th>TÊN</th><th>DOMAIN</th><th>MÔ TẢ</th></tr></thead>
              <tbody>
                {sources.filter((s) => s.tier === tier).map((s) => (
                  <tr key={s.domain}><td><strong>{s.name}</strong></td><td><code>{s.domain}</code></td><td>{s.desc}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

function parseCsv(text: string) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const split = (line: string) => {
    const values: string[] = []; let current = ""; let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (char === '"') quoted = !quoted;
      else if (char === "," && !quoted) { values.push(current.trim()); current = ""; }
      else current += char;
    }
    values.push(current.trim()); return values;
  };
  const headers = split(lines[0]);
  return lines.slice(1).map((line) => Object.fromEntries(headers.map((header, index) => [header.trim(), split(line)[index] || ""])));
}
