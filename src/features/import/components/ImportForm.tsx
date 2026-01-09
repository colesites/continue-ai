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
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Screen recording permission denied. Please enable screen recording to use Capture Mode."
          : "We could not start screen capture. Please allow screen recording and try again.";

      toast.error(message);
    }
  };

  const handleCapturedTranscript = async (transcript: NormalizedTranscript) => {
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
        importMethod: "automatic",
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

      {/* Capture Mode */}
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
          <p className="text-xs text-primary">
            Paste a share link and we&apos;ll guide you through a quick
            screen-capture → OCR import.
          </p>
        </div>
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
                  if (detected && detected !== "unknown" && !isMobile) {
                    void initiateCapture(pasted, detected);
                  }
                }
              }}
              placeholder="Paste a shared chat link (T3 Chat / ChatGPT / Claude / Gemini)..."
              disabled={isImporting}
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
              disabled={isImporting}
            />
          </div>
        </div>
        {url.trim() && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Paste → Capture. We&apos;ll open the link in a new tab and record
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
            "w-full sm:hidden flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold transition-all",
            url.trim() && provider && provider !== "unknown" && !isImporting
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
              <Video size={18} />
              Start Capture Mode
            </>
          )}
        </button>
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
