import { useState } from "react";
import { ParkedScreen } from "../Primitives";
import { TherapistCard } from "../ui/Card";
import { Button } from "../ui/Button";

// Mock practitioners -- Empatherapy-powered discovery doesn't exist yet.
// Booking is a local confirmation only, not a real request.
const MOCK_THERAPISTS = [
  { name: "Maya R.", specialty: "Breathwork & Energy Healing", tags: ["Breathwork", "Reiki"], rating: "5.0", avatarInitial: "M" },
  { name: "Leah S.", specialty: "Somatic Therapy & Trauma Informed", tags: ["Somatic", "Trauma"], rating: "5.0", avatarInitial: "L" },
  { name: "Kai T.", specialty: "Integration & Psychedelic Support", tags: ["Integration"], rating: "4.9", avatarInitial: "K" }
];

export default function Therapists() {
  const [requested, setRequested] = useState([]);

  return (
    <ParkedScreen title="Therapists" note="Empatherapy-powered practitioner discovery — coming soon">
      {MOCK_THERAPISTS.map(t => (
        <div key={t.name} className="mb-3">
          <TherapistCard {...t} />
          <Button
            variant={requested.includes(t.name) ? "secondary" : "primary"}
            size="sm"
            className="w-full -mt-1"
            disabled={requested.includes(t.name)}
            onClick={() => setRequested(prev => [...prev, t.name])}
          >
            {requested.includes(t.name) ? "Request sent" : "Book a session"}
          </Button>
        </div>
      ))}
    </ParkedScreen>
  );
}
