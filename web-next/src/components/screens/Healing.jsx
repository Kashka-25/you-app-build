import { BackRow, SectionTitle, Pill } from "../Primitives";
import { TimelineCard } from "../ui/Card";

// Mock timeline — parked until Empatherapy exists to feed real sessions.
const MOCK_SESSIONS = [
  { date: "May 15, 2024", title: "Breathwork Session", description: "With Maya. Felt a huge release. Clarity followed." },
  { date: "Apr 22, 2024", title: "Somatic Therapy", description: "With Leah. Began healing my relationship with my body." },
  { date: "Mar 10, 2024", title: "EMDR Session", description: "With Leah. Processed childhood trauma.", isLast: true }
];

export default function Healing() {
  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <SectionTitle>Healing journey</SectionTitle>
      <Pill muted>parked — designed, not wired to production</Pill>

      <SectionTitle>Healing timeline</SectionTitle>
      {MOCK_SESSIONS.map(s => (
        <TimelineCard key={s.title} {...s} />
      ))}
    </div>
  );
}
