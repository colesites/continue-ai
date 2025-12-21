import { z } from "zod";

// SSRF protection: Block private networks, localhost, link-local, and metadata IPs
const BLOCKED_IP_RANGES = [
  /^127\./,                    // Loopback
  /^10\./,                     // Private Class A
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private Class B
  /^192\.168\./,               // Private Class C
  /^169\.254\./,               // Link-local
  /^0\./,                      // Current network
  /^100\.(6[4-9]|[7-9][0-9]|1[0-2][0-9])\./, // Carrier-grade NAT
  /^198\.18\./,                // Benchmark testing
  /^::1$/,                     // IPv6 loopback
  /^fc00:/,                    // IPv6 unique local
  /^fe80:/,                    // IPv6 link-local
];

const BLOCKED_HOSTNAMES = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
  "169.254.169.254",           // AWS/GCP metadata
  "metadata.google.com",
];

export function isBlockedHost(hostname: string): boolean {
  const lowerHost = hostname.toLowerCase();
  
  if (BLOCKED_HOSTNAMES.includes(lowerHost)) {
    return true;
  }
  
  for (const pattern of BLOCKED_IP_RANGES) {
    if (pattern.test(hostname)) {
      return true;
    }
  }
  
  return false;
}

export const SharedLinkSchema = z.string().url().refine((url) => {
  try {
    const parsed = new URL(url);
    
    // Must be HTTPS
    if (parsed.protocol !== "https:") {
      return false;
    }
    
    // Check for blocked hosts
    if (isBlockedHost(parsed.hostname)) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}, "Invalid or blocked URL");

export type Provider = "chatgpt" | "gemini" | "claude" | "perplexity" | "grok" | "unknown";

export function detectProvider(url: string): Provider {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    
    if (hostname.includes("chat.openai.com") || hostname.includes("chatgpt.com")) {
      return "chatgpt";
    }
    if (hostname.includes("gemini.google.com") || hostname.includes("aistudio.google.com")) {
      return "gemini";
    }
    if (hostname.includes("claude.ai") || hostname.includes("anthropic.com")) {
      return "claude";
    }
    if (hostname.includes("perplexity.ai")) {
      return "perplexity";
    }
    if (hostname.includes("grok.x.ai") || hostname.includes("x.com/i/grok")) {
      return "grok";
    }
    
    return "unknown";
  } catch {
    return "unknown";
  }
}

export function getProviderDisplayName(provider: Provider): string {
  const names: Record<Provider, string> = {
    chatgpt: "ChatGPT",
    gemini: "Gemini",
    claude: "Claude",
    perplexity: "Perplexity",
    grok: "Grok",
    unknown: "Unknown",
  };
  return names[provider];
}

export function getProviderColor(provider: Provider): string {
  const colors: Record<Provider, string> = {
    chatgpt: "#10a37f",
    gemini: "#4285f4",
    claude: "#cc785c",
    perplexity: "#20b8cd",
    grok: "#ffffff",
    unknown: "#6b7280",
  };
  return colors[provider];
}

