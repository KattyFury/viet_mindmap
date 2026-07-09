"use client";

import { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useMindmapStore } from "@/store/mindmap-store";
import { Sidebar } from "./Sidebar";
import { MindMapCanvas } from "./MindMapCanvas";
import { IconGoogle, IconMindmap } from "./icons";

interface AppShellProps {
  authEnabled: boolean;
}

const LOCAL_KEY = "local-guest";

function Loading({ label = "Đang tải…" }: { label?: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-white text-[13px] text-[#868E96]">
      {label}
    </div>
  );
}

function AppWorkspace({
  email,
  name,
  authEnabled,
}: {
  email: string;
  name: string;
  authEnabled: boolean;
}) {
  const hydrate = useMindmapStore((s) => s.hydrate);
  const hydrated = useMindmapStore((s) => s.hydrated);
  const userKey = authEnabled ? email : LOCAL_KEY;

  useEffect(() => {
    hydrate(userKey);
  }, [userKey, hydrate]);

  if (!hydrated) {
    return <Loading label="Đang chuẩn bị…" />;
  }

  return (
    <div className="flex h-full min-h-0">
      <div className="hidden md:flex md:h-full">
        <Sidebar email={email} name={name} authEnabled={authEnabled} />
      </div>

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

/** Guest / public web — không cần SessionProvider, không đăng nhập */
function AppShellGuest() {
  return (
    <AppWorkspace
      email="local@vietmindmap"
      name="Local"
      authEnabled={false}
    />
  );
}

/** Google auth bật — bắt đăng nhập */
function AppShellAuth() {
  const { data: session, status } = useSession();
  const email = session?.user?.email ?? null;
  const name = session?.user?.name ?? null;

  if (status === "loading") {
    return <Loading />;
  }

  if (!email) {
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

  return (
    <AppWorkspace
      email={email}
      name={name ?? "User"}
      authEnabled={true}
    />
  );
}

export function AppShell({ authEnabled }: AppShellProps) {
  if (authEnabled) return <AppShellAuth />;
  return <AppShellGuest />;
}
