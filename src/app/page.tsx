import { AppShell } from "@/components/AppShell";
import { isGoogleAuthConfigured } from "@/lib/auth";

export default function Home() {
  return (
    <main className="h-full">
      <AppShell authEnabled={isGoogleAuthConfigured} />
    </main>
  );
}
