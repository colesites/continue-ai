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
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/utils/cn";
import { api } from "../../../../convex/_generated/api";
import type { Provider } from "@/utils/url-safety";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const chats = useQuery(api.chats.getUserChats);

  return (
    <aside
      className={cn(
        "h-screen flex flex-col border-r border-zinc-800 bg-zinc-950/80 backdrop-blur transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">CA</span>
            </div>
            <span className="font-semibold text-white">Continue AI</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-lg bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800 font-medium transition-colors",
            collapsed && "justify-center px-2"
          )}
        >
          <MessageSquarePlus size={18} />
          {!collapsed && <span>New</span>}
        </Link>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {!collapsed && (
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider px-3 mb-2">
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
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-zinc-900 text-white border border-zinc-800"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white",
                  collapsed && "justify-center px-2"
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
                {!collapsed && (
                  <span className="truncate">{chat.title}</span>
                )}
              </Link>
            );
          })}
          {chats?.length === 0 && !collapsed && (
            <p className="text-xs text-zinc-600 px-3 py-4 text-center">
              No chats yet. Import a conversation to get started.
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-800">
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center"
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

