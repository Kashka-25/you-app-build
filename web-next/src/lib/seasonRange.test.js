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
  it("leaves Season and Equinox reviews ending on their turning day", () => {
    expect(seasonTo({ kind: "season", from: "2026-06-21", to: "2026-09-23" })).toBe("2026-09-23");
    expect(seasonTo({ kind: "equinox", from: "2026-03-20", to: "2026-09-23" })).toBe("2026-09-23");
  });
  it("shows a look back ending on its last day read, not the day after", () => {
    // "The last two weeks", read on 1 Nov: to is 2 Nov (not included).
    expect(seasonTo({ kind: "lookback", from: "2026-10-18", to: "2026-11-02" })).toBe("2026-11-01");
    expect(seasonTo({ kind: "lookback", from: "2026-01-05", to: "2026-03-02" })).toBe("2026-03-01");
  });
  it("falls back to the start when there is no end", () => {
    expect(seasonTo({ kind: "season", from: "2026-06-01" })).toBe("2026-06-01");
  });
});
