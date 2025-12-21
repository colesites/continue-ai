import { auth } from "@clerk/nextjs/server";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { createGateway, gateway } from "@ai-sdk/gateway";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are Continue AI, an advanced AI assistant. 

The user has imported a conversation from another AI platform and wants to continue it with you. You have access to the full conversation history.

Guidelines:
- Continue naturally from where the previous conversation left off
- Maintain context from the imported messages
- Be helpful, accurate, and thoughtful
- If the conversation was about a specific task, help complete it
- If there were any issues or hallucinations in the previous conversation, help correct them
- Acknowledge the context when appropriate but don't repeatedly mention that you're continuing from another AI`;

export async function POST(req: Request) {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages, model: modelId = "openai/gpt-4o" }: { messages: UIMessage[]; model?: string } = await req.json();

    // Use Vercel AI Gateway - single key for all models.
    // Gateway expects AI_GATEWAY_API_KEY; we also support AI_GATEWAY_TOKEN for convenience.
    const apiKey =
      process.env.AI_GATEWAY_API_KEY ?? process.env.AI_GATEWAY_TOKEN;

    const gw = apiKey ? createGateway({ apiKey }) : null;

    // Format: "provider/model" e.g., "openai/gpt-4o", "anthropic/claude-3-5-sonnet", "google/gemini-2.0-flash"
    const result = streamText({
      model: (gw ? gw(modelId) : gateway(modelId)) as any,
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
