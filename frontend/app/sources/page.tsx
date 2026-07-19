export default function SourcesPage() {
  const sources = [
    {
      tier: 0,
      name: "Ngân hàng Nhà nước (SBV)",
      domain: "sbv.gov.vn",
      desc: "Cơ quan quản lý ngân hàng — thẩm quyền xác nhận/bác bỏ tin đồn tài chính",
    },
    {
      tier: 0,
      name: "Bộ Y tế",
      domain: "moh.gov.vn",
      desc: "Cơ quan phát ngôn về dịch bệnh, y tế công cộng",
    },
    {
      tier: 0,
      name: "Bộ Công an",
      domain: "bocongan.gov.vn",
      desc: "Cơ quan phát ngôn về an ninh, trật tự",
    },
    {
      tier: 0,
      name: "Cổng TTĐT Chính phủ",
      domain: "chinhphu.vn",
      desc: "Công bộ chính sách, quyết định chính thức",
    },
    {
      tier: 1,
      name: "TTXVN",
      domain: "baotintuc.vn",
      desc: "Thông tấn xã — nguồn tin chính thống quốc gia",
    },
    { tier: 1, name: "VTV", domain: "vtv.vn", desc: "Đài Truyền hình Việt Nam" },
    { tier: 1, name: "Nhân Dân", domain: "nhandan.vn", desc: "Cơ quan ngôn luận của Đảng" },
    {
      tier: 2,
      name: "VnExpress",
      domain: "vnexpress.net",
      desc: "Báo lớn — corroboration, không đơn phương quyết định",
    },
    { tier: 2, name: "Tuổi Trẻ", domain: "tuoitre.vn", desc: "Báo lớn — corroboration" },
    { tier: 2, name: "Thanh Niên", domain: "thanhnien.vn", desc: "Báo lớn — corroboration" },
  ];

  return (
    <div className="mx-auto max-w-[1640px] px-[28px] pt-[25px] pb-8 max-[700px]:px-[15px] max-[700px]:pt-[26px] max-[700px]:pb-6">
      <div className="mb-[18px] flex items-center justify-between gap-[25px] max-[700px]:flex-col max-[700px]:items-start">
        <div>
          <span className="text-[10px] font-extrabold tracking-[1.5px] text-[#c01cad]">NGUỒN TIN</span>
          <h1 className="my-[6px] text-[38px] font-[760] tracking-[-1.6px] text-[#202944] max-[480px]:text-[31px]">Nguồn chính thức</h1>
          <p className="m-0 text-[12px] text-[#738195]">
            Danh sách whitelist nguồn tin theo tầng thẩm quyền — hệ thống chỉ dùng các nguồn này để xác minh nội
            dung.
          </p>
        </div>
      </div>

      {[0, 1, 2].map((tier) => (
        <section key={tier} className="overflow-hidden rounded-[17px] bg-white shadow-[0_10px_30px_#28304f0b,0_2px_7px_#28304f08] max-[700px]:rounded-[14px]" style={{ marginBottom: 24 }}>
          <div className="p-6 max-[700px]:p-4">
            <h3 style={{ marginBottom: 4 }}>
              Tier {tier}:{" "}
              {tier === 0
                ? "Cơ quan chính phủ (1 mình đủ)"
                : tier === 1
                ? "Báo chí chính thống (cần ≥2 độc lập)"
                : "Báo lớn (chỉ corroboration)"}
            </h3>
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16 }}>
              {tier === 0
                ? "Một mình Tier 0 xác nhận/bác bỏ là đủ — không cần nguồn khác."
                : tier === 1
                ? "Cần ≥2 nguồn Tier 1/2 độc lập xác nhận. Bác bỏ hợp lệ khi dẫn lời Tier 0."
                : "Chỉ dùng để bổ sung — không đơn phương quyết định."}
            </p>
            <div className="overflow-x-auto"><table className="w-full min-w-[620px] border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-[#eff1f5] bg-[#fafbfe] px-3 py-2.5 text-left text-[8px] font-[650] tracking-[.55px] text-[#989dae]">TÊN</th>
                  <th className="border-b border-[#eff1f5] bg-[#fafbfe] px-3 py-2.5 text-left text-[8px] font-[650] tracking-[.55px] text-[#989dae]">DOMAIN</th>
                  <th className="border-b border-[#eff1f5] bg-[#fafbfe] px-3 py-2.5 text-left text-[8px] font-[650] tracking-[.55px] text-[#989dae]">MÔ TẢ</th>
                </tr>
              </thead>
              <tbody>
                {sources
                  .filter((s) => s.tier === tier)
                  .map((s) => (
                    <tr key={s.domain}>
                      <td className="border-b border-[#f0f1f5] px-3 py-[11px] align-middle text-[10px] text-[#445468]">
                        <strong className="block text-[11px] leading-[1.4] text-[#26384d]">{s.name}</strong>
                      </td>
                      <td className="border-b border-[#f0f1f5] px-3 py-[11px] align-middle text-[10px] text-[#445468]">
                        <code className="font-(family-name:--font-mono) text-[9px]">{s.domain}</code>
                      </td>
                      <td className="border-b border-[#f0f1f5] px-3 py-[11px] align-middle text-[10px] text-[#445468]">{s.desc}</td>
                    </tr>
                  ))}
              </tbody>
            </table></div>
          </div>
        </section>
      ))}
    </div>
  );
}
