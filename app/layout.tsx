import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin", "latin-ext"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://legalshield174.openai.site"),
  title: "LegalShield 174 — Legal Intelligence",
  description: "Nền tảng kiểm chứng claim, ánh xạ điều khoản và ưu tiên rủi ro cần chuyên gia xử lý.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "LegalShield 174 — Legal Intelligence",
    description: "Kiểm chứng claim · Ánh xạ điều khoản · Ưu tiên human review",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LegalShield 174 — Legal Intelligence",
    description: "Kiểm chứng claim · Ánh xạ điều khoản · Ưu tiên human review",
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
