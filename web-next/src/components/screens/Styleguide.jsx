import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ArrowRight, BookOpen } from "lucide-react";
import { Button, FloatingButton } from "../ui/Button";
import {
  HeroCard,
  JourneyCard,
  ReflectionCard,
  EventCard,
  CommunityCard,
  TherapistCard,
  MediaCard,
  TimelineCard
} from "../ui/Card";
import { SearchInput, FloatingLabelField, MoodSelector } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { ProgressRing } from "../ui/ProgressRing";
import { EmptyState } from "../ui/EmptyState";
import { Skeleton, LoadingScreen } from "../ui/LoadingScreen";

const SWATCHES = [
  ["bg-bg", "Background"],
  ["bg-surface1", "Surface"],
  ["bg-forest", "Primary Forest"],
  ["bg-forestAccent", "Forest Accent"],
  ["bg-sage", "Sage"],
  ["bg-gold", "Warm Gold"],
  ["bg-cream", "Cream"],
  ["bg-ember", "Ember (accent only)"]
];

function Section({ title, children }) {
  return (
    <section className="mb-10">
      <div className="font-serif text-h2 font-medium mb-4 pb-2 border-b border-borderC">{title}</div>
      {children}
    </section>
  );
}

function Row({ label, children }) {
  return (
    <div className="mb-5">
      <div className="text-label uppercase text-textMuted mb-2">{label}</div>
      {children}
    </div>
  );
}

export default function Styleguide() {
  const [mode, setMode] = useState("light");
  const [mood, setMood] = useState("okay");
  const [modalOpen, setModalOpen] = useState(false);

  function toggleMode() {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
    document.documentElement.setAttribute("data-mode", next);
  }

  return (
    <div className="min-h-screen bg-bg text-textPrimary font-sans px-6 py-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/" className="text-bodySm text-textSecondary underline">&larr; back to app</Link>
          <div className="font-serif text-hero mt-2">Component Library</div>
          <div className="text-bodySm text-textSecondary mt-1">Phase 1 — built in isolation against Phase 0 tokens.</div>
        </div>
        <button
          onClick={toggleMode}
          className="border border-borderC bg-surface1 text-textSecondary text-caption px-3 py-1.5 rounded-full flex-none"
        >
          {mode === "light" ? "dark mode" : "light mode"}
        </button>
      </div>

      <Section title="Palette">
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {SWATCHES.map(([bgClass, label]) => (
            <div key={bgClass}>
              <div className={`h-14 rounded-sm border border-borderC ${bgClass}`} />
              <div className="text-caption text-textSecondary mt-1.5">{label}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Brand mark">
        <Row label="Wordmark — transparent PNG, tested against both surfaces below">
          <div className="flex gap-3">
            <div className="bg-surface1 rounded-card p-4 shadow-card">
              <img src="/images/logo-you.png" alt="YOU wordmark" className="h-24 w-auto" />
            </div>
            <div className="bg-forest rounded-card p-4 shadow-card">
              <img src="/images/logo-you.png" alt="YOU wordmark" className="h-24 w-auto" />
            </div>
          </div>
        </Row>
      </Section>

      <Section title="Typography">
        <div className="space-y-2.5">
          <div className="font-serif text-hero">Hero — the living biography</div>
          <div className="font-serif text-h1">H1 — screen heading</div>
          <div className="font-serif text-h2">H2 — section title</div>
          <div className="text-h3 font-medium">H3 — card title</div>
          <div className="text-body">Body — primary copy, used for descriptions and most reading text.</div>
          <div className="text-bodySm text-textSecondary">Body small — secondary copy, meta descriptions.</div>
          <div className="text-caption text-textMuted">Caption — helper text, timestamps.</div>
          <div className="text-label uppercase text-gold">Label — eyebrows, pills</div>
        </div>
      </Section>

      <Section title="Buttons">
        <Row label="Primary / Secondary / Ghost">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </Row>
        <Row label="With icon, small size, disabled">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" icon={ArrowRight}>Continue</Button>
            <Button variant="secondary" size="sm">Small</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
        </Row>
        <Row label="Floating (FAB)">
          <FloatingButton icon={Plus} />
        </Row>
      </Section>

      <Section title="Cards">
        <Row label="Hero — placeholder gradient (no art yet)">
          <HeroCard eyebrow="Chapter Three" title="The Season of Rebuilding" subtitle="March 2025 — present" />
        </Row>
        <Row label="Hero — AI-generated art (light/dark pair, swaps with mode)">
          <HeroCard
            eyebrow="Good Morning"
            title="Your Daily YOU"
            subtitle="Small steps. Big shifts."
            imageLight="/images/home-light.jpg"
            imageDark="/images/home-dark.jpg"
          />
        </Row>
        <Row label="Journey">
          <JourneyCard
            chapter="Life Chapter"
            season="Season of Letting Go"
            title="Learning to trust the process"
            description="A quiet stretch of steady habits and fewer answers than questions."
            filled={3}
          />
        </Row>
        <Row label="Reflection">
          <ReflectionCard
            date="July 12"
            prompt="What has this given you?"
            text="I noticed I didn't reach for my phone first thing this morning. Small, but it felt like proof."
          />
        </Row>
        <Row label="Event">
          <EventCard month="Jul" day="18" title="Full moon circle" time="7:00 PM" location="Online — Community room" />
        </Row>
        <Row label="Community">
          <CommunityCard
            name="Mira K."
            tag="Seeker"
            blurb="Just hit a 30-day streak on morning pages. Feels less like a habit now and more like a room I get to walk into."
            avatarInitial="M"
          />
        </Row>
        <Row label="Therapist">
          <TherapistCard
            name="Leah M."
            specialty="Somatic Therapy & Trauma Informed"
            tags={["Somatic", "Trauma"]}
            rating="5.0"
            avatarInitial="L"
          />
        </Row>
        <Row label="Media">
          <div className="flex gap-3 overflow-x-auto pb-1">
            <MediaCard label="Healing Journey" title="Forest Path" image="/images/healing-forest.jpg" />
            <MediaCard label="Constellation" title="Turning Points" />
            <MediaCard label="Atlas" title="Inner Coastline" />
          </div>
        </Row>
        <Row label="Timeline">
          <div>
            <TimelineCard date="2023" title="Left the old job" description="The first chapter break — everything after reads differently because of this." />
            <TimelineCard date="2024" title="Started therapy" description="Slow, unglamorous, foundational." />
            <TimelineCard date="2025" title="Season of Rebuilding" description="Where the story picks up today." isLast />
          </div>
        </Row>
      </Section>

      <Section title="Inputs">
        <Row label="Rounded search">
          <SearchInput placeholder="Search your biography" />
        </Row>
        <Row label="Floating label field">
          <FloatingLabelField label="What are you working on?" />
        </Row>
        <Row label="Mood selector">
          <MoodSelector value={mood} onChange={setMood} />
        </Row>
      </Section>

      <Section title="Feedback & State">
        <Row label="Progress ring">
          <div className="flex gap-6">
            <ProgressRing value={75} label="Keep flowing" />
            <ProgressRing value={32} label="Just beginning" />
          </div>
        </Row>
        <Row label="Modal / dialog">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>Open modal</Button>
          <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Today's Reflection">
            <div className="text-bodySm text-textSecondary mb-4">
              What made you feel most alive today? This is a shared sheet/dialog primitive — same
              floating-card treatment as everything else, just elevated above a backdrop.
            </div>
            <Button variant="primary" className="w-full" onClick={() => setModalOpen(false)}>Done</Button>
          </Modal>
        </Row>
        <Row label="Empty state">
          <div className="rounded-card bg-surface1 shadow-card">
            <EmptyState
              icon={BookOpen}
              title="No reflections yet"
              description="Your first entry starts the story. Nothing to catch up on — just begin."
              actionLabel="Write one now"
            />
          </div>
        </Row>
        <Row label="Loading — skeleton">
          <div className="rounded-card bg-surface1 p-4 shadow-card space-y-2.5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </Row>
        <Row label="Loading — full state">
          <div className="rounded-card bg-surface1 shadow-card">
            <LoadingScreen />
          </div>
        </Row>
      </Section>
    </div>
  );
}
