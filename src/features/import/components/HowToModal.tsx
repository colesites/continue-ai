"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Info, Link2, Video } from "lucide-react";

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
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header gradient */}
        <div className="h-1 bg-gradient-to-r from-primary via-accent to-secondary" />

        <div className="p-6">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>

          {/* Title */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="text-primary-foreground" size={28} />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Welcome to Continue AI
            </h2>
            <p className="text-muted-foreground mt-2">
              Pick up where you left off with any AI conversation
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4 mb-6">
            <Step
              icon={<Sparkles size={18} />}
              title="Continue with any model"
              description="Pick GPT / Claude / Gemini (via AI Gateway) and keep going."
            />

            <div className="pt-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Using a shared link
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
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30 mb-6">
            <Info size={18} className="text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-foreground font-medium">Pro tip</p>
              <div className="mt-1 space-y-1 text-muted-foreground">
                <p>
                  <span className="text-foreground">Paste Transcript:</span>{" "}
                  Format with <span className="text-foreground">User:</span> and{" "}
                  <span className="text-foreground">Assistant:</span> prefixes
                  for best results (raw paste works too).
                </p>
                <p>
                  <span className="text-foreground">Capture Mode:</span> Start
                  from the top and scroll the shared page slowly so the capture
                  can pick up all content.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleClose}
            className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors"
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
      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
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
        className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
      >
        How does this work?
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-accent to-secondary" />
            <div className="p-6">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-foreground">
                  How it works
                </h2>
              </div>
              <div className="space-y-4">
                <Step
                  icon={<Sparkles size={18} />}
                  title="Continue"
                  description="Choose GPT / Claude / Gemini and keep going."
                />
                <div className="pt-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
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
