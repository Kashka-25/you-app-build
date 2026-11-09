import { describe, expect, it } from "vitest";
import { BETA_EMAIL, BETA_MAILTO } from "./BetaInvite";

describe("the beta invitation", () => {
  it("emails Cassidy's YOU address with a helpful subject", () => {
    expect(BETA_EMAIL).toBe("YourOwnUniverse.life@gmail.com");
    const url = new URL(BETA_MAILTO);
    expect(url.protocol).toBe("mailto:");
    expect(url.pathname).toBe(BETA_EMAIL);
    expect(url.searchParams.get("subject")).toBe("YOU beta");
    expect(url.searchParams.get("body")).toMatch(/join the beta test/);
  });
});
