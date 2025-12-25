"use client";

import { useQuery } from "convex/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  MessageSquarePlus,
  MessageCircle,
  Search as SearchIcon,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { api } from "../../convex/_generated/api";
import type { Provider } from "@/utils/url-safety";
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

export function Sidebar() {
  const pathname = usePathname();
  const chats = useQuery(api.chats.getUserChats);
  const { user } = useUser();
  const sidebar = useSidebar();

  const displayName =
    user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "";

  const hasChats = (chats?.length ?? 0) > 0;

  const handleNavigate = () => {
    if (sidebar.isMobile) {
      sidebar.setOpenMobile(false);
    }
  };

  return (
    <SidebarPrimitive
      collapsible="offcanvas"
      className="border-r border-sidebar-border bg-sidebar/95 text-sidebar-foreground shadow-2xl"
    >
      <SidebarHeader className="border-b border-sidebar-border/60 p-4 pb-5">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <SidebarTrigger
              aria-label="Close sidebar"
              className="h-8 w-8 border border-sidebar-border/60 text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
            />
            <div>
              <p className="text-base font-semibold tracking-tight">
                Continue AI
              </p>
            </div>
          </div>
          <Link
            href="/"
            onClick={handleNavigate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <MessageSquarePlus size={18} />
            <span>New Chat</span>
          </Link>
          <div className="relative">
            <SearchIcon
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sidebar-foreground/60"
            />
            <SidebarInput
              id="sidebar-thread-search"
              placeholder="Search your threads..."
              className="bg-sidebar-accent/30 pl-9 pr-3 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/50"
            />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-[0.3em] text-sidebar-foreground/60">
            Recent
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats?.map((chat) => {
                const isActive = pathname === `/chat/${chat._id}`;
                return (
                  <SidebarMenuItem key={chat._id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={chat.title}
                      className={cn(
                        "border border-transparent text-sm",
                        "data-[active=true]:border-sidebar-border data-[active=true]:bg-sidebar-accent/40 data-[active=true]:text-sidebar-accent-foreground"
                      )}
                    >
                      <Link
                        href={`/chat/${chat._id}`}
                        onClick={handleNavigate}
                        className="flex items-center gap-3"
                      >
                        <MessageCircle
                          size={16}
                          style={{
                            color: isActive
                              ? undefined
                              : getProviderColor(
                                  chat.source.provider as Provider
                                ),
                          }}
                        />
                        <span className="truncate">{chat.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>

            {!hasChats && (
              <p className="mt-4 rounded-xl border border-dashed border-sidebar-border/60 px-3 py-4 text-center text-xs text-sidebar-foreground/60">
                No chats yet. Import a conversation to get started.
              </p>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60 p-4">
        <div className="flex items-center gap-3">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-9 h-9",
              },
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-tight">
              {displayName || "Logged in"}
            </p>
          </div>
        </div>
      </SidebarFooter>
    </SidebarPrimitive>
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
