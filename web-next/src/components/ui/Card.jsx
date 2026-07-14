import { Clock, MapPin } from "lucide-react";

// Imagery is still an open Phase 0 decision (real photography vs AI-generated).
// These gradients are stand-ins for wherever a hero/media image will land.
const IMAGE_PLACEHOLDER = "bg-gradient-to-br from-forest via-forestAccent to-sage";

export function HeroCard({ eyebrow, title, subtitle, children }) {
  return (
    <div className="relative rounded-card overflow-hidden shadow-card h-56">
      <div className={`absolute inset-0 ${IMAGE_PLACEHOLDER}`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
      <div className="relative h-full flex flex-col justify-end p-5">
        {eyebrow && <div className="text-label uppercase text-cream/80 mb-1">{eyebrow}</div>}
        <div className="font-serif text-hero text-cream">{title}</div>
        {subtitle && <div className="text-bodySm text-cream/85 mt-1">{subtitle}</div>}
        {children}
      </div>
    </div>
  );
}

export function JourneyCard({ chapter, season, title, description, segments = 5, filled = 3 }) {
  return (
    <div className="rounded-card bg-surface1 border border-borderC p-4 shadow-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-label uppercase text-gold">{chapter}</span>
        <span className="text-caption text-textSecondary italic font-serif">{season}</span>
      </div>
      <div className="font-serif text-h3 text-textPrimary mb-1">{title}</div>
      <div className="text-bodySm text-textSecondary mb-3">{description}</div>
      <div className="flex gap-1">
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < filled ? "bg-forestAccent" : "bg-surface3"}`} />
        ))}
      </div>
    </div>
  );
}

export function ReflectionCard({ date, prompt, text }) {
  return (
    <div className="rounded-card bg-surface1 border-l-2 border-gold p-4 shadow-card">
      <div className="text-caption text-textMuted mb-1.5">{date}</div>
      {prompt && <div className="text-label uppercase text-textSecondary mb-1.5">{prompt}</div>}
      <div className="font-serif text-body italic text-textPrimary leading-relaxed">&ldquo;{text}&rdquo;</div>
    </div>
  );
}

export function EventCard({ month, day, title, time, location }) {
  return (
    <div className="rounded-card bg-surface1 border border-borderC p-4 shadow-card flex gap-3.5">
      <div className="flex-none w-12 text-center rounded-sm bg-surface3 py-1.5 h-fit">
        <div className="text-label uppercase text-textMuted">{month}</div>
        <div className="font-serif text-h2 text-textPrimary leading-none mt-0.5">{day}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-h3 font-medium text-textPrimary mb-1.5">{title}</div>
        <div className="text-caption text-textSecondary flex items-center gap-1.5">
          <Clock size={12} strokeWidth={1.75} />
          {time}
        </div>
        <div className="text-caption text-textSecondary flex items-center gap-1.5 mt-1">
          <MapPin size={12} strokeWidth={1.75} />
          {location}
        </div>
      </div>
    </div>
  );
}

export function CommunityCard({ name, tag, blurb, avatarInitial }) {
  return (
    <div className="rounded-card bg-surface1 border border-borderC p-4 shadow-card flex gap-3">
      <div className="w-10 h-10 rounded-full bg-forestAccent text-surface2 flex items-center justify-center font-serif text-h3 flex-none">
        {avatarInitial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-h3 font-medium text-textPrimary">{name}</span>
          <span className="text-label uppercase text-gold">{tag}</span>
        </div>
        <div className="text-bodySm text-textSecondary mt-1">{blurb}</div>
      </div>
    </div>
  );
}

export function MediaCard({ label, title }) {
  return (
    <div className="rounded-card overflow-hidden shadow-card relative w-40 h-28 flex-none">
      <div className={`absolute inset-0 ${IMAGE_PLACEHOLDER}`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="relative h-full flex flex-col justify-end p-2.5">
        {label && <span className="text-label uppercase text-cream/80">{label}</span>}
        <span className="text-bodySm text-cream font-medium">{title}</span>
      </div>
    </div>
  );
}

export function TimelineCard({ date, title, description, isLast }) {
  return (
    <div className="flex gap-3.5">
      <div className="flex flex-col items-center flex-none">
        <div className="w-2.5 h-2.5 rounded-full bg-gold mt-1.5" />
        {!isLast && <div className="w-px flex-1 bg-borderC mt-1" />}
      </div>
      <div className={`flex-1 min-w-0 ${isLast ? "" : "pb-5"}`}>
        <div className="text-caption text-textMuted mb-0.5">{date}</div>
        <div className="text-h3 font-medium text-textPrimary mb-1">{title}</div>
        <div className="text-bodySm text-textSecondary">{description}</div>
      </div>
    </div>
  );
}
