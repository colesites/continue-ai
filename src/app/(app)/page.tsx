import { ArrowRight, Copy, Link2, Sparkles } from "lucide-react";
import {
  HowToModal,
  HowToButton,
} from "@/features/import/components/HowToModal";
import { ImportForm } from "@/features/import/components/ImportForm";
import { ImportPreviewBox } from "@/features/import/components/ImportPreviewBox";

export default function ImportPage() {
  return (
    <>
      <HowToModal />

      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="flex items-start justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm shadow-indigo-500/15">
                  <Sparkles className="text-white" size={18} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-white">
                  Continue AI
                </h1>
              </div>
              <p className="text-zinc-400 mt-2 max-w-xl">
                Continue any conversation. Paste a transcript (best) or try importing a share link.
              </p>
            </div>
            <div className="hidden sm:block pt-2">
              <HowToButton />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left: steps + providers */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur p-6">
                <p className="text-sm font-medium text-white">How it works</p>
                <div className="mt-4 space-y-4">
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
                </div>

                <div className="mt-6 pt-6 border-t border-zinc-800">
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">
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
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white">Import</p>
                    <p className="text-sm text-zinc-400 mt-1">
                      Paste transcript for best reliability. Auto-import may be blocked.
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

              <div className="mt-4 text-center sm:hidden">
                <HowToButton />
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
      <div className="w-8 h-8 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-200 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-sm text-zinc-400 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function ProviderPill({ name, color }: { name: string; color: string }) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/40 px-3 py-1 text-xs text-zinc-300"
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      <span>{name}</span>
    </div>
  );
}
