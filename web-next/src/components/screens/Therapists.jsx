import { ParkedScreen, Placeholder } from "../Primitives";

// Empatherapy-powered practitioner discovery — separate from Healing
// Journey (which is session history), don't merge these two.
export default function Therapists() {
  return (
    <ParkedScreen title="Therapists" note="Empatherapy-powered practitioner discovery — coming soon">
      <Placeholder label="practitioner card" tall>Specialty, rating, book a session</Placeholder>
      <Placeholder label="practitioner card" tall>repeat</Placeholder>
    </ParkedScreen>
  );
}
