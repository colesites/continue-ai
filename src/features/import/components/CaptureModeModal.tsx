"use client";

import * as React from "react";
import { X, ExternalLink, Loader2, Video, ScanText } from "lucide-react";

import { cn } from "@/utils/cn";
import type { NormalizedTranscript } from "@/features/import/types";

type CaptureStatus =
  | "idle"
  | "capturing"
  | "stopped"
  | "uploading"
  | "done"
  | "error";

export function CaptureModeModal({
  isOpen,
  url,
  autoStart = false,
  onClose,
  onCaptured,
  onAutoStartComplete,
  onCaptureReady,
}: {
  isOpen: boolean;
  url: string;
  autoStart?: boolean;
  onClose: () => void;
  onCaptured: (transcript: NormalizedTranscript) => void;
  onAutoStartComplete?: () => void;
  onCaptureReady?: (href: string) => void;
}) {
  const [status, setStatus] = React.useState<CaptureStatus>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [frameCount, setFrameCount] = React.useState(0);
  const [frames, setFrames] = React.useState<string[]>([]);

  const streamRef = React.useRef<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const intervalRef = React.useRef<number | null>(null);
  const framesLenRef = React.useRef<number>(0);
  const framesRef = React.useRef<string[]>([]);
  const notifiedCaptureRef = React.useRef<boolean>(false);

  React.useEffect(() => {
    if (!isOpen) return;
    setStatus("idle");
    setError(null);
    setFrameCount(0);
    setFrames([]);
    framesLenRef.current = 0;
    framesRef.current = [];
    notifiedCaptureRef.current = false;
  }, [isOpen, url]);

  const stopTracks = React.useCallback(() => {
    const stream = streamRef.current;
    if (stream) {
      for (const track of stream.getTracks()) track.stop();
    }
    streamRef.current = null;
  }, []);

  const clearIntervalSafe = React.useCallback(() => {
    if (intervalRef.current != null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    return () => {
      clearIntervalSafe();
      stopTracks();
    };
  }, [clearIntervalSafe, stopTracks]);

  const handleProcess = React.useCallback(async () => {
    const framesToSend = framesRef.current;
    if (!framesToSend.length) return;
    if (status === "uploading") return;
    setStatus("uploading");
    setError(null);

    try {
      const res = await fetch("/api/import/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          frames: framesToSend,
          // Default to a strong vision model via AI Gateway.
          model: "openai/gpt-4o",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Capture OCR failed");

      onCaptured(data.transcript as NormalizedTranscript);
      setStatus("done");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Capture OCR failed");
    }
  }, [onCaptured, status, url]);

  const handleStartCapture = React.useCallback(async () => {
    setError(null);
    setStatus("capturing");
    setFrames([]);
    setFrameCount(0);
    framesLenRef.current = 0;
    framesRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: 2,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (!notifiedCaptureRef.current) {
        notifiedCaptureRef.current = true;
        onCaptureReady?.(url);
      }

      // If user stops sharing via browser UI, reflect it.
      const [videoTrack] = stream.getVideoTracks();
      if (videoTrack) {
        videoTrack.onended = () => {
          clearIntervalSafe();
          stopTracks();
          setStatus((s) => (s === "capturing" ? "stopped" : s));
          // Auto-process when recording ends.
          if (framesRef.current.length > 0) {
            // fire and forget; UI will reflect uploading state
            void handleProcess();
          }
        };
      }

      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      await video.play();
      videoRef.current = video;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      const MAX_FRAMES = 24; // ~12s at 2fps (user can stop/start again)

      intervalRef.current = window.setInterval(() => {
        if (!videoRef.current) return;
        if (framesLenRef.current >= MAX_FRAMES) return;

        const w = videoRef.current.videoWidth || 1280;
        const h = videoRef.current.videoHeight || 720;
        canvas.width = w;
        canvas.height = h;

        try {
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          setFrames((prev) => {
            if (prev.length >= MAX_FRAMES) return prev;
            const next = [...prev, dataUrl];
            framesLenRef.current = next.length;
            framesRef.current = next;
            return next;
          });
          setFrameCount((c) => c + 1);
        } catch {
          // Ignore occasional draw errors while tab switches.
        }
      }, 500);
    } catch (e) {
      clearIntervalSafe();
      stopTracks();
      setStatus("error");
      setError(
        e instanceof Error
          ? e.message
          : "Capture failed. Please allow screen recording."
      );
    }
  }, [clearIntervalSafe, handleProcess, onCaptureReady, stopTracks, url]);

  // Attempt to auto-start capture when the modal opens from a paste action.
  React.useEffect(() => {
    if (!isOpen || !autoStart) return;
    if (status !== "idle") return;
    const timer = window.setTimeout(() => {
      Promise.resolve(handleStartCapture()).finally(() =>
        onAutoStartComplete?.()
      );
    }, 150);
    return () => window.clearTimeout(timer);
  }, [isOpen, autoStart, status, onAutoStartComplete, handleStartCapture]);

  const handleStopCapture = () => {
    clearIntervalSafe();
    stopTracks();
    setStatus("stopped");
    // Auto-process immediately on stop (user intent).
    if (framesRef.current.length > 0) {
      void handleProcess();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden">
        <div className="h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <h2 className="text-xl font-bold text-white">Capture Mode</h2>
          <p className="mt-1 text-sm text-zinc-400">Quick steps (about 15s):</p>

          <ol className="mt-3 space-y-2 text-sm text-zinc-300 list-decimal pl-5">
            <li>
              Allow screen recording when prompted (we auto-start capture).
            </li>
            <li>
              We’ll open the shared link in a new tab after capture starts.
            </li>
            <li>Switch to the shared tab and scroll from top to bottom.</li>
            <li>
              Return here and click{" "}
              <span className="font-semibold text-white">Stop capture</span>{" "}
              (auto OCR &amp; import).
            </li>
          </ol>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3">
            <p className="text-xs text-zinc-400 truncate pr-3">{url}</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-medium text-indigo-300 hover:text-indigo-200 shrink-0"
            >
              Open link <ExternalLink size={14} />
            </a>
          </div>

          <div className="mt-4 space-y-2 text-sm text-zinc-300">
            <p className="text-zinc-400 text-xs">
              If frames stay at 0, you likely selected the wrong window/tab in
              the picker.
            </p>
            <p className="text-zinc-500 text-xs">
              Frames captured:{" "}
              <span className="text-zinc-300">{frameCount}</span>
            </p>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="mt-5 flex gap-3">
            {status !== "capturing" ? (
              <button
                onClick={handleStartCapture}
                className={cn(
                  "flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-colors",
                  "bg-indigo-600 hover:bg-indigo-500 text-white"
                )}
              >
                <Video size={18} />
                Start capture
              </button>
            ) : (
              <button
                onClick={handleStopCapture}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
              >
                Stop &amp; import
              </button>
            )}

            <button
              onClick={handleProcess}
              disabled={!frames.length || status === "uploading"}
              className={cn(
                "inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-colors",
                frames.length && status !== "uploading"
                  ? "bg-green-600 hover:bg-green-500 text-white"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              )}
            >
              {status === "uploading" ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <ScanText size={18} />
                  OCR &amp; Import
                </>
              )}
            </button>
          </div>

          <p className="mt-3 text-[11px] text-zinc-500">
            Note: capture requires permission and won’t start automatically
            without a click.
          </p>
        </div>
      </div>
    </div>
  );
}
