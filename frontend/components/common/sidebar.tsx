"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueueQuery } from "@/hooks/use-queries";
import { parseCaseDate } from "@/utils/date";
import { Zap, Layers, FileBarChart, Shield, CheckCircle, GitBranch, TrendingUp, TrendingDown, LifeBuoy } from "lucide-react";

const navLinkBase =
  "flex items-center gap-3 rounded-[11px] p-3 text-[12px] no-underline transition-[transform,background,box-shadow] duration-[180ms] ease-in-out hover:translate-x-[2px] hover:bg-[#fbf0ff] hover:text-[#a219c2]";

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`${navLinkBase} ${
        active ? "bg-white text-[#9d18be] shadow-[0_8px_22px_#23294b12]" : "text-[#757d91]"
      }`}
    >
      {children}
    </Link>
  );
}

function NavIcon({ active, children }: { active: boolean; children: React.ReactNode }) {
  return <span className={`inline-flex items-center justify-center w-[18px] ${active ? "text-[#d620a8]" : "text-[#757d91]"}`}>{children}</span>;
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: caseItems = [] } = useQueueQuery();

  const activeCount = caseItems.filter((x) => x.status !== "Đã xử lý").length;
  const quickReport = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const timestamps = caseItems
      .map((item) => parseCaseDate(item.createdAt || item.publishedAt))
      .filter((date): date is Date => Boolean(date));
    const todayDates = timestamps.filter((date) => date >= todayStart && date < tomorrowStart);
    const yesterdayCount = timestamps.filter((date) => date >= yesterdayStart && date < todayStart).length;
    const hourlyCounts = Array.from(
      { length: 24 },
      (_, hour) => todayDates.filter((date) => date.getHours() === hour).length,
    );
    const maximum = Math.max(1, ...hourlyCounts);
    const points = hourlyCounts
      .map((count, hour) => {
        const x = 2 + (hour / 23) * 196;
        const y = 44 - (count / maximum) * 38;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
    const change = yesterdayCount
      ? Math.round(((todayDates.length - yesterdayCount) / yesterdayCount) * 100)
      : todayDates.length
        ? 100
        : 0;
    return { count: todayDates.length, change, points, hourlyCounts };
  }, [caseItems]);

  const items = [
    { href: "/", icon: <Zap size={18} />, label: "Tổng quan thị trường", active: pathname === "/" },
    { href: "/queue", icon: <Layers size={18} />, label: "Hàng đợi giám sát", active: pathname.startsWith("/queue"), count: activeCount },
    { href: "/reports", icon: <FileBarChart size={18} />, label: "Báo cáo tổng hợp", active: pathname.startsWith("/reports") },
    { href: "/sources", icon: <Shield size={18} />, label: "Nguồn chính thức", active: pathname.startsWith("/sources") },
    { href: "/verify", icon: <CheckCircle size={18} />, label: "Tầng kiểm chứng", active: pathname.startsWith("/verify") },
    { href: "/graph", icon: <GitBranch size={18} />, label: "Knowledge Graph", active: pathname.startsWith("/graph") },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-[#eef0f5] bg-white px-[13px] pt-[23px] pb-[18px] text-[#526075]">
      <div className="flex items-center gap-[13px] px-[7px] pb-[27px]">
        <span className="grid h-[47px] w-[47px] place-items-center rounded-[11px] bg-linear-145 from-[#ff3aac] to-[#ad19d5] font-[Georgia] text-[26px] font-bold text-white shadow-[0_8px_18px_#d926a744]">
          L
        </span>
        <div>
          <strong className="block text-[19px] font-[750] text-[#131c31]">Legal Radar</strong>
          <small className="mt-[4px] block text-[10px] text-[#9a9fb0]">TRUNG TÂM GIÁM SÁT</small>
        </div>
      </div>
      <nav aria-label="Điều hướng chính" className="grid gap-2 pt-1">
        {items.map((item) => (
          <NavLink key={item.href} href={item.href} active={item.active}>
            <NavIcon active={item.active}>{item.icon}</NavIcon> {item.label}
            {item.count !== undefined && (
              <b className="ml-auto rounded-[10px] bg-linear-145 from-[#ff3aac] to-[#ad19d5] px-[7px] py-[2px] text-[9px] text-white shadow-[0_4px_10px_#c728a733]">
                {item.count}
              </b>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto grid gap-3 max-[980px]:hidden">
        <div className="rounded-xl border border-[#e8eaf1] bg-white p-[14px] shadow-[0_5px_18px_#24304c08] max-[1200px]:hidden">
          <small className="block text-[9px] text-[#8290a6]">BÁO CÁO NHANH HÔM NAY</small>
          <span className="mt-[13px] block text-[9px] text-[#8290a6]">Claims mới hôm nay</span>{" "}
          <strong className="mt-1 block text-[22px] text-[#162039]">
            {quickReport.count}{" "}
            <em
              className={`inline-flex items-center gap-0.5 text-[10px] not-italic ${
                quickReport.change >= 0 ? "text-[#20a66e]" : "text-[#e24a5d]"
              }`}
            >
              {quickReport.change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {quickReport.change >= 0 ? "+" : ""}{quickReport.change}%
            </em>
          </strong>
          <svg viewBox="0 0 200 48" aria-hidden="true" className="mt-[5px] h-12 w-full overflow-visible">
            <polyline
              className="fill-none stroke-[#dd15aa] stroke-2"
              points={quickReport.points}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <small className="mt-1 block text-[8px] text-[#929aab]">
            Theo giờ · so với hôm qua
          </small>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl border border-[#e8eaf1] bg-white px-[14px] py-3 shadow-[0_5px_18px_#24304c08]">
          <LifeBuoy size={20} className="text-[#61718c]" />
          <div>
            <strong className="block text-[10px]">Trung tâm hỗ trợ</strong>
            <small className="mt-[3px] block text-[9px] text-[#8b97aa]">Hướng dẫn & chính sách</small>
          </div>
        </div>
        <div className="rounded-xl border border-[#e8eaf1] bg-white px-[13px] py-2.5 text-[10px] text-[#66728a] shadow-[0_5px_18px_#24304c08]">
          <i className="mr-[7px] inline-block h-[7px] w-[7px] rounded-full bg-[#42cf91] shadow-[0_0_0_3px_#42cf9120]" /> Legal
          Radar v2.4.1
          <small className="mt-[5px] ml-[14px] block text-[8px] text-[#929aab]">Hệ thống hoạt động ổn định</small>
        </div>
      </div>
    </aside>
  );
}
