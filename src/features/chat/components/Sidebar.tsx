"use client";

import { useQuery } from "convex/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  MessageSquarePlus,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/utils/cn";
import { api } from "../../../../convex/_generated/api";
import type { Provider } from "@/utils/url-safety";

interface SidebarProps {
  className?: string;
  isMobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ className, isMobile, onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const chats = useQuery(api.chats.getUserChats);

  // Force expanded state on mobile
  const isCollapsed = isMobile ? false : collapsed;

  return (
    <aside
      className={cn(
        "h-full flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        isMobile ? "w-full" : isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sidebar-accent border border-sidebar-border flex items-center justify-center">
              <span className="text-sidebar-accent-foreground font-semibold text-sm">CA</span>
            </div>
            <span className="font-semibold text-sidebar-foreground">Continue AI</span>
          </Link>
        )}
        
        {isMobile ? (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-accent-foreground transition-colors"
          >
            <X size={18} />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-accent-foreground transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Link
          href="/"
          onClick={isMobile ? onClose : undefined}
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground border border-primary/20 hover:bg-primary/90 font-medium transition-colors",
            isCollapsed && "justify-center px-2"
          )}
        >
          <MessageSquarePlus size={18} />
          {!isCollapsed && <span>New</span>}
        </Link>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin scrollbar-thumb-sidebar-border scrollbar-track-transparent">
        {!isCollapsed && (
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Recent Chats
          </p>
        )}
        <div className="space-y-1">
          {chats?.map((chat) => {
            const isActive = pathname === `/chat/${chat._id}`;
            return (
              <Link
                key={chat._id}
                href={`/chat/${chat._id}`}
                onClick={isMobile ? onClose : undefined}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isCollapsed && "justify-center px-2"
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
                {!isCollapsed && (
                  <span className="truncate">{chat.title}</span>
                )}
              </Link>
            );
          })}
          {chats?.length === 0 && !isCollapsed && (
            <p className="text-xs text-muted-foreground px-3 py-4 text-center">
              No chats yet. Import a conversation to get started.
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <div
          className={cn(
            "flex items-center gap-3",
            isCollapsed && "justify-center"
          )}
        >
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
              },
            }}
          />
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

