"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useQueueQuery,
  useClearQueueMutation,
} from "../../hooks/use-queries";
import { VerdictBadge, StatusBadge, slug } from "../common/badge";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ManualInputDrawer } from "./manual-input-drawer";
import { CaseDetail } from "../cases/case-detail";
import { Case, Verdict, Status, Priority } from "../../types";
import {
  FilePlus, AlertTriangle, Search, Clock,
  ArrowUpDown, Plus, X, ExternalLink, ArrowRight
} from "lucide-react";

const verdicts: Array<"Tất cả" | Verdict> = ["Tất cả", "Đúng", "Hiểu lầm", "Cần kiểm chứng"];
const statuses: Array<"Tất cả" | Status> = ["Tất cả", "Mới", "Đang xử lý", "Đã xử lý"];
const priorityRank: Record<Priority, number> = { "Khẩn cấp": 4, Cao: 3, "Trung bình": 2, Thấp: 1 };

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

const pageShell =
  "mx-auto max-w-[1640px] px-[28px] pt-[25px] pb-8 max-[700px]:px-[15px] max-[700px]:pt-[26px] max-[700px]:pb-6";

const metricArticle =
  "flex min-h-[119px] items-start justify-between rounded-[15px] border border-[#e8eaf1] bg-white px-5 py-[18px] shadow-[0_6px_24px_#24304b08] max-[700px]:min-h-[102px] max-[700px]:p-[14px] max-[480px]:min-h-[92px]";
const metricLabel = "block text-[11px] text-[#6d7990]";
const metricValue = "my-2 block text-[27px] text-[#111d36]";
const metricIcon = "grid h-[45px] w-[45px] place-items-center rounded-full text-[19px] not-italic";

const tabButton = "relative border-0 bg-transparent px-[14px] text-[11px] max-[700px]:whitespace-nowrap";
const tabActive =
  "font-extrabold text-[#bd0aae] after:absolute after:right-2 after:bottom-0 after:left-2 after:h-[2px] after:bg-[#d80aa1] after:content-['']";
const tabCount = "ml-[6px] rounded-[10px] bg-[#f0f1f5] px-[6px] py-[2px] text-[9px] text-[#7c8799]";

const priorityColors: Record<string, string> = {
  "khan-cap": "bg-[#fff0f4] text-[#bd315b]",
  cao: "bg-[#fff7e5] text-[#a16b15]",
  "trung-binh": "bg-[#eaf2f8] text-[#3b668b]",
  thap: "bg-[#edf1f4] text-[#687789]",
};

const platformBg: Record<Case["platform"], string> = {
  Facebook: "bg-[#e8f0f8] text-[#286298]",
  TikTok: "bg-[#202a34] text-white",
  YouTube: "bg-[#ffebe9] text-[#c54137]",
  Web: "bg-[#e8f8ee] text-[#147a49]",
  Forum: "bg-[#e8f0f8] text-[#286298]",
};

const thCell =
  "border-b border-[#eff1f5] bg-[#fafbfe] px-3 py-2.5 text-left text-[8px] font-[650] tracking-[.55px] text-[#989dae]";
const tdCell = "border-b border-[#f0f1f5] px-3 py-[11px] align-middle text-[10px] text-[#445468]";
const tdSmall = "mt-[3px] block text-[8px] text-[#91a0af]";

export function QueueView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const { data: fetchedItems = [], isLoading } = useQueueQuery();
  const clearQueueMutation = useClearQueueMutation();

  const [localCases, setLocalCases] = useState<Case[]>([]);

  // Load local cases from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("local_cases");
    if (saved) {
      try {
        setLocalCases(JSON.parse(saved) as Case[]);
      } catch {
        // ignore
      }
    }
  }, []);

  const saveLocalCases = (cases: Case[]) => {
    setLocalCases(cases);
    sessionStorage.setItem("local_cases", JSON.stringify(cases));
  };

  const [verdictFilter, setVerdictFilter] = useState<(typeof verdicts)[number]>("Tất cả");
  const [statusFilter, setStatusFilter] = useState<(typeof statuses)[number]>("Tất cả");
  const [sortDesc, setSortDesc] = useState(true);
  const [quickTab, setQuickTab] = useState<"all" | "urgent" | "verify" | "processing">("all");
  const [showInput, setShowInput] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  const allItems = useMemo(() => {
    // Deduplicate: if a local case exists in backend (by ID), prefer the backend one.
    const fetchedIds = new Set(fetchedItems.map((item) => item.id));
    const filteredLocal = localCases.filter((item) => !fetchedIds.has(item.id));
    return [...filteredLocal, ...fetchedItems];
  }, [localCases, fetchedItems]);

  const openCount = allItems.filter((item) => item.status !== "Đã xử lý").length;
  const urgentCount = allItems.filter((item) => item.priority === "Khẩn cấp").length;
  const verifyCount = allItems.filter((item) => item.verdict === "Cần kiểm chứng").length;
  const processingCount = allItems.filter((item) => item.status === "Đang xử lý").length;

  const rows = useMemo(() => {
    return allItems
      .filter((item) => verdictFilter === "Tất cả" || item.verdict === verdictFilter)
      .filter((item) => statusFilter === "Tất cả" || item.status === statusFilter)
      .filter(
        (item) =>
          !searchQuery ||
          `${item.claim} ${item.platform} ${item.id}`.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => (priorityRank[b.priority] - priorityRank[a.priority]) * (sortDesc ? 1 : -1));
  }, [allItems, verdictFilter, statusFilter, searchQuery, sortDesc]);

  const visibleRows = useMemo(() => {
    return rows.filter(
      (item) =>
        quickTab === "all" ||
        (quickTab === "urgent" && item.priority === "Khẩn cấp") ||
        (quickTab === "verify" && item.verdict === "Cần kiểm chứng") ||
        (quickTab === "processing" && item.status === "Đang xử lý")
    );
  }, [rows, quickTab]);

  const handleOpenCase = (id: string) => {
    const item = allItems.find((x) => x.id === id);
    if (item) setSelectedCase(item);
  };

  const handleClearQueue = () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ hàng đợi?")) {
      clearQueueMutation.mutate();
      saveLocalCases([]);
    }
  };

  if (isLoading) {
    return (
      <div className={pageShell}>
        <div style={{ padding: "100px", textAlign: "center" }}>Đang tải hàng đợi giám sát...</div>
      </div>
    );
  }

  return (
    <div className={pageShell}>
      <div className="mb-[18px] flex items-center justify-between gap-[25px] max-[700px]:flex-col max-[700px]:items-start">
        <div>
          <span className="text-[10px] font-extrabold tracking-[1.5px] text-[#c01cad]">ĐIỀU PHỐI NỘI DUNG</span>
          <h1 className="my-[6px] text-[38px] font-[760] tracking-[-1.6px] text-[#202944] max-[480px]:text-[31px]">
            Hàng đợi giám sát
          </h1>
          <p className="m-0 text-[12px] text-[#738195]">
            Nhập thủ công nội dung cần theo dõi, sau đó rà soát kết quả phân tích của AI.
          </p>
        </div>
      </div>

      <section className="mb-[15px] grid grid-cols-4 gap-[14px] max-[1200px]:grid-cols-2 max-[480px]:grid-cols-1">
        <article className={metricArticle}>
          <div>
            <small className={metricLabel}>Hồ sơ mới</small>
            <strong className={metricValue}>{allItems.filter((item) => item.status === "Mới").length}</strong>
          </div>
          <i className={`${metricIcon} bg-[#f2eaff] text-[#8d22dc]`}><FilePlus size={19} /></i>
        </article>
        <article className={metricArticle}>
          <div>
            <small className={metricLabel}>Khẩn cấp</small>
            <strong className={metricValue}>{urgentCount}</strong>
            {urgentCount > 0 && (
              <span className="text-[9px] font-[750] text-[#dc1998]">
                <em className="font-normal not-italic text-[#94a0b1] max-[700px]:hidden">
                  {allItems.length ? Math.round((urgentCount / allItems.length) * 100) : 0}% tổng hồ sơ
                </em>
              </span>
            )}
          </div>
          <i className={`${metricIcon} bg-[#ffedf4] text-[#e31b87]`}><AlertTriangle size={19} /></i>
        </article>
        <article className={metricArticle}>
          <div>
            <small className={metricLabel}>Cần kiểm chứng</small>
            <strong className={metricValue}>{verifyCount}</strong>
            {verifyCount > 0 && (
              <span className="text-[9px] font-[750] text-[#1ba86b]">
                <em className="font-normal not-italic text-[#94a0b1] max-[700px]:hidden">
                  {allItems.length ? Math.round((verifyCount / allItems.length) * 100) : 0}% tổng hồ sơ
                </em>
              </span>
            )}
          </div>
          <i className={`${metricIcon} bg-[#fff4de] text-[#df971b]`}><Search size={19} /></i>
        </article>
        <article className={metricArticle}>
          <div>
            <small className={metricLabel}>Đang xử lý</small>
            <strong className={metricValue}>{processingCount || openCount}</strong>
          </div>
          <i className={`${metricIcon} bg-[#ffedf6] text-[#e11a8c]`}><Clock size={19} /></i>
        </article>
      </section>

      <section className="overflow-hidden rounded-[17px] bg-white shadow-[0_10px_30px_#28304f0b,0_2px_7px_#28304f08] max-[700px]:rounded-[14px]">
        <div className="flex h-[54px] items-stretch gap-2 border-b border-[#e8eaf1] px-[15px] max-[700px]:overflow-x-auto">
          <button
            className={`${tabButton} ${quickTab === "all" ? tabActive : "text-[#6f7b91]"}`}
            onClick={() => setQuickTab("all")}
          >
            Tất cả
          </button>
          <button
            className={`${tabButton} ${quickTab === "urgent" ? tabActive : "text-[#6f7b91]"}`}
            onClick={() => setQuickTab("urgent")}
          >
            Khẩn cấp <b className={tabCount}>{urgentCount}</b>
          </button>
          <button
            className={`${tabButton} ${quickTab === "verify" ? tabActive : "text-[#6f7b91]"}`}
            onClick={() => setQuickTab("verify")}
          >
            Cần kiểm chứng <b className={tabCount}>{verifyCount}</b>
          </button>
          <button
            className={`${tabButton} ${quickTab === "processing" ? tabActive : "text-[#6f7b91]"}`}
            onClick={() => setQuickTab("processing")}
          >
            Đang xử lý <b className={tabCount}>{processingCount}</b>
          </button>
        </div>
        <div className="flex items-end justify-between border-b border-[#f0f1f6] px-[15px] py-[13px] max-[700px]:flex-col max-[700px]:items-stretch max-[700px]:gap-2.5">
          <div className="flex gap-[9px] max-[700px]:grid max-[700px]:grid-cols-2">
            <label className="flex items-center rounded-[9px] border border-[#e4e7ee] pl-2.5 text-[10px] font-bold tracking-[.7px] text-[#8290a5]">
              Kết quả AI
              <select
                className="min-w-[150px] border-0 bg-transparent py-2 pr-[25px] pl-[9px] text-[11px] text-[#35495e] outline-none max-[700px]:w-full max-[700px]:min-w-0"
                value={verdictFilter}
                onChange={(event) => setVerdictFilter(event.target.value as (typeof verdicts)[number])}
              >
                {verdicts.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center rounded-[9px] border border-[#e4e7ee] pl-2.5 text-[10px] font-bold tracking-[.7px] text-[#8290a5]">
              Trạng thái
              <select
                className="min-w-[150px] border-0 bg-transparent py-2 pr-[25px] pl-[9px] text-[11px] text-[#35495e] outline-none max-[700px]:w-full max-[700px]:min-w-0"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as (typeof statuses)[number])}
              >
                {statuses.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex items-center gap-[9px] max-[700px]:flex-col max-[700px]:items-stretch">
            <button
              className="rounded-[10px] border border-[#e7e9f0] bg-[#fafbfe] px-3 py-[9px] text-[11px] text-[#35495e] hover:border-[#dca1d4] hover:text-[#b51aa8] max-[700px]:w-full"
              onClick={() => setSortDesc((v) => !v)}
            >
              <ArrowUpDown size={14} className="mr-1 inline align-[-2px]" /> Mức ưu tiên: {sortDesc ? "cao trước" : "thấp trước"}
            </button>
            <button
              className="rounded-[10px] border-0 bg-linear-145 from-[#ef35ad] to-[#a921cf] px-3 py-[9px] text-[11px] font-[750] text-white shadow-[0_7px_16px_#c626aa2c] hover:-translate-y-px hover:shadow-[0_9px_20px_#c626aa3d] max-[700px]:w-full"
              onClick={() => setShowInput(true)}
            >
               <Plus size={14} className="mr-1 inline align-[-2px]" /> Nhập nội dung mới
            </button>
            <button onClick={handleClearQueue} disabled={clearQueueMutation.isPending}>
              <X size={14} className="mr-1 inline align-[-2px]" /> Xóa hàng đợi
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="queue-monitor-table w-full min-w-[1120px] border-collapse">
            <thead>
              <tr>
                <th className={`${thCell} w-[44px] max-w-[44px] min-w-[44px] pr-[6px] pl-2.5 text-center`}>
                  <span className="inline-block h-3.5 w-3.5 rounded-[3px] border border-[#cfd5df] bg-white" />
                </th>
                <th className={`${thCell} w-[340px] min-w-[340px]`}>CLAIM / NỘI DUNG</th>
                <th className={thCell}>NỀN TẢNG</th>
                <th className={thCell}>MỨC RỦI RO</th>
                <th className={thCell}>ĐÁNH GIÁ AI</th>
                <th className={thCell}>ĐỘ TIN CẬY</th>
                <th className={thCell}>CHỦ ĐỀ PHÁP LÝ</th>
                <th className={thCell}>TRẠNG THÁI</th>
                <th className={`${thCell} w-[52px] min-w-[52px] text-center`} />
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((item, index) => (
                <tr
                  key={item.id}
                  className={`group cursor-pointer transition-[background,transform] duration-[180ms] hover:bg-[#fdf8ff] focus:outline-2 focus:outline-offset-[-2px] focus:outline-[#47799f] ${
                    index === 0 ? "shadow-[inset_0_0_0_1px_#ef54c4]" : ""
                  }`}
                  onClick={() => handleOpenCase(item.id)}
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") handleOpenCase(item.id);
                  }}
                >
                  <td className={`${tdCell} w-[44px] max-w-[44px] min-w-[44px] pr-[6px] pl-2.5 text-center`}>
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-[3px] border ${
                        index === 0
                          ? "border-[#c51db4] bg-[#c51db4] shadow-[inset_0_0_0_3px_#c51db4]"
                          : "border-[#cfd5df] bg-white"
                      }`}
                    />
                  </td>
                  <td className={`${tdCell} w-[340px] min-w-[340px]`}>
                    <strong className="block max-w-[280px] text-[11px] leading-[1.4] text-[#26384d]">
                      {item.claim}
                    </strong>
                    <small className={tdSmall}>
                      {item.id} · {item.publishedAt}
                      {item.sourceUrl && item.sourceUrl !== "#" ? (
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#2e638f]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={10} className="ml-1 inline align-[-1px]" />
                        </a>
                      ) : null}
                    </small>
                  </td>
                  <td className={tdCell}>
                    <span
                      className={`mr-[7px] inline-grid h-[25px] w-[25px] place-items-center rounded-full font-extrabold shadow-[inset_0_0_0_1px_#ffffff90] ${platformBg[item.platform]}`}
                    >
                      {platformIcon(item.platform)}
                    </span>
                    {item.platform}
                  </td>
                  <td className={tdCell}>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-[9px] px-2 py-[5px] text-[8px] font-[750] whitespace-nowrap ${
                        item.spreadRisk >= 70
                          ? "bg-[#fff0f4] text-[#bd315b]"
                          : item.spreadRisk >= 40
                            ? "bg-[#fff7e5] text-[#a16b15]"
                            : item.spreadRisk >= 15
                              ? "bg-[#eaf2f8] text-[#3b668b]"
                              : "bg-[#edf1f4] text-[#687789]"
                      }`}
                    >
                      <i className="h-[5px] w-[5px] rounded-full bg-current" />
                      {item.spreadRisk >= 70
                        ? "Khẩn cấp"
                        : item.spreadRisk >= 40
                          ? "Cao"
                          : item.spreadRisk >= 15
                            ? "Trung bình"
                            : "Thấp"}
                    </span>
                  </td>
                  <td className={tdCell}>
                    <VerdictBadge value={item.verdict} />
                    <small className={`${tdSmall} ml-1`}>AI {item.aiAccuracy}/100</small>
                  </td>
                  <td className={tdCell}>
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-full border-2 text-[9px] font-extrabold ${
                        item.sourceReliability >= 80
                          ? "border-[#32be7a] text-[#11975c]"
                          : item.sourceReliability >= 50
                            ? "border-[#e0a52d] text-[#b87b08]"
                            : item.sourceReliability >= 20
                              ? "border-[#e07b2d] text-[#b85f08]"
                              : "border-[#aab8c8] text-[#69778d]"
                      }`}
                    >
                      {item.sourceReliability}%
                    </span>
                  </td>
                  <td className={tdCell}>
                    <strong className="block max-w-[120px] text-[9px] font-semibold text-[#26384d]">
                      {item.document}
                    </strong>
                    <small className={tdSmall}>{item.provision}</small>
                  </td>
                  <td className={tdCell}>
                    <StatusBadge value={item.status} />
                  </td>
                  <td className={`${tdCell} w-[52px] min-w-[52px] text-center`}>
                    <button
                      type="button"
                      className="inline-grid h-8 w-8 place-items-center rounded-full border-0 bg-[#f5eff9] p-0 align-middle text-[#b51aa8] transition-[transform,background,color] duration-[180ms] group-hover:translate-x-[2px] group-hover:bg-[#c71bb0] group-hover:text-white"
                      aria-label={`Mở hồ sơ ${item.id}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenCase(item.id);
                      }}
                    >
                      <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleRows.length === 0 && (
            <div className="p-[65px] text-center text-[#8492a1]">
              <strong className="block font-[Georgia] text-[17px] font-semibold text-[#35495d]">
                Chưa có hồ sơ trong hàng đợi
              </strong>
              <span className="mt-[5px] block text-[9px]">
                Bấm &ldquo;Quét MXH&rdquo; để thu thập dữ liệu từ mạng xã hội.
              </span>
            </div>
          )}
        </div>
        <footer className="flex border-t border-[#f0f1f5] px-4 py-3 text-[11px] text-[#84909e]">
          Hiển thị&nbsp;<strong>{visibleRows.length}</strong>&nbsp;/ {allItems.length} hồ sơ
        </footer>
      </section>

      {showInput && (
        <ManualInputDrawer
          onClose={() => setShowInput(false)}
          onSave={(items: Case[]) => {
            const updated = [...items, ...localCases];
            saveLocalCases(updated);
            setShowInput(false);
            if (items.length === 1) {
              setSelectedCase(items[0]);
            }
          }}
        />
      )}
      {selectedCase && (
        <CaseDetail item={selectedCase} onClose={() => setSelectedCase(null)} />
      )}
    </div>
  );
}
