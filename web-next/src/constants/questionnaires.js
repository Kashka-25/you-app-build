// Questionnaire wording. DRAFT (Sep 28) — written to YOU's voice guide,
// for Cassidy to edit. One question per screen; every screen can be left
// and returned to. `{value}` / `{pillar}` are filled in at render time.
//
// Voice: grounded, gentle, non-dogmatic. YOU never claims to heal or fix;
// it holds space for light and shadow both.

// ── Light & Shadow of a Value ──
// Light = the value lived well · Shadow = its excess · Void = its absence ·
// Integration = holding both.
export const LIGHT_SHADOW_STEPS = [
  {
    kind: "light",
    title: "Light",
    question: "When {value} is alive in you, what does it look like? Think of a moment you lived it well.",
    hint: "A small, ordinary moment counts."
  },
  {
    kind: "shadow",
    title: "Shadow",
    question: "Every light casts a shadow. When {value} goes too far in you, what happens?",
    hint: "No judgement here — the shadow is part of the whole.",
    support: true
  },
  {
    kind: "void",
    title: "Void",
    question: "And when {value} is missing — when you can't reach it — what does that feel like?",
    hint: "Notice it, without needing to fix it.",
    support: true
  },
  {
    kind: "integration",
    title: "Integration",
    question: "Holding the light and the shadow together, what might a balanced {value} look like in your life this season?",
    hint: "One true sentence is enough."
  }
];

// ── Freeing the Dream (per Pillar) ──
// Longing → Vision → Weight → Seed, then plant into Pursue, hold as a
// seed, or release. Each Pillar gets its own wording of the same arc.
export const DREAM_STAGES = [
  { kind: "longing", title: "Longing" },
  { kind: "vision", title: "Vision" },
  { kind: "weight", title: "Weight", support: true },
  { kind: "seed", title: "Seed" }
];

export const DREAM_QUESTIONS = {
  Body: {
    longing: "What does your body long for that it isn't getting?",
    vision: "Imagine living in your body the way you wish you could. What does an ordinary day feel like?",
    weight: "What makes that feel far away, or not quite allowed?",
    seed: "What's the smallest way you could honour this in your body this week?"
  },
  Heart: {
    longing: "What is your heart quietly asking for?",
    vision: "If your heart felt held and free, how would you move through a day?",
    weight: "What old feeling or story stands between you and that?",
    seed: "What's one gentle thing you could offer your heart this week?"
  },
  Mind: {
    longing: "What does your mind hunger to learn, explore or understand?",
    vision: "Picture your mind fed and clear. What are you curious about, and what are you making of it?",
    weight: "What crowds out the space for that right now?",
    seed: "What's one small door you could open for your mind this week?"
  },
  Spirit: {
    longing: "What does your spirit reach toward — what gives you a sense of something larger?",
    vision: "If that connection were woven through your days, what would change?",
    weight: "What makes it hard to make room for it?",
    seed: "What's one small practice or moment that could hold it this week?"
  },
  Connection: {
    longing: "What kind of closeness, love or belonging are you longing for?",
    vision: "Imagine being truly met by the people in your life. What does that look and feel like?",
    weight: "What makes that connection feel hard to reach?",
    seed: "Who could you reach toward, even a little, this week?"
  },
  Purpose: {
    longing: "What do you long to give, build or contribute?",
    vision: "If your work carried your purpose, what would you be doing, and for whom?",
    weight: "What holds you back — practically, or inside?",
    seed: "What's the smallest step toward it you could take this week?"
  },
  Play: {
    longing: "Where are you longing for more joy, adventure or creativity?",
    vision: "Imagine a life with room to play. What are you doing, making or exploring?",
    weight: "What tells you there isn't time or permission for that?",
    seed: "What's one playful thing you could say yes to this week?"
  },
  "Home & Earth": {
    longing: "What are you longing for in your home, your place, or your bond with the natural world?",
    vision: "Picture the place that would truly feel like home. What's around you, and how do you live there?",
    weight: "What makes it feel unreachable right now?",
    seed: "What's one small way to tend your place, or the earth around it, this week?"
  }
};

export const DREAM_OUTCOMES = [
  { key: "planted", title: "Plant it", desc: "Add it to Pursue as a dream" },
  { key: "held", title: "Hold it as a seed", desc: "Keep it here, not yet ready to grow" },
  { key: "released", title: "Release it", desc: "Let it go with thanks — it has done its work" }
];

// Quiet, non-alarming support link for heavier screens. An international
// directory rather than one country's line.
export const SUPPORT_LINK = {
  label: "If this stirs up something heavy, you don't have to hold it alone.",
  cta: "Find support near you",
  url: "https://findahelpline.com"
};

export function fill(text, vars) {
  return text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}
