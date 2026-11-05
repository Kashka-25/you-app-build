import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FirstValues } from "./ValuesPanel";

describe("Choosing your first values", () => {
  it("offers the starter values, each with its meaning", () => {
    const html = renderToStaticMarkup(<FirstValues onPick={() => {}} onSeeAll={() => {}} picked={[]} />);
    expect(html).toContain("Choose your first values");
    for (const name of ["Love", "Courage", "Gratitude"]) expect(html).toContain(`>${name}<`);
    expect((html.match(/line-clamp-3/g) || []).length).toBeGreaterThanOrEqual(8);
    expect(html).toContain("See all the values, or name your own");
  });

  it("marks values already chosen and asks for a few more", () => {
    const html = renderToStaticMarkup(<FirstValues onPick={() => {}} onSeeAll={() => {}} picked={[{ name: "Love" }]} />);
    expect(html).toContain("Choose a few more");
    expect(html).toContain('aria-pressed="true"');
  });
});
