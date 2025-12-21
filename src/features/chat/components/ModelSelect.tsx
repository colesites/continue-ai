"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/utils/cn";
import {
  AVAILABLE_MODELS,
  getProviderColor,
  type ModelOption,
} from "@/lib/models";

interface ModelSelectProps {
  value: string;
  onChange: (modelId: string) => void;
}

export function ModelSelect({ value, onChange }: ModelSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedModel =
    AVAILABLE_MODELS.find((m) => m.id === value) || AVAILABLE_MODELS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Group models by provider
  const groupedModels = AVAILABLE_MODELS.reduce(
    (acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider].push(model);
      return acc;
    },
    {} as Record<string, ModelOption[]>
  );

  const providerLabels = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    google: "Google",
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
          "bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 text-zinc-300"
        )}
      >
        <Sparkles
          size={14}
          style={{ color: getProviderColor(selectedModel.provider) }}
        />
        <span>{selectedModel.name}</span>
        <ChevronDown
          size={14}
          className={cn("transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-50">
          {Object.entries(groupedModels).map(([provider, models]) => (
            <div key={provider}>
              <div className="px-3 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider bg-zinc-800/50">
                {providerLabels[provider as keyof typeof providerLabels]}
              </div>
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onChange(model.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors",
                    value === model.id
                      ? "bg-indigo-500/20 text-white"
                      : "hover:bg-zinc-800 text-zinc-300"
                  )}
                >
                  <Sparkles
                    size={16}
                    className="shrink-0 mt-0.5"
                    style={{ color: getProviderColor(model.provider) }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{model.name}</p>
                    <p className="text-xs text-zinc-500">{model.description}</p>
                  </div>
                  {value === model.id && (
                    <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
