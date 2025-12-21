import { create } from "zustand";
import type { Provider } from "@/utils/url-safety";
import type { ImportPreviewResponse, NormalizedTranscript } from "../types";

interface ImportStore {
  // State
  status: "idle" | "scanning" | "previewing" | "importing" | "error" | "success";
  url: string;
  provider: Provider | null;
  preview: ImportPreviewResponse | null;
  manualTranscript: string;
  error: string | null;
  chatId: string | null;
  requiresManualPaste: boolean;

  // Actions
  setUrl: (url: string) => void;
  setProvider: (provider: Provider) => void;
  setManualTranscript: (text: string) => void;
  startScan: () => void;
  scanSuccess: (preview: ImportPreviewResponse) => void;
  scanError: (error: string, requiresManualPaste?: boolean) => void;
  startImport: () => void;
  importSuccess: (chatId: string) => void;
  importError: (error: string) => void;
  reset: () => void;
}

export const useImportStore = create<ImportStore>((set) => ({
  // Initial state
  status: "idle",
  url: "",
  provider: null,
  preview: null,
  manualTranscript: "",
  error: null,
  chatId: null,
  requiresManualPaste: false,

  // Actions
  setUrl: (url) => set({ url }),
  setProvider: (provider) => set({ provider }),
  setManualTranscript: (text) => set({ manualTranscript: text }),

  startScan: () =>
    set({
      status: "scanning",
      error: null,
      preview: null,
      requiresManualPaste: false,
    }),

  scanSuccess: (preview) =>
    set({
      status: "previewing",
      preview,
      provider: preview.provider,
      error: null,
    }),

  scanError: (error, requiresManualPaste = false) =>
    set({
      status: "error",
      error,
      requiresManualPaste,
    }),

  startImport: () =>
    set({
      status: "importing",
      error: null,
    }),

  importSuccess: (chatId) =>
    set({
      status: "success",
      chatId,
      error: null,
    }),

  importError: (error) =>
    set({
      status: "error",
      error,
    }),

  reset: () =>
    set({
      status: "idle",
      url: "",
      provider: null,
      preview: null,
      manualTranscript: "",
      error: null,
      chatId: null,
      requiresManualPaste: false,
    }),
}));

