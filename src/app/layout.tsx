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

// GitHub Pages static export dùng basePath /viet_mindmap — icon phải kèm basePath
// (href="/mindmap.png" sẽ trỏ nhầm ra kattyfury.github.io/mindmap.png → 404)
const basePath = process.env.GITHUB_PAGES === "true" ? "/viet_mindmap" : "";
const iconUrl = `${basePath}/mindmap.png`;

export const metadata: Metadata = {
  title: "VietMindmap",
  description:
    "Mindmap chuẩn từng khoảng cách – Tối ưu tiếng Việt",
  icons: {
    icon: [
      { url: iconUrl, type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: iconUrl, type: "image/png", sizes: "512x512" },
    ],
    shortcut: iconUrl,
  },
  appleWebApp: {
    capable: true,
    title: "VietMindmap",
    statusBarStyle: "default",
  },
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
