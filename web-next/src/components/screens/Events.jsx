import { useState } from "react";
import { BackRow, SectionTitle } from "../Primitives";
import { EventCard } from "../ui/Card";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";

// Mock data — no events/booking backend exists yet. Join state is local
// only (not persisted); structure is real, the data source isn't.
const MOCK_EVENTS = [
  { id: 1, month: "Jul", day: "18", title: "Full moon circle", time: "7:00 PM", location: "Online — Community room" },
  { id: 2, month: "Jul", day: "25", title: "Sound healing journey", time: "6:00 PM", location: "Brisbane" },
  { id: 3, month: "Aug", day: "02", title: "Nature walk", time: "8:00 AM", location: "Gold Coast" }
];

export default function Events() {
  const [joined, setJoined] = useState([]);

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
