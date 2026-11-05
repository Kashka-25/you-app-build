import { describe, expect, it } from "vitest";
import { buildStory, SECTIONS } from "./myStory";

const include = Object.fromEntries(SECTIONS.map(s => [s.key, true]));
const data = {
  loaded: true,
  profile: { name: "Test" },
  moments: [
    { id: "m1", title: "Sea swim", moment_date: "2026-03-10" },
    { id: "m2", title: "Mountain", moment_date: "2026-06-01" }
  ],
  highlights: [
    { text: "Words from May", entry_date: "2026-05-02", entry_id: "e2" },
    { text: "Words from March", entry_date: "2026-03-10", entry_id: "e1" },
    { text: "More from that March entry", entry_date: "2026-03-10", entry_id: "e1" }
  ],
  weekHarvests: [{ week_start: "2026-04-06", note: "A gentle week" }],
  journalEntries: [], memory: [], wanderings: [], wanderingStops: [], seasons: [], chapters: [], values: [], identityVisions: [], items: []
};

describe("My Story's year flow", () => {
  it("weaves memories, kept words and harvests together by date", () => {
    const book = buildStory(data, include);
    const year = book.years.find(y => y.year === 2026);
    expect(year.flow.map(f => `${f.kind}:${f.date}`)).toEqual([
      "memory:2026-03-10",
      "words:2026-03-10",
      "harvest:2026-04-06",
      "words:2026-05-02",
      "memory:2026-06-01"
    ]);
  });

  it("gathers lines from one entry into a single passage", () => {
    const year = buildStory(data, include).years.find(y => y.year === 2026);
    const march = year.flow.find(f => f.kind === "words" && f.date === "2026-03-10");
    expect(march.lines).toEqual(["Words from March", "More from that March entry"]);
  });
});
