import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function pad(n) {
  return String(n).padStart(2, "0");
}

export function dateKey(year, month, day) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function buildCells(year, month) {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // 0 = Monday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length < 42) cells.push(null); // fixed 6 rows -- no layout jump between months
  return cells;
}

// month: a Date anywhere within the month to display.
// markedDates: Set of "YYYY-MM-DD" strings to show a dot under.
// selectedDate / todayDate: "YYYY-MM-DD" strings.
export function CalendarGrid({ month, markedDates, selectedDate, todayDate, onSelectDate, onPrevMonth, onNextMonth }) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const cells = buildCells(year, monthIndex);
  const label = month.toLocaleDateString("en-AU", { month: "long", year: "numeric" });

  return (
    <div className="rounded-card bg-surface1 shadow-card p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={onPrevMonth} aria-label="Previous month" className="text-textSecondary p-1">
          <ChevronLeft size={18} strokeWidth={1.75} />
        </button>
        <div className="font-serif text-h3 text-textPrimary">{label}</div>
        <button onClick={onNextMonth} aria-label="Next month" className="text-textSecondary p-1">
          <ChevronRight size={18} strokeWidth={1.75} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1.5 text-center">
        {WEEKDAY_LABELS.map((w, i) => (
          <div key={i} className="text-caption text-textMuted">{w}</div>
        ))}

        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const key = dateKey(year, monthIndex, day);
          const marked = markedDates.has(key);
          const selected = key === selectedDate;
          const today = key === todayDate;
          return (
            <button
              key={i}
              onClick={() => onSelectDate(key)}
              className={`aspect-square flex flex-col items-center justify-center rounded-full text-bodySm ${
                selected
                  ? "bg-forestAccent text-surface2 font-medium"
                  : today
                  ? "border border-gold text-textPrimary"
                  : "text-textPrimary"
              }`}
            >
              {day}
              <span
                className={`w-1 h-1 rounded-full mt-0.5 ${
                  marked ? (selected ? "bg-surface2" : "bg-gold") : "bg-transparent"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
