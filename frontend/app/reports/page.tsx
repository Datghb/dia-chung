"use client";

import { useQueueQuery } from "@/hooks/use-queries";
import { ArrowLeftRight } from "lucide-react";

export default function ReportsPage() {
  const { data: allItems = [], isLoading } = useQueueQuery();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1640px] px-[28px] pt-[25px] pb-8 max-[700px]:px-[15px] max-[700px]:pt-[26px] max-[700px]:pb-6">
        <div style={{ padding: "100px", textAlign: "center" }}>Đang tải báo cáo...</div>
      </div>
    );
  }

  const total = allItems.length;
  const dung = allItems.filter((i) => i.verdict === "Đúng").length;
  const hieuLam = allItems.filter((i) => i.verdict === "Hiểu lầm").length;
  const canKC = allItems.filter((i) => i.verdict === "Cần kiểm chứng").length;
  const open = allItems.filter((i) => i.status !== "Đã xử lý").length;

  const hieuLamItems = allItems.filter((i) => i.verdict === "Hiểu lầm");
  const reasonTexts = hieuLamItems.map((i) => i.reason.toLowerCase());
  const countPattern = (patterns: RegExp[]) =>
    reasonTexts.filter((r) => patterns.some((p) => p.test(r))).length;
  const nhầmChủThể = countPattern([
    /chủ thể.*tổ chức.*cá nhân|tổ chức.*cá nhân.*chủ thể|gán.*tổ chức.*cá nhân|cá nhân.*tổ chức/i,
  ]);
  const nhầmNĐ15 = countPattern([/nđ15|nđ 15|15\/2020|hết hiệu lực|quy định cũ/i]);
  const nhầmKhoản = countPattern([
    /khoản 1.*khoản 2|khoản 2.*khoản 1|k1.*k2|k2.*k1|nhầm khoản/i,
  ]);
  const otherHieuLam = Math.max(0, hieuLam - nhầmChủThể - nhầmNĐ15 - nhầmKhoản);

  const platforms = ["Facebook", "TikTok", "YouTube", "Web", "Forum"] as const;
  const platformCounts = platforms.map((p) => ({
    platform: p,
    count: allItems.filter((i) => i.platform === p).length,
  }));

  return (
    <div className="mx-auto max-w-[1640px] px-[28px] pt-[25px] pb-8 max-[700px]:px-[15px] max-[700px]:pt-[26px] max-[700px]:pb-6">
      <div className="mb-[18px] flex items-center justify-between gap-[25px] max-[700px]:flex-col max-[700px]:items-start">
        <div>
          <span className="text-[10px] font-extrabold tracking-[1.5px] text-[#c01cad]">BÁO CÁO</span>
          <h1 className="my-[6px] text-[38px] font-[760] tracking-[-1.6px] text-[#202944] max-[480px]:text-[31px]">Báo cáo tổng hợp</h1>
          <p className="m-0 text-[12px] text-[#738195]">Tổng hợp kết quả phân tích AI trên tất cả hồ sơ giám sát.</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-[17px] bg-white shadow-[0_10px_30px_#28304f0b,0_2px_7px_#28304f08] max-[700px]:rounded-[14px]" style={{ marginBottom: 24 }}>
        <div className="grid grid-cols-4 gap-4 p-6 max-[760px]:grid-cols-2 max-[480px]:gap-2 max-[480px]:p-3">
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{total}</div>
            <small>Tổng hồ sơ</small>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#22c55e" }}>{dung}</div>
            <small>Đúng</small>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#f97316" }}>{hieuLam}</div>
            <small>Hiểu lầm</small>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#eab308" }}>{canKC}</div>
            <small>Cần kiểm chứng</small>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[17px] bg-white shadow-[0_10px_30px_#28304f0b,0_2px_7px_#28304f08] max-[700px]:rounded-[14px]" style={{ marginBottom: 24 }}>
        <div style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 12 }}>Top hiểu lầm lặp lại</h3>
          <div className="overflow-x-auto"><table className="w-full min-w-[520px] border-collapse">
            <thead>
              <tr>
                <th className="border-b border-[#eff1f5] bg-[#fafbfe] px-3 py-2.5 text-left text-[8px] font-[650] tracking-[.55px] text-[#989dae]">STT</th>
                <th className="border-b border-[#eff1f5] bg-[#fafbfe] px-3 py-2.5 text-left text-[8px] font-[650] tracking-[.55px] text-[#989dae]">NHÓM HIỂU LẦM</th>
                <th className="border-b border-[#eff1f5] bg-[#fafbfe] px-3 py-2.5 text-left text-[8px] font-[650] tracking-[.55px] text-[#989dae]">SỐ LẦN</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-b border-[#f0f1f5] px-3 py-[11px] align-middle text-[10px] text-[#445468]">1</td>
                <td className="border-b border-[#f0f1f5] px-3 py-[11px] align-middle text-[10px] text-[#445468]">Nhầm chủ thể tổ chức <ArrowLeftRight size={12} className="inline align-[-1px]" /> cá nhân</td>
                <td className="border-b border-[#f0f1f5] px-3 py-[11px] align-middle text-[10px] text-[#445468]">{nhầmChủThể}</td>
              </tr>
              <tr>
                <td className="border-b border-[#f0f1f5] px-3 py-[11px] align-middle text-[10px] text-[#445468]">2</td>
                <td className="border-b border-[#f0f1f5] px-3 py-[11px] align-middle text-[10px] text-[#445468]">Nhầm quy định cũ NĐ15/2020</td>
                <td className="border-b border-[#f0f1f5] px-3 py-[11px] align-middle text-[10px] text-[#445468]">{nhầmNĐ15}</td>
              </tr>
              <tr>
                <td className="border-b border-[#f0f1f5] px-3 py-[11px] align-middle text-[10px] text-[#445468]">3</td>
                <td className="border-b border-[#f0f1f5] px-3 py-[11px] align-middle text-[10px] text-[#445468]">Nhầm khoản k1 <ArrowLeftRight size={12} className="inline align-[-1px]" /> k2 Điều 95</td>
                <td className="border-b border-[#f0f1f5] px-3 py-[11px] align-middle text-[10px] text-[#445468]">{nhầmKhoản}</td>
              </tr>
              {otherHieuLam > 0 && (
                <tr>
                  <td className="border-b border-[#f0f1f5] px-3 py-[11px] align-middle text-[10px] text-[#445468]">4</td>
                  <td className="border-b border-[#f0f1f5] px-3 py-[11px] align-middle text-[10px] text-[#445468]">Hiểu lầm khác</td>
                  <td className="border-b border-[#f0f1f5] px-3 py-[11px] align-middle text-[10px] text-[#445468]">{otherHieuLam}</td>
                </tr>
              )}
            </tbody>
          </table></div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[17px] bg-white shadow-[0_10px_30px_#28304f0b,0_2px_7px_#28304f08] max-[700px]:rounded-[14px]" style={{ marginBottom: 24 }}>
        <div style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 12 }}>Phân bổ theo nền tảng</h3>
          <div className="overflow-x-auto"><table className="w-full min-w-[430px] border-collapse">
            <thead>
              <tr>
                <th className="border-b border-[#eff1f5] bg-[#fafbfe] px-3 py-2.5 text-left text-[8px] font-[650] tracking-[.55px] text-[#989dae]">NỀN TẢNG</th>
                <th className="border-b border-[#eff1f5] bg-[#fafbfe] px-3 py-2.5 text-left text-[8px] font-[650] tracking-[.55px] text-[#989dae]">SỐ LƯỢNG</th>
                <th className="border-b border-[#eff1f5] bg-[#fafbfe] px-3 py-2.5 text-left text-[8px] font-[650] tracking-[.55px] text-[#989dae]">TỈ LỆ</th>
              </tr>
            </thead>
            <tbody>
              {platformCounts
                .filter((p) => p.count > 0)
                .sort((a, b) => b.count - a.count)
                .map((p) => (
                  <tr key={p.platform}>
                    <td className="border-b border-[#f0f1f5] px-3 py-[11px] align-middle text-[10px] text-[#445468]">{p.platform === "Web" ? "Báo chí" : p.platform === "Forum" ? "Khác" : p.platform}</td>
                    <td className="border-b border-[#f0f1f5] px-3 py-[11px] align-middle text-[10px] text-[#445468]">{p.count}</td>
                    <td className="border-b border-[#f0f1f5] px-3 py-[11px] align-middle text-[10px] text-[#445468]">{total ? Math.round((p.count / total) * 100) : 0}%</td>
                  </tr>
                ))}
            </tbody>
          </table></div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[17px] bg-white shadow-[0_10px_30px_#28304f0b,0_2px_7px_#28304f08] max-[700px]:rounded-[14px]">
        <div style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 4 }}>Hồ sơ đang mở: {open}</h3>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>
            Báo cáo được tính trực tiếp từ dữ liệu hàng đợi hiện đang hiển thị.
          </p>
        </div>
      </section>
    </div>
  );
}
