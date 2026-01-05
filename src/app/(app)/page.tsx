"use client";
import { ArrowRight, Copy, Sparkles } from "lucide-react";
import {
  HowToModal,
  HowToButton,
} from "@/features/import/components/HowToModal";
import { ImportForm } from "@/features/import/components/ImportForm";
import { ImportPreviewBox } from "@/features/import/components/ImportPreviewBox";
import { useImportStore } from "@/features/import/lib/useImportStore";

export default function ImportPage() {
  const { method } = useImportStore();

  return (
    <>
      <HowToModal />

      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center shadow-sm shadow-primary/15">
                  <Sparkles className="text-primary-foreground" size={18} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
                  Continue AI
                </h1>
              </div>
              <p className="text-muted-foreground mt-2 max-w-xl">
                Continue any conversation. Capture from link (best) or paste a
                transcript.
              </p>
            </div>
            <div className="hidden sm:block pt-2">
              <HowToButton />
            </div>
          </div>

          <div className="sm:hidden mb-8">
            <HowToButton />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left: steps + providers */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-border bg-card p-6">
                <p className="text-sm font-medium text-card-foreground">
                  How it works
                </p>
                <div className="mt-4 space-y-4">
                  {method === "manual" ? (
                    <>
                      <Step
                        icon={<Copy size={16} />}
                        title="Copy the chat"
                        description="Select the full conversation from the other AI."
                      />
                      <Step
                        icon={<ArrowRight size={16} />}
                        title="Paste into Continue AI"
                        description="We’ll parse roles + context so you can pick up instantly."
                      />
                      <Step
                        icon={<Sparkles size={16} />}
                        title="Keep going with any model"
                        description="Choose GPT / Claude / Gemini via AI Gateway."
                      />
                    </>
                  ) : (
                    <>
                      <Step
                        icon={<Sparkles size={16} />}
                        title="Continue"
                        description="Choose GPT / Claude / Gemini and keep going."
                      />
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-6 mb-2">
                        USING A SHARED LINK
                      </p>
                      <Step
                        icon={<Copy size={16} />}
                        title="Paste share link (Capture Mode)"
                        description="Capture the share page and OCR it into a transcript."
                      />
                      <Step
                        icon={<ArrowRight size={16} />}
                        title="Scroll while recording"
                        description="Start capture, select the share tab, scroll, then OCR & import."
                      />
                    </>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Works with
                  </p>
                  <div className="mt-3 flex items-center gap-3 flex-wrap">
                    <ProviderPill name="ChatGPT" color="#10a37f" />
                    <ProviderPill name="Gemini" color="#4285f4" />
                    <ProviderPill name="Claude" color="#cc785c" />
                    <ProviderPill name="Perplexity" color="#20b8cd" />
                    <ProviderPill name="Grok" color="#ffffff" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: import card */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">
                      Import
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Paste transcript for best reliability. Auto-import may be
                      blocked.
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <ImportPreviewBox />
                </div>

                <div className="mt-5">
                  <ImportForm />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Step({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg border border-border bg-muted text-muted-foreground flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function ProviderPill({ name, color }: { name: string; color: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-secondary-foreground">
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>{name}</span>
    </div>
  );
}
