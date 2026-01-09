"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { Link2, Loader2, ExternalLink, Video, CheckIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/utils/cn";
import {
  detectProvider,
  getProviderDisplayName,
  getProviderColor,
} from "@/utils/url-safety";
import type { Provider } from "@/utils/url-safety";
import { useImportStore } from "../lib/useImportStore";
import { api } from "../../../../convex/_generated/api";
import type { NormalizedTranscript, NormalizedMessage } from "../types";
import { CaptureModeModal } from "./CaptureModeModal";
import { Textarea } from "@/components/ui/textarea";
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

const PROVIDER_OPTIONS: { value: Provider; label: string }[] = [
  { value: "chatgpt", label: "ChatGPT" },
  { value: "claude", label: "Claude" },
  { value: "gemini", label: "Gemini" },
  { value: "perplexity", label: "Perplexity" },
  { value: "grok", label: "Grok" },
  { value: "unknown", label: "Other / Unknown" },
];

const USER_LABELS = ["user", "you", "me", "customer", "human"];
const ASSISTANT_LABELS = [
  "assistant",
  "ai",
  "model",
  "bot",
  "claude",
  "chatgpt",
  "gemini",
  "perplexity",
  "grok",
  "bard",
];

const NOISE_PATTERNS = [
  /no file chosen/i,
  /chatgpt can make mistakes/i,
  /check important info/i,
  /skip to content/i,
  /chat history/i,
  /this is a copy of a conversation between/i,
  /report conversation/i,
];

export function ImportForm() {
  const router = useRouter();
  const {
    status,
    url,
    provider,
    selectedModel,
    error,
    setUrl,
    setSelectedModel,
    setProvider,
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
  const [isMobile, setIsMobile] = useState(false);
  const [manualTranscript, setManualTranscript] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  useEffect(() => {
    if (typeof window === "undefined") return;

    const query = window.matchMedia("(max-width: 640px)");

    const updateIsMobile = () => {
      setIsMobile(query.matches);
    };

    updateIsMobile();

    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", updateIsMobile);
      return () => query.removeEventListener("change", updateIsMobile);
    }

    query.addListener(updateIsMobile);
    return () => query.removeListener(updateIsMobile);
  }, []);

  const createChat = useMutation(api.chats.createChat);
  const addMessage = useMutation(api.messages.addMessage);

  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    if (isMobile && !provider) {
      setProvider("unknown");
    }
  }, [isMobile, provider, setProvider]);

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

    const supportsScreenCapture =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getDisplayMedia === "function";

    if (!supportsScreenCapture) {
      toast.error(
        isMobile
          ? "Screen recording isn’t supported on this mobile browser. Please paste the transcript manually."
          : "Screen recording isn’t supported in this browser. Try Chrome, Edge, or another desktop browser."
      );
      return;
    }

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
      const isPermissionDeniedError =
        err instanceof DOMException && err.name === "NotAllowedError";

      const message = isPermissionDeniedError
        ? "Screen recording permission denied. Please enable screen recording to use Capture Mode."
        : isMobile
          ? "We couldn’t start screen capture on this mobile browser. Try again or paste the transcript manually."
          : "We could not start screen capture. Please allow screen recording and try again.";

      toast.error(message);
    }
  };

  const handleCapturedTranscript = async (
    transcript: NormalizedTranscript,
    importMethod: "automatic" | "manual" = "automatic"
  ) => {
    setIsCaptureOpen(false);
    setIsSubmitting(true);
    startImport();

    try {
      if (!transcript.messages?.length) {
        throw new Error(
          "We couldn't extract any messages. Try capturing slower and scrolling from the top."
        );
      }

      const chatId = await createChat({
        title: transcript.title || "Imported Chat",
        provider: transcript.provider,
        sourceUrl: transcript.sourceUrl,
        importMethod,
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualTranscriptImport = async () => {
    if (!manualTranscript.trim()) {
      toast.error("Paste the transcript from your AI chat before importing.");
      return;
    }

    const manualProvider = provider ?? "unknown";

    try {
      const transcript = buildManualTranscript({
        raw: manualTranscript,
        provider: manualProvider,
        title: manualTitle,
      });
      await handleCapturedTranscript(transcript, "manual");
      setManualTranscript("");
      setManualTitle("");
      setUrl("");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "We couldn’t parse this transcript. Please ensure it includes clear User:/Assistant: labels.";
      toast.error(message);
    }
  };

  const isProcessing =
    status === "scanning" || status === "importing" || isSubmitting;
  const helperText = isMobile
    ? "Mobile import: copy the full conversation from your AI app and paste it below. Capture Mode isn't available on phones."
    : "Desktop Capture Mode: paste a shared link and we'll capture the page automatically.";

  return (
    <div className="space-y-4">
      {!isMobile && (
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
          onCaptured={(transcript) =>
            handleCapturedTranscript(transcript, "automatic")
          }
          model={selectedModel}
        />
      )}

      {/* Capture Mode */}
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
          <p className="text-xs text-primary">{helperText}</p>
        </div>
        {!isMobile ? (
          <>
            <div className="relative group/input flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <div className="relative flex-1 w-full">
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
                      if (detected && detected !== "unknown") {
                        void initiateCapture(pasted, detected);
                      }
                    }
                  }}
                  placeholder="Paste a shared chat link (T3 Chat / ChatGPT / Claude / Gemini)..."
                  disabled={isProcessing}
                  className={cn(
                    "w-full pl-12 pr-4 py-4 rounded-xl bg-background border text-foreground placeholder:text-muted-foreground placeholder:text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all",
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

              <div className="shrink-0 w-full sm:w-[220px]">
                <ModelSelectorWrapper
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  disabled={isProcessing}
                />
              </div>
            </div>
            {url.trim() && (
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3 gap-4">
                <p className="text-xs text-muted-foreground flex-1">
                  Paste → Capture. We&apos;ll open the link in a new tab and
                  record while you scroll.
                </p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 shrink-0"
                >
                  Open link <ExternalLink size={14} />
                </a>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Conversation provider
              </label>
              <select
                value={provider ?? "unknown"}
                onChange={(e) => setProvider(e.target.value as Provider)}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {PROVIDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Title (optional)
              </label>
              <input
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="e.g. Claude brainstorm, Gemini summary..."
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Transcript
              </label>
              <Textarea
                value={manualTranscript}
                onChange={(e) => setManualTranscript(e.target.value)}
                placeholder={
                  "User: Paste your first message here...\nAssistant: Paste the AI reply...\nUser: ..."
                }
                className="min-h-[200px] resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Paste the entire chat exactly as you see it. Prefix each turn
                with &quot;User:&quot; or &quot;Assistant:&quot; for best
                results.
              </p>
            </div>
          </div>
        )}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            {error}
          </div>
        )}
        {isMobile ? (
          <button
            onClick={handleManualTranscriptImport}
            disabled={isProcessing || !manualTranscript.trim()}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold transition-all",
              manualTranscript.trim() && !isProcessing
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating chat...
              </>
            ) : (
              <>Paste Transcript</>
            )}
          </button>
        ) : (
          <button
            onClick={() => {
              if (!url.trim() || !provider || provider === "unknown") return;
              void initiateCapture(url.trim());
            }}
            disabled={
              !url.trim() || !provider || provider === "unknown" || isProcessing
            }
            className={cn(
              "w-full hidden sm:flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold transition-all",
              url.trim() && provider && provider !== "unknown" && !isProcessing
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating chat...
              </>
            ) : (
              <>
                <Video size={18} />
                Start Capture Mode
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
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
          className="w-full sm:w-auto min-h-[56px] px-4 rounded-xl border border-input bg-background hover:bg-muted transition-colors flex items-center justify-center gap-2 group min-w-[140px]"
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

function buildManualTranscript({
  raw,
  provider,
  title,
}: {
  raw: string;
  provider: Provider;
  title?: string;
}): NormalizedTranscript {
  const sanitizedLines = raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\t/g, " ").replace(/\s+$/, ""))
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      return !NOISE_PATTERNS.some((pattern) => pattern.test(trimmed));
    });

  const messages: NormalizedMessage[] = [];
  let currentRole: NormalizedMessage["role"] = "user";
  let buffer: string[] = [];

  const flush = () => {
    const content = buffer.join("\n").trim();
    if (!content) {
      buffer = [];
      return;
    }
    messages.push({
      role: currentRole,
      content,
      order: messages.length,
    });
    buffer = [];
  };

  for (const rawLine of sanitizedLines) {
    const line = rawLine;
    const normalized = stripFormatting(line);
    const labelledMatch = normalized.match(/^([^:：\-]+)\s*[:：\-]\s*(.*)$/i);
    const roleFromLabel =
      labelledMatch?.[1] && mapLabelToRole(labelledMatch[1]);

    if (labelledMatch && roleFromLabel) {
      flush();
      currentRole = roleFromLabel;
      const remainder = labelledMatch[2].trim();
      if (remainder) {
        buffer.push(remainder);
      }
      continue;
    }

    const roleFromStandalone = mapLabelToRole(normalized);
    if (roleFromStandalone && !labelledMatch) {
      flush();
      currentRole = roleFromStandalone;
      continue;
    }

    buffer.push(line);
  }

  flush();

  if (!messages.length) {
    const fallbackChunks = sanitizedLines
      .join("\n")
      .split(/\n{2,}/)
      .map((chunk) => chunk.trim())
      .filter(Boolean);

    if (!fallbackChunks.length) {
      throw new Error(
        'No messages detected. Please format lines like "User: ..." and "Assistant: ...".'
      );
    }

    fallbackChunks.forEach((chunk, index) => {
      messages.push({
        role: index % 2 === 0 ? "user" : "assistant",
        content: chunk,
        order: index,
      });
    });
  }

  const generatedTitle = title?.trim() || deriveTitleFromMessages(messages);

  return {
    provider,
    title: generatedTitle,
    messages,
    sourceUrl: undefined,
    fetchedAt: Date.now(),
  };
}

function stripFormatting(input: string): string {
  return input
    .trim()
    .replace(/^[*_`~]+/, "")
    .replace(/[*_`~]+$/, "")
    .trim();
}

function mapLabelToRole(label: string): NormalizedMessage["role"] | null {
  const normalized = stripFormatting(label).toLowerCase();
  if (!normalized) return null;
  if (normalized.includes("system")) return "system";
  if (
    USER_LABELS.some(
      (token) => normalized === token || normalized.includes(`${token}:`)
    )
  ) {
    return "user";
  }
  if (
    ASSISTANT_LABELS.some(
      (token) => normalized === token || normalized.includes(`${token}:`)
    )
  ) {
    return "assistant";
  }
  return null;
}

function deriveTitleFromMessages(messages: NormalizedMessage[]): string {
  const candidate =
    messages.find((msg) => msg.role === "user")?.content ||
    messages[0]?.content ||
    "";

  if (!candidate) return "Manual Transcript";

  const singleLine = candidate.replace(/\s+/g, " ").trim();
  if (!singleLine) return "Manual Transcript";

  return singleLine.length > 60 ? `${singleLine.slice(0, 57)}...` : singleLine;
}
