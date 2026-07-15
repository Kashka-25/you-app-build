import { ArrowLeft } from "lucide-react";
import { SectionTitle, Placeholder } from "../../Primitives";

export default function ConstellationsDetail({ onBack }) {
  return (
    <div className="pt-1 pb-24 px-5">
      <button onClick={onBack} className="flex items-center gap-1.5 text-bodySm text-textSecondary mb-2">
        <ArrowLeft size={16} strokeWidth={1.75} />
        Back
      </button>
      <SectionTitle>Life constellations</SectionTitle>
      <Placeholder label="star map" className="min-h-[240px]">
        Meaningful memories as stars. Connecting stars reveals patterns. Pulled from Memory Bank.
      </Placeholder>
    </div>
  );
}
