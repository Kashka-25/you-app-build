import { Link, useNavigate } from "react-router-dom";

export function Placeholder({ label, children, tall, className = "" }) {
  return (
    <div
      className={`border border-dashed border-borderC rounded-card bg-surface1 p-4 mb-4 shadow-card ${tall ? "min-h-[110px]" : ""} ${className}`}
    >
      <div className="text-label uppercase text-gold mb-1.5">{label}</div>
      <div className="text-bodySm text-textMuted">{children}</div>
    </div>
  );
}

export function Pill({ children, muted }) {
  return (
    <span
      className={`inline-block text-label px-2.5 py-1 rounded-full mb-2 ${
        muted ? "bg-surface3 text-textMuted" : "bg-forestAccent text-surface2"
      }`}
    >
      {children}
    </span>
  );
}

export function SectionTitle({ children }) {
  return <div className="font-serif text-h2 font-medium mt-5 mb-2.5 first:mt-0">{children}</div>;
}

export function BackRow() {
  const navigate = useNavigate();
  return (
    <div
      className="flex items-center gap-2 mb-2 cursor-pointer text-textSecondary text-bodySm"
      onClick={() => navigate(-1)}
    >
      &larr; back
    </div>
  );
}

export function ParkedScreen({ title, note, children }) {
  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <SectionTitle>{title}</SectionTitle>
      <Pill muted>{note}</Pill>
      {children}
    </div>
  );
}

export function ExploreLink({ to, label, sub }) {
  return (
    <Link to={to} className="block">
      <div className="border border-dashed border-borderC rounded-card bg-surface1 p-4 mb-3 shadow-card cursor-pointer hover:border-borderC/60">
        <div className="text-label uppercase text-gold mb-1.5">{label}</div>
        <div className="text-bodySm text-textMuted">{sub}</div>
      </div>
    </Link>
  );
}
