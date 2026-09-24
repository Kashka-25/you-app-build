// Thin wrapper around the Anthropic Messages API for the journal AI
// functions. ANTHROPIC_API_KEY is a project secret (already set — the
// existing suggest-chapters / suggest-value-challenges functions depend on
// the same secret) and never reaches the browser.
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = "claude-sonnet-5";

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } };

export async function callClaude({
  system,
  messages,
  maxTokens = 1500
}: {
  system: string;
  messages: { role: "user" | "assistant"; content: string | ContentBlock[] }[];
  maxTokens?: number;
}): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured on this project.");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = (data.content || []).map((b: { text?: string }) => b.text || "").join("");
  if (!text) throw new Error("Anthropic API returned no text content.");
  return text;
}

// Claude is asked to return JSON directly (system prompt enforces "JSON
// only, no prose"), but models occasionally wrap it in a code fence or add
// a stray sentence — strip that defensively before parsing rather than
// letting the whole request fail on an otherwise-usable response.
export function parseJsonResponse<T>(text: string): T {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const startArr = cleaned.indexOf("[");
  const first = start === -1 ? startArr : startArr === -1 ? start : Math.min(start, startArr);
  const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  const jsonSlice = first >= 0 && end >= first ? cleaned.slice(first, end + 1) : cleaned;
  return JSON.parse(jsonSlice) as T;
}
