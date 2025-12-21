"use client";

import { useImportStore } from "../lib/useImportStore";
import { cn } from "@/utils/cn";
import { getProviderDisplayName, getProviderColor } from "@/utils/url-safety";
import { Scan, CheckCircle, AlertCircle, Loader2, MessageSquare } from "lucide-react";

const SCAN_STEPS = [
  "Connecting to shared link...",
  "Reading conversation...",
  "Extracting messages...",
  "Normalizing format...",
  "Preparing preview...",
];

export function ImportPreviewBox() {
  const { status, provider, preview, error, requiresManualPaste } = useImportStore();

  if (status === "idle") {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-xl border overflow-hidden transition-all duration-300",
        status === "scanning" && "border-primary/50 pulse-glow",
        status === "previewing" && "border-green-500/50",
        status === "error" && "border-destructive/50",
        status === "importing" && "border-primary/50",
        status === "success" && "border-green-500/50"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "px-4 py-3 flex items-center gap-3",
          status === "scanning" && "bg-primary/10",
          status === "previewing" && "bg-green-500/10",
          status === "error" && "bg-destructive/10",
          status === "importing" && "bg-primary/10",
          status === "success" && "bg-green-500/10"
        )}
      >
        {status === "scanning" && (
          <>
            <div className="relative">
              <Scan className="text-primary animate-pulse" size={20} />
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Scanning shared link</p>
              <ScanningAnimation />
            </div>
          </>
        )}

        {status === "previewing" && preview && (
          <>
            <CheckCircle className="text-green-400" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Ready to import from{" "}
                <span style={{ color: getProviderColor(preview.provider) }}>
                  {getProviderDisplayName(preview.provider)}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {preview.messageCount} messages found
              </p>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="text-destructive" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Import failed</p>
              <p className="text-xs text-destructive">{error}</p>
            </div>
          </>
        )}

        {status === "importing" && (
          <>
            <Loader2 className="text-primary animate-spin" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Creating chat...</p>
              <p className="text-xs text-muted-foreground">Setting up your conversation</p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="text-green-400" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Import complete!</p>
              <p className="text-xs text-muted-foreground">Redirecting to your chat...</p>
            </div>
          </>
        )}

        {/* Provider badge */}
        {provider && status !== "error" && (
          <div
            className="px-2 py-1 rounded-md text-xs font-medium"
            style={{
              backgroundColor: `${getProviderColor(provider)}20`,
              color: getProviderColor(provider),
            }}
          >
            {getProviderDisplayName(provider)}
          </div>
        )}
      </div>

      {/* Content preview */}
      {status === "previewing" && preview && preview.previewMessages.length > 0 && (
        <div className="px-4 py-3 border-t border-border bg-muted/50 max-h-48 overflow-y-auto">
          <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-medium">
            Preview
          </p>
          <div className="space-y-3">
            {preview.previewMessages.slice(0, 3).map((msg, i) => (
              <div key={i} className="flex items-start gap-2">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs",
                    msg.role === "user"
                      ? "bg-primary/20 text-primary"
                      : "bg-purple-500/20 text-purple-400"
                  )}
                >
                  {msg.role === "user" ? "U" : "A"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">
                    {msg.role === "user" ? "User" : "Assistant"}
                  </p>
                  <p className="text-sm text-foreground/80 line-clamp-2">{msg.content}</p>
                </div>
              </div>
            ))}
            {preview.previewMessages.length > 3 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                +{preview.messageCount - 3} more messages
              </p>
            )}
          </div>
        </div>
      )}

      {/* Scan visualization */}
      {status === "scanning" && (
        <div className="px-4 py-6 border-t border-border bg-muted/50 relative overflow-hidden">
          {/* Scan line effect */}
          <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 scan-line" />

          {/* Skeleton preview */}
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full shimmer" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-16 rounded shimmer" />
                  <div className="h-4 w-full rounded shimmer" />
                  <div className="h-4 w-3/4 rounded shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScanningAnimation() {
  return (
    <div className="flex items-center gap-1 mt-1">
      <span className="text-xs text-primary">Reading</span>
      <span className="flex gap-0.5">
        <span className="w-1 h-1 rounded-full bg-primary typing-dot" />
        <span className="w-1 h-1 rounded-full bg-primary typing-dot" />
        <span className="w-1 h-1 rounded-full bg-primary typing-dot" />
      </span>
    </div>
  );
}

