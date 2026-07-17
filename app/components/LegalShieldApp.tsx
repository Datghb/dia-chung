"use client";

import { useEffect, useMemo, useState } from "react";
import { alerts, claims, sources, trend, verdictCopy } from "../mock-data";
import type { Alert, Claim, Risk, Verdict } from "../types";

const nav = [
  ["dashboard", "Tổng quan", "⌂"], ["analyze", "Kiểm tra bài đăng", "◎"], ["claims/CL-001", "Điều tra claim", "◇"],
  ["alerts", "Cảnh báo rủi ro", "△"], ["knowledge", "Knowledge Graph", "⌘"], ["legal-qa", "Hỏi đáp pháp luật", "?"],
  ["legal-documents", "Nguồn dữ liệu", "▤"], ["settings", "Cài đặt", "⚙"],
];

const sample = "Ngân hàng X sắp phá sản, mọi người cần rút toàn bộ tiền trước ngày mai.";

function routeFromLocation() {
  if (typeof window === "undefined") return "dashboard";
  return window.location.pathname.replace(/^\//, "") || "dashboard";
}

export function LegalShieldApp() {
  const [route, setRoute] = useState("dashboard");
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const sync = () => setRoute(routeFromLocation());
    sync(); window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  function go(next: string) {
    window.history.pushState({}, "", `/${next}`);
    setRoute(next); setMobileNav(false); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function notify(message: string) {
    setToast(message); window.setTimeout(() => setToast(""), 3200);
  }

  let content = <Dashboard go={go} />;
  if (route === "analyze") content = <Analyze go={go} />;
  else if (route.startsWith("analysis/")) content = <Analysis go={go} notify={notify} />;
  else if (route.startsWith("claims/") || route === "knowledge") content = <ClaimInvestigation notify={notify} />;
  else if (route === "alerts") content = <Alerts />;
  else if (route === "legal-qa") content = <LegalQA />;
  else if (route === "legal-documents") content = <Documents />;
  else if (route === "settings") content = <Placeholder title="Cài đặt hệ thống" />;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <button className="brand" onClick={() => go("dashboard")} aria-label="Về tổng quan">
          <span className="brand-mark">L</span><span><b>LegalShield</b><small>174 · LEGAL INTELLIGENCE</small></span>
        </button>
        <nav aria-label="Điều hướng chính">
          {nav.map(([path, label, icon]) => (
            <button key={path} className={route === path || (path.startsWith("claims") && route.startsWith("claims")) ? "active" : ""} onClick={() => go(path)}>
              <span className="nav-icon">{icon}</span>{label}{label === "Cảnh báo rủi ro" && <em>8</em>}
            </button>
          ))}
        </nav>
        <div className="system-status">
          <div><span className="live-dot" /> Dữ liệu đồng bộ</div>
          <p>Phiên bản pháp lý</p><strong>NĐ 174/2026/NĐ-CP</strong>
          <small>Hiệu lực từ 01/07/2026</small>
        </div>
      </aside>
      {mobileNav && <button className="backdrop" onClick={() => setMobileNav(false)} aria-label="Đóng menu" />}
      <main>
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNav(true)}>☰</button>
          <label className="search"><span>⌕</span><input aria-label="Tìm kiếm" placeholder="Tìm claim, đối tượng, nguồn hoặc điều khoản…" /></label>
          <div className="header-actions">
            <button className="date-filter">7 ngày gần đây⌄</button>
            <button className="primary" onClick={() => go("analyze")}>＋ Phân tích bài đăng mới</button>
            <button className="icon-btn" aria-label="Thông báo">♢<i /></button>
            <button className="avatar">MA</button>
          </div>
        </header>
        <div className="page">{content}</div>
      </main>
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </div>
  );
}

function PageHeading({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description: string; actions?: React.ReactNode }) {
  return <div className="page-heading"><div>{eyebrow && <small>{eyebrow}</small>}<h1>{title}</h1><p>{description}</p></div>{actions && <div className="page-actions">{actions}</div>}</div>;
}

function RiskBadge({ risk }: { risk: Risk }) { return <span className={`badge risk ${risk.toLowerCase()}`}>{risk}</span>; }
function VerdictBadge({ verdict }: { verdict: Verdict }) { return <span className={`badge verdict ${verdict.toLowerCase()}`}><i />{verdict.replace("_", " ")}</span>; }

function Dashboard({ go }: { go: (r: string) => void }) {
  const metrics = [
    ["Bài đăng đã phân tích", "1.284", "+12,4%", "▤", "navy"],
    ["Mâu thuẫn nguồn chính thức", "146", "+8,2%", "↯", "red"],
    ["Claim thiếu bối cảnh", "89", "−3,1%", "◐", "amber"],
    ["Chưa đủ bằng chứng", "214", "+5,6%", "○", "gray"],
    ["Cần chuyên gia xem xét", "32", "+4 ca", "♙", "purple"],
  ];
  return <>
    <PageHeading eyebrow="TRUNG TÂM ĐIỀU HÀNH" title="Tổng quan rủi ro thông tin" description="Theo dõi claim, bằng chứng và các trường hợp cần ưu tiên xử lý." actions={<><button className="secondary">Xuất báo cáo</button><button className="primary" onClick={() => go("analyze")}>＋ Phân tích mới</button></>} />
    <div className="metrics">{metrics.map((m) => <div className={`metric ${m[4]}`} key={m[0]}><div className="metric-top"><span>{m[3]}</span><button title={`Thông tin về ${m[0]}`}>ⓘ</button></div><strong>{m[1]}</strong><p>{m[0]}</p><small className={m[2].startsWith("−") ? "down" : ""}>{m[2]} <span>so với 24h trước</span></small></div>)}</div>
    <section className="dashboard-grid">
      <div className="panel trend-panel"><PanelTitle title="Xu hướng claim theo ngày" sub="Phân loại kết quả kiểm chứng · 7 ngày gần đây" action="Xem chi tiết →" />
        <TrendChart />
      </div>
      <div className="panel topics-panel"><PanelTitle title="Chủ đề tăng nhanh" sub="Theo tốc độ lan truyền" />
        {["Chính sách công", "Doanh nghiệp", "Ngân hàng", "Cơ quan nhà nước", "Dịch vụ công"].map((t, i) => <div className="topic" key={t}><span className="topic-index">{i + 1}</span><div><strong>{t}</strong><small>{[186, 142, 98, 75, 63][i]} bài đăng · {[32, 24, 41, 18, 22][i]}% rủi ro</small></div><div className="spark">{[28, 40, 35, 55, 48, 72].map((h, n) => <i key={n} style={{ height: `${h - i * 3}%` }} />)}</div><em>+{[68, 51, 44, 37, 29][i]}%</em></div>)}
      </div>
    </section>
    <section className="panel"><PanelTitle title="Cảnh báo ưu tiên" sub="Xếp hạng theo phạm vi ảnh hưởng, tốc độ lan truyền và bằng chứng hiện có" action="Xem tất cả cảnh báo →" />
      <AlertTable rows={alerts.slice(0, 5)} onRow={(id) => go(id === "ALT-001" ? "analysis/POST-001" : "alerts")} />
    </section>
  </>;
}

function PanelTitle({ title, sub, action }: { title: string; sub: string; action?: string }) {
  return <div className="panel-title"><div><h2>{title}</h2><p>{sub}</p></div>{action && <button>{action}</button>}</div>;
}

function TrendChart() {
  const colors = ["#db4d42", "#d79a2b", "#8c96a6", "#2b8a66"];
  return <div className="chart-wrap"><div className="legend">{["Contradicted", "Missing Context", "Insufficient Evidence", "Supported"].map((x, i) => <span key={x}><i style={{ background: colors[i] }} />{x}</span>)}</div><div className="chart">
    {[60, 45, 30, 15, 0].map((n) => <span className="y-label" key={n}>{n}</span>)}
    <div className="grid-lines">{[0, 1, 2, 3, 4].map((n) => <i key={n} />)}</div>
    <div className="bars">{trend.map((d) => <div className="bar-group" key={d.day}>{d.values.map((v, i) => <i key={i} title={`${v} claim`} style={{ height: `${v * 1.9}px`, background: colors[i] }} />)}<small>{d.day}</small></div>)}</div>
  </div></div>;
}

function Analyze({ go }: { go: (r: string) => void }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const steps = ["Trích xuất claim", "Nhận diện đối tượng liên quan", "Tìm nguồn chính thức", "Đối chiếu claim và bằng chứng", "Ánh xạ điều khoản", "Tính mức độ ưu tiên review"];
  function run() {
    if (!text.trim()) return;
    setLoading(true); setStep(0);
    const timer = window.setInterval(() => setStep((s) => {
      if (s >= 5) { window.clearInterval(timer); window.setTimeout(() => go("analysis/POST-001"), 500); return s; }
      return s + 1;
    }), 520);
  }
  return <>
    <PageHeading eyebrow="PHÂN TÍCH MỚI" title="Kiểm tra bài đăng" description="Trích xuất claim, đối chiếu nguồn chính thức và xác định phạm vi pháp lý có khả năng liên quan." />
    {loading ? <div className="pipeline panel"><div className="pipeline-head"><span className="scan">◎</span><div><small>ĐANG PHÂN TÍCH</small><h2>Đang xây dựng chuỗi bằng chứng</h2><p>Hệ thống đang xử lý nội dung và truy ngược các nguồn chính thức.</p></div><strong>{Math.round(((step + 1) / 6) * 100)}%</strong></div><div className="progress"><i style={{ width: `${((step + 1) / 6) * 100}%` }} /></div><div className="pipeline-steps">{steps.map((s, i) => <div className={i < step ? "done" : i === step ? "current" : ""} key={s}><span>{i < step ? "✓" : i + 1}</span><div><strong>{s}</strong><small>{i < step ? "Hoàn tất" : i === step ? "Đang xử lý…" : "Đang chờ"}</small></div></div>)}</div><p className="pipeline-note">Không đóng trang trong khi phân tích. Quá trình thường hoàn tất trong 10–20 giây.</p></div> :
    <div className="analyze-grid">
      <section className="panel input-panel"><div className="section-label"><span>01</span><div><h2>Nội dung bài đăng</h2><p>Dán nguyên văn để hệ thống nhận diện claim chính xác hơn.</p></div></div>
        <label className="field"><span>Nội dung <b>*</b></span><textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Dán nội dung bài đăng cần kiểm tra tại đây…" /><small>{text.length} / 5.000 ký tự</small></label>
        <button className="sample-btn" onClick={() => setText(sample)}>✦ Dùng bài đăng mẫu <span>Ngân hàng X sắp phá sản…</span></button>
        <div className="form-row"><label className="field"><span>URL bài đăng</span><input placeholder="https://…" /></label><label className="field"><span>Nền tảng</span><select><option>Facebook</option><option>TikTok</option><option>YouTube</option><option>X</option><option>Forum</option><option>Other</option></select></label></div>
        <div className="form-row thirds"><label className="field"><span>Chủ thể đăng</span><select><option>Cá nhân</option><option>Tổ chức</option></select></label><label className="field"><span>Ngày đăng</span><input type="date" defaultValue="2026-07-17" /></label><label className="field"><span>Lượt tương tác</span><input type="number" defaultValue="12460" /></label></div>
        <label className="upload"><span>⇧</span><div><strong>Tải ảnh chụp màn hình</strong><small>PNG, JPG tối đa 10MB</small></div><button>Chọn tệp</button><input type="file" accept="image/png,image/jpeg" /></label>
        <button className="analyze-btn" disabled={!text.trim()} onClick={run}>◎ Phân tích rủi ro <span>Thời gian dự kiến 10–20 giây</span></button>
      </section>
      <aside className="guide">
        <div className="guide-card blue"><span>⌁</span><h3>Hệ thống hỗ trợ</h3><ul><li>Thông tin có thể kiểm chứng bằng nguồn chính thức</li><li>Claim về tổ chức, cá nhân và chính sách</li><li>Nội dung thiếu bối cảnh hoặc đang lan truyền</li></ul></div>
        <div className="guide-card amber"><span>⚖</span><h3>Phạm vi của kết quả</h3><p>Hệ thống không tự kết luận một người đã vi phạm pháp luật. Kết quả chỉ hỗ trợ sàng lọc và cần chuyên gia xác nhận.</p></div>
        <div className="guide-card"><small>VÍ DỤ BÀI ĐĂNG</small><blockquote>“Ngân hàng X sắp phá sản, mọi người cần rút toàn bộ tiền trước ngày mai.”</blockquote><button onClick={() => setText(sample)}>Sử dụng ví dụ này →</button></div>
        <LegalDisclaimer />
      </aside>
    </div>}
  </>;
}

function Analysis({ go, notify }: { go: (r: string) => void; notify: (m: string) => void }) {
  return <>
    <div className="breadcrumbs"><button onClick={() => go("dashboard")}>Tổng quan</button><span>/</span><button onClick={() => go("analyze")}>Kiểm tra bài đăng</button><span>/</span><b>POST-001</b></div>
    <PageHeading eyebrow="KẾT QUẢ PHÂN TÍCH · POST-001" title="Bài đăng có dấu hiệu cần ưu tiên xem xét" description="Phát hiện lúc 10:42 · 17/07/2026 · Hoàn tất trong 12,4 giây" actions={<><button className="secondary">↓ Xuất hồ sơ</button><button className="primary" onClick={() => notify("Đã chuyển hồ sơ tới hàng chờ chuyên gia")}>♙ Chuyển human review</button></>} />
    <HumanReviewBanner />
    <section className="analysis-summary">
      <div className="summary-main"><div className="summary-status"><span>TRẠNG THÁI TỔNG THỂ</span><strong><i /> CÓ DẤU HIỆU LIÊN QUAN</strong></div><p>Bài đăng chứa <b>2 claim có thể kiểm chứng</b>. Một claim mâu thuẫn với nguồn chính thức và một claim chưa đủ bằng chứng. Kết quả cần chuyên gia xác nhận trước khi sử dụng.</p></div>
      <div className="summary-stat"><small>RISK LEVEL</small><RiskBadge risk="HIGH" /><p>Lan truyền nhanh · 12,4K tương tác</p></div>
      <div className="summary-stat"><small>CONFIDENCE</small><strong className="confidence">91%</strong><p>Độ tin cậy mô hình</p></div>
      <div className="summary-stat"><small>CLAIM</small><strong>02</strong><p>1 mâu thuẫn · 1 thiếu bằng chứng</p></div>
      <div className="summary-stat"><small>PHẠM VI CÓ THỂ LIÊN QUAN</small><strong className="legal-ref">Điểm c khoản 2<br />Điều 95</strong><p>NĐ 174/2026/NĐ-CP</p></div>
    </section>
    <div className="analysis-columns">
      <section><div className="panel original-post"><PanelTitle title="Bài đăng gốc" sub="Facebook · Tài khoản cá nhân · 17/07/2026, 08:14" /><div className="post-meta"><span>f</span><div><strong>Nguyễn Văn A</strong><small>facebook.com/post/7842 · Công khai</small></div><em>12.460 tương tác</em></div><blockquote><mark>Ngân hàng X sắp phá sản</mark>, mọi người cần <mark>rút toàn bộ tiền trước ngày mai</mark>. Tôi nghe người quen bên trong nói vậy, chia sẻ gấp cho người thân!</blockquote><div className="post-footer"><span>12,4K tương tác</span><span>8,1K lượt chia sẻ</span><a href="#">Mở bài đăng gốc ↗</a></div></div></section>
      <section className="claims-section"><div className="claims-heading"><div><h2>Claim được phát hiện</h2><p>2 claim có thể kiểm chứng · Sắp xếp theo mức độ rủi ro</p></div><button>Ưu tiên rủi ro⌄</button></div>
        <ClaimCard claim={claims[0]} index={1} onOpen={() => go("claims/CL-001")} />
        <ClaimCard claim={{ ...claims[2], text: "Mọi người cần rút toàn bộ tiền trước ngày mai.", entity: "Khách hàng Ngân hàng X", verdict: "INSUFFICIENT_EVIDENCE", risk: "MEDIUM", confidence: 68 }} index={2} onOpen={() => go("claims/CL-002")} />
      </section>
    </div>
    <LegalDisclaimer />
  </>;
}

function ClaimCard({ claim, index, onOpen }: { claim: Claim; index: number; onOpen: () => void }) {
  return <article className="claim-card"><div className="claim-card-top"><span>CLAIM {String(index).padStart(2, "0")}</span><RiskBadge risk={claim.risk} /></div><h3>“{claim.text}”</h3><div className="claim-entity"><small>ĐỐI TƯỢNG ĐƯỢC NHẮC ĐẾN</small><strong>▣ {claim.entity}</strong></div><div className="verdict-block"><VerdictBadge verdict={claim.verdict} /><p>{verdictCopy[claim.verdict]}</p><strong>{claim.confidence}% confidence</strong></div><div className="claim-source"><small>NGUỒN CHÍNH THỨC NỔI BẬT</small><p><span>✓</span><b>{claim.source}</b> · Thông cáo ngày 17/07/2026</p></div><div className="claim-legal"><small>ĐIỀU KHOẢN CÓ KHẢ NĂNG LIÊN QUAN</small><strong>⚖ {claim.provision}</strong><span>Nghị định 174/2026/NĐ-CP</span></div><button className="open-claim" onClick={onOpen}>Mở điều tra chi tiết <span>→</span></button></article>;
}

function HumanReviewBanner() { return <div className="review-banner"><span>♙</span><div><strong>Cần chuyên gia pháp lý xem xét</strong><p>Kết quả tự động chỉ phục vụ sàng lọc. Cần kiểm tra bối cảnh, chủ thể và mức độ ảnh hưởng trước khi đưa ra quyết định.</p></div><em>ĐANG CHỜ REVIEW</em></div>; }
function LegalDisclaimer() { return <div className="disclaimer"><span>ⓘ</span><p><strong>Lưu ý pháp lý</strong>Kết quả phân tích không phải kết luận vi phạm hay quyết định xử phạt. Mức phạt (nếu có) chỉ mang tính tham khảo.</p></div>; }

function ClaimInvestigation({ notify }: { notify: (m: string) => void }) {
  const [activeNode, setActiveNode] = useState("Claim");
  const [zoom, setZoom] = useState(1);
  return <>
    <div className="breadcrumbs"><button>Tổng quan</button><span>/</span><button>Điều tra claim</button><span>/</span><b>CL-001</b></div>
    <PageHeading eyebrow="HỒ SƠ CLAIM · CL-001" title="“Ngân hàng X sắp phá sản.”" description="Đối tượng bị ảnh hưởng: Ngân hàng X · Cập nhật lần cuối 10:42, 17/07/2026" actions={<><button className="secondary">↓ Xuất chuỗi bằng chứng</button><button className="primary" onClick={() => notify("Đã nhận hồ sơ để review")}>Nhận xử lý</button></>} />
    <div className="claim-header panel"><div><small>KẾT QUẢ KIỂM CHỨNG</small><VerdictBadge verdict="CONTRADICTED" /><p>{verdictCopy.CONTRADICTED}</p></div><div><small>RISK LEVEL</small><RiskBadge risk="HIGH" /><p>Tốc độ lan truyền cao</p></div><div><small>CONFIDENCE</small><strong className="confidence">94%</strong><p>3 nguồn phù hợp</p></div><div><small>HUMAN REVIEW</small><span className="review-pill">ĐANG CHỜ REVIEW</span><p>Chưa có người phụ trách</p></div></div>
    <section className="panel evidence-compare"><PanelTitle title="So sánh bằng chứng" sub="Các đoạn được highlight dựa trên quan hệ ngữ nghĩa và điều kiện áp dụng" />
      <div className="compare-grid"><div><span className="compare-label claim-label">NỘI DUNG CLAIM</span><blockquote>“<mark className="bad">Ngân hàng X sắp phá sản</mark>, mọi người cần rút toàn bộ tiền trước ngày mai.”</blockquote><small>Nguồn: Bài đăng Facebook · 17/07/2026</small></div><div><span className="compare-label source-label">NGUỒN CHÍNH THỨC</span><blockquote>“Ngân hàng Nhà nước khẳng định <mark className="good">Ngân hàng X đang hoạt động bình thường, bảo đảm đầy đủ các tỷ lệ an toàn</mark> và quyền lợi người gửi tiền.”</blockquote><small>Thông cáo NHNN · 17/07/2026 · 09:30</small></div></div>
      <div className="comparison-result"><span>↯</span><div><strong>Phát hiện mâu thuẫn trực tiếp</strong><p>Claim về tình trạng “sắp phá sản” không phù hợp với xác nhận chính thức về hoạt động và các tỷ lệ an toàn.</p></div><em>94% confidence</em></div>
    </section>
    <div className="investigation-grid">
      <section className="panel"><PanelTitle title="Chuỗi nguồn chính thức" sub="3 nguồn được sử dụng để đối chiếu" />
        {sources.slice(0, 3).map((s, i) => <article className="evidence-card" key={s.id}><div className="source-icon">{i === 0 ? "NH" : i === 1 ? "CP" : "VB"}</div><div><div className="source-title"><span>NGUỒN CHÍNH THỨC</span><em>{s.reliability}% tin cậy</em></div><h3>{s.name}</h3><p>{s.agency} · Ban hành ngày {s.date}</p><blockquote>“{i === 0 ? "Ngân hàng X đang hoạt động bình thường và bảo đảm các tỷ lệ an toàn theo quy định." : "Chưa ghi nhận thông tin về việc đình chỉ hoặc chấm dứt hoạt động của Ngân hàng X."}”</blockquote><div><VerdictBadge verdict={i === 2 ? "SUPPORTED" : "CONTRADICTED"} /><a href="#">Mở nguồn ↗</a></div></div></article>)}
      </section>
      <LegalProvisionCard />
    </div>
    <section className="panel graph-panel"><PanelTitle title="Knowledge Graph" sub="Đường đi từ bài đăng đến điều khoản và biện pháp khắc phục" action="Toàn màn hình ↗" />
      <div className="graph-controls"><button onClick={() => setZoom(Math.min(1.3, zoom + .1))}>＋</button><button onClick={() => setZoom(Math.max(.8, zoom - .1))}>−</button><button onClick={() => setZoom(1)}>⌂</button></div>
      <div className="graph" style={{ transform: `scale(${zoom})` }}>
        <div className="node post" onClick={() => setActiveNode("Social Post")}><small>SOCIAL POST</small><b>Facebook Post</b><span>12,4K interactions</span></div><i className="edge e1">contains →</i>
        <div className="node claim active" onClick={() => setActiveNode("Claim")}><small>CLAIM</small><b>Ngân hàng X<br />sắp phá sản</b><span>CONTRADICTED</span></div><i className="edge e2">mentions →</i>
        <div className="node entity" onClick={() => setActiveNode("Entity")}><small>ENTITY</small><b>Ngân hàng X</b><span>Tổ chức</span></div><i className="edge e3">contradicted by ↘</i>
        <div className="node source" onClick={() => setActiveNode("Evidence Source")}><small>EVIDENCE SOURCE</small><b>Thông cáo NHNN</b><span>17/07/2026</span></div><i className="edge e4">may relate →</i>
        <div className="node provision" onClick={() => setActiveNode("Legal Provision")}><small>LEGAL PROVISION</small><b>Điểm c khoản 2<br />Điều 95</b><span>NĐ 174/2026</span></div><i className="edge e5">references →</i>
        <div className="node penalty" onClick={() => setActiveNode("Penalty")}><small>PENALTY</small><b>10–15 triệu</b><span>Tham khảo · Cá nhân</span></div>
      </div><div className="node-detail"><small>NODE ĐANG CHỌN</small><strong>{activeNode}</strong><span>Nhấp vào các node để xem chi tiết quan hệ.</span></div>
    </section>
    <LegalDisclaimer />
  </>;
}

function LegalProvisionCard() {
  return <aside className="panel legal-card"><div className="legal-card-head"><span>⚖</span><div><small>ÁNH XẠ PHÁP LÝ</small><h2>Nghị định 174/2026/NĐ-CP</h2><p>Hiệu lực từ 01/07/2026</p></div></div><div className="provision-focus"><small>ĐIỀU KHOẢN CÓ KHẢ NĂNG LIÊN QUAN</small><h3>Điểm c khoản 2 Điều 95</h3><p>Nhóm hành vi cung cấp, chia sẻ thông tin có khả năng gây hoang mang trong Nhân dân.</p></div><dl><div><dt>Chủ thể áp dụng</dt><dd>Cá nhân / Tổ chức</dd></div><div><dt>Mức phạt tham khảo</dt><dd>10–15 triệu đồng (cá nhân)<br />20–30 triệu đồng (tổ chức)</dd></div><div><dt>Biện pháp khắc phục</dt><dd>Buộc gỡ bỏ thông tin; cải chính theo yêu cầu của cơ quan có thẩm quyền.</dd></div></dl><div className="legal-warning">Đây là điều khoản có khả năng liên quan dựa trên dữ liệu được phân tích, không phải kết luận xử phạt.</div><a href="#">Mở văn bản gốc ↗</a></aside>;
}

function Alerts() {
  const [selected, setSelected] = useState<Alert | null>(null);
  const [status, setStatus] = useState("Tất cả");
  const visible = useMemo(() => status === "Tất cả" ? alerts : alerts.filter((a) => a.status === status), [status]);
  return <>
    <PageHeading eyebrow="RISK OPERATIONS" title="Cảnh báo rủi ro" description="Ưu tiên và điều phối các trường hợp có tốc độ lan truyền hoặc phạm vi ảnh hưởng đáng chú ý." actions={<button className="primary">＋ Tạo quy tắc cảnh báo</button>} />
    <div className="filter-bar">{["7 ngày gần đây", "Tất cả nền tảng", "Mọi mức rủi ro", "Mọi verdict", "Điều 95"].map(x => <button key={x}>{x}⌄</button>)}<select value={status} onChange={e => setStatus(e.target.value)} aria-label="Lọc trạng thái"><option>Tất cả</option><option>New</option><option>Reviewing</option><option>Resolved</option><option>Dismissed</option></select><button className="clear-filter">Xóa bộ lọc</button></div>
    <section className="panel"><PanelTitle title={`${visible.length} cảnh báo cần theo dõi`} sub="Cập nhật dữ liệu lúc 10:46 · 17/07/2026" /><AlertTable rows={visible} onRow={(id) => setSelected(alerts.find(a => a.id === id) || null)} /></section>
    {selected && <><button className="backdrop open" onClick={() => setSelected(null)} aria-label="Đóng panel" /><aside className="side-panel"><button className="close-panel" onClick={() => setSelected(null)}>×</button><small>{selected.id} · {selected.platform}</small><h2>{selected.claim}</h2><RiskBadge risk={selected.score > 85 ? "HIGH" : "MEDIUM"} /><div className="score-ring"><strong>{selected.score}</strong><span>/100 risk score</span></div><h3>Lý do cảnh báo</h3><p>{selected.reason}. Nội dung cần được đánh giá cùng bối cảnh và bằng chứng hiện có.</p><h3>Điều khoản có khả năng liên quan</h3><div className="mini-provision">⚖ <b>{selected.provision}</b><span>NĐ 174/2026/NĐ-CP</span></div><h3>Trạng thái xử lý</h3><select defaultValue={selected.status}><option>New</option><option>Reviewing</option><option>Resolved</option><option>Dismissed</option></select><button className="primary full">Mở hồ sơ chi tiết →</button></aside></>}
  </>;
}

function AlertTable({ rows, onRow }: { rows: Alert[]; onRow: (id: string) => void }) {
  return <div className="table-wrap"><table><thead><tr><th>CLAIM</th><th>NỀN TẢNG</th><th>LAN TRUYỀN</th><th>RISK SCORE</th><th>ĐIỀU KHOẢN</th><th>PHỤ TRÁCH</th><th>TRẠNG THÁI</th><th /></tr></thead><tbody>{rows.map((a) => <tr key={a.id} onClick={() => onRow(a.id)}><td><strong>{a.claim}</strong><small>{a.id} · {a.reason}</small></td><td><span className="platform">{a.platform[0]}</span>{a.platform}</td><td><b>{a.reach}</b><small>tương tác</small></td><td><span className={`score ${a.score > 85 ? "hot" : a.score > 70 ? "warm" : ""}`}>{a.score}</span></td><td><a>{a.provision}</a></td><td>{a.owner}</td><td><span className={`status ${a.status.toLowerCase()}`}>{a.status}</span></td><td>›</td></tr>)}</tbody></table></div>;
}

function LegalQA() {
  const questions = ["Cá nhân chia sẻ thông tin sai sự thật có thể bị phạt bao nhiêu?", "Khi nào bài đăng có thể liên quan đến khoản 2 Điều 95?", "Biện pháp khắc phục có thể gồm những gì?", "Điểm a khoản 1 Điều 95 quy định nhóm hành vi nào?", "Mức phạt tổ chức được xác định như thế nào?"];
  const [q, setQ] = useState(questions[0]);
  const [input, setInput] = useState("");
  return <>
    <PageHeading eyebrow="LEGAL RESEARCH" title="Hỏi đáp pháp luật có dẫn nguồn" description="Tra cứu cấu trúc điều khoản và phạm vi áp dụng. Hệ thống chỉ trả lời khi có citation phù hợp." />
    <div className="qa-layout"><section className="qa-main panel"><div className="qa-intro"><span>⚖</span><h2>Tra cứu Nghị định 174/2026/NĐ-CP</h2><p>Đặt câu hỏi cụ thể về điều, khoản, điểm, mức phạt hoặc biện pháp khắc phục.</p></div><div className="suggestions">{questions.slice(0, 4).map(x => <button onClick={() => setQ(x)} key={x}>{x}<span>→</span></button>)}</div>
      <div className="qa-thread"><div className="qa-question"><span>MA</span><p>{q}</p></div><article className="qa-answer"><div className="answer-label"><span>LS</span><b>LegalShield Research</b><em>3 citation</em></div><p><strong>Trả lời ngắn:</strong> Mức phạt phụ thuộc vào nhóm hành vi, chủ thể thực hiện và tình tiết cụ thể. Với dữ liệu đang tra cứu, hành vi có khả năng thuộc phạm vi Điều 95 có mức phạt tham khảo cho cá nhân bằng một nửa mức áp dụng đối với tổ chức.</p><div className="citation-quote"><small>ĐIỂM C KHOẢN 2 ĐIỀU 95</small><blockquote>“Phạt tiền đối với hành vi cung cấp, chia sẻ thông tin có khả năng gây hoang mang trong Nhân dân…”</blockquote><span>Nghị định 174/2026/NĐ-CP · Hiệu lực 01/07/2026</span><a href="#">[1] Mở nguồn ↗</a></div><div className="legal-warning">Câu trả lời mang tính hỗ trợ tra cứu, không thay thế ý kiến tư vấn của chuyên gia pháp lý.</div></article></div>
      <form className="qa-input" onSubmit={e => {e.preventDefault(); if(input.trim()) {setQ(input); setInput("");}}}><input value={input} onChange={e => setInput(e.target.value)} placeholder="Hỏi về Điều 95 hoặc phạm vi áp dụng…" aria-label="Câu hỏi pháp luật" /><button>Gửi →</button><small>Câu trả lời không được tạo nếu không có nguồn phù hợp.</small></form></section>
      <aside className="sources-panel panel"><h2>Nguồn được sử dụng</h2><p>3 nguồn · Đã human verified</p>{sources.slice(0, 3).map((s, i) => <article key={s.id}><span>{i + 1}</span><div><strong>{i === 0 ? "Nghị định 174/2026/NĐ-CP" : s.name}</strong><small>{s.agency} · {s.date}</small><em>✓ Đã xác minh</em></div></article>)}<div className="citation-policy"><strong>Chính sách citation</strong><p>Mỗi khẳng định pháp lý phải truy ngược được về văn bản gốc. Khi citation không khả dụng, hệ thống sẽ không tạo câu trả lời.</p></div></aside>
    </div>
  </>;
}

function Documents() {
  const docs = [
    ["Nghị định 174/2026/NĐ-CP", "174/2026/NĐ-CP", "15/05/2026", "01/07/2026", "126", "Đã xác minh"],
    ["Luật An ninh mạng", "24/2018/QH14", "12/06/2018", "01/01/2019", "43", "Đã xác minh"],
    ["Luật Tiếp cận thông tin", "104/2016/QH13", "06/04/2016", "01/07/2018", "37", "Đã xác minh"],
    ["Quy trình đánh giá rủi ro nội bộ", "LS174-QT-02", "05/07/2026", "05/07/2026", "18", "Đang review"],
  ];
  return <>
    <PageHeading eyebrow="LEGAL KNOWLEDGE BASE" title="Nguồn dữ liệu pháp luật" description="Quản lý văn bản, cấu trúc điều khoản và trạng thái xác minh của dữ liệu pháp lý." actions={<button className="primary">＋ Nhập văn bản</button>} />
    <div className="doc-stats"><div><span>▤</span><strong>24</strong><small>Văn bản đang hoạt động</small></div><div><span>⌘</span><strong>1.842</strong><small>Điều khoản đã cấu trúc</small></div><div><span>✓</span><strong>96,4%</strong><small>Human verified</small></div><div><span>↻</span><strong>10:31</strong><small>Cập nhật gần nhất</small></div></div>
    <section className="panel"><PanelTitle title="Danh sách văn bản" sub="Dữ liệu được sử dụng để kiểm chứng và ánh xạ claim" /><div className="table-wrap"><table><thead><tr><th>TÊN VĂN BẢN</th><th>SỐ HIỆU</th><th>NGÀY BAN HÀNH</th><th>HIỆU LỰC</th><th>ĐIỀU KHOẢN</th><th>TRẠNG THÁI</th><th /></tr></thead><tbody>{docs.map((d, i) => <tr key={d[1]}><td><div className="doc-name"><span>§</span><div><strong>{d[0]}</strong><small>Cập nhật dữ liệu {10+i}/07/2026</small></div></div></td><td><code>{d[1]}</code></td><td>{d[2]}</td><td>{d[3]}</td><td><b>{d[4]}</b> nodes</td><td><span className={`verified ${i===3?"pending":""}`}>{i===3?"◷":"✓"} {d[5]}</span></td><td>›</td></tr>)}</tbody></table></div></section>
    <div className="empty-mini"><span>⌘</span><div><strong>Knowledge Graph đã sẵn sàng</strong><p>1.842 nodes · 4.620 relationships · 30 claim đang được liên kết</p></div><button>Mở trình khám phá →</button></div>
  </>;
}

function Placeholder({ title }: { title: string }) {
  return <><PageHeading title={title} description="Khu vực cấu hình dành cho quản trị viên hệ thống." /><div className="empty-state panel"><span>⚙</span><h2>Chưa có cấu hình cần cập nhật</h2><p>Các cài đặt mặc định đang được áp dụng an toàn.</p></div></>;
}
