import { useState, useEffect, useMemo } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { BackRow, SectionTitle } from "../Primitives";
import { EventCard } from "../ui/Card";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { CalendarGrid, dateKey } from "../ui/CalendarGrid";
import { fetchKronkEvents } from "../../lib/kronkClient";

// Mock data — no events/booking backend exists yet. Join state and
// personal activities are local only (not persisted); structure is real,
// the data source isn't.
const MOCK_EVENTS = [
  { id: 1, date: "2026-07-18", month: "Jul", day: "18", title: "Full moon circle", time: "7:00 PM", location: "Online — Community room" },
  { id: 2, date: "2026-07-25", month: "Jul", day: "25", title: "Sound healing journey", time: "6:00 PM", location: "Brisbane" },
  { id: 3, date: "2026-08-02", month: "Aug", day: "02", title: "Nature walk", time: "8:00 AM", location: "Gold Coast" }
];

function formatKronkEvent(e) {
  const d = new Date(e.date);
  return {
    id: e.id,
    date: e.date.slice(0, 10),
    month: d.toLocaleDateString("en-AU", { month: "short" }),
    day: d.toLocaleDateString("en-AU", { day: "2-digit" }),
    time: d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }),
    title: e.title,
    organizer: e.organizer,
    link: e.kronkUrl,
    source: "Kronk"
  };
}

function todayKey() {
  const d = new Date();
  return dateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

// Avoids the classic `new Date("YYYY-MM-DD")` UTC/local off-by-one-day
// pitfall -- parses the key as local calendar components instead.
function formatDayLabel(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" });
}

export default function Events() {
  const [joined, setJoined] = useState([]);
  const [kronkEvents, setKronkEvents] = useState([]);
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [personalActivities, setPersonalActivities] = useState([]);
  const [addingActivity, setAddingActivity] = useState(false);
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDate, setActivityDate] = useState(todayKey);
  const [activityTime, setActivityTime] = useState("");

  // fetchKronkEvents() is the one integration seam here -- see
  // lib/kronkClient.js. Everything else in this screen just renders
  // whatever it resolves to.
  useEffect(() => {
    fetchKronkEvents().then(events => setKronkEvents(events.map(formatKronkEvent)));
  }, []);

  function toggleJoin(id) {
    setJoined(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  }

  function addActivity() {
    if (!activityTitle.trim()) return;
    setPersonalActivities(prev => [
      ...prev,
      { id: `p${Date.now()}`, title: activityTitle.trim(), date: activityDate, time: activityTime }
    ]);
    setSelectedDate(activityDate);
    setActivityTitle("");
    setActivityTime("");
    setAddingActivity(false);
  }

  const markedDates = useMemo(() => {
    const set = new Set();
    MOCK_EVENTS.forEach(e => set.add(e.date));
    kronkEvents.forEach(e => set.add(e.date));
    personalActivities.forEach(a => set.add(a.date));
    return set;
  }, [kronkEvents, personalActivities]);

  const dayAgenda = useMemo(() => {
    const events = MOCK_EVENTS.filter(e => e.date === selectedDate).map(e => ({ kind: "Event", title: e.title, meta: e.time }));
    const kronk = kronkEvents.filter(e => e.date === selectedDate).map(e => ({ kind: "Kronk", title: e.title, meta: e.time }));
    const personal = personalActivities
      .filter(a => a.date === selectedDate)
      .map(a => ({ kind: "Personal", title: a.title, meta: a.time }));
    return [...events, ...kronk, ...personal];
  }, [selectedDate, kronkEvents, personalActivities]);

  function shiftMonth(delta) {
    setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  const yourEvents = MOCK_EVENTS.filter(e => joined.includes(e.id));

  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <SectionTitle>Events</SectionTitle>

      <div className="text-label uppercase text-textMuted mb-2 flex items-center gap-1.5">
        <CalendarDays size={13} strokeWidth={1.75} />
        Calendar
      </div>
      <CalendarGrid
        month={viewMonth}
        markedDates={markedDates}
        selectedDate={selectedDate}
        todayDate={todayKey()}
        onSelectDate={setSelectedDate}
        onPrevMonth={() => shiftMonth(-1)}
        onNextMonth={() => shiftMonth(1)}
      />

      <div className="mt-3 mb-3">
        <div className="text-label uppercase text-textMuted mb-2">{formatDayLabel(selectedDate)}</div>
        {dayAgenda.length === 0 ? (
          <div className="text-bodySm text-textMuted">Nothing on this day yet.</div>
        ) : (
          <div className="space-y-2">
            {dayAgenda.map((item, i) => (
              <div key={i} className="rounded-sm bg-surface1 px-3 py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-bodySm text-textPrimary">{item.title}</div>
                  {item.meta && <div className="text-caption text-textMuted">{item.meta}</div>}
                </div>
                <span className="text-caption uppercase text-gold flex-none">{item.kind}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {addingActivity ? (
        <div className="rounded-card bg-surface1 shadow-card p-4 mb-5">
          <div className="text-label uppercase text-textMuted mb-2">Add a personal activity</div>
          <input
            className="w-full bg-surface2 border border-borderC rounded-sm px-3 py-2 text-body mb-2 outline-none focus:border-forestAccent"
            placeholder="What's happening?"
            value={activityTitle}
            onChange={e => setActivityTitle(e.target.value)}
          />
          <div className="flex gap-2 mb-3">
            <input
              type="date"
              className="flex-1 bg-surface2 border border-borderC rounded-sm px-3 py-2 text-bodySm outline-none focus:border-forestAccent"
              value={activityDate}
              onChange={e => setActivityDate(e.target.value)}
            />
            <input
              type="time"
              className="flex-1 bg-surface2 border border-borderC rounded-sm px-3 py-2 text-bodySm outline-none focus:border-forestAccent"
              value={activityTime}
              onChange={e => setActivityTime(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => setAddingActivity(false)}>Cancel</Button>
            <Button variant="primary" size="sm" className="flex-1" onClick={addActivity}>Add</Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" icon={Plus} className="w-full mb-5" onClick={() => setAddingActivity(true)}>
          Add a personal activity
        </Button>
      )}

      <SectionTitle>Upcoming</SectionTitle>
      {MOCK_EVENTS.map(e => (
        <div key={e.id} className="mb-3">
          <EventCard month={e.month} day={e.day} title={e.title} time={e.time} location={e.location} />
          <Button
            variant={joined.includes(e.id) ? "secondary" : "primary"}
            size="sm"
            className="w-full -mt-1"
            onClick={() => toggleJoin(e.id)}
          >
            {joined.includes(e.id) ? "Joined — tap to leave" : "Join"}
          </Button>
        </div>
      ))}

      {kronkEvents.length > 0 && (
        <>
          <SectionTitle>From Kronk</SectionTitle>
          {kronkEvents.map(e => (
            <EventCard
              key={e.id}
              month={e.month}
              day={e.day}
              title={e.title}
              time={e.time}
              organizer={e.organizer}
              link={e.link}
              source={e.source}
            />
          ))}
        </>
      )}

      <SectionTitle>Your events</SectionTitle>
      {yourEvents.length === 0 ? (
        <EmptyState title="No events joined yet" description="Events you join will show up here." />
      ) : (
        yourEvents.map(e => (
          <EventCard key={e.id} month={e.month} day={e.day} title={e.title} time={e.time} location={e.location} />
        ))
      )}
    </div>
  );
}
