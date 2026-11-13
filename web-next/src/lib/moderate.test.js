// The AI output backstop (supabase/functions/_shared/moderate.ts). It has no
// Deno imports, so it runs here too. Added after the 13 Nov 2026 AI test
// found "reducing your medication" slipping past the -e form.
import { describe, it, expect } from "vitest";
import { moderate } from "../../../supabase/functions/_shared/moderate.ts";

const dropped = text => moderate(text).stats.dropped > 0;
const blocked = text => moderate(text).stats.blocked;

describe("moderate: medication advice is dropped", () => {
  const advice = [
    "You could reduce your medication.",
    "Consider reducing your medication for a while.",
    "Maybe stop taking your antidepressants.",
    "Have you thought about stopping your meds?",
    "It might help to start taking your medication again.",
    "You could try skipping your dose on good days.",
    "Coming off your meds could feel freeing.",
    "Tapering off your medication may be worth it.",
    "Lowering your dose could help.",
    "Doubling the dose might be wise.",
    "Weaning yourself off your antidepressants is an option.",
    "Take 50 mg before bed."
  ];
  for (const s of advice) it(s, () => expect(dropped(s)).toBe(true));
});

describe("moderate: healing claims and diagnoses are dropped", () => {
  const lines = [
    "This practice will heal your trauma.",
    "Journaling can cure your anxiety.",
    "You have clinical depression.",
    "You are showing signs of PTSD.",
    "You are clinically depressed."
  ];
  for (const s of lines) it(s, () => expect(dropped(s)).toBe(true));
});

describe("moderate: ordinary reflections are kept", () => {
  const fine = [
    "You wrote about your medication appointment with real courage.",
    "You started a pottery class, and it seems to have brought you joy.",
    "Changing your routine seems to have given you more room to breathe.",
    "You reduced the hours you work, and you sound lighter for it.",
    "Your doctor is the right person to talk to about your medication.",
    "It sounds like a hard week, and you kept going."
  ];
  for (const s of fine) it(s, () => {
    const { value, stats } = moderate(s);
    expect(stats.dropped).toBe(0);
    expect(value).toBe(s);
  });
});

describe("moderate: only the bad sentence goes", () => {
  it("keeps the rest of the reply", () => {
    const { value, stats } = moderate("You've been gentle with yourself. Consider reducing your medication. Keep writing.");
    expect(stats.dropped).toBe(1);
    expect(value).toContain("gentle with yourself");
    expect(value).toContain("Keep writing.");
    expect(value).not.toMatch(/medication/);
  });
  it("leaves skipped keys (the Seeker's own words) untouched", () => {
    const { value } = moderate({ title: "Stop taking your meds?", note: "Stop taking your meds." }, ["title"]);
    expect(value.title).toBe("Stop taking your meds?");
    expect(value.note).toBe("");
  });
});

describe("moderate: self-harm encouragement blocks the whole reply", () => {
  it("blocks", () => expect(blocked("Maybe you should hurt yourself.")).toBe(true));
  it("doesn't block ordinary words", () => expect(blocked("You cut back on coffee this week.")).toBe(false));
});
