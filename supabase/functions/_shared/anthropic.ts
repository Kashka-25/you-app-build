// Thin wrapper around the Anthropic Messages API for the journal AI
// functions. ANTHROPIC_API_KEY is a project secret and never reaches the browser.
// Pass `usage: { req, fn: "function-name" }` to log tokens to ai_usage.
import { logUsage } from "./usage.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = "claude-sonnet-5";

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } };

// Optional per call: `model` overrides the default above; `fallbacks: true`
// turns on Anthropic's server-side refusal fallback (recommended for the
// Opus 5.5 family), so a safety-classifier refusal is retried on a suitable
// model instead of failing.
export async function callClaude({
  system,
  messages,
  maxTokens = 1500,
  usage,
  model = MODEL,
  fallbacks = false
}: {
  system: string;
  messages: { role: "user" | "assistant"; content: string | ContentBlock[] }[];
  maxTokens?: number;
  usage?: { req?: Request; fn: string };
  model?: string;
  fallbacks?: boolean;
}): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured on this project.");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      ...(fallbacks ? { "anthropic-beta": "server-side-fallback-2026-07-01" } : {})
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages,
      ...(fallbacks ? { fallbacks: "default" } : {})
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  if (usage) await logUsage({ ...usage, data });
  if (data.stop_reason === "refusal") {
    throw new Error("The model declined this request.");
  }

  // Only text blocks: thinking blocks (on by default on newer models) are skipped.
  const text = (data.content || [])
    .filter((b: { type?: string }) => b.type === "text")
    .map((b: { text?: string }) => b.text || "")
    .join("");
  if (!text) throw new Error("Anthropic API returned no text content.");
  return text;
}

// Claude is asked to return JSON directly, but occasionally wraps it in a
// code fence or adds a stray sentence - strip that defensively before parsing.
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