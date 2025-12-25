"use client";

import { cn } from "@/utils/cn";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import type { ChatMessageProps } from "@/features/chat/types";

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
    <div
      className={cn("py-3", isUser ? "flex justify-end" : "flex justify-start")}
    >
      <div
        className={cn(
          "group w-full max-w-[92%] sm:max-w-[80%]",
          isUser && "ml-auto"
        )}
      >
        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl border px-4 py-3",
            "shadow-sm shadow-black/20",
            isUser
              ? "bg-primary/10 border-primary/20"
              : "bg-muted border-border"
          )}
        >
          <div
            className={cn(
              "prose prose-sm max-w-none dark:prose-invert",
              "prose-p:leading-relaxed",
              "prose-code:text-primary prose-code:bg-muted/70 prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
              "prose-pre:bg-background prose-pre:border prose-pre:border-border",
              "prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
            )}
          >
            <MessageContent content={content} isStreaming={isStreaming} />
          </div>
        </div>

        {/* Actions UNDER the bubble (both roles) */}
        {!isStreaming && (
          <div
            className={cn(
              "mt-2 flex items-center gap-2 text-xs text-muted-foreground transition-opacity",
              // Keep it subtle by default; brighten on hover
              "opacity-60 group-hover:opacity-100",
              isUser && "justify-end"
            )}
          >
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-muted hover:text-foreground transition-colors"
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
              <span className="text-[11px] px-2 py-1 rounded-md bg-muted/50 border border-border text-muted-foreground">
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
              <p
                key={j}
                className="mb-2 last:mb-0 wrap-break-word whitespace-pre-wrap"
              >
                {line}
                {isStreaming &&
                  i === paragraphs.length - 1 &&
                  j === lines.length - 1 && (
                    <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse" />
                  )}
              </p>
            ))}
          </div>
        );
      })}
    </>
  );
}
