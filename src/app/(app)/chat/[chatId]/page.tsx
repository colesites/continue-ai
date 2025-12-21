import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ChatClient } from "./ChatClient";

// Required for Cache Components - provide at least one param for validation
export async function generateStaticParams() {
  // Return a placeholder - actual chats are dynamic
  return [{ chatId: "placeholder" }];
}

function LoadingFallback() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ChatClient />
    </Suspense>
  );
}
