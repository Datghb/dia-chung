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
  const [activeView, setActiveView] = useState<"market" | "queue" | "report" | "sources" | "verify">("market");
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
          <button className={activeView === "market" ? "active" : ""} onClick={() => { setActiveView("market"); setSelectedId(null); }}><span>⌁</span> Tổng quan thị trường</button>
          <button className={activeView === "queue" ? "active" : ""} onClick={() => { setActiveView("queue"); setSelectedId(null); }}><span>▦</span> Hàng đợi giám sát <b>{caseItems.filter((x) => (statusById[x.id] ?? x.status) !== "Đã xử lý").length}</b></button>
          <button className={activeView === "report" ? "active" : ""} onClick={() => { setActiveView("report"); setSelectedId(null); }}><span>◎</span> Báo cáo tổng hợp</button>
          <button className={activeView === "sources" ? "active" : ""} onClick={() => { setActiveView("sources"); setSelectedId(null); }}><span>⌘</span> Nguồn chính thức</button>
          <button className={activeView === "verify" ? "active" : ""} onClick={() => { setActiveView("verify"); setSelectedId(null); }}><span>✓</span> Tầng kiểm chứng</button>
          <button onClick={() => { setActiveView("sources"); setSelectedId(null); }}><span>⌬</span> Knowledge Graph</button>
        </nav>
        <div className="sidebar-insights">
          <div className="sidebar-mini-report">
            <small>BÁO CÁO NHANH HÔM NAY</small>
            <span>Claims mới</span><strong>{caseItems.length} <em>↗ 18%</em></strong>
            <svg viewBox="0 0 200 48" aria-hidden="true"><path d="M2 42 L18 26 L32 31 L48 17 L64 23 L81 12 L97 28 L113 19 L130 25 L148 9 L164 27 L181 18 L198 4" /></svg>
          </div>
          <div className="sidebar-support"><span>◉</span><div><strong>Trung tâm hỗ trợ</strong><small>Hướng dẫn & chính sách</small></div></div>
          <div className="monitor-system"><i /> Legal Radar v2.4.1<small>Hệ thống hoạt động ổn định</small></div>
        </div>
      </aside>

      <main className="monitor-main">
        <header className="monitor-topbar">
          <div className="monitor-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm claim hoặc mã hồ sơ…" aria-label="Tìm kiếm hồ sơ" /></div>
          <div className={`monitor-live ${dataSource}`}><i /> {dataSource === "api" ? "Dữ liệu API trực tiếp" : "Dữ liệu mẫu dự phòng"}</div>
          <button className="notification-button" aria-label="Thông báo">♢<b>3</b></button>
          <button className="monitor-avatar" aria-label="Tài khoản Minh Anh">MA</button><span className="avatar-chevron">⌄</span>
        </header>

        {activeView === "market" ? (
          <MarketOverview allItems={caseItems.map((item) => ({ ...item, status: statusById[item.id] ?? item.status }))} />
        ) : activeView === "report" ? (
          <ReportView allItems={caseItems} statusById={statusById} />
        ) : activeView === "sources" ? (
          <SourcesView />
        ) : activeView === "verify" ? (
          <VerificationView cases={studyCases} apiConnected={dataSource === "api"} />
        ) : (
          <>
            <Queue
              rows={data}
              allItems={caseItems.map((item) => ({ ...item, status: statusById[item.id] ?? item.status }))}
              verdictFilter={verdictFilter}
              statusFilter={statusFilter}
              sortDesc={sortDesc}
              onVerdictFilter={setVerdictFilter}
              onStatusFilter={setStatusFilter}
              onSort={() => setSortDesc((value) => !value)}
              onOpen={setSelectedId}
              onCreate={() => setShowInput(true)}
            />
            {selectedWithStatus && (
              <>
                <button className="detail-backdrop" onClick={() => setSelectedId(null)} aria-label="Đóng hồ sơ" />
                <CaseDetail
                  item={selectedWithStatus}
                  onBack={() => setSelectedId(null)}
                  onStatusChange={(status) => setStatusById((current) => ({ ...current, [selectedWithStatus.id]: status }))}
                />
              </>
            )}
          </>
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

function MarketOverview({ allItems }: { allItems: Case[] }) {
  const [period, setPeriod] = useState<1 | 7 | 30>(7);
  const parsedItems = allItems.map((item) => ({ item, date: parseCaseDate(item.publishedAt) }));
  const latestDate = parsedItems.reduce((latest, row) => row.date && row.date > latest ? row.date : latest, new Date(0));
  const rangeStart = new Date(latestDate);
  rangeStart.setDate(rangeStart.getDate() - period + 1);
  const filtered = parsedItems.filter((row) => !row.date || row.date >= rangeStart).map((row) => row.item);
  const total = filtered.length;
  const urgent = filtered.filter((item) => item.priority === "Khẩn cấp").length;
  const verify = filtered.filter((item) => item.verdict === "Cần kiểm chứng").length;
  const misconception = filtered.filter((item) => item.verdict === "Hiểu lầm").length;
  const riskIndex = total ? Math.round(filtered.reduce((sum, item) => sum + item.score, 0) / total) : 0;
  const platformCounts = (["Facebook", "TikTok", "YouTube", "X", "Forum"] as Case["platform"][]).map((platform) => ({
    platform, count: filtered.filter((item) => item.platform === platform).length,
  }));
  const topicCounts = Array.from(filtered.reduce((map, item) => map.set(item.document, (map.get(item.document) || 0) + 1), new Map<string, number>()))
    .sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxTopic = Math.max(1, ...topicCounts.map(([, count]) => count));
  const alerts = [...filtered].sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority] || b.score - a.score).slice(0, 5);
  const pipeline = [
    ["Đã phát hiện", total],
    ["Cần kiểm chứng", verify],
    ["Đang xử lý", filtered.filter((item) => item.status === "Đang xử lý").length],
    ["Đã xác minh", filtered.filter((item) => item.status === "Đã xử lý").length],
    ["Đã cảnh báo", urgent],
  ] as const;
  const graphItem = alerts[0] || allItems[0];
  const days = Array.from({ length: Math.min(period, 7) }, (_, index) => {
    const date = new Date(latestDate);
    date.setDate(date.getDate() - (Math.min(period, 7) - index - 1));
    const dateItems = parsedItems.filter((row) => row.date?.toDateString() === date.toDateString()).map((row) => row.item);
    return {
      label: `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`,
      urgent: dateItems.filter((item) => item.priority === "Khẩn cấp").length,
      high: dateItems.filter((item) => item.priority === "Cao").length,
      medium: dateItems.filter((item) => item.priority === "Trung bình").length,
      low: dateItems.filter((item) => item.priority === "Thấp").length,
    };
  });
  const maxDaily = Math.max(1, ...days.flatMap((day) => [day.urgent, day.high, day.medium, day.low]));
  const chartPath = (key: "urgent" | "high" | "medium" | "low") => days.map((day, index) =>
    `${index ? "L" : "M"}${(index / Math.max(1, days.length - 1)) * 800} ${165 - (day[key] / maxDaily) * 145}`,
  ).join(" ");
  return (
    <div className="monitor-page market-page">
      <div className="market-title">
        <div><span className="eyebrow">BẢNG ĐIỀU KHIỂN CHIẾN LƯỢC</span><h1>Toàn cảnh thị trường thông tin</h1><p>Giúp lãnh đạo theo dõi rủi ro pháp lý, tin sai lệch và các điểm nóng chủ đề theo thời gian thực.</p></div>
        <div className="period-switch"><button className={period === 1 ? "active" : ""} onClick={() => setPeriod(1)}>24 giờ</button><button className={period === 7 ? "active" : ""} onClick={() => setPeriod(7)}>7 ngày</button><button className={period === 30 ? "active" : ""} onClick={() => setPeriod(30)}>30 ngày</button><button>▣</button></div>
      </div>

      <section className="market-kpis">
        <article><i className="purple">▣</i><div><small>Nội dung theo dõi</small><strong>{total.toLocaleString("vi-VN")}</strong><span className="green">● <em>Dữ liệu từ API</em></span></div></article>
        <article><i className="pink">◇</i><div><small>Risk Index</small><strong>{riskIndex} <b>/100</b></strong><span>● <em>Điểm AI trung bình</em></span></div></article>
        <article><i className="rose">△</i><div><small>Khẩn cấp</small><strong>{urgent}</strong><span>● <em>{total ? Math.round(urgent / total * 100) : 0}% tổng hồ sơ</em></span></div></article>
        <article><i className="amber">⌕</i><div><small>Cần kiểm chứng</small><strong>{verify}</strong><span className="green">● <em>{total ? Math.round(verify / total * 100) : 0}% tổng hồ sơ</em></span></div></article>
        <article><i className="violet">◴</i><div><small>Tỷ lệ hiểu lầm</small><strong>{total ? Math.round(misconception / total * 100) : 0}%</strong><span>● <em>{misconception} hồ sơ</em></span></div></article>
      </section>

      <div className="market-grid">
        <section className="chart-panel risk-chart">
          <header><h2>Xung nhịp rủi ro pháp lý <small>ⓘ</small></h2><span>↑ 18% <em>so với 7 ngày trước</em></span><b>⋮</b></header>
          <div className="chart-legend"><span className="hot">Khẩn cấp</span><span className="high">Cao</span><span className="medium">Trung bình</span><span className="low">Thấp</span></div>
          <div className="area-chart">
            <div className="y-axis"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div>
            <svg viewBox="0 0 800 180" preserveAspectRatio="none" aria-label="Biểu đồ rủi ro 7 ngày">
              <defs>
                <linearGradient id="pinkFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ef2b92" stopOpacity=".24"/><stop offset="1" stopColor="#ef2b92" stopOpacity=".02"/></linearGradient>
                <linearGradient id="orangeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f7a21b" stopOpacity=".2"/><stop offset="1" stopColor="#f7a21b" stopOpacity=".02"/></linearGradient>
              </defs>
              <path className="line pink-line" d={chartPath("urgent")}/>
              <path className="line orange-line" d={chartPath("high")}/>
              <path className="line blue-line" d={chartPath("medium")}/>
              <path className="line green-line" d={chartPath("low")}/>
            </svg>
            <div className="chart-note">Cập nhật theo {total} hồ sơ thực tế</div>
            <div className="x-axis">{days.map((day) => <span key={day.label}>{day.label}</span>)}</div>
          </div>
        </section>

        <section className="chart-panel platform-panel">
          <header><h2>Phân bổ theo nền tảng</h2><b>⋮</b></header>
          <div className="donut-wrap"><div className="donut" style={{ background: platformGradient(platformCounts, total) }}><span><strong>{total.toLocaleString("vi-VN")}</strong><small>Tổng</small></span></div><div className="donut-list">{platformCounts.map(({ platform, count }, index) => <p key={platform}><i className={["fb","tt","yt","xx","other"][index]}/>{platform === "Forum" ? "Khác" : platform} <b>{total ? Math.round(count / total * 100) : 0}% <em>({count.toLocaleString("vi-VN")})</em></b></p>)}</div></div>
        </section>

        <section className="chart-panel topics-panel">
          <header><h2>Top chủ đề pháp lý nóng</h2><b>⋮</b></header>
          <div className="topic-bars">{topicCounts.map(([name,count])=><div key={name}><span>{name}</span><i><b style={{width:`${count / maxTopic * 100}%`}}/></i><em>{count}</em></div>)}</div>
          <div className="bar-axis"><span>0</span><span>1K</span><span>2K</span><span>3K</span></div>
        </section>

        <section className="chart-panel heatmap-panel">
          <header><h2>Heatmap điểm nóng <small>ⓘ</small></h2><b>⋮</b></header>
          <div className="heat-platforms"><span>● Facebook</span><span>● TikTok</span><span>● YouTube</span><span>● X</span><span>● Khác</span></div>
          <div className="heatmap">{topicCounts.slice(0,6).map(([name])=><div key={name}><span>{name}</span>{platformCounts.map(({platform}, col)=>{const count=filtered.filter((item)=>item.document===name&&item.platform===platform).length;return <i key={col} className={`heat-${count ? Math.max(0,4-Math.min(4,count)) : 4}`}/>})}</div>)}</div>
          <div className="heat-legend"><span>■ Rất cao</span><span>■ Cao</span><span>■ Trung bình</span><span>■ Thấp</span><span>■ Rất thấp</span></div>
        </section>

        <section className="chart-panel pipeline-panel">
          <header><h2>Tiến trình kiểm chứng</h2><b>⋮</b></header>
          <div className="market-pipeline">{pipeline.map((item,index)=><div key={item[0]} className={`step-${index}`}><small>{item[0]}</small><i>{index===0?"⌘":index===1?"⌕":index===2?"⚙":index===3?"✓":"♟"}</i><strong>{item[1].toLocaleString("vi-VN")}</strong><span>{total ? (item[1] / total * 100).toFixed(1) : "0.0"}%</span></div>)}</div>
          <p className="conversion">Tỷ lệ cảnh báo thực tế: <b>{total ? (urgent / total * 100).toFixed(1) : "0.0"}%</b></p>
        </section>

        <section className="chart-panel alerts-panel">
          <header><h2>Cảnh báo ưu tiên</h2></header>
          <div className="alert-list">{alerts.map((item)=><div key={item.id}><i/> <span>{item.claim}</span><b className={slug(item.priority)}>{item.priority}</b><time>{item.publishedAt.split("·").at(-1)?.trim() || "—"}</time></div>)}</div>
          <a>Xem tất cả cảnh báo <b>→</b></a>
        </section>

        <section className="chart-panel graph-panel">
          <header><h2>Knowledge Graph nổi bật <small>ⓘ</small></h2></header>
          <div className="graph-labels"><span>Claim</span><span>Chủ đề</span><span>Điều luật</span><span>Nguồn kiểm chứng</span></div>
          {graphItem && <div className="graph-content"><div className="claim-node">{graphItem.claim}</div><b>╌╌→</b><div className="node-stack"><span>{graphItem.subject}</span><span>{graphItem.platform}</span><span>{graphItem.account}</span></div><b>╌╌→</b><div className="node-stack law"><span>{graphItem.document}</span><span>{graphItem.provision}</span><span>{graphItem.penalty}</span></div><b>╌╌→</b><div className="node-stack source"><span>{graphItem.sourceAgency}</span><span>{graphItem.sourceTitle}</span><span>{graphItem.sourceResult}</span></div></div>}
        </section>

        <section className="chart-panel signals-panel">
          <header><h2>Tín hiệu thị trường</h2></header>
          <div className="signal-list">
            <p><i>♙</i><span><strong>Chủ đề nổi bật: {topicCounts[0]?.[0] || "Chưa có dữ liệu"}</strong><small>Chiếm {total && topicCounts[0] ? Math.round(topicCounts[0][1] / total * 100) : 0}% hồ sơ trong kỳ.</small></span></p>
            <p><i>♪</i><span><strong>Nền tảng có nhiều tín hiệu nhất: {[...platformCounts].sort((a,b)=>b.count-a.count)[0]?.platform}</strong><small>{[...platformCounts].sort((a,b)=>b.count-a.count)[0]?.count || 0} nội dung được ghi nhận.</small></span></p>
            <p><i>◇</i><span><strong>{urgent} hồ sơ vượt ngưỡng khẩn cấp</strong><small>Được tính trực tiếp từ mức ưu tiên của hàng đợi.</small></span></p>
            <p><i>✓</i><span><strong>{filtered.filter((item)=>item.status==="Đã xử lý").length} hồ sơ đã xác minh</strong><small>{total ? Math.round(filtered.filter((item)=>item.status==="Đã xử lý").length / total * 100) : 0}% tổng hồ sơ trong kỳ.</small></span></p>
            <p><i>◴</i><span><strong>Điểm rủi ro trung bình: {riskIndex}/100</strong><small>Tính từ AI score của toàn bộ dữ liệu đang lọc.</small></span></p>
          </div>
        </section>
      </div>
    </div>
  );
}

function parseCaseDate(value: string) {
  const match = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return match ? new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1])) : null;
}

function platformGradient(counts: Array<{ platform: Case["platform"]; count: number }>, total: number) {
  const colors = ["#3b84f5", "#222d3a", "#f22f3f", "#3d4855", "#cfd3da"];
  if (!total) return "#eef0f4";
  let cursor = 0;
  return `conic-gradient(${counts.map((entry, index) => {
    const start = cursor;
    cursor += entry.count / total * 100;
    return `${colors[index]} ${start}% ${cursor}%`;
  }).join(",")})`;
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
  const urgentCount = allItems.filter((item) => item.priority === "Khẩn cấp").length;
  const verifyCount = allItems.filter((item) => item.verdict === "Cần kiểm chứng").length;
  const processingCount = allItems.filter((item) => item.status === "Đang xử lý").length;
  const [quickTab, setQuickTab] = useState<"all" | "urgent" | "verify" | "processing">("all");
  const visibleRows = rows.filter((item) =>
    quickTab === "all" ||
    (quickTab === "urgent" && item.priority === "Khẩn cấp") ||
    (quickTab === "verify" && item.verdict === "Cần kiểm chứng") ||
    (quickTab === "processing" && item.status === "Đang xử lý"),
  );
  return (
    <div className="monitor-page">
      <div className="queue-heading">
        <div><span className="eyebrow">ĐIỀU PHỐI NỘI DUNG</span><h1>Hàng đợi giám sát</h1><p>Nhập thủ công nội dung cần theo dõi, sau đó rà soát kết quả phân tích của AI.</p></div>
        <div className="trend-card"><div><small>Xu hướng rủi ro 7 ngày</small><strong>↑ 18%</strong></div><svg viewBox="0 0 250 55" aria-hidden="true"><path d="M3 48 L25 23 L47 30 L69 17 L91 19 L113 8 L135 12 L157 4 L179 33 L201 42 L224 18 L247 25" /></svg></div>
      </div>

      <section className="queue-metrics">
        <article><div><small>Hồ sơ mới</small><strong>{allItems.filter((item) => item.status === "Mới").length}</strong><span className="up">↑ 18% <em>so với tuần trước</em></span></div><i className="metric-icon purple">▣</i></article>
        <article><div><small>Khẩn cấp</small><strong>{urgentCount}</strong><span className="hot">↑ 33% <em>so với tuần trước</em></span></div><i className="metric-icon pink">ϟ</i></article>
        <article><div><small>Cần kiểm chứng</small><strong>{verifyCount}</strong><span className="up">↑ 12% <em>so với tuần trước</em></span></div><i className="metric-icon amber">◇</i></article>
        <article><div><small>Đang xử lý</small><strong>{processingCount || openCount}</strong><span className="hot">↑ 20% <em>đang trong hàng đợi</em></span></div><i className="metric-icon rose">◷</i></article>
      </section>

      <section className="queue-card">
        <div className="queue-tabs">
          <button className={quickTab === "all" ? "active" : ""} onClick={() => setQuickTab("all")}>Tất cả</button>
          <button className={quickTab === "urgent" ? "active" : ""} onClick={() => setQuickTab("urgent")}>Khẩn cấp <b>{urgentCount}</b></button>
          <button className={quickTab === "verify" ? "active" : ""} onClick={() => setQuickTab("verify")}>Cần kiểm chứng <b>{verifyCount}</b></button>
          <button className={quickTab === "processing" ? "active" : ""} onClick={() => setQuickTab("processing")}>Đang xử lý <b>{processingCount}</b></button>
        </div>
        <div className="queue-toolbar">
          <div className="filter-group">
            <label>Kết quả AI<select value={verdictFilter} onChange={(event) => onVerdictFilter(event.target.value as (typeof verdicts)[number])}>{verdicts.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label>Trạng thái<select value={statusFilter} onChange={(event) => onStatusFilter(event.target.value as (typeof statuses)[number])}>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label>
          </div>
          <div className="queue-actions"><button className="sort-button" onClick={onSort}>↕ Mức ưu tiên: {sortDesc ? "cao trước" : "thấp trước"}</button><button className="create-button" onClick={onCreate}>＋ Nhập nội dung mới</button></div>
        </div>
        <div className="queue-table-wrap">
          <table className="queue-table">
            <thead><tr><th><span className="fake-checkbox" /></th><th>CLAIM / NỘI DUNG</th><th>NỀN TẢNG</th><th>MỨC RỦI RO</th><th>ĐÁNH GIÁ AI</th><th>ĐỘ TIN CẬY</th><th>CHỦ ĐỀ PHÁP LÝ</th><th>TRẠNG THÁI</th><th /></tr></thead>
            <tbody>
              {visibleRows.map((item) => (
                <tr key={item.id} onClick={() => onOpen(item.id)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onOpen(item.id); }}>
                  <td><span className="fake-checkbox" /></td>
                  <td><strong>{item.claim}</strong><small>{item.id} · {item.publishedAt}</small></td>
                  <td><span className={`platform-logo ${item.platform.toLowerCase()}`}>{platformIcon(item.platform)}</span>{item.platform}</td>
                  <td><span className={`priority-badge ${slug(item.priority)}`}><i />{item.priority}</span></td>
                  <td><VerdictBadge value={item.verdict} /><small className="score-copy">AI score {item.score}/100</small></td>
                  <td><span className={`confidence-ring ${item.score >= 85 ? "strong" : item.score >= 65 ? "medium" : ""}`}>{item.score}%</span></td>
                  <td><strong className="legal-topic">{item.document}</strong><small>{item.provision}</small></td>
                  <td><StatusBadge value={item.status} /></td>
                  <td><button className="row-arrow" aria-label={`Mở hồ sơ ${item.id}`}>→</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleRows.length === 0 && <div className="queue-empty"><strong>Không có hồ sơ phù hợp</strong><span>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</span></div>}
        </div>
        <footer className="queue-footer">Hiển thị <strong>{visibleRows.length}</strong> / {allItems.length} hồ sơ <span>Dữ liệu mock · nội dung nhập mới chỉ lưu trong phiên hiện tại</span></footer>
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
      <button className="drawer-close" onClick={onBack} aria-label="Đóng hồ sơ">×</button>
      <div className="detail-heading">
        <div><span className="eyebrow">CHI TIẾT HỒ SƠ · {item.id}</span><h1>{item.claim}</h1><p>{item.platform} · Công khai · {item.publishedAt}</p></div>
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
          <section className="knowledge-card">
            <small>KNOWLEDGE GRAPH</small>
            <div className="knowledge-flow"><span>Claim</span><i>→</i><span>Chủ thể</span><i>→</i><span>Điều luật</span><i>→</i><span>Nguồn</span></div>
          </section>
        </aside>
      </div>
      <div className="detail-actions"><button onClick={onBack}>← Quay lại hàng đợi</button><button onClick={() => onStatusChange("Đang xử lý")}>Bắt đầu kiểm chứng →</button></div>
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
  const paths: Record<Case["platform"], string> = {
    Facebook: "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z",
    TikTok: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
    YouTube: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
    X: "M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z",
    Forum: "M12.103 0C18.666 0 24 5.485 24 11.997c0 6.51-5.33 11.99-11.9 11.99L0 24V11.79C0 5.28 5.532 0 12.103 0zm.116 4.563c-2.593-.003-4.996 1.352-6.337 3.57-1.33 2.208-1.387 4.957-.148 7.22L4.4 19.61l4.794-1.074c2.745 1.225 5.965.676 8.136-1.39 2.17-2.054 2.86-5.228 1.737-7.997-1.135-2.778-3.84-4.59-6.84-4.585h-.008z",
  };
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label={`${platform} logo`}>
      <path d={paths[platform]} />
    </svg>
  );
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
