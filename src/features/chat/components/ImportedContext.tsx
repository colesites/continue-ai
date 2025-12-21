"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink, Clock } from "lucide-react";
import { cn } from "@/utils/cn";
import { getProviderDisplayName, getProviderColor } from "@/utils/url-safety";
import type { Provider } from "@/utils/url-safety";

interface ImportedContextProps {
  provider: string;
  sourceUrl?: string;
  importedAt: number;
  messageCount: number;
}

export function ImportedContext({
  provider,
  sourceUrl,
  importedAt,
  messageCount,
}: ImportedContextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const providerTyped = provider as Provider;

  const formattedDate = new Date(importedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-zinc-900/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: getProviderColor(providerTyped) }}
          />
          <span className="text-zinc-400">
            Continued from{" "}
            <span
              className="font-medium"
              style={{ color: getProviderColor(providerTyped) }}
            >
              {getProviderDisplayName(providerTyped)}
            </span>
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-500">{messageCount} imported messages</span>
        </div>
        <ChevronDown
          size={16}
          className={cn(
            "text-zinc-500 transition-transform",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {isExpanded && (
        <div className="px-4 py-3 border-t border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Clock size={14} />
            <span>Imported {formattedDate}</span>
          </div>
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <ExternalLink size={14} />
              <span className="truncate">{sourceUrl}</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

