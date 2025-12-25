"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { Plus, Search } from "lucide-react";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { api } from "../../../convex/_generated/api";
import { Sidebar as AppSidebar } from "@/components/Sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/utils/cn";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);

  useEffect(() => {
    if (isLoaded && user) {
      getOrCreateUser({
        clerkUserId: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? "",
        name: user.fullName ?? undefined,
        imageUrl: user.imageUrl ?? undefined,
      });
    }
  }, [isLoaded, user, getOrCreateUser]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <ShellLayout>{children}</ShellLayout>
    </SidebarProvider>
  );
}

function ShellLayout({ children }: { children: ReactNode }) {
  const { isMobile, open, openMobile, setOpenMobile, setOpen } = useSidebar();

  const toolbarButtonClasses =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition-colors hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40";

  const focusSidebarSearch = () => {
    const input = document.getElementById(
      "sidebar-thread-search"
    ) as HTMLInputElement | null;
    if (!input) return;
    input.focus();
    const valueLength = input.value.length;
    input.setSelectionRange(valueLength, valueLength);
  };

  const handleSearchClick = () => {
    if (isMobile && !openMobile) {
      setOpenMobile(true);
      window.setTimeout(focusSidebarSearch, 220);
    } else {
      setOpen(true);
      window.requestAnimationFrame(focusSidebarSearch);
    }
  };

  const handleNewChatClick = () => {
    if (isMobile && openMobile) {
      setOpenMobile(false);
    }
  };

  const hideTriggerGroup = open || openMobile;

  return (
    <>
      <AppSidebar />
      <SidebarInset className="bg-zinc-950">
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-2 z-40 pl-2 pointer-events-none">
            <div className="flex h-12 items-center">
              <div
                className={cn(
                  "pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/10 bg-black/60 p-1 text-white shadow-lg backdrop-blur",
                  hideTriggerGroup && "pointer-events-none opacity-0 scale-95"
                )}
                aria-hidden={hideTriggerGroup}
              >
                <SidebarTrigger
                  className={cn(toolbarButtonClasses, "border border-white/10")}
                />
                <button
                  type="button"
                  onClick={handleSearchClick}
                  className={toolbarButtonClasses}
                  aria-label="Search chats"
                >
                  <Search className="size-4" />
                </button>
                <Link
                  href="/"
                  className={toolbarButtonClasses}
                  aria-label="Start new chat"
                  onClick={handleNewChatClick}
                >
                  <Plus className="size-4" />
                </Link>
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </SidebarInset>
    </>
  );
}
