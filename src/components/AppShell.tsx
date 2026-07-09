"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useMindmapStore } from "@/store/mindmap-store";
import { Sidebar } from "./Sidebar";
import { MindMapCanvas } from "./MindMapCanvas";
import { IconGoogle, IconMindmap } from "./icons";
import { signIn } from "next-auth/react";

interface AppShellProps {
  authEnabled: boolean;
}

const LOCAL_KEY = "local-guest";

export function AppShell({ authEnabled }: AppShellProps) {
  const { data: session, status } = useSession();
  const hydrate = useMindmapStore((s) => s.hydrate);
  const hydrated = useMindmapStore((s) => s.hydrated);

  const email = session?.user?.email ?? null;
  const name = session?.user?.name ?? null;

  // When Google auth is configured, require sign-in.
  // When not configured (local dev), use guest storage key.
  const readyToUse = !authEnabled || !!email;
  const userKey = email ?? (authEnabled ? null : LOCAL_KEY);

  useEffect(() => {
    if (userKey) hydrate(userKey);
  }, [userKey, hydrate]);

  if (authEnabled && status === "loading") {
    return (
      <div className="flex h-full items-center justify-center bg-white text-[13px] text-[#868E96]">
        Đang tải…
      </div>
    );
  }

  if (authEnabled && !email) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white px-6">
        <div className="mb-6 text-[#111]">
          <IconMindmap size={40} />
        </div>
        <h1 className="text-[22px] font-medium tracking-tight text-[#111]">
          VietMindmap
        </h1>
        <p className="mt-2 max-w-sm text-center text-[13px] leading-relaxed text-[#868E96]">
          Mindmap chuẩn từng khoảng cách — Tối ưu tiếng Việt
        </p>
        <button
          type="button"
          onClick={() => signIn("google")}
          className="mt-8 flex items-center gap-2.5 rounded-xl border border-[#E9ECEF] bg-white px-5 py-3 text-[14px] font-medium text-[#212529] shadow-sm hover:bg-[#F8F9FA]"
        >
          <IconGoogle size={18} />
          Đăng nhập bằng Google
        </button>
      </div>
    );
  }

  if (!hydrated || !readyToUse) {
    return (
      <div className="flex h-full items-center justify-center bg-white text-[13px] text-[#868E96]">
        Đang chuẩn bị…
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0">
      <div className="hidden md:flex md:h-full">
        <Sidebar
          email={email ?? "local@vietmindmap"}
          name={name ?? "Local"}
          authEnabled={authEnabled}
        />
      </div>

      {/* Mobile: view-only notice + canvas */}
      <div className="flex min-w-0 flex-1 flex-col md:contents">
        <div className="border-b border-[#E9ECEF] bg-[#F8F9FA] px-3 py-2 text-center text-[11px] text-[#868E96] md:hidden">
          Mobile chỉ xem — dùng desktop để chỉnh sửa
        </div>
        <div className="min-h-0 min-w-0 flex-1">
          <MindMapCanvas />
        </div>
      </div>
    </div>
  );
}
