import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AppShell } from "./AppShell";

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-zinc-400">Loading...</p>
      </div>
    </div>
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Check auth at page level - more secure than proxy
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
