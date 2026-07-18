"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Case } from "../../types";
import { parseCaseDate } from "../../utils/date";
import { legalTopicName, discussionTopicName } from "../../utils/topic";
import {
  TrendingUp, TrendingDown, Circle, Square, Star, MoreVertical, Target,
  Info, Calendar, AlertTriangle
} from "lucide-react";

// Re-use same icon paths from original
function kpiIcon(type: "shield" | "warning" | "search" | "trend") {
  const paths = {
    shield: (
      <>
        <path d="M12 3 20 6v5.8c0 5-3.4 8.4-8 10.2-4.6-1.8-8-5.2-8-10.2V6l8-3Z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),
    warning: (
      <>
        <path d="M10.3 4.2 2.7 18a2 2 0 0 0 1.8 3h15a2 2 0 0 0 1.8-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4.5" />
        <path d="M12 17.2h.01" />
      </>
    ),
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="7.3" />
        <path d="m16.2 16.2 5 5" />
      </>
    ),
    trend: (
      <>
        <path d="M4 20v-6M10 20V9M16 20v-4" />
        <path d="m3.5 10 5-5 4 4L21 1" />
        <path d="M16.5 1H21v4.5" />
      </>
    ),
  };
  return (
    <svg
      className="fill-none stroke-current stroke-[1.9]"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ width: 20, height: 20 }}
    >
      {paths[type]}
    </svg>
  );
}

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
  const colors: Record<Case["platform"], string> = {
    Facebook: "text-[#1877f2]",
    TikTok: "text-[#111]",
    YouTube: "text-[#ff0033]",
    X: "text-[#050505]",
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

const kpiArticle =
  "flex min-h-[136px] items-start gap-[18px] rounded-[15px] border border-[#e5e8ef] bg-white px-5 py-6 shadow-[0_7px_24px_#27334d0a]";
const kpiIconBox = "grid h-[58px] w-[58px] flex-none place-items-center rounded-[17px] text-[0px] not-italic";
const kpiLabel = "text-[12px] font-[650] text-[#536077]";
const kpiValue = "my-3 mb-[15px] block text-[30px] leading-none tracking-[-.8px] text-[#101a34]";
const kpiTrendEm = "ml-[13px] font-normal not-italic text-[#7b8799]";

const chartPanel = "overflow-hidden rounded-[15px] border border-[#e3e6ee] bg-white shadow-[0_7px_24px_#29354e09]";
const chartHeader = "flex h-[57px] items-center px-5";
const chartTitle = "m-0 text-[15px] font-[780] text-[#17243d]";
const chartMenu = "ml-auto text-[18px] font-bold text-[#53627a]";

const heatGrid =
  "grid grid-cols-[118px_repeat(5,1fr)] items-center gap-1 max-[720px]:grid-cols-[92px_repeat(5,minmax(46px,1fr))] max-[720px]:min-w-[610px]";
const heatLevels = ["bg-[#ec4a92]", "bg-[#f59b81]", "bg-[#fbd798]", "bg-[#bde5c5]", "bg-[#e4eced]"];

const periodButton = "h-full min-w-[82px] rounded-[10px] border-0 px-[17px] text-[11px] max-[720px]:min-w-0 max-[720px]:flex-1 max-[520px]:px-3";
const periodActive =
  "bg-linear-90 from-[#ec1fa7] to-[#b910c2] font-extrabold text-white shadow-[0_5px_12px_#ce16ad2b]";

export function MarketOverview({ allItems }: { allItems: Case[] }) {
  const [period, setPeriod] = useState<1 | 7 | 30>(7);
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  // Filter items matching global search query in topbar
  const filteredAllItems = useMemo(() => {
    if (!searchQuery) return allItems;
    const lower = searchQuery.toLowerCase();
    return allItems.filter(
      (item) =>
        item.claim.toLowerCase().includes(lower) ||
        item.platform.toLowerCase().includes(lower) ||
        item.id.toLowerCase().includes(lower)
    );
  }, [allItems, searchQuery]);

  const rows = useMemo(() => {
    return filteredAllItems.map((item) => ({ item, date: parseCaseDate(item.publishedAt) }));
  }, [filteredAllItems]);

  const dated = useMemo(() => {
    return rows.filter((row): row is { item: Case; date: Date } => Boolean(row.date));
  }, [rows]);

  const latest = useMemo(() => new Date(), []);

  const start = useMemo(() => {
    const d = new Date(latest);
    if (period === 1) d.setTime(d.getTime() - 24 * 60 * 60 * 1000);
    else d.setDate(d.getDate() - period + 1);
    return d;
  }, [latest, period]);

  const previousStart = useMemo(() => {
    const d = new Date(start);
    if (period === 1) d.setTime(d.getTime() - 24 * 60 * 60 * 1000);
    else d.setDate(d.getDate() - period);
    return d;
  }, [start, period]);

  const current = useMemo(() => {
    return rows.filter((row) => row.date && row.date >= start && row.date <= latest).map((row) => row.item);
  }, [rows, start, latest]);

  const previous = useMemo(() => {
    return rows
      .filter((row) => row.date && row.date >= previousStart && row.date < start)
      .map((row) => row.item);
  }, [rows, previousStart, start]);

  const delta = (now: number, before: number) => {
    return before ? Math.round(((now - before) / before) * 100) : now ? 100 : 0;
  };

  const discussionDelta = delta(current.length, previous.length);
  const urgent = current.filter((item) => item.priority === "Khẩn cấp").length;
  const urgentDelta = delta(urgent, previous.filter((item) => item.priority === "Khẩn cấp").length);

  const topicMap = (items: Case[]) =>
    items.reduce((map, item) => {
      const topic = discussionTopicName(item);
      map.set(topic, (map.get(topic) || 0) + 1);
      return map;
    }, new Map<string, number>());

  const currentTopics = useMemo(() => topicMap(current), [current]);
  const previousTopics = useMemo(() => topicMap(previous), [previous]);

  const topics = useMemo(() => {
    return Array.from(currentTopics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [currentTopics]);

  const maxTopic = useMemo(() => {
    return Math.max(1, ...topics.map(([, count]) => count));
  }, [topics]);

  const hotTopics = topics.filter(([, count]) => count >= maxTopic * 0.5).length;
  const [topTopicName, topTopicCount] = topics[0] || ["Chưa có dữ liệu", 0];
  const topTopicShare = current.length ? Math.round((topTopicCount / current.length) * 100) : 0;

  const platforms = ["Facebook", "TikTok", "YouTube", "X", "Forum"] as Case["platform"][];

  const heatMax = useMemo(() => {
    return Math.max(
      1,
      ...topics.flatMap(([topic]) =>
        platforms.map(
          (platform) =>
            current.filter((item) => discussionTopicName(item) === topic && item.platform === platform).length
        )
      )
    );
  }, [topics, current, platforms]);

  const topPlatform = useMemo(() => {
    return (
      platforms
        .map((platform) => ({
          platform,
          count: current.filter((item) => item.platform === platform).length,
        }))
        .sort((a, b) => b.count - a.count)[0]?.platform || "Facebook"
    );
  }, [current, platforms]);

  const chartDays = period === 30 ? 30 : period === 1 ? 1 : 7;

  const daysData = useMemo(() => {
    return Array.from({ length: chartDays }, (_, index) => {
      const date = new Date(latest);
      date.setDate(date.getDate() - chartDays + 1 + index);
      const dayItems =
        chartDays === 1
          ? current
          : dated
              .filter(
                (row) =>
                  row.date >= start && row.date <= latest && row.date.toDateString() === date.toDateString()
              )
              .map((row) => row.item);
      const dailyTopics = Array.from(topicMap(dayItems)).sort((a, b) => b[1] - a[1]);
      return {
        label: `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`,
        "Lượt đề cập": dayItems.length,
        topTopic: dailyTopics[0]?.[0] || "Chưa có thảo luận",
        topTopicCount: dailyTopics[0]?.[1] || 0,
      };
    });
  }, [chartDays, latest, current, dated, start]);

  const peak = useMemo(() => {
    return daysData.reduce<{ label: string; value: number }>(
      (best, day) => (day["Lượt đề cập"] > best.value ? { label: day.label, value: day["Lượt đề cập"] } : best),
      { value: -1, label: "" }
    );
  }, [daysData]);

  const signed = (value: number) => `${value >= 0 ? "+" : ""}${value}%`;
  const discussionChange = previous.length
    ? signed(discussionDelta)
    : current.length
    ? `${current.length} lượt mới`
    : "Không thay đổi";

  // Recharts Custom Tooltip to mimic original premium design
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className="custom-chart-tooltip"
          style={{
            background: "rgba(21, 34, 53, 0.95)",
            border: "1px solid #334155",
            borderRadius: "8px",
            padding: "10px 12px",
            color: "#fff",
            fontSize: "12px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
          }}
        >
          <strong style={{ display: "block", marginBottom: "4px" }}>{data.label}</strong>
          <div>
            Lượt đề cập: <span style={{ color: "#e8198b", fontWeight: 700 }}>{data["Lượt đề cập"]}</span>
          </div>
          <div style={{ marginTop: "2px" }}>
            Chủ đề nổi bật: <span style={{ color: "#38bdf8" }}>{data.topTopic}</span>
          </div>
          {data.topTopicCount > 0 && (
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>
              (Đề cập chủ đề: {data.topTopicCount})
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const trendTextClass = (value: number) =>
    value >= 0 ? "text-[11px] font-[750] text-[#08a658]" : "text-[11px] font-[750] text-[#ef3540]";
  const headerTrendClass = (value: number) =>
    value >= 0
      ? "ml-auto mr-4 text-[11px] font-extrabold text-[#07a75b]"
      : "ml-auto mr-4 text-[11px] font-extrabold text-[#ef3540]";

  return (
    <div className="mx-auto min-h-[calc(100vh-66px)] max-w-[1640px] bg-[#fbfbfd] px-[26px] pt-[18px] pb-[28px] max-[720px]:p-4">
      <div className="mb-[18px] flex items-end justify-between max-[820px]:flex-col max-[820px]:items-start max-[820px]:gap-3.5">
        <div>
          <small className="text-[10px] font-[850] tracking-[1.25px] text-[#d316a8]">
            BẢNG ĐIỀU KHIỂN CHIẾN LƯỢC
          </small>
          <h1 className="mt-[9px] mb-[7px] text-[34px] font-extrabold leading-[1.08] tracking-[-1.25px] text-[#101b35] max-[720px]:text-[28px]">
            Toàn cảnh thảo luận thị trường
          </h1>
          <p className="m-0 text-[11px] text-[#758196]">
            Giúp lãnh đạo nhận biết chủ đề đang được quan tâm, mức độ thảo luận và nền tảng phát sinh nhiều tín
            hiệu nhất.
          </p>
        </div>
        <div
          className="flex h-12 items-center overflow-hidden rounded-xl border border-[#e7e9f0] bg-white max-[720px]:w-full"
          aria-label="Khoảng thời gian"
        >
          <button
            className={`${periodButton} ${period === 1 ? periodActive : "bg-transparent text-[#68758b]"}`}
            onClick={() => setPeriod(1)}
          >
            24 giờ
          </button>
          <button
            className={`${periodButton} ${period === 7 ? periodActive : "bg-transparent text-[#68758b]"}`}
            onClick={() => setPeriod(7)}
          >
            7 ngày
          </button>
          <button
            className={`${periodButton} ${period === 30 ? periodActive : "bg-transparent text-[#68758b]"}`}
            onClick={() => setPeriod(30)}
          >
            30 ngày
          </button>
          <span className="grid h-full w-[52px] place-items-center border-l border-[#e8e9ef] text-[#65738b]">
            <Calendar size={16} />
          </span>
        </div>
      </div>

      <section className="mb-4 grid grid-cols-4 gap-3.5 max-[1250px]:grid-cols-2 max-[720px]:grid-cols-1">
        <article className={kpiArticle}>
          <i className={`${kpiIconBox} bg-linear-145 from-[#ffe5f0] to-[#fff1f7] text-[#ef197b]`}>
            {kpiIcon("search")}
          </i>
          <div>
            <small className={kpiLabel}>Chủ đề được bàn luận nhiều nhất</small>
            <strong
              className="my-2.5 mb-3 line-clamp-2 block text-[19px] leading-[1.2] tracking-[-.8px] text-[#101a34]"
              title={topTopicName}
            >
              {topTopicName}
            </strong>
            <span className="flex flex-wrap gap-x-0 gap-y-1 text-[11px] font-[750] text-[#08a658]">
              {topTopicCount} lượt đề cập{" "}
              <em className="ml-2 font-normal not-italic text-[#7b8799]">{topTopicShare}% thảo luận trong kỳ</em>
            </span>
          </div>
        </article>
        <article className={kpiArticle}>
          <i className={`${kpiIconBox} bg-linear-145 from-[#ffe5ef] to-[#fff2f7] text-[#ed176f]`}>
            {kpiIcon("warning")}
          </i>
          <div>
            <small className={kpiLabel}>Claim rủi ro cao</small>
            <strong className={kpiValue} style={{ fontFamily: "var(--font-geist)" }}>
              {urgent}
            </strong>
            <span className={trendTextClass(urgentDelta)}>
              {urgentDelta >= 0 ? <TrendingUp size={12} className="inline align-[-1px]" /> : <TrendingDown size={12} className="inline align-[-1px]" />} {signed(urgentDelta)} <em className={kpiTrendEm}>so với kỳ trước</em>
            </span>
          </div>
        </article>
        <article className={kpiArticle}>
          <i className={`${kpiIconBox} bg-linear-145 from-[#fff0d9] to-[#fff8ed] text-[#ee8b00]`}>
            {kpiIcon("search")}
          </i>
          <div>
            <small className={kpiLabel}>Chủ đề nổi bật</small>
            <strong className={kpiValue} style={{ fontFamily: "var(--font-geist)" }}>
              {hotTopics}
            </strong>
            <span className="text-[11px] font-[750] text-[#08a658]">
              {topics.length} <em className={kpiTrendEm}>chủ đề đang được theo dõi</em>
            </span>
          </div>
        </article>
        <article className={kpiArticle}>
          <i className={`${kpiIconBox} bg-linear-145 from-[#ede4ff] to-[#f8f4ff] text-[#7b38e8]`}>
            {kpiIcon("trend")}
          </i>
          <div>
            <small className={kpiLabel}>Lượng thảo luận {period === 1 ? "24 giờ" : `${period} ngày`}</small>
            <strong className={kpiValue} style={{ fontFamily: "var(--font-geist)" }}>
              {current.length}
            </strong>
            <span className={trendTextClass(discussionDelta)}>
              {discussionDelta >= 0 ? <TrendingUp size={12} className="inline align-[-1px]" /> : <TrendingDown size={12} className="inline align-[-1px]" />} {discussionChange} <em className={kpiTrendEm}>so với kỳ trước</em>
            </span>
          </div>
        </article>
      </section>

      <div className="grid grid-cols-[minmax(0,1.55fr)_minmax(350px,1fr)] gap-4 max-[1250px]:grid-cols-1">
        <section
          className={`${chartPanel} h-[320px] max-[1250px]:h-auto max-[1250px]:min-h-[320px]`}
          style={{ overflow: "visible" }}
        >
          <header className={chartHeader}>
            <h2 className={chartTitle}>
              Xu hướng thảo luận theo thời gian <Info size={14} className="inline align-[-2px] text-[#8995a8]" />
            </h2>
            <span className={headerTrendClass(discussionDelta)}>
              {discussionDelta >= 0 ? <TrendingUp size={12} className="inline align-[-1px]" /> : <TrendingDown size={12} className="inline align-[-1px]" />} {discussionChange}{" "}
              <em className="ml-2 font-normal not-italic text-[#96a0b0]">so với kỳ trước</em>
            </span>
            <MoreVertical size={18} className={chartMenu} />
          </header>
          <div className="flex gap-7 px-[22px] pt-px pb-[5px] text-[10px] text-[#526078]">
            <span className="flex items-center gap-2">
              <i className="h-1 w-[21px]" style={{ background: "#ed198b" }} /> Lượt đề cập
            </span>
          </div>
          <div className="pr-[18px] pb-7 pl-[38px]" style={{ height: 230, position: "relative", overflow: "visible" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daysData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskAreaV2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ed198b" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="#ed198b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e8ed" />
                <XAxis dataKey="label" tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} />
                <YAxis tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Lượt đề cập"
                  stroke="#ed198b"
                  strokeWidth={2}
                  fill="url(#riskAreaV2)"
                  activeDot={{ r: 5, fill: "#ed198b", strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div
              style={{
                position: "absolute",
                bottom: 4,
                left: 40,
                fontSize: "11px",
                color: "#64748b",
                fontWeight: 500,
              }}
            >
              Cao điểm: <strong style={{ color: "#475569" }}>{peak.label || "chưa có dữ liệu"}</strong> · <strong style={{ color: "#ed198b" }}>{Math.max(0, peak.value)}</strong> lượt đề cập
            </div>
          </div>
        </section>

        <section className={`${chartPanel} h-[320px] max-[1250px]:h-auto max-[1250px]:min-h-[320px]`}>
          <header className={chartHeader}>
            <h2 className={chartTitle}>Top chủ đề được bàn luận nhiều nhất</h2>
            <MoreVertical size={18} className={chartMenu} />
          </header>
          <div className="px-[22px] pt-[2px]">
            {topics.map(([topic, count]) => {
              const change = delta(count, previousTopics.get(topic) || 0);
              return (
                <div
                  key={topic}
                  className="grid h-[42px] grid-cols-[126px_1fr_28px_52px] items-center gap-2.5"
                >
                  <strong className="text-[11px] text-[#24324b]">{topic}</strong>
                  <i className="h-[7px] overflow-hidden rounded-md bg-[#f0f1f5]">
                    <b
                      className="block h-full rounded-md bg-linear-90 from-[#ec1682] to-[#ed2a91]"
                      style={{ width: `${Math.max(8, (count / maxTopic) * 100)}%` }}
                    />
                  </i>
                  <em className="text-[11px] not-italic text-[#1f2d46]">{count}</em>
                  <span
                    className={`text-right text-[10px] font-[750] ${
                      change >= 0 ? "text-[#0aa65d]" : "text-[#ef3540]"
                    }`}
                  >
                    {change >= 0 ? <TrendingUp size={10} className="inline align-[-1px]" /> : <TrendingDown size={10} className="inline align-[-1px]" />} {Math.abs(change)}%
                  </span>
                </div>
              );
            })}
          </div>
          <footer className="flex justify-between px-[22px] py-1.5 text-[9px] text-[#778397]">
            <span><Circle size={8} fill="currentColor" className="inline align-[-1px]" />&nbsp; Số lượt đề cập theo chủ đề</span>
            <span>so với kỳ trước</span>
          </footer>
        </section>

        <section className={`${chartPanel} min-h-[278px] max-[720px]:overflow-x-auto`}>
          <header className={chartHeader}>
            <h2 className={chartTitle}>
              Heatmap điểm nóng <Info size={14} className="inline align-[-2px] text-[#8995a8]" />
            </h2>
            <MoreVertical size={18} className={chartMenu} />
          </header>
          <div className={`${heatGrid} px-5 pt-px pb-[7px] text-[9px] font-[650] text-[#25334b]`}>
            <span>Chủ đề</span>
            {platforms.map((platform) => (
              <span key={platform} className="flex items-center justify-center gap-[5px] whitespace-nowrap">
                {platformIcon(platform)} {platform === "Forum" ? "Khác" : platform}
              </span>
            ))}
          </div>
          <div className="px-5">
            {topics.map(([topic]) => (
              <div key={topic} className={`${heatGrid} h-7`}>
                <strong className="text-[10px] text-[#26344b]">{topic}</strong>
                {platforms.map((platform) => {
                  const count = current.filter(
                    (item) => discussionTopicName(item) === topic && item.platform === platform
                  ).length;
                  const level = Math.min(4, 4 - Math.round((count / heatMax) * 4));
                  return (
                    <i
                      key={platform}
                      className={`h-6 rounded-[3px] border border-white ${heatLevels[level]}`}
                      title={`${topic} · ${platform}: ${count} hồ sơ`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-[17px] px-2.5 py-[15px] text-[9px] text-[#6d798d] max-[720px]:min-w-[610px]">
            <span className="text-[#e43886] inline-flex items-center gap-1"><Square size={10} fill="currentColor" /> Rất cao</span>
            <span className="text-[#ee936c] inline-flex items-center gap-1"><Square size={10} fill="currentColor" /> Cao</span>
            <span className="text-[#dfb656] inline-flex items-center gap-1"><Square size={10} fill="currentColor" /> Trung bình</span>
            <span className="text-[#74c889] inline-flex items-center gap-1"><Square size={10} fill="currentColor" /> Thấp</span>
            <span className="text-[#9acfa5] inline-flex items-center gap-1"><Square size={10} fill="currentColor" /> Rất thấp</span>
          </div>
        </section>

        <section className={`${chartPanel} min-h-[278px]`}>
          <header className={chartHeader}>
            <h2 className={chartTitle}>
              <span className="mr-2 inline-grid h-[23px] w-[23px] place-items-center rounded-full bg-[#ffe7f3] text-[#e9177d]">
                <Star size={14} fill="currentColor" />
              </span>{" "}
              Nhận định điều hành
            </h2>
            <MoreVertical size={18} className={chartMenu} />
          </header>
          <div className="mx-3.5 mb-3.5 overflow-hidden rounded-xl border border-[#e6e8ee]">
            <p className="m-0 flex min-h-[64px] items-center gap-[17px] border-b border-[#e7e9ef] px-3 py-[9px] text-[11px] text-[#2a374d]">
              <i className="grid h-[45px] w-[45px] flex-none place-items-center rounded-xl bg-[#fde9f5] text-[#e6167c]">
                <Target size={25} />
              </i>
              <span>
                Thảo luận đang tập trung vào chủ đề <b className="font-[750]">{topics[0]?.[0] || "chưa xác định"}</b>.
              </span>
            </p>
            <p className="m-0 flex min-h-[64px] items-center gap-[17px] border-b border-[#e7e9ef] px-3 py-[9px] text-[11px] text-[#2a374d]">
              <i className="grid h-[45px] w-[45px] flex-none place-items-center rounded-xl bg-[#fde9f5] text-[25px] not-italic text-[#e6167c]">
                {platformIcon(topPlatform)}
              </i>
              <span>
                <b className="font-[750]">{topPlatform}</b> là nền tảng ghi nhận nhiều tín hiệu nhất trong kỳ.
              </span>
            </p>
            <p className="m-0 flex min-h-[64px] items-center gap-[17px] px-3 py-[9px] text-[11px] text-[#2a374d]">
              <i className="grid h-[45px] w-[45px] flex-none place-items-center rounded-xl bg-[#fde9f5] text-[#e6167c]">
                <AlertTriangle size={25} />
              </i>
              <span>
                <b className="font-[750]">{urgent || 0} claim</b> ở mức khẩn cấp cần được ưu tiên xử lý.
              </span>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
