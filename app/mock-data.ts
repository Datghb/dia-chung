import type { Alert, Claim } from "./types";

export const verdictCopy = {
  SUPPORTED: "Có nguồn chính thức phù hợp với nội dung claim.",
  CONTRADICTED: "Claim mâu thuẫn với nguồn chính thức được tìm thấy.",
  MISSING_CONTEXT: "Nội dung có một phần đúng nhưng thiếu điều kiện hoặc bối cảnh quan trọng.",
  INSUFFICIENT_EVIDENCE: "Chưa tìm thấy đủ nguồn đáng tin cậy để đánh giá.",
};

const topics = ["Ngân hàng X", "Bộ Y tế", "Dịch vụ công", "Tập đoàn Năng lượng", "Cơ quan Thuế", "Quỹ Bảo hiểm"];
const statements = [
  "sắp phá sản và người dân phải rút tiền ngay",
  "đã dừng toàn bộ dịch vụ từ hôm nay",
  "thay đổi chính sách nhưng không thông báo",
  "thu thêm phí bắt buộc từ tháng này",
  "đã bị cơ quan quản lý đình chỉ hoạt động",
];
const verdicts = ["CONTRADICTED", "MISSING_CONTEXT", "INSUFFICIENT_EVIDENCE", "SUPPORTED"] as const;
const risks = ["HIGH", "MEDIUM", "LOW", "MEDIUM"] as const;

export const claims: Claim[] = Array.from({ length: 30 }, (_, i) => ({
  id: `CL-${String(i + 1).padStart(3, "0")}`,
  text: i === 0 ? "Ngân hàng X sắp phá sản." : `${topics[i % topics.length]} ${statements[i % statements.length]}.`,
  entity: topics[i % topics.length],
  verdict: verdicts[i % 4],
  risk: i === 0 ? "HIGH" : risks[i % 4],
  confidence: [94, 81, 62, 89][i % 4],
  provision: ["Điểm c khoản 2 Điều 95", "Điểm a khoản 1 Điều 95", "Khoản 3 Điều 95"][i % 3],
  source: ["Ngân hàng Nhà nước Việt Nam", "Cổng Thông tin điện tử Chính phủ", "Cơ sở dữ liệu quốc gia về VBPL"][i % 3],
}));

export const posts = Array.from({ length: 20 }, (_, i) => ({
  id: `POST-${String(i + 1).padStart(3, "0")}`,
  platform: ["Facebook", "TikTok", "YouTube", "X", "Forum"][i % 5],
  content: claims[i].text,
  interactions: 1240 + i * 387,
  detectedAt: `${String(14 + (i % 4)).padStart(2, "0")}/07/2026 · ${String(8 + (i % 9)).padStart(2, "0")}:30`,
}));

export const sources = Array.from({ length: 10 }, (_, i) => ({
  id: `SRC-${i + 1}`,
  name: ["Thông cáo hoạt động Ngân hàng X", "Thông tin điều hành thị trường", "Cổng dữ liệu văn bản pháp luật", "Báo cáo giám sát hệ thống"][i % 4],
  agency: ["Ngân hàng Nhà nước Việt Nam", "Cổng Thông tin điện tử Chính phủ", "Bộ Tư pháp", "Cơ quan Thanh tra"][i % 4],
  date: `${String(8 + i).padStart(2, "0")}/07/2026`,
  reliability: 96 - i,
}));

export const provisions = Array.from({ length: 6 }, (_, i) => ({
  id: `P-${i + 1}`,
  article: "Điều 95",
  clause: `Khoản ${(i % 3) + 1}`,
  point: `Điểm ${String.fromCharCode(97 + (i % 3))}`,
  subject: i % 2 ? "Tổ chức" : "Cá nhân",
  penalty: i % 2 ? "20–30 triệu đồng (tham khảo)" : "10–15 triệu đồng (tham khảo)",
}));

export const alerts: Alert[] = Array.from({ length: 8 }, (_, i) => ({
  id: `ALT-${String(i + 1).padStart(3, "0")}`,
  claim: claims[i].text,
  platform: posts[i].platform,
  reach: `${(12.4 + i * 6.3).toFixed(1)}K`,
  score: 91 - i * 5,
  reason: ["Tốc độ lan truyền tăng 340% trong 2 giờ", "Nhắc đến tổ chức có phạm vi ảnh hưởng lớn", "Mâu thuẫn với thông tin chính thức", "Thiếu điều kiện áp dụng quan trọng"][i % 4],
  provision: claims[i].provision,
  owner: ["Minh Anh", "Chưa phân công", "Hoàng Nam"][i % 3],
  status: ["New", "Reviewing", "Resolved", "Dismissed"][i % 4] as Alert["status"],
}));

export const trend = [
  { day: "11/07", values: [18, 12, 9, 16] }, { day: "12/07", values: [22, 15, 11, 18] },
  { day: "13/07", values: [20, 19, 14, 21] }, { day: "14/07", values: [31, 17, 16, 19] },
  { day: "15/07", values: [29, 24, 18, 22] }, { day: "16/07", values: [41, 28, 19, 25] },
  { day: "17/07", values: [52, 31, 23, 29] },
];
