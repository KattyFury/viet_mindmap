import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Providers } from "@/components/Providers";
import { isGoogleAuthConfigured } from "@/lib/auth";
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
  // Không set AUTH_GOOGLE_* → guest mode, ai vào cũng dùng được
  const authEnabled = isGoogleAuthConfigured;

  return (
    <html lang="vi" className={`${beVietnam.variable} h-full`}>
      <body className={`${beVietnam.className} h-full overflow-hidden`}>
        <Providers authEnabled={authEnabled}>{children}</Providers>
      </body>
    </html>
  );
}
