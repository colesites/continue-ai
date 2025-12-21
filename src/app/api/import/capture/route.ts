import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { streamText } from "ai";
import { createGateway, gateway } from "@ai-sdk/gateway";
import { NormalizedTranscriptSchema } from "@/features/import/types";

// Allow up to 60s for multimodal OCR + parsing
export const maxDuration = 60;

const RequestSchema = z.object({
  url: z.string().url(),
  frames: z.array(z.string().min(10)).min(1).max(24),
  model: z.string().optional(),
});

function extractJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const json = text.slice(start, end + 1);
  return JSON.parse(json);
}

async function getResultText(result: unknown): Promise<string> {
  const anyResult = result as any;
  const t = anyResult?.text;
  if (typeof t === "function") return await t.call(anyResult);
  return await t;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request. Provide url and up to 24 image frames." },
        { status: 400 }
      );
    }

    const { url, frames, model: modelId = "openai/gpt-4o" } = parsed.data;

    // Use Vercel AI Gateway if configured
    const apiKey =
      process.env.AI_GATEWAY_API_KEY ?? process.env.AI_GATEWAY_TOKEN;
    const gw = apiKey ? createGateway({ apiKey }) : null;

    const prompt = `You are extracting a chat transcript from screenshots of a shared AI chat page (Gemini/ChatGPT/Claude/etc).

Return ONLY valid JSON in this exact shape:
{
  "provider": string,
  "title": string,
  "messages": Array<{ "role": "user" | "assistant" | "system", "content": string, "order": number }>,
  "sourceUrl": string,
  "fetchedAt": number
}

Rules:
- Keep message order correct (top to bottom). Use order starting at 0 and increment by 1.
- Merge wrapped lines into single message content.
- Remove duplicated lines caused by scrolling overlap.
- If roles are unclear, best-guess; never omit content.
- provider can be "gemini" | "chatgpt" | "claude" | "perplexity" | "grok" | "unknown".
- sourceUrl must be the url provided.
- fetchedAt must be Date.now() (milliseconds).
`;

    // Multimodal content parts. We pass data URLs directly; gateway models typically accept this.
    const contentParts: any[] = [{ type: "text", text: prompt }];
    for (const frame of frames) {
      contentParts.push({ type: "image", image: frame });
    }

    const result = streamText({
      model: (gw ? gw(modelId) : gateway(modelId)) as any,
      messages: [
        {
          role: "user",
          content: contentParts,
        } as any,
      ],
    });

    const text = await getResultText(result);
    const obj = extractJsonObject(text);
    const transcriptParsed = NormalizedTranscriptSchema.safeParse(obj);

    if (!transcriptParsed.success) {
      return NextResponse.json(
        {
          error:
            "OCR succeeded but parsing failed. Try capturing slower / fewer frames.",
        },
        { status: 422 }
      );
    }

    if (!transcriptParsed.data.messages?.length) {
      return NextResponse.json(
        {
          error:
            "We couldn’t extract any messages from the capture. Try starting at the top and scrolling slower.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, transcript: transcriptParsed.data });
  } catch (error) {
    console.error("Import capture error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


