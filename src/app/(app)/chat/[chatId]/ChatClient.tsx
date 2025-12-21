"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState, useMemo } from "react";
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { ChatMessage } from "@/features/chat/components/ChatMessage";
import { ChatInput } from "@/features/chat/components/ChatInput";
import { ImportedContext } from "@/features/chat/components/ImportedContext";
import { getDefaultModel } from "@/lib/models";

export function ChatClient() {
  const params = useParams();
  const chatId = params.chatId as Id<"chats">;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedModel, setSelectedModel] = useState(getDefaultModel().id);
  const lastSavedAssistantIdRef = useRef<string | null>(null);
  const hasSeededRef = useRef(false);

  // Fetch chat and messages from Convex
  const chat = useQuery(api.chats.getChat, { chatId });
  const dbMessages = useQuery(api.messages.getMessages, { chatId });
  const addMessage = useMutation(api.messages.addMessage);

  // Create transport with model
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { model: selectedModel },
      }),
    [selectedModel]
  );

  // AI chat hook - new v5 API
  const {
    messages: aiMessages,
    sendMessage,
    setMessages,
    status,
    error: chatError,
  } = useChat({
    transport,
    onError: (err) => {
      console.error("AI chat error:", err);
    },
  });

  // Seed the chat UI with messages from Convex so the conversation always renders,
  // and subsequent sendMessage() updates show up immediately even if Convex updates lag.
  useEffect(() => {
    if (hasSeededRef.current) return;
    if (!dbMessages) return;
    if (aiMessages.length > 0) {
      hasSeededRef.current = true;
      return;
    }

    const seededMessages: UIMessage[] = dbMessages.map((m) => ({
      id: m._id,
      role: m.role,
      parts: [{ type: "text", text: m.content }],
    }));

    hasSeededRef.current = true;
    setMessages(seededMessages);
  }, [dbMessages, aiMessages.length, setMessages]);

  const importedById = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const m of dbMessages ?? []) {
      map[m._id] = !!m.metadata?.isImported;
    }
    return map;
  }, [dbMessages]);

  // Convert DB messages to UI format for display
  const displayMessages = useMemo(() => {
    // Prefer AI SDK messages once available (includes optimistic new messages).
    if (aiMessages.length > 0) {
      return aiMessages.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.parts
          .filter(
            (part): part is { type: "text"; text: string } =>
              part.type === "text"
          )
          .map((part) => part.text)
          .join(""),
        isImported: importedById[msg.id] ?? false,
      }));
    }

    // Fallback to DB messages before the hook is seeded/ready
    return (dbMessages ?? []).map((msg) => ({
      id: msg._id,
      role: msg.role as "user" | "assistant",
      content: msg.content,
      isImported: msg.metadata?.isImported ?? false,
    }));
  }, [dbMessages, aiMessages, importedById]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages]);

  const isLoading = status === "submitted" || status === "streaming";
  const isStreaming = status === "streaming";

  const handleSend = async (content: string) => {
    // Reset saved tracking for new stream
    lastSavedAssistantIdRef.current = null;

    // First, persist user message to Convex
    await addMessage({
      chatId,
      role: "user",
      content,
    });

    // Send to AI
    sendMessage({
      text: content,
    });
  };

  // Persist assistant messages when streaming completes
  useEffect(() => {
    if (status !== "ready" || aiMessages.length === 0) return;

    const lastMessage = aiMessages[aiMessages.length - 1];
    if (lastMessage.role !== "assistant") return;

    // If the assistant message already exists in Convex (e.g., when reloading),
    // don't save it again—just mark it as seen.
    const alreadyInDb = dbMessages?.some((m) => m._id === lastMessage.id);
    if (alreadyInDb) {
      lastSavedAssistantIdRef.current = lastMessage.id;
      return;
    }

    if (lastSavedAssistantIdRef.current === lastMessage.id) return;

    const content = lastMessage.parts
      .filter(
        (part): part is { type: "text"; text: string } => part.type === "text"
      )
      .map((part) => part.text)
      .join("");

    if (content) {
      lastSavedAssistantIdRef.current = lastMessage.id;
      addMessage({
        chatId,
        role: "assistant",
        content,
        model: selectedModel,
      });
    }
  }, [status, aiMessages, dbMessages, chatId, addMessage, selectedModel]);

  if (chat === undefined || dbMessages === undefined) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (chat === null) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <p className="text-zinc-400 mb-4">Chat not found</p>
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Import
        </Link>
      </div>
    );
  }

  // Count imported messages
  const importedMessageCount = dbMessages.filter(
    (m) => m.metadata?.isImported
  ).length;

  return (
    <div className="flex-1 flex flex-col h-screen bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="font-semibold text-white truncate max-w-md">
            {chat.title}
          </h1>
        </div>
      </header>

      {/* Imported context banner */}
      {chat.source && (
        <ImportedContext
          provider={chat.source.provider}
          sourceUrl={chat.source.sourceUrl}
          importedAt={chat.source.importedAt}
          messageCount={importedMessageCount}
        />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {!!chatError && (
            <div className="mt-4 mb-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 shrink-0" size={18} />
                <div className="min-w-0">
                  <p className="font-semibold">AI didn’t respond</p>
                  <p className="mt-1 text-sm text-amber-200/80 wrap-break-word">
                    {chatError.message}
                  </p>
                  <p className="mt-2 text-xs text-amber-200/70">
                    Set{" "}
                    <code className="px-1 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      AI_GATEWAY_API_KEY
                    </code>{" "}
                    (or{" "}
                    <code className="px-1 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      AI_GATEWAY_TOKEN
                    </code>
                    ) in your env and restart the dev server.
                  </p>
                </div>
              </div>
            </div>
          )}

          {displayMessages.map((message, index) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              isImported={message.isImported}
              isStreaming={
                isStreaming &&
                index === displayMessages.length - 1 &&
                message.role === "assistant"
              }
            />
          ))}

          {/* Loading indicator for new response */}
          {status === "submitted" && (
            <div className="flex gap-4 px-4 py-6 bg-zinc-900/30">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Loader2 size={16} className="animate-spin" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-zinc-400">Thinking</span>
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-zinc-400 typing-dot" />
                  <span className="w-1 h-1 rounded-full bg-zinc-400 typing-dot" />
                  <span className="w-1 h-1 rounded-full bg-zinc-400 typing-dot" />
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        isLoading={isLoading}
        disabled={!!chatError}
        model={selectedModel}
        onModelChange={setSelectedModel}
      />
    </div>
  );
}
