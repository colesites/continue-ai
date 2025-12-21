"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ConvexClientProvider } from "@/lib/convex";
import { QueryProvider } from "@/lib/query-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#6366f1",
          colorBackground: "#111113",
          colorInputBackground: "#18181b",
          colorInputText: "#fafafa",
          borderRadius: "0.75rem",
        },
        elements: {
          formButtonPrimary:
            "bg-indigo-600 hover:bg-indigo-500 text-white font-medium",
          card: "bg-[#111113] border border-[#27272a]",
          headerTitle: "text-white",
          headerSubtitle: "text-zinc-400",
          socialButtonsBlockButton:
            "bg-[#18181b] border-[#27272a] text-white hover:bg-[#27272a]",
          formFieldLabel: "text-zinc-300",
          formFieldInput: "bg-[#18181b] border-[#27272a] text-white",
          footerActionLink: "text-indigo-400 hover:text-indigo-300",
        },
      }}
    >
      <QueryProvider>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </QueryProvider>
    </ClerkProvider>
  );
}

