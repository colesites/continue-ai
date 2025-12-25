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
    id: "openai/gpt-5.2",
    name: "GPT-5.2",
    provider: "openai",
    description: "Fast and efficient",
  },
  // Anthropic (via AI Gateway)
  {
    id: "anthropic/claude-3-5-sonnet-latest",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    description: "Excellent reasoning",
  },
  {
    id: "anthropic/claude-3-5-haiku-latest",
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    description: "Fast responses",
  },
  // Google (via AI Gateway)
  {
    id: "google/gemini-3.0-flash",
    name: "Gemini 3.0 Flash",
    provider: "google",
    description: "Latest Gemini model",
  },
  {
    id: "google/gemini-3.0-pro",
    name: "Gemini 3.0 Pro",
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
