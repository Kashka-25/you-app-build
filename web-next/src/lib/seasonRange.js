const shift = (day, n) => {
  const d = new Date(day + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return day;
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// The last day a season reading covers.
// - Your season (kind "current"): readings saved before 13 Nov 2026 stored
//   the Monday that starts their last week, so they read "9 Nov – 9 Nov";
//   those are shown to the week's Sunday. Newer ones already store the Sunday.
// - A look back ("the last two weeks", "since a date") stores the day after
//   the last one read (infer-season reads up to, not including, `to`), so
//   it's shown a day earlier: it ended today, not tomorrow.
// - Season and Equinox reviews end on the solstice or equinox itself.
export function seasonTo(based = {}) {
  const to = based.to || based.from;
  if (!to) return to;
  if (based.kind === "lookback") return based.to && based.to > based.from ? shift(to, -1) : to;
  if (based.kind && based.kind !== "current") return to;
  const d = new Date(to + "T00:00:00Z");
  if (Number.isNaN(d.getTime()) || d.getUTCDay() !== 1) return to;
  return shift(to, 6);
}
