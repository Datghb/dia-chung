import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin", "latin-ext"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://legalshield174.openai.site"),
  title: "Legal Radar — Giám sát nội dung mạng xã hội",
  description: "Hàng đợi giám sát, kiểm chứng claim và hồ sơ căn cứ pháp luật.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Legal Radar — Giám sát nội dung mạng xã hội",
    description: "Kiểm chứng claim, điều phối xử lý và truy xuất căn cứ pháp luật.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Legal Radar — Giám sát nội dung mạng xã hội",
    description: "Kiểm chứng claim, điều phối xử lý và truy xuất căn cứ pháp luật.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className={`${geist.variable} ${mono.variable}`}>{children}</body>
    </html>
  );
}
