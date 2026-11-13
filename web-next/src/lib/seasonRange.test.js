import { describe, it, expect } from "vitest";
import { seasonTo } from "./seasonRange";

describe("seasonTo", () => {
  it("shows an old reading's last Monday as that week's Sunday", () => {
    expect(seasonTo({ from: "2026-11-09", to: "2026-11-09" })).toBe("2026-11-15");
    expect(seasonTo({ kind: "current", from: "2026-09-07", to: "2026-11-09" })).toBe("2026-11-15");
  });
  it("leaves newer readings, which already end on a Sunday, alone", () => {
    expect(seasonTo({ kind: "current", from: "2026-11-09", to: "2026-11-15" })).toBe("2026-11-15");
  });
  it("leaves chosen stretches (season, equinox, look back) as they were asked for", () => {
    expect(seasonTo({ kind: "season", from: "2026-06-01", to: "2026-08-31" })).toBe("2026-08-31");
    expect(seasonTo({ kind: "lookback", from: "2026-01-05", to: "2026-03-02" })).toBe("2026-03-02");
  });
  it("falls back to the start when there is no end", () => {
    expect(seasonTo({ kind: "season", from: "2026-06-01" })).toBe("2026-06-01");
  });
});
