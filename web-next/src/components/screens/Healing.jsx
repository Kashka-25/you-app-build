import { ParkedScreen, Placeholder } from "../Primitives";

export default function Healing() {
  return (
    <ParkedScreen title="Healing journey" note="parked — designed, not wired to production">
      <Placeholder label="healing timeline" tall>
        Session cards — therapy, breathwork, ceremony, EMDR, etc. Mood before/after, insights, breakthroughs.
      </Placeholder>
      <Placeholder label="session entry" tall>repeat</Placeholder>
    </ParkedScreen>
  );
}
