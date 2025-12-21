import * as cheerio from "cheerio";
import type { ProviderParser } from "./types";
import type { NormalizedTranscript, NormalizedMessage } from "../../types";

export const grokParser: ProviderParser = {
  name: "grok",

  detect: (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return (
        parsed.hostname.includes("grok.x.ai") ||
        parsed.hostname.includes("x.com") && parsed.pathname.includes("grok")
      );
    } catch {
      return false;
    }
  },

  fetch: async (url: string): Promise<string> => {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    return response.text();
  },

  parse: async (html: string, url: string): Promise<NormalizedTranscript> => {
    const $ = cheerio.load(html);
    const messages: NormalizedMessage[] = [];

    // Try to find embedded JSON data
    const scripts = $("script").toArray();
    for (const script of scripts) {
      const content = $(script).html();
      if (content?.includes("messages") || content?.includes("conversation")) {
        try {
          const jsonMatch = content.match(/\{[\s\S]*"messages"[\s\S]*\}/);
          if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            if (data.messages && Array.isArray(data.messages)) {
              data.messages.forEach((msg: any, i: number) => {
                if (msg.role && msg.content) {
                  messages.push({
                    role: msg.role === "user" ? "user" : "assistant",
                    content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
                    order: i,
                  });
                }
              });
            }
          }
        } catch {
          // Continue to DOM parsing
        }
      }
    }

    // Fallback: DOM parsing
    if (messages.length === 0) {
      // Grok/X uses specific message containers
      const messageEls = $('[class*="message"], [class*="turn"], [class*="chat-entry"]').toArray();

      messageEls.forEach((el, i) => {
        const $el = $(el);
        const className = $el.attr("class") || "";
        const isUser = className.includes("user") || className.includes("human");
        const content = $el.find('[class*="content"], [class*="text"]').text().trim() ||
          $el.text().trim();

        if (content && content.length > 10) {
          messages.push({
            role: isUser ? "user" : "assistant",
            content,
            order: i,
          });
        }
      });
    }

    // Extract title
    let title = $("title").text().trim();
    if (title.includes("Grok") || title.includes("X")) {
      title = title.replace(/[-–]?\s*(Grok|X)\s*[-–]?/g, "").trim();
    }
    if (!title) {
      title =
        messages.length > 0
          ? messages[0].content.slice(0, 50) + "..."
          : "Imported Grok Chat";
    }

    return {
      provider: "grok",
      title,
      messages,
      sourceUrl: url,
      fetchedAt: Date.now(),
    };
  },
};

