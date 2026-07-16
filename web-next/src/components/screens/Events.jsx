import { useState, useEffect } from "react";
import { BackRow, SectionTitle } from "../Primitives";
import { EventCard } from "../ui/Card";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { fetchKronkEvents } from "../../lib/kronkClient";

// Mock data — no events/booking backend exists yet. Join state is local
// only (not persisted); structure is real, the data source isn't.
const MOCK_EVENTS = [
  { id: 1, month: "Jul", day: "18", title: "Full moon circle", time: "7:00 PM", location: "Online — Community room" },
  { id: 2, month: "Jul", day: "25", title: "Sound healing journey", time: "6:00 PM", location: "Brisbane" },
  { id: 3, month: "Aug", day: "02", title: "Nature walk", time: "8:00 AM", location: "Gold Coast" }
];

function formatKronkEvent(e) {
  const d = new Date(e.date);
  return {
    id: e.id,
    month: d.toLocaleDateString("en-AU", { month: "short" }),
    day: d.toLocaleDateString("en-AU", { day: "2-digit" }),
    time: d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }),
    title: e.title,
    organizer: e.organizer,
    link: e.kronkUrl,
    source: "Kronk"
  };
}

export default function Events() {
  const [joined, setJoined] = useState([]);
  const [kronkEvents, setKronkEvents] = useState([]);

  // fetchKronkEvents() is the one integration seam here -- see
  // lib/kronkClient.js. Everything else in this screen just renders
  // whatever it resolves to.
  useEffect(() => {
    fetchKronkEvents().then(events => setKronkEvents(events.map(formatKronkEvent)));
  }, []);

  function toggleJoin(id) {
    setJoined(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  }

  const yourEvents = MOCK_EVENTS.filter(e => joined.includes(e.id));

  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <SectionTitle>Events</SectionTitle>

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
