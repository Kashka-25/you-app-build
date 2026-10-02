// Mirrors functions/_shared/limit.ts so the app can show each tester their
// beta AI allowance. The server is what enforces it; keep these in step if
// prices or the allowance change (AI_USER_MONTHLY_USD on the server).
export const AI_USER_MONTHLY_USD = 1;

const PRICES = [
  [/^claude-opus-5-5/, 4, 20],
  [/^claude-sonnet-5/, 2, 10],
  [/^claude-haiku-4-5/, 1, 5],
  [/^claude-opus/, 5, 25]
];

export function callCostUsd(model, input, output) {
  const p = PRICES.find(([r]) => r.test(model || "")) || [null, 10, 50];
  return ((input || 0) * p[1] + (output || 0) * p[2]) / 1_000_000;
}
