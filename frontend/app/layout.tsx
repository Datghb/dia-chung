import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import { Sidebar } from "@/components/common/sidebar";
import { Topbar } from "@/components/common/topbar";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin", "latin-ext"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://legalshield174.openai.site"),
  title: "Địa chứng — Giám sát nội dung mạng xã hội",
  description: "Hàng đợi giám sát, kiểm chứng claim và hồ sơ căn cứ pháp luật.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Địa chứng — Giám sát nội dung mạng xã hội",
    description: "Kiểm chứng claim, điều phối xử lý và truy xuất căn cứ pháp luật.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Địa chứng — Giám sát nội dung mạng xã hội",
    description: "Kiểm chứng claim, điều phối xử lý và truy xuất căn cứ pháp luật.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className={`${geist.variable} ${mono.variable}`}>
        <Providers>
          <div className="flex min-h-screen bg-[#f7f8fc] text-[15px] text-[#19283b]">
            <Sidebar />
            <div className="ml-[248px] flex h-screen flex-1 flex-col max-[980px]:ml-[78px] max-[700px]:ml-0">
              <Topbar />
              <main className="min-h-0 flex-1 overflow-y-auto bg-[#f7f8fc]">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
