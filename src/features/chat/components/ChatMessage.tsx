"use client";

import { cn } from "@/utils/cn";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface ChatMessageProps {
  role: "user" | "assistant" | "system";
  content: string;
  isImported?: boolean;
  isStreaming?: boolean;
}

export function ChatMessage({
  role,
  content,
  isImported,
  isStreaming,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (role === "system") return null;

  const isUser = role === "user";

  return (
    <div className={cn("py-3", isUser ? "flex justify-end" : "flex justify-start")}>
      <div className={cn("group w-full max-w-[92%] sm:max-w-[80%]", isUser && "ml-auto")}>
        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl border px-4 py-3",
            "shadow-sm shadow-black/20",
            isUser
              ? "bg-indigo-500/10 border-indigo-500/20"
              : "bg-zinc-900/40 border-zinc-800"
          )}
        >
          <div
            className={cn(
              "prose prose-invert prose-sm max-w-none",
              "prose-p:text-zinc-200 prose-p:leading-relaxed",
              "prose-code:text-indigo-200 prose-code:bg-zinc-800/70 prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
              "prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800",
              "prose-headings:text-white",
              "prose-strong:text-white",
              "prose-ul:text-zinc-200 prose-ol:text-zinc-200",
              "prose-a:text-indigo-300 prose-a:no-underline hover:prose-a:underline"
            )}
          >
            <MessageContent content={content} isStreaming={isStreaming} />
          </div>
        </div>

        {/* Actions UNDER the bubble (both roles) */}
        {!isStreaming && (
          <div
            className={cn(
              "mt-2 flex items-center gap-2 text-xs text-zinc-500 transition-opacity",
              // Keep it subtle by default; brighten on hover
              "opacity-60 group-hover:opacity-100",
              isUser && "justify-end"
            )}
          >
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-zinc-900 hover:text-zinc-200 transition-colors"
            >
              {copied ? (
                <>
                  <Check size={12} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={12} />
                  Copy
                </>
              )}
            </button>
            {isImported && (
              <span className="text-[11px] px-2 py-1 rounded-md bg-zinc-900/50 border border-zinc-800 text-zinc-400">
                Imported
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MessageContent({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming?: boolean;
}) {
  // Simple markdown-like rendering
  const paragraphs = content.split("\n\n");

  return (
    <>
      {paragraphs.map((para, i) => {
        const lines = para.split("\n");
        return (
          <div key={i}>
            {lines.map((line, j) => (
              <p key={j} className="mb-2 last:mb-0 wrap-break-word whitespace-pre-wrap">
                {line}
                {isStreaming && i === paragraphs.length - 1 && j === lines.length - 1 && (
                  <span className="inline-block w-2 h-4 ml-1 bg-indigo-500 animate-pulse" />
                )}
              </p>
            ))}
          </div>
        );
      })}
    </>
  );
}

