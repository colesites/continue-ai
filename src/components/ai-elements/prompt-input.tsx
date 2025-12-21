/* Minimal Vercel AI Elements-style prompt input (shadcn-powered)
 * This is intentionally small and tailored to this codebase.
 */
"use client";

import * as React from "react";
import { Loader2, Send } from "lucide-react";

import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface PromptInputProps {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function PromptInput({
  value,
  onValueChange,
  onSubmit,
  placeholder = "Continue the conversation...",
  disabled,
  isLoading,
  className,
}: PromptInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [value]);

  const canSend = !!value.trim() && !isLoading && !disabled;

  const handleSubmit = () => {
    if (!canSend) return;
    onSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className={cn(
        "flex items-end gap-2 rounded-2xl p-3",
        // Borderless feel with NO focus ring/outline.
        "bg-zinc-900/50 shadow-sm shadow-black/20",
        "focus-within:outline-none focus-within:ring-0",
        className
      )}
    >
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        rows={1}
        className={cn(
          "min-h-[24px] max-h-[200px] resize-none bg-transparent px-0 py-0",
          "border-0 focus-visible:ring-0 focus-visible:ring-offset-0",
          "text-white placeholder:text-zinc-500"
        )}
      />

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={!canSend}
        size="icon"
        className={cn(
          "rounded-lg shrink-0",
          canSend
            ? "bg-indigo-600 hover:bg-indigo-500 text-white"
            : "bg-zinc-800 text-zinc-500"
        )}
        aria-label="Send message"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}


