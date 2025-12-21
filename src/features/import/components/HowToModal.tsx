"use client";

import { useState, useEffect } from "react";
import { X, Copy, Sparkles, Info, Link2, Video } from "lucide-react";

const STORAGE_KEY = "continue-ai-how-to-seen";

export function HowToModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      // Avoid setState synchronously inside the effect body (repo lint rule).
      const t = setTimeout(() => setIsOpen(true), 0);
      return () => clearTimeout(t);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header gradient */}
        <div className="h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="p-6">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>

          {/* Title */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="text-white" size={28} />
            </div>
            <h2 className="text-2xl font-bold text-white">
              Welcome to Continue AI
            </h2>
            <p className="text-zinc-400 mt-2">
              Pick up where you left off with any AI conversation
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4 mb-6">
            <Step
              icon={<Copy size={18} />}
              title="Best: paste the transcript"
              description="Copy the conversation text and paste it into Continue AI."
            />
            <Step
              icon={<Sparkles size={18} />}
              title="Continue with any model"
              description="Pick GPT / Claude / Gemini (via AI Gateway) and keep going."
            />

            <div className="pt-2">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                Using a shared link (optional)
              </p>
              <div className="space-y-3">
                <Step
                  icon={<Link2 size={18} />}
                  title="Paste share link (Capture Mode)"
                  description="We’ll help you screen-capture the share page and OCR it into a transcript."
                />
                <Step
                  icon={<Video size={18} />}
                  title="Record + scroll"
                  description="Open the link, start capture, scroll the conversation, then OCR & import."
                />
              </div>
            </div>
          </div>

          {/* Tip */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 mb-6">
            <Info size={18} className="text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-zinc-300 font-medium">Pro tip</p>
              <p className="text-zinc-500 mt-0.5">
                Format your paste with &quot;User:&quot; and
                &quot;Assistant:&quot; prefixes for best results, or just paste
                the raw text!
              </p>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleClose}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
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
    <div className="flex items-start gap-4">
      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-medium text-white">{title}</p>
        <p className="text-sm text-zinc-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

export function HowToButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors"
      >
        How does this work?
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <div className="h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <div className="p-6">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-white">How it works</h2>
              </div>
              <div className="space-y-4">
                <Step
                  icon={<Copy size={18} />}
                  title="Best: paste transcript"
                  description="Copy the conversation text and paste it into Continue AI."
                />
                <Step
                  icon={<Sparkles size={18} />}
                  title="Continue"
                  description="Choose GPT / Claude / Gemini and keep going."
                />
                <div className="pt-2">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                    Using a shared link
                  </p>
                  <div className="space-y-3">
                    <Step
                      icon={<Link2 size={18} />}
                      title="Paste share link (Capture Mode)"
                      description="Capture the share page and OCR it into a transcript."
                    />
                    <Step
                      icon={<Video size={18} />}
                      title="Scroll while recording"
                      description="Start capture, select the share tab, scroll, then OCR & import."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
