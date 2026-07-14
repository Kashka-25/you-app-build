import { BackRow, SectionTitle, Placeholder } from "../Primitives";

export default function Events() {
  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <SectionTitle>Events</SectionTitle>
      <Placeholder label="upcoming event" tall>card, join button</Placeholder>
      <Placeholder label="upcoming event" tall>card</Placeholder>
      <Placeholder label="your events">booked list</Placeholder>
    </div>
  );
}
