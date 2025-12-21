"use client";

import { useState } from "react";
import { PromptInput } from "@/components/ai-elements/prompt-input";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (!value.trim() || isLoading || disabled) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <div className="border-t border-zinc-800 bg-zinc-950/80 backdrop-blur p-4">
      <div className="max-w-3xl mx-auto">
        <PromptInput
          value={value}
          onValueChange={setValue}
          onSubmit={handleSubmit}
          disabled={disabled}
          isLoading={isLoading}
        />
        <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
          <span>Shift+Enter for new line</span>
          <span>Verify important info</span>
        </div>
      </div>
    </div>
  );
}

