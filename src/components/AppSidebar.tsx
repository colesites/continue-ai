"use client";

import { useQuery } from "convex/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { MessageSquarePlus, MessageCircle, PanelLeft, Search } from "lucide-react";
import { cn } from "@/utils/cn";
import { api } from "../../convex/_generated/api";
import type { Provider } from "@/utils/url-safety";

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export function Sidebar({ className, onClose }: SidebarProps) {
  const pathname = usePathname();
  const chats = useQuery(api.chats.getUserChats);
  const { user } = useUser();
  const displayName =
    user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "";

  const hasChats = (chats?.length ?? 0) > 0;

  return (
    <aside
      className={cn(
        "h-full flex flex-col border-r border-sidebar-border bg-sidebar/95 text-sidebar-foreground shadow-2xl",
        className
      )}
    >
      <div className="px-5 py-4 border-b border-sidebar-border/60">
        <div className="relative flex items-center justify-center">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute left-0 p-1.5 rounded-lg border border-sidebar-border/50 bg-sidebar/60 hover:bg-sidebar-accent/40 transition-colors"
              aria-label="Close sidebar"
            >
              <PanelLeft size={16} />
            </button>
          )}
          <span className="text-base font-semibold tracking-tight text-center">
            Continue AI
          </span>
        </div>
      </div>

      <div className="px-5 py-4 border-b border-sidebar-border/60 space-y-3">
        <Link
          href="/"
          onClick={onClose}
          className={cn(
            "w-full inline-flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary text-primary-foreground px-4 py-2.5 font-medium tracking-tight transition-all hover:bg-primary/90"
          )}
        >
          <MessageSquarePlus size={18} />
          <span>New Chat</span>
        </Link>
        <label className="sr-only" htmlFor="sidebar-thread-search">
          Search your threads
        </label>
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-sidebar-foreground/60"
          />
          <input
            id="sidebar-thread-search"
            placeholder="Search your threads..."
            className="w-full rounded-xl border border-sidebar-border/70 bg-sidebar-accent/20 py-2.5 pl-9 pr-3 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 scrollbar-thin scrollbar-thumb-sidebar-border scrollbar-track-transparent">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/50 px-2 mb-3">
            Recent
          </p>
          <div className="space-y-1.5">
            {chats?.map((chat) => {
              const isActive = pathname === `/chat/${chat._id}`;
              return (
                <Link
                  key={chat._id}
                  href={`/chat/${chat._id}`}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors border",
                    isActive
                      ? "border-sidebar-border bg-sidebar-accent/40 text-sidebar-accent-foreground shadow-inner"
                      : "border-transparent text-sidebar-foreground/70 hover:border-sidebar-border/70 hover:bg-sidebar-accent/30 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <MessageCircle
                    size={16}
                    style={{
                      color: isActive
                        ? undefined
                        : getProviderColor(chat.source.provider as Provider),
                    }}
                  />
                  <span className="truncate">{chat.title}</span>
                </Link>
              );
            })}
          </div>
          {!hasChats && (
            <p className="text-xs text-sidebar-foreground/60 px-2 py-4 text-center border border-dashed border-sidebar-border/60 rounded-xl">
              No chats yet. Import a conversation to get started.
            </p>
          )}
        </div>
      </div>

      <div className="px-5 py-4 border-t border-sidebar-border/60">
        <div className="flex items-center gap-3">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-9 h-9",
              },
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-tight truncate">
              {displayName || "Logged in"}
            </p>
            <p className="text-xs text-sidebar-foreground/60">Workspace</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function getProviderColor(provider: Provider): string {
  const colors: Record<Provider, string> = {
    chatgpt: "#10a37f",
    gemini: "#4285f4",
    claude: "#cc785c",
    perplexity: "#20b8cd",
    grok: "#ffffff",
    unknown: "#6b7280",
  };
  return colors[provider];
}
