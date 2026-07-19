"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useQueueQuery } from "@/hooks/use-queries";
import { API_URL } from "@/utils/api";
import { Search, Zap, Bell, ChevronDown, Check, AlertTriangle, X } from "lucide-react";

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const { data: caseItems = [], isError } = useQueueQuery();
  const [crawlState, setCrawlState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [crawlMessage, setCrawlMessage] = useState("");
  const [, startTransition] = useTransition();

  const searchQuery = searchParams.get("q") || "";

  const handleSearchChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set("q", val);
    else params.delete("q");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  async function runCrawl() {
    setCrawlState("loading");
    setCrawlMessage("Đang kết nối quét MXH...");
    try {
      const response = await fetch(`${API_URL}/api/crawl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: [], max_posts_per_platform: 1 }),
      });
      if (!response.ok) throw new Error("Crawl API unavailable");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let buffer = "";
      let itemCount = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg = JSON.parse(line);
            if (msg.type === "start") {
              setCrawlMessage(`${msg.message} — đang phân tích...`);
            } else if (msg.type === "error") {
              setCrawlMessage(msg.message);
              setCrawlState("error");
              return;
            } else if (msg.type === "item") {
              itemCount = msg.count;
              setCrawlMessage(`Đã phân tích ${itemCount} nội dung: ${msg.claim}...`);
              void queryClient.invalidateQueries({ queryKey: ["queue"] });
            } else if (msg.type === "done") {
              setCrawlMessage(`Hoàn tất! ${itemCount} nội dung đã được thêm vào hàng đợi.`);
            }
          } catch { /* skip non-JSON */ }
        }
      }
      void queryClient.invalidateQueries({ queryKey: ["queue"] });
      setCrawlState("success");
    } catch {
      setCrawlMessage("Không thể quét nguồn lúc này. Kiểm tra Backend và API key crawler.");
      setCrawlState("error");
    }
  }

  const urgentCount = caseItems.filter((x) => x.priority === "Khẩn cấp").length;

  return (
    <>
      <header className="flex h-[66px] items-center gap-3 border-b border-[#eceef4] bg-[#ffffffcc] px-[28px] backdrop-blur-[12px] max-[980px]:h-[69px] max-[860px]:gap-[7px] max-[700px]:h-[58px] max-[700px]:px-[15px]">
        <div className="flex max-w-[525px] flex-1 items-center gap-[9px] rounded-xl border border-[#e9ebf2] bg-white px-[15px] py-[11px] text-[#7d8da0] shadow-[0_5px_16px_#23294b08]">
          <Search size={18} className="text-[#7d8da0]" />
          <input
            className="w-full border-0 text-[14px] outline-0"
            value={searchQuery}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Tìm claim hoặc mã hồ sơ…"
            aria-label="Tìm kiếm hồ sơ"
          />
        </div>
        <button
          className="crawl-button ml-auto rounded-[9px] bg-linear-90 from-[#e51aa6] to-[#ae0bc5] px-[13px] py-2.5 text-[10px] font-extrabold whitespace-nowrap text-white shadow-[0_5px_14px_#c613ad24] disabled:cursor-wait disabled:opacity-70 max-[860px]:ml-0"
          onClick={runCrawl}
          disabled={crawlState === "loading"}
        >
          {crawlState === "loading" ? (
            <>
              <i className="mr-[5px] inline-block h-2.5 w-2.5 animate-[crawl-spin_.7s_linear_infinite] rounded-full border-2 border-[#ffffff66] border-t-white align-[-2px]" />{" "}
              Đang quét MXH…
            </>
          ) : (
            <><Zap size={14} className="mr-[5px] inline align-[-2px]" /> Quét MXH</>
          )}
        </button>
        <div
          className={`rounded-[18px] border border-[#e8eaf1] bg-white px-[13px] py-2 text-[11px] max-[860px]:hidden ${
            isError || caseItems.length === 0 ? "text-[#9b6b20]" : "text-[#607286]"
          }`}
        >
          <i
            className={`mr-[7px] inline-block h-[7px] w-[7px] rounded-full ${
              isError || caseItems.length === 0
                ? "bg-[#e3a83d] shadow-[0_0_0_3px_#e3a83d20]"
                : "bg-[#42cf91] shadow-[0_0_0_3px_#42cf9120]"
            }`}
          />{" "}
          {isError || caseItems.length === 0 ? "Dữ liệu mẫu dự phòng" : "Dữ liệu API trực tiếp"}
        </div>
        <button
          className="relative h-9 w-9 border-0 bg-transparent text-[20px] text-[#65738a] max-[700px]:hidden"
          aria-label="Thông báo"
        >
          <Bell size={20} />
          <b className="absolute top-0 right-0 grid h-4 w-4 place-items-center rounded-full bg-[#df0c9e] text-[9px] text-white">
            {urgentCount || ""}
          </b>
        </button>
        <button
          className="ml-1 h-[35px] w-[35px] rounded-full bg-linear-145 from-[#ff3aac] to-[#ad19d5] text-[10px] font-extrabold text-white shadow-[0_6px_14px_#d12aa13b]"
          aria-label="Tài khoản Minh Anh"
        >
          MA
        </button>
        <ChevronDown size={16} className="text-[#66748b] max-[700px]:hidden" />
      </header>

      {crawlMessage && (
        <div
          className={`fixed right-[22px] bottom-[22px] z-[120] flex w-[min(430px,calc(100vw-32px))] items-start gap-2.5 rounded-xl border p-[13px_14px] shadow-[0_14px_38px_#20324d22] ${
            crawlState === "error"
              ? "border-[#f0cbd3] bg-[#fff3f5] text-[#a43f53]"
              : "border-[#ccebdd] bg-[#f0fbf6] text-[#276d53]"
          }`}
          role="status"
        >
          <span
            className={`grid h-[21px] w-[21px] place-items-center rounded-full text-[11px] font-extrabold text-white ${
              crawlState === "error" ? "bg-[#d9556e]" : "bg-[#35a87b]"
            }`}
          >
            {crawlState === "success" ? <Check size={14} /> : <AlertTriangle size={14} />}
          </span>
          <p className="mt-[2px] flex-1 text-[11px] leading-[1.45]">{crawlMessage}</p>
          <button className="border-0 bg-transparent leading-none text-inherit" onClick={() => setCrawlMessage("")}>
            <X size={18} />
          </button>
        </div>
      )}
    </>
  );
}
