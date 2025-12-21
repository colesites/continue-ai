"use client";

import { useState } from "react";
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

type ImportMethod = "manual" | "capture";

export function ImportForm() {
  const router = useRouter();
  const [method, setMethod] = useState<ImportMethod>("manual");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [captureUrl, setCaptureUrl] = useState<string>("");
  const [autoStartCapture, setAutoStartCapture] = useState(false);
  const {
    status,
    url,
    provider,
    manualTranscript,
    error,
    setUrl,
    setProvider,
    setManualTranscript,
    startImport,
    importSuccess,
    importError,
    reset,
  } = useImportStore();

  const createChat = useMutation(api.chats.createChat);
  const addMessage = useMutation(api.messages.addMessage);

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

  const handleUrlChange = (value: string, openCaptureOnPaste = false) => {
    setUrl(value);
    const detected = detectProvider(value);
    setProvider(detected);

    // Only auto-open capture when the user is in Capture Mode *and* this change came from paste.
    // (Recording still requires a click due to browser permissions.)
    if (
      method === "capture" &&
      openCaptureOnPaste &&
      value.trim() &&
      detected &&
      detected !== "unknown"
    ) {
      const trimmed = value.trim();
      setCaptureUrl(trimmed);
      setIsCaptureOpen(true);
      setAutoStartCapture(true);
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
        // Capture mode is still user-assisted, so store as "manual" for now.
        // (If you want, we can extend Convex schema to add a "capture" enum.)
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
      />
      {/* Method Toggle */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg">
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
              onChange={(e) => handleUrlChange(e.target.value, false)}
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
              screen-capture → OCR import. (This works even when providers block
              scraping.)
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Link2 size={20} />
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value, false)}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData("text");
                if (pasted) handleUrlChange(pasted, true);
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
              setCaptureUrl(url.trim());
              setIsCaptureOpen(true);
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
