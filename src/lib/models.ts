export interface ModelOption {
  id: string; // Format: "provider/model" for Vercel AI Gateway
  name: string;
  provider: "openai" | "anthropic" | "google";
  description: string;
  isDefault?: boolean;
}

// Using Vercel AI Gateway format: "provider/model"
// All accessible with a single AI_GATEWAY_API_KEY (or AI_GATEWAY_TOKEN) via AI Gateway
export const AVAILABLE_MODELS: ModelOption[] = [
  // OpenAI
  {
    id: "openai/gpt-5",
    name: "GPT-5",
    provider: "openai",
    description: "Most capable OpenAI model",
    isDefault: true,
  },
  {
    id: "openai/gpt-5-pro",
    name: "GPT-5 Pro",
    provider: "openai",
    description: "Advanced capabilities",
  },
  {
    id: "openai/gpt-5.1-thinking",
    name: "GPT-5.1 Thinking",
    provider: "openai",
    description: "Advanced capabilities",
  },
  {
    id: "openai/gpt-5.1-instant",
    name: "GPT-5.1 Instant",
    provider: "openai",
    description: "Advanced capabilities",
  },
  {
    id: "openai/gpt-5.2",
    name: "GPT-5.2",
    provider: "openai",
    description: "Fast and efficient",
  },
  {
    id: "openai/gpt-5.2-pro",
    name: "GPT-5.2 Pro",
    provider: "openai",
    description: "Advanced capabilities",
  },

  // Anthropic (via AI Gateway)
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    provider: "anthropic",
    description: "Advanced capabilities",
  },
  {
    id: "anthropic/claude-opus-4",
    name: "Claude Opus 4",
    provider: "anthropic",
    description: "Advanced capabilities",
  },
  {
    id: "anthropic/claude-opus-4.1",
    name: "Claude Opus 4.1",
    provider: "anthropic",
    description: "Excellent reasoning",
  },
  {
    id: "anthropic/claude-haiku-4.5",
    name: "Claude Haiku 4.5",
    provider: "anthropic",
    description: "Fast responses",
  },
  {
    id: "anthropic/claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    provider: "anthropic",
    description: "Advanced capabilities",
  },
  {
    id: "anthropic/claude-opus-4.5",
    name: "Claude Opus 4.5",
    provider: "anthropic",
    description: "Advanced capabilities",
  },
  // Google (via AI Gateway)
  {
    id: "google/gemini-3-flash",
    name: "Gemini 3 Flash",
    provider: "google",
    description: "Latest Gemini model",
  },
  {
    id: "google/gemini-3.0-pro-preview",
    name: "Gemini 3 Pro Preview",
    provider: "google",
    description: "Advanced capabilities",
  },
];

export function getModelById(id: string): ModelOption | undefined {
  return AVAILABLE_MODELS.find((m) => m.id === id);
}

export function getDefaultModel(): ModelOption {
  return AVAILABLE_MODELS.find((m) => m.isDefault) || AVAILABLE_MODELS[0];
}

export function getProviderColor(provider: ModelOption["provider"]): string {
  const colors = {
    openai: "#10a37f",
    anthropic: "#cc785c",
    google: "#4285f4",
  };
  return colors[provider];
}
