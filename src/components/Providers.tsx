"use client";

import { SessionProvider } from "next-auth/react";

interface ProvidersProps {
  children: React.ReactNode;
  /** Chỉ bọc SessionProvider khi Google auth được cấu hình */
  authEnabled?: boolean;
}

export function Providers({
  children,
  authEnabled = false,
}: ProvidersProps) {
  if (!authEnabled) return <>{children}</>;
  return <SessionProvider>{children}</SessionProvider>;
}
