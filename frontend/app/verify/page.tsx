"use client";

import { useVerifyQuery } from "@/hooks/use-queries";
import { Check, ExternalLink } from "lucide-react";

export default function VerifyPage() {
  const { data: cases = [], isLoading, isSuccess } = useVerifyQuery();

  const pageShell =
    "mx-auto max-w-[1640px] px-[28px] pt-[25px] pb-8 max-[700px]:px-[15px] max-[700px]:pt-[26px] max-[700px]:pb-6";
  const colLabel = "text-[9px] tracking-[.8px] text-[#9a7b98]";
  const dlRow = "grid grid-cols-[130px_1fr] gap-2 border-t border-[#f0f1f5] py-2 text-[11px] max-[480px]:grid-cols-1";

  if (isLoading) {
    return (
      <div className={pageShell}>
        <div style={{ padding: "100px", textAlign: "center" }}>Đang tải dữ liệu kiểm chứng...</div>
      </div>
    );
  }

  return (
    <div className={pageShell}>
      <div className="mb-[18px] flex items-center justify-between gap-[25px] max-[700px]:flex-col max-[700px]:items-start">
        <div>
          <span className="text-[10px] font-extrabold tracking-[1.5px] text-[#c01cad]">ĐỐI CHIẾU THỰC TẾ</span>
          <h1 className="my-[6px] text-[38px] font-[760] tracking-[-1.6px] text-[#202944] max-[480px]:text-[31px]">
            Tầng kiểm chứng
          </h1>
          <p className="m-0 text-[12px] text-[#738195]">
            So sánh kết quả hệ thống với các quyết định xử phạt đã được công bố.
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-[7px] rounded-[11px] px-[13px] py-2.5 text-[11px] font-bold ${
            isSuccess ? "bg-[#e9f8f2] text-[#26795d]" : "bg-[#fff4df] text-[#956717]"
          }`}
        >
          <i className={`h-[7px] w-[7px] rounded-full ${isSuccess ? "bg-[#36a77c]" : "bg-[#d59b31]"}`} />
          {isSuccess ? `${cases.length} study case từ API` : "Đang chờ Backend API"}
        </div>
      </div>
      {!cases.length ? (
        <section className="rounded-[17px] bg-white p-[60px] text-center shadow-[0_10px_30px_#28304f0b,0_2px_7px_#28304f08]">
          <strong className="text-[18px] text-[#3f485d]">Chưa tải được study case</strong>
          <p className="text-[12px] text-[#858e9d]">Khởi động backend tại cổng 8000 để xem dữ liệu kiểm chứng thật.</p>
        </section>
      ) : (
        <div className="grid gap-[17px]">
          {cases.map((item) => (
            <article
              className="overflow-hidden rounded-[17px] bg-white shadow-[0_10px_30px_#28304f0b,0_2px_7px_#28304f08]"
              key={item.id}
            >
              <header className="flex justify-between gap-5 border-b border-[#eff1f5] px-[23px] py-[21px] max-[760px]:flex-col">
                <div>
                  <small className={colLabel}>
                    {item.id} · {item.ngay_quyet_dinh}
                  </small>
                  <h2 className="my-[5px] text-[18px] text-[#293149]">{item.ten_vu}</h2>
                  <p className="m-0 text-[11px] text-[#828b99]">{item.nguon_cong_bo}</p>
                </div>
                <span className="self-start rounded-[9px] bg-[#e9f8f2] px-2.5 py-[7px] text-[9px] font-extrabold text-[#287c61]">
                  KHỚP CASE THẬT
                </span>
              </header>
              <div className="grid grid-cols-2 max-[760px]:grid-cols-1">
                <div className="px-[23px] py-[21px]">
                  <small className={colLabel}>HÀNH VI THỰC TẾ</small>
                  <p className="text-[12px] leading-[1.55] text-[#606b7e]">{item.hanh_vi}</p>
                  <dl className="mt-3.5 mb-0">
                    <div className={dlRow}>
                      <dt className="text-[#8992a0]">Chủ thể</dt>
                      <dd className="m-0 font-[650] text-[#3e495e]">{item.chu_the}</dd>
                    </div>
                    <div className={dlRow}>
                      <dt className="text-[#8992a0]">Mức phạt thực tế</dt>
                      <dd className="m-0 font-[650] text-[#3e495e]">
                        {item.muc_phat.toLocaleString("vi-VN")} đồng
                      </dd>
                    </div>
                    <div className={dlRow}>
                      <dt className="text-[#8992a0]">Điều khoản viện dẫn</dt>
                      <dd className="m-0 font-[650] text-[#3e495e]">{item.dieu_khoan_vien_dan}</dd>
                    </div>
                  </dl>
                </div>
                <div className="border-l border-[#eff1f5] bg-[#fcf9fd] px-[23px] py-[21px] max-[760px]:border-t max-[760px]:border-l-0">
                  <small className={colLabel}>KỲ VỌNG HỆ THỐNG</small>
                  <p className="inline-block rounded-lg bg-[#e9f8f2] px-[9px] py-1.5 text-[12px] font-extrabold text-[#287d61]">
                    <Check size={14} className="mr-1 inline align-[-1px]" /> {item.expected_he_thong.nhan}
                  </p>
                  <strong className="block text-[13px] leading-[1.45] text-[#a925a6]">
                    {item.expected_he_thong.dieu_khoan_moi}
                  </strong>
                  <p className="text-[12px] leading-[1.55] text-[#606b7e]">{item.expected_he_thong.ghi_chu}</p>
                </div>
              </div>
              <footer className="flex justify-between gap-[15px] bg-[#f8f9fc] px-[23px] py-[13px] text-[10px] text-[#747f91] max-[760px]:flex-col">
                <span>Biện pháp: {item.bien_phap_khac_phuc}</span>
                <a
                  className="text-[#aa20a4] no-underline max-[760px]:self-start"
                  href={item.nguon_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Mở nguồn công bố <ExternalLink size={12} className="inline align-[-1px]" />
                </a>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
