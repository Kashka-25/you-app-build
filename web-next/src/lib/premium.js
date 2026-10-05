// YOU Premium. Every AI feature in YOU (journal and weekly reflections,
// Seasons, chapter suggestions, value challenges, Scan a page) is part of
// YOU Premium, a future subscription. While YOU is in beta it's open to
// everyone, within the beta allowance (see aiCost.js and the Edge
// Functions' _shared/limit.ts).
//
// To make AI subscription-only:
//   1. set PREMIUM_OPEN_IN_BETA to false here, and
//   2. set the Supabase secret AI_REQUIRE_PREMIUM=true (the server's gate).
// entitlements.is_premium is then what decides, written only by the
// service role (e.g. a payment webhook).
//
// Paid Arcana (courses bought in YOUniversity) are separate from this:
// owning a course never depends on Premium.
export const PREMIUM_OPEN_IN_BETA = true;

export const PREMIUM_NAME = "YOU Premium";

export const PREMIUM_REQUIRED_MESSAGE =
  "AI reflections are part of YOU Premium. Everything else in YOU keeps working, and anything you write is saved.";

export function canUseAi(entitlement) {
  return PREMIUM_OPEN_IN_BETA || Boolean(entitlement?.is_premium);
}
