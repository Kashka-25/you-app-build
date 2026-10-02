// Moderation on AI *output*, never on what the Seeker writes. Every AI
// function runs its reply through this before saving or returning it.
//
// YOU is a mirror, never an authority, and never claims to heal or fix
// (the Codex voice rule). The prompts already say so; this is the backstop
// for when a reply slips anyway:
// - drop: sentences that claim to heal/cure/fix, diagnose the Seeker, or
//   give medication or dosage advice. The rest of the reply still shows.
// - block: anything that encourages self-harm. The whole reply is withheld
//   and the Seeker is gently pointed to support instead.
// Deterministic and free; misses are possible, so the prompts stay the
// first line of defence.

const BLOCK: RegExp[] = [
  /\b(kill|hurt|harm|cut)\s+yourself\b/i,
  /\bend\s+your\s+(own\s+)?life\b/i,
  /\b(take|end)\s+your\s+own\s+life\b/i,
  /\bsuicide\s+(methods?|plans?|notes?)\b/i,
  /\byou\s+(should|could|might\s+as\s+well)\s+(die|disappear\s+forever)\b/i
];

const DROP: RegExp[] = [
  // Healing / fixing / curing claims
  /\b(this|YOU|I|we|it|journal(l)?ing|writing|the\s+app|this\s+practice)\s+(will|can|could|is\s+going\s+to)\s+(heal|cure|fix|treat)\b/i,
  /\b(heal|cure|fix|treat)\s+(you|your)\s+(trauma|depression|anxiety|wounds?|pain|illness|condition|disorder)\b/i,
  // Diagnosing the Seeker
  /\byou\s+(have|are\s+suffering\s+from|suffer\s+from|are\s+showing\s+(clear\s+)?signs\s+of|(may|might|probably|clearly|likely)\s+have)\s+(clinical\s+)?(depression|an?\s+anxiety\s+disorder|ptsd|c-?ptsd|bipolar(\s+disorder)?|adhd|ocd|bpd|borderline(\s+personality\s+disorder)?|an?\s+(eating|personality|mood|mental(\s+health)?)\s+disorder|a\s+mental\s+illness|a\s+trauma\s+disorder)\b/i,
  /\byou\s+are\s+(clinically\s+)?(depressed|bipolar|a\s+narcissist|narcissistic|psychotic|schizophrenic)\b/i,
  // Medication and dosage advice
  /\b(stop|start|increase|decrease|reduce|change|skip|double|come\s+off|taper)\s+(taking\s+)?(your\s+)?(medication|medications|meds|dose|dosage|antidepressants?|prescription)\b/i,
  /\b\d+(\.\d+)?\s?(mg|milligrams|mcg)\b/i
];

export type ModerationStats = { dropped: number; blocked: boolean };

function moderateString(text: string, stats: ModerationStats): string {
  if (BLOCK.some(r => r.test(text))) {
    stats.blocked = true;
    return "";
  }
  // Sentence by sentence, so one bad line doesn't cost the whole reflection.
  const sentences = text.match(/[^.!?\n]+[.!?]*[\s]*|\n+/g) || [text];
  const kept = sentences.filter(s => {
    const bad = DROP.some(r => r.test(s));
    if (bad) stats.dropped++;
    return !bad;
  });
  return kept.join("").trim();
}

// Cleans every string inside a value (string, array or object), except
// the keys listed in `skip` (e.g. the Seeker's own titles echoed back).
export function moderate<T>(value: T, skip: string[] = []): { value: T; stats: ModerationStats } {
  const stats: ModerationStats = { dropped: 0, blocked: false };
  const walk = (v: unknown, key?: string): unknown => {
    if (key && skip.includes(key)) return v;
    if (typeof v === "string") return moderateString(v, stats);
    if (Array.isArray(v)) return v.map(x => walk(x));
    if (v && typeof v === "object") {
      return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, walk(x, k)]));
    }
    return v;
  };
  const cleaned = walk(value) as T;
  if (stats.dropped || stats.blocked) {
    // Counts only: what was said stays private.
    console.warn(`[moderation] dropped ${stats.dropped} sentence(s)${stats.blocked ? ", reply blocked" : ""}`);
  }
  return { value: cleaned, stats };
}

// What the Seeker sees when a reply is withheld.
export const BLOCKED_MESSAGE =
  "YOU couldn't write a reflection for this one. If you're carrying something heavy right now, you don't have to hold it alone: findahelpline.com can connect you with someone to talk to, wherever you are.";
