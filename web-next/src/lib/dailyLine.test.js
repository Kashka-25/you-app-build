import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { DAILY_LINES, dailyLine, dayNumber } from "./dailyLine";

describe("dailyLine", () => {
  it("is the same all day", () => {
    expect(dailyLine(new Date(2026, 10, 13, 0, 5))).toBe(dailyLine(new Date(2026, 10, 13, 23, 55)));
  });
  it("changes with the day, and comes round again", () => {
    const today = new Date(2026, 10, 13);
    const tomorrow = new Date(2026, 10, 14);
    expect(dailyLine(tomorrow)).not.toBe(dailyLine(today));
    const later = new Date(2026, 10, 13 + DAILY_LINES.length);
    expect(dailyLine(later)).toBe(dailyLine(today));
  });
  it("counts whole local days", () => {
    expect(dayNumber(new Date(1970, 0, 2, 12))).toBe(1);
  });
  it("matches the copy index.html paints before the app arrives", () => {
    const html = readFileSync(fileURLToPath(new URL("../../index.html", import.meta.url)), "utf8");
    const list = html.match(/var lines = (\[[\s\S]*?\]);/);
    expect(list, "index.html's splash script").toBeTruthy();
    expect(JSON.parse(list[1])).toEqual(DAILY_LINES);
  });
});
