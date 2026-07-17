"use client";

import { useMemo, useState } from "react";

type Verdict = "Đúng" | "Hiểu lầm" | "Cần kiểm chứng";
type Status = "Mới" | "Đang xử lý" | "Đã xử lý";
type Priority = "Khẩn cấp" | "Cao" | "Trung bình" | "Thấp";

type Case = {
  id: string;
  claim: string;
  original: string;
  platform: "Facebook" | "TikTok" | "YouTube" | "X";
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
};

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
          <button className="active"><span>▦</span> Hàng đợi giám sát <b>{caseItems.filter((x) => (statusById[x.id] ?? x.status) !== "Đã xử lý").length}</b></button>
          <button><span>◎</span> Báo cáo tổng hợp</button>
          <button><span>⌘</span> Nguồn chính thức</button>
        </nav>
        <div className="monitor-system"><i /> Hệ thống đang giám sát<small>Cập nhật 30 giây trước</small></div>
      </aside>

      <main className="monitor-main">
        <header className="monitor-topbar">
          <div className="monitor-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm claim hoặc mã hồ sơ…" aria-label="Tìm kiếm hồ sơ" /></div>
          <div className="monitor-live"><i /> Dữ liệu trực tiếp</div>
          <button className="monitor-avatar" aria-label="Tài khoản Minh Anh">MA</button>
        </header>

        {selectedWithStatus ? (
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
          onSave={(item) => {
            setCaseItems((current) => [item, ...current]);
            setShowInput(false);
            setSelectedId(item.id);
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
                  <td><span className={`platform-logo ${item.platform.toLowerCase()}`}>{item.platform === "Facebook" ? "f" : item.platform === "TikTok" ? "♪" : item.platform === "YouTube" ? "▶" : "𝕏"}</span>{item.platform}</td>
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

function ManualInput({ onClose, onSave }: { onClose: () => void; onSave: (item: Case) => void }) {
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState<Case["platform"]>("Facebook");
  const [account, setAccount] = useState("");
  const [publishedAt, setPublishedAt] = useState("");
  const [reach, setReach] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const compact = content.trim().replace(/\s+/g, " ");
    const claim = compact.split(/[.!?]/)[0].slice(0, 150) || compact.slice(0, 150);
    onSave({
      id: `HS-MVP-${Date.now().toString().slice(-6)}`,
      claim,
      original: compact,
      platform,
      account: account.trim() || "Chưa xác định",
      publishedAt: publishedAt ? new Date(publishedAt).toLocaleString("vi-VN") : "Vừa nhập",
      priority: "Cao",
      score: 75,
      verdict: "Cần kiểm chứng",
      status: "Mới",
      reason: "Nội dung vừa được nhập thủ công và đang chờ đối chiếu với nguồn chính thức. Kết quả hiện tại là dữ liệu mô phỏng cho luồng MVP.",
      document: "Đang xác định",
      provision: "Chờ ánh xạ điều / khoản / điểm",
      subject: "Chủ thể đăng tải nội dung",
      penalty: "Chưa đủ căn cứ xác định",
      sourceTitle: "Chưa có nguồn đối chiếu",
      sourceAgency: "Đang chờ kiểm chứng",
      sourceUrl: "#",
      sourceResult: "Chưa đủ bằng chứng",
      reach: reach.trim() ? `${reach.trim()} lượt tương tác` : "Chưa có số liệu tương tác",
    });
  }

  return (
    <>
      <button className="input-backdrop" onClick={onClose} aria-label="Đóng form nhập nội dung" />
      <aside className="input-drawer" aria-labelledby="manual-input-title">
        <div className="input-drawer-head"><div><span className="eyebrow">MVP · NHẬP THỦ CÔNG</span><h2 id="manual-input-title">Thêm nội dung giám sát</h2><p>Nhập nguyên văn bài đăng để tạo hồ sơ mới trong hàng đợi.</p></div><button onClick={onClose} aria-label="Đóng">×</button></div>
        <form onSubmit={submit}>
          <label className="manual-field"><span>Nội dung bài đăng <b>*</b></span><textarea required value={content} onChange={(event) => setContent(event.target.value)} placeholder="Dán nguyên văn nội dung cần kiểm tra…" /><small>{content.length} / 5.000 ký tự</small></label>
          <div className="manual-grid">
            <label className="manual-field"><span>Nền tảng</span><select value={platform} onChange={(event) => setPlatform(event.target.value as Case["platform"])}><option>Facebook</option><option>TikTok</option><option>YouTube</option><option>X</option></select></label>
            <label className="manual-field"><span>Tài khoản đăng</span><input value={account} onChange={(event) => setAccount(event.target.value)} placeholder="Tên tài khoản hoặc kênh" /></label>
          </div>
          <div className="manual-grid">
            <label className="manual-field"><span>Thời gian đăng</span><input type="datetime-local" value={publishedAt} onChange={(event) => setPublishedAt(event.target.value)} /></label>
            <label className="manual-field"><span>Lượt tương tác</span><input type="number" min="0" value={reach} onChange={(event) => setReach(event.target.value)} placeholder="Ví dụ: 12500" /></label>
          </div>
          <div className="manual-note"><span>i</span><p><strong>Luồng MVP</strong> Sau khi lưu, hệ thống tạo hồ sơ với kết quả “Cần kiểm chứng”. Dữ liệu chỉ tồn tại trong phiên trình duyệt hiện tại.</p></div>
          <div className="manual-actions"><button type="button" onClick={onClose}>Hủy</button><button type="submit" disabled={!content.trim()}>Tạo hồ sơ &amp; phân tích →</button></div>
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
            <div className="card-heading"><div><span>01</span><div><small>NỘI DUNG GỐC</small><h2>Bài đăng được giám sát</h2></div></div><em>{item.reach}</em></div>
            <div className="post-author"><span className={`platform-logo ${item.platform.toLowerCase()}`}>{item.platform === "Facebook" ? "f" : item.platform === "TikTok" ? "♪" : item.platform === "YouTube" ? "▶" : "𝕏"}</span><div><strong>{item.account}</strong><small>{item.platform} · {item.publishedAt}</small></div></div>
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
