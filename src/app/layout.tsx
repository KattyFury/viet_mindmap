import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VietMindmap",
  description:
    "Mindmap chuẩn từng khoảng cách – Tối ưu tiếng Việt",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${beVietnam.variable} h-full`}>
      <body className={`${beVietnam.className} h-full overflow-hidden`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
