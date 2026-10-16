import { describe, expect, it } from "vitest";
import { creditLine, kronkProfileUrl, pickFeatured, safeUrl, saveGate, supportLinks } from "./showcase";

const live = (id, placements, featured_at, extra = {}) => ({ id, status: "live", placements, featured_at, ...extra });

describe("pickFeatured", () => {
  it("takes the most recently featured live piece in that placement", () => {
    const works = [
      live("a", ["home_background", "gallery"], "2026-10-01T00:00:00Z"),
      live("b", ["home_background"], "2026-10-10T00:00:00Z"),
      live("c", ["gallery"], "2026-10-12T00:00:00Z"),
      { id: "d", status: "waiting", placements: ["home_background"], featured_at: "2026-10-15T00:00:00Z" }
    ];
    expect(pickFeatured(works, "home_background").id).toBe("b");
    expect(pickFeatured(works, "gallery").id).toBe("c");
    expect(pickFeatured(works, "featured_words")).toBeNull();
  });
});

describe("links", () => {
  it("keeps https only", () => {
    expect(safeUrl("https://ko-fi.com/ana")).toBe("https://ko-fi.com/ana");
    expect(safeUrl("http://ko-fi.com/ana")).toBeNull();
    expect(safeUrl("javascript:alert(1)")).toBeNull();
    expect(safeUrl("not a url")).toBeNull();
  });

  it("labels support links and drops bad ones", () => {
    expect(
      supportLinks([
        { kind: "kofi", url: "https://ko-fi.com/ana" },
        { kind: "weird", label: "My shop", url: "https://shop.example" },
        { kind: "paypal", url: "javascript:void(0)" }
      ])
    ).toEqual([
      { kind: "kofi", label: "Ko-fi", url: "https://ko-fi.com/ana" },
      { kind: "other", label: "My shop", url: "https://shop.example/" }
    ]);
    expect(supportLinks(null)).toEqual([]);
  });

  it("turns a Kronk handle into a profile link", () => {
    expect(kronkProfileUrl("@ana@Kronk.Social")).toBe("https://kronk.social/@ana");
    expect(kronkProfileUrl("ana")).toBeNull();
    expect(kronkProfileUrl(null)).toBeNull();
  });
});

describe("saveGate", () => {
  it("lets free pieces be saved", () => {
    expect(saveGate(live("a", ["gallery"], null, { save_mode: "free" }), false).ok).toBe(true);
  });
  it("asks for a contribution first when the artist chose that", () => {
    const w = live("a", ["gallery"], null, { save_mode: "contribution" });
    expect(saveGate(w, false)).toEqual({ ok: false, reason: "needs-contribution" });
    expect(saveGate(w, true).ok).toBe(true);
  });
  it("never saves a piece that isn't live", () => {
    expect(saveGate({ status: "removed", save_mode: "free" }, true).ok).toBe(false);
  });
});

describe("creditLine", () => {
  it("names the artist and who offered it", () => {
    expect(creditLine("Ana", [])).toBe("By Ana");
    expect(creditLine("Ana", [{ role: "offered_by", name: "Ben" }])).toBe("By Ana · offered by Ben");
    expect(creditLine("Ana", [{ role: "offered_by", name: "Ben" }, { role: "offered_by", name: "Cleo" }, { role: "offered_by", name: "Dee" }])).toBe(
      "By Ana · offered by Ben, Cleo and Dee"
    );
  });
});
