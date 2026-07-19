"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useQueueQuery } from "@/hooks/use-queries";
import { API_URL } from "@/utils/api";
import type { Case } from "@/types";
import { Search, Zap, Bell, ChevronDown, Check, AlertTriangle, X, CheckCheck, ExternalLink } from "lucide-react";

const NOTIFICATION_STORAGE_KEY = "legal-radar-read-notifications";

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const { data: caseItems = [], isError } = useQueueQuery();
  const [crawlState, setCrawlState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [crawlMessage, setCrawlMessage] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [notificationToast, setNotificationToast] = useState<Case | null>(null);
  const knownNotificationIds = useRef<Set<string>>(new Set());
  const notificationsInitialized = useRef(false);
  const notificationToastTimer = useRef<number | null>(null);
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

  const notifications = useMemo(
    () =>
      caseItems
        .filter(
          (item) =>
            item.status === "Mới" ||
            item.priority === "Khẩn cấp" ||
            item.verdict === "Cần kiểm chứng",
        )
        .sort((a, b) => {
          const priority = { "Khẩn cấp": 4, Cao: 3, "Trung bình": 2, Thấp: 1 };
          return priority[b.priority] - priority[a.priority] || b.score - a.score;
        })
        .slice(0, 10),
    [caseItems],
  );
  const unreadCount = notifications.filter((item) => !readNotificationIds.includes(item.id)).length;

  useEffect(() => {
    if (!notificationsInitialized.current) {
      knownNotificationIds.current = new Set(notifications.map((item) => item.id));
      notificationsInitialized.current = true;
      return;
    }

    const newItems = notifications.filter((item) => !knownNotificationIds.current.has(item.id));
    notifications.forEach((item) => knownNotificationIds.current.add(item.id));
    if (!newItems.length) return;

    const showTimer = window.setTimeout(() => {
      if (notificationToastTimer.current) window.clearTimeout(notificationToastTimer.current);
      setNotificationToast(newItems[0]);
      notificationToastTimer.current = window.setTimeout(() => {
        setNotificationToast(null);
        notificationToastTimer.current = null;
      }, 5000);
    }, 0);

    return () => window.clearTimeout(showTimer);
  }, [notifications]);

  useEffect(
    () => () => {
      if (notificationToastTimer.current) window.clearTimeout(notificationToastTimer.current);
    },
    [],
  );

  const saveReadNotifications = (ids: string[]) => {
    const uniqueIds = Array.from(new Set(ids));
    setReadNotificationIds(uniqueIds);
    window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(uniqueIds));
  };

  const toggleNotifications = () => {
    if (!notificationsOpen) {
      try {
        const saved = JSON.parse(window.localStorage.getItem(NOTIFICATION_STORAGE_KEY) || "[]");
        setReadNotificationIds(Array.isArray(saved) ? saved : []);
      } catch {
        setReadNotificationIds([]);
      }
    }
    setNotificationsOpen((open) => !open);
  };

  const openNotification = (id: string) => {
    saveReadNotifications([...readNotificationIds, id]);
    setNotificationsOpen(false);
    router.push(`/cases/${encodeURIComponent(id)}`);
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[66px] min-w-0 items-center gap-3 border-b border-[#eceef4] bg-[#ffffffdd] px-[28px] backdrop-blur-[12px] max-[980px]:h-[69px] max-[860px]:gap-[7px] max-[700px]:h-[58px] max-[700px]:px-[15px]">
        <div className="flex min-w-0 max-w-[525px] flex-1 items-center gap-[9px] rounded-xl border border-[#e9ebf2] bg-white px-[15px] py-[11px] text-[#7d8da0] shadow-[0_5px_16px_#23294b08] max-[520px]:px-2.5">
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
        <div className="relative max-[700px]:hidden">
          <button
            className={`relative grid h-9 w-9 place-items-center rounded-full border-0 text-[20px] transition-colors ${
              notificationsOpen ? "bg-[#fff0f8] text-[#d40c91]" : "bg-transparent text-[#65738a] hover:bg-[#f5f6f9]"
            }`}
            aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ""}`}
            aria-expanded={notificationsOpen}
            onClick={toggleNotifications}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <b className="absolute -top-0.5 -right-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-[#df0c9e] px-1 text-[9px] text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </b>
            )}
          </button>

          {notificationsOpen && (
            <section className="absolute top-[46px] right-0 z-[150] w-[380px] overflow-hidden rounded-[15px] border border-[#e6e9ef] bg-white shadow-[0_18px_50px_#1f2b4426]">
              <header className="flex items-center justify-between border-b border-[#edf0f4] px-4 py-3.5">
                <div>
                  <h2 className="m-0 text-[14px] font-[780] text-[#17243d]">Thông báo</h2>
                  <p className="mt-1 text-[9px] text-[#8a96a8]">{unreadCount} thông báo chưa đọc</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    className="inline-flex items-center gap-1 border-0 bg-transparent text-[9px] font-[700] text-[#c51991]"
                    onClick={() => saveReadNotifications([...readNotificationIds, ...notifications.map((item) => item.id)])}
                  >
                    <CheckCheck size={13} /> Đánh dấu tất cả đã đọc
                  </button>
                )}
              </header>

              <div className="max-h-[390px] overflow-y-auto">
                {notifications.length ? (
                  notifications.map((item) => {
                    const unread = !readNotificationIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        className={`flex w-full items-start gap-3 border-0 border-b border-[#f0f2f5] px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[#faf7fc] ${
                          unread ? "bg-[#fff8fc]" : "bg-white"
                        }`}
                        onClick={() => openNotification(item.id)}
                      >
                        <span
                          className={`mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-full ${
                            item.priority === "Khẩn cấp"
                              ? "bg-[#fff0f3] text-[#dc3558]"
                              : item.verdict === "Cần kiểm chứng"
                                ? "bg-[#fff7e4] text-[#b97813]"
                                : "bg-[#edf8f3] text-[#23865c]"
                          }`}
                        >
                          {item.priority === "Khẩn cấp" ? <AlertTriangle size={15} /> : <Bell size={14} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <strong className="line-clamp-2 block text-[10px] leading-[1.45] text-[#26354b]">
                            {item.claim}
                          </strong>
                          <small className="mt-1 block text-[9px] text-[#8692a4]">
                            {item.platform === "Web" ? "Báo chí" : item.platform === "Forum" ? "Khác" : item.platform}
                            {" · "}
                            {item.priority}
                            {" · "}
                            {item.verdict}
                          </small>
                        </span>
                        {unread ? (
                          <i className="mt-2 h-2 w-2 flex-none rounded-full bg-[#df0c9e]" />
                        ) : (
                          <ExternalLink size={12} className="mt-2 flex-none text-[#a0aaba]" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-6 py-10 text-center">
                    <CheckCheck size={24} className="mx-auto text-[#50ad83]" />
                    <strong className="mt-3 block text-[11px] text-[#344158]">Chưa có thông báo mới</strong>
                    <p className="mt-1 text-[9px] text-[#929cad]">Hồ sơ mới từ API sẽ tự động xuất hiện tại đây.</p>
                  </div>
                )}
              </div>

              <footer className="border-t border-[#edf0f4] bg-[#fafbfc] p-2.5 text-center">
                <button
                  className="border-0 bg-transparent text-[9px] font-[750] text-[#b9149b]"
                  onClick={() => {
                    setNotificationsOpen(false);
                    router.push("/queue");
                  }}
                >
                  Xem toàn bộ hàng đợi
                </button>
              </footer>
            </section>
          )}
        </div>
        <button
          className="ml-1 h-[35px] w-[35px] flex-none rounded-full bg-linear-145 from-[#ff3aac] to-[#ad19d5] text-[10px] font-extrabold text-white shadow-[0_6px_14px_#d12aa13b] max-[520px]:hidden"
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

      {notificationToast && (
        <div
          className="fixed right-[22px] z-[125] flex w-[min(390px,calc(100vw-32px))] items-start gap-3 rounded-xl border border-[#ead5e4] bg-white p-[14px] text-left shadow-[0_16px_42px_#25324a2b] transition-all"
          style={{ bottom: crawlMessage ? 112 : 22 }}
          onClick={() => openNotification(notificationToast.id)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") openNotification(notificationToast.id);
          }}
          role="button"
          tabIndex={0}
          aria-label={`Mở thông báo: ${notificationToast.claim}`}
        >
          <span
            className={`grid h-9 w-9 flex-none place-items-center rounded-full ${
              notificationToast.priority === "Khẩn cấp"
                ? "bg-[#fff0f3] text-[#dc3558]"
                : "bg-[#fff0f8] text-[#d40c91]"
            }`}
          >
            {notificationToast.priority === "Khẩn cấp" ? <AlertTriangle size={17} /> : <Bell size={17} />}
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block text-[11px] font-[780] text-[#1e2b43]">
              Có hồ sơ mới từ {notificationToast.platform === "Web" ? "Báo chí" : notificationToast.platform === "Forum" ? "Khác" : notificationToast.platform}
            </strong>
            <span className="mt-1 line-clamp-2 block text-[10px] leading-[1.45] text-[#58667b]">
              {notificationToast.claim}
            </span>
            <small className="mt-1.5 block text-[9px] font-[700] text-[#c51991]">Bấm để xem chi tiết · tự đóng sau 5 giây</small>
          </span>
          <button
            className="grid h-6 w-6 flex-none place-items-center rounded-full text-[#8793a5] hover:bg-[#f4f5f8]"
            onClick={(event) => {
              event.stopPropagation();
              if (notificationToastTimer.current) window.clearTimeout(notificationToastTimer.current);
              notificationToastTimer.current = null;
              setNotificationToast(null);
            }}
            aria-label="Đóng thông báo"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </>
  );
}
