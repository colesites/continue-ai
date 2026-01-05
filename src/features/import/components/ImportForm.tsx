"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import {
  Link2,
  Loader2,
  FileText,
  Copy,
  Sparkles,
  ExternalLink,
  Video,
  CheckIcon,
} from "lucide-react";
import { cn } from "@/utils/cn";
import {
  detectProvider,
  getProviderDisplayName,
  getProviderColor,
} from "@/utils/url-safety";
import { useImportStore } from "../lib/useImportStore";
import { api } from "../../../../convex/_generated/api";
import type { NormalizedTranscript } from "../types";
import { CaptureModeModal } from "./CaptureModeModal";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import { AVAILABLE_MODELS } from "@/lib/models";

type ImportMethod = "manual" | "capture";

export function ImportForm() {
  const router = useRouter();
  const {
    status,
    url,
    method,
    provider,
    manualTranscript,
    selectedModel,
    error,
    setUrl,
    setMethod,
    setSelectedModel,
    setProvider,
    setManualTranscript,
    startImport,
    importSuccess,
    importError,
    setInitialStream,
    reset,
  } = useImportStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [captureUrl, setCaptureUrl] = useState<string>("");
  const [autoStartCapture, setAutoStartCapture] = useState(false);

  const createChat = useMutation(api.chats.createChat);
  const addMessage = useMutation(api.messages.addMessage);

  useEffect(() => {
    reset();
  }, [reset]);

  const openLinkInNewTab = (href: string) => {
    if (typeof window === "undefined") return;
    try {
      const newTab = window.open(href, "_blank", "noopener,noreferrer");
      if (!newTab) {
        console.warn("Popup blocked: enable pop-ups to auto-open link.");
      }
    } catch (err) {
      console.warn("Failed to auto-open link", err);
    }
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    const detected = detectProvider(value);
    setProvider(detected);
  };

  const initiateCapture = async (
    targetUrl: string,
    detectedProvider?: typeof provider
  ) => {
    const activeProvider = detectedProvider || provider;
    if (!targetUrl || !activeProvider || activeProvider === "unknown") return;

    try {
      // 1. Start screen capture immediately (must be in gesture handler)
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: 2,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      // 2. Store stream and open modal
      setInitialStream(stream);
      setCaptureUrl(targetUrl);
      setIsCaptureOpen(true);
    } catch (err) {
      console.error("Failed to initiate capture:", err);
      // Fallback to manual trigger in modal if stream fails
      setCaptureUrl(targetUrl);
      setIsCaptureOpen(true);
    }
  };

  const handleCapturedTranscript = async (transcript: NormalizedTranscript) => {
    setIsCaptureOpen(false);
    setIsSubmitting(true);
    startImport();

    try {
      if (!transcript.messages?.length) {
        throw new Error(
          "We couldn’t extract any messages. Try capturing slower and scrolling from the top."
        );
      }

      const chatId = await createChat({
        title: transcript.title || "Imported Chat",
        provider: transcript.provider,
        sourceUrl: transcript.sourceUrl,
        importMethod: "manual",
        messages: transcript.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      await addMessage({
        chatId,
        role: "assistant",
        content:
          "I captured the full conversation from your shared link. Where do you want to continue from?",
      });

      importSuccess(chatId);
      setUrl("");
      router.push(`/chat/${chatId}`);
    } catch (err) {
      console.error("Capture import error:", err);
      importError(err instanceof Error ? err.message : "Failed to create chat");
      setIsSubmitting(false);
    }
  };

  const handleManualImport = async () => {
    if (!manualTranscript.trim()) return;
    setIsSubmitting(true);
    startImport();

    try {
      const messages = parseManualTranscript(manualTranscript);
      const title = generateTitle(messages);

      const chatId = await createChat({
        title,
        provider: provider || "unknown",
        sourceUrl: url || undefined,
        importMethod: "manual",
        messages,
      });

      importSuccess(chatId);
      setUrl("");
      router.push(`/chat/${chatId}`);
    } catch (err) {
      console.error("Manual import error:", err);
      importError(err instanceof Error ? err.message : "Failed to create chat");
      setIsSubmitting(false);
    }
  };

  const isImporting = status === "importing" || isSubmitting;

  return (
    <div className="space-y-4">
      <CaptureModeModal
        isOpen={isCaptureOpen}
        url={captureUrl || url}
        autoStart={autoStartCapture}
        onAutoStartComplete={() => setAutoStartCapture(false)}
        onCaptureReady={(href) => {
          openLinkInNewTab(href);
        }}
        onClose={() => {
          setIsCaptureOpen(false);
          setAutoStartCapture(false);
        }}
        onCaptured={handleCapturedTranscript}
        model={selectedModel}
      />
      {/* Method Toggle */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg">
        <button
          onClick={() => {
            setMethod("capture");
            reset();
          }}
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
            method === "capture"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Link2 size={16} className="inline mr-2" />
          Capture from link
        </button>
        <button
          onClick={() => {
            setMethod("manual");
            reset();
          }}
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
            method === "manual"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText size={16} className="inline mr-2" />
          Paste Transcript
        </button>
      </div>

      {/* Manual Import (Primary) */}
      {method === "manual" && (
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Link2 size={18} />
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              onPaste={(e) => {
                e.preventDefault();
                const pasted = e.clipboardData.getData("text");
                if (pasted) {
                  handleUrlChange(pasted);
                }
              }}
              placeholder="Paste shared link (optional)"
              disabled={isImporting}
              className={cn(
                "w-full pl-11 pr-4 py-3 rounded-xl bg-background border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all",
                provider && provider !== "unknown"
                  ? "border-primary/50"
                  : "border-input"
              )}
            />
            {provider && provider !== "unknown" && (
              <div
                className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-xs font-medium"
                style={{
                  backgroundColor: `${getProviderColor(provider)}20`,
                  color: getProviderColor(provider),
                }}
              >
                {getProviderDisplayName(provider)}
              </div>
            )}
          </div>

          {url.trim() && (
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                If copying is hard, open the share link in a new tab and copy
                the chat.
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80"
              >
                Open link <ExternalLink size={14} />
              </a>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <Copy size={14} />
              Paste the conversation
            </label>
            <textarea
              value={manualTranscript}
              onChange={(e) => setManualTranscript(e.target.value)}
              placeholder={`Paste your conversation here...

Format like:
User: Your question here
Assistant: The AI response here

Or just paste the raw text - we'll figure it out!`}
              rows={8}
              disabled={isImporting}
              className="w-full px-4 py-3 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none text-sm"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleManualImport}
            disabled={!manualTranscript.trim() || isImporting}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold transition-all",
              manualTranscript.trim() && !isImporting
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {isImporting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating chat...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Continue This Conversation
              </>
            )}
          </button>
        </div>
      )}

      {/* Capture Mode */}
      {method === "capture" && (
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
            <p className="text-xs text-primary">
              Paste a share link and we’ll guide you through a quick
              screen-capture → OCR import.
            </p>
          </div>
          <div className="relative group/input flex items-stretch gap-2">
            <div className="relative flex-1">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Link2 size={20} />
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = e.clipboardData.getData("text");
                  if (pasted) {
                    handleUrlChange(pasted);
                    const detected = detectProvider(pasted);
                    if (
                      method === "capture" &&
                      detected &&
                      detected !== "unknown"
                    ) {
                      void initiateCapture(pasted, detected);
                    }
                  }
                }}
                placeholder="Paste a shared chat link (Gemini / ChatGPT / Claude)..."
                disabled={isImporting}
                className={cn(
                  "w-full pl-12 pr-4 py-4 rounded-xl bg-background border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all",
                  provider && provider !== "unknown"
                    ? "border-primary/50"
                    : "border-input"
                )}
              />
              {provider && provider !== "unknown" && (
                <div
                  className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md text-xs font-medium"
                  style={{
                    backgroundColor: `${getProviderColor(provider)}20`,
                    color: getProviderColor(provider),
                  }}
                >
                  {getProviderDisplayName(provider)}
                </div>
              )}
            </div>

            <div className="flex-shrink-0">
              <ModelSelectorWrapper
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                disabled={isImporting}
              />
            </div>
          </div>{" "}
          {/* Closing div for "relative group/input flex items-stretch gap-2" */}
          {url.trim() && (
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Paste → Capture. We’ll open the link in a new tab and record
                while you scroll.
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80"
              >
                Open link <ExternalLink size={14} />
              </a>
            </div>
          )}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              {error}
            </div>
          )}
          <button
            onClick={() => {
              if (!url.trim() || !provider || provider === "unknown") return;
              void initiateCapture(url.trim());
            }}
            disabled={
              !url.trim() || !provider || provider === "unknown" || isImporting
            }
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold transition-all",
              url.trim() && provider && provider !== "unknown" && !isImporting
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Video size={18} />
            Start Capture Mode
          </button>
        </div>
      )}
    </div>
  );
}

function parseManualTranscript(
  text: string
): Array<{ role: "user" | "assistant"; content: string }> {
  const lines = text.split("\n");
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

  let currentRole: "user" | "assistant" | null = null;
  let currentContent: string[] = [];

  const flushMessage = () => {
    if (currentRole && currentContent.length > 0) {
      messages.push({
        role: currentRole,
        content: currentContent.join("\n").trim(),
      });
    }
    currentContent = [];
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    const userMatch = trimmedLine.match(/^(User|You|Human|Me|Q)[\s:]/i);
    const assistantMatch = trimmedLine.match(
      /^(Assistant|AI|Bot|ChatGPT|Claude|Gemini|Perplexity|Grok|A|Response)[\s:]/i
    );

    if (userMatch) {
      flushMessage();
      currentRole = "user";
      const content = trimmedLine.slice(userMatch[0].length).trim();
      if (content) currentContent.push(content);
    } else if (assistantMatch) {
      flushMessage();
      currentRole = "assistant";
      const content = trimmedLine.slice(assistantMatch[0].length).trim();
      if (content) currentContent.push(content);
    } else if (currentRole) {
      currentContent.push(line);
    } else if (trimmedLine) {
      // No role detected yet, assume it's user content
      currentRole = "user";
      currentContent.push(line);
    }
  }

  flushMessage();

  // If no messages were parsed, treat the entire text as a single user message
  if (messages.length === 0) {
    return [{ role: "user", content: text.trim() }];
  }

  return messages;
}

function generateTitle(
  messages: Array<{ role: string; content: string }>
): string {
  const firstUserMessage = messages.find((m) => m.role === "user");
  if (firstUserMessage) {
    const content = firstUserMessage.content.slice(0, 50);
    return content.length < firstUserMessage.content.length
      ? `${content}...`
      : content;
  }
  return "Imported Chat";
}

function ModelSelectorWrapper({
  selectedModel,
  onModelChange,
  disabled,
}: {
  selectedModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedModelData = AVAILABLE_MODELS.find(
    (m) => m.id === selectedModel
  );

  const groupedModels = AVAILABLE_MODELS.reduce(
    (acc, m) => {
      if (!acc[m.provider]) acc[m.provider] = [];
      acc[m.provider].push(m);
      return acc;
    },
    {} as Record<string, typeof AVAILABLE_MODELS>
  );

  return (
    <ModelSelector open={open} onOpenChange={setOpen}>
      <ModelSelectorTrigger asChild>
        <button
          disabled={disabled}
          className="h-full px-4 rounded-xl border border-input bg-background hover:bg-muted transition-colors flex items-center justify-center gap-2 group min-w-[140px]"
        >
          {selectedModelData && (
            <>
              <ModelSelectorLogo
                provider={selectedModelData.provider}
                className="size-4"
              />
              <span className="text-sm font-medium text-foreground truncate max-w-[80px]">
                {selectedModelData.name}
              </span>
            </>
          )}
        </button>
      </ModelSelectorTrigger>
      <ModelSelectorContent title="Select Model for OCR">
        <ModelSelectorInput placeholder="Search models..." />
        <ModelSelectorList>
          <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
          {Object.entries(groupedModels).map(([provider, models]) => (
            <ModelSelectorGroup heading={provider} key={provider}>
              {models.map((m) => (
                <ModelSelectorItem
                  key={m.id}
                  onSelect={() => {
                    onModelChange(m.id);
                    setOpen(false);
                  }}
                  value={m.name}
                >
                  <ModelSelectorLogo provider={m.provider} />
                  <ModelSelectorName>{m.name}</ModelSelectorName>
                  {selectedModel === m.id && (
                    <CheckIcon className="ml-auto size-4" />
                  )}
                </ModelSelectorItem>
              ))}
            </ModelSelectorGroup>
          ))}
        </ModelSelectorList>
      </ModelSelectorContent>
    </ModelSelector>
  );
}
