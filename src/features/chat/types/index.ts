interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  model: string;
  onModelChange: (modelId: string) => void;
}

interface ChatMessageProps {
  role: "user" | "assistant" | "system";
  content: string;
  isImported?: boolean;
  isStreaming?: boolean;
}

interface ImportedContextProps {
  provider: string;
  sourceUrl?: string;
  importedAt: number;
  messageCount: number;
}

export type { ChatInputProps, ChatMessageProps, ImportedContextProps };
