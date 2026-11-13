// The last day a season reading covers. Readings saved before 13 Nov 2026
// stored the Monday that starts their last week, so they read "9 Nov – 9 Nov";
// those are shown to the week's Sunday. Newer ones already store the Sunday.
export function seasonTo(based = {}) {
  const to = based.to || based.from;
  if (!to || (based.kind && based.kind !== "current")) return to;
  const d = new Date(to + "T00:00:00Z");
  if (Number.isNaN(d.getTime()) || d.getUTCDay() !== 1) return to;
  d.setUTCDate(d.getUTCDate() + 6);
  return d.toISOString().slice(0, 10);
}
