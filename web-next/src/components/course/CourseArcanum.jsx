import { useState } from "react";
import { Check, ChevronDown, Clock, Lock } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { FORMATS } from "../../constants/arcana";
import { useCourse } from "../../lib/course";
import { BackRow } from "../Primitives";
import CourseHero from "./CourseHero";
import CoursePath from "./CoursePath";
import GiftCode from "../youniversity/GiftCode";

function Section({ label, children }) {
  return (
    <div className="mb-6">
      <div className="text-label uppercase tracking-[0.12em] text-gold mb-2">{label}</div>
      {children}
    </div>
  );
}

function About({ arcanum, course, showStages = true }) {
  return (
    <>
      <Section label="About">
        <div className="text-body text-textPrimary whitespace-pre-line">{arcanum.about}</div>
      </Section>
      <Section label="Inside">
        <ul className="space-y-1.5 m-0 p-0 list-none">
          {arcanum.inside.map(line => (
            <li key={line} className="flex gap-2 text-bodySm text-textPrimary">
              <Check size={16} strokeWidth={2} className="text-forestAccent flex-none mt-0.5" />
              {line}
            </li>
          ))}
        </ul>
      </Section>
      {course && showStages && (
        <Section label="The seven stages">
          <div className="grid grid-cols-2 gap-2.5">
            {course.stages.map((s, i) => {
              const Icon = course.tools[s.practice.tool].icon;
              return (
                <div key={s.id} className="rounded-card bg-surface1 border border-borderC p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-caption font-semibold text-gold">{String(i + 1).padStart(2, "0")}</span>
                    <Icon size={18} strokeWidth={1.5} className="text-textMuted" />
                  </div>
                  <div className="font-serif text-[17px] leading-tight text-textPrimary mt-2">{s.name}</div>
                  <div className="text-caption text-textMuted mt-0.5">{s.short}</div>
                </div>
              );
            })}
          </div>
        </Section>
      )}
      {course && showStages && (
        <Section label="Tools you'd keep">
          <div className="flex flex-wrap gap-2">
            {Object.values(course.tools).map(t => {
              const Icon = t.icon;
              return (
                <span key={t.name} className="inline-flex items-center gap-1.5 text-bodySm text-textSecondary bg-surface1 border border-borderC rounded-full px-3 py-1.5">
                  <Icon size={14} strokeWidth={1.75} className="text-gold" /> {t.name}
                </span>
              );
            })}
          </div>
        </Section>
      )}
      <Section label="Where it lives in YOU">
        {arcanum.addsTo.map(a => (
          <div key={a.area} className="text-bodySm mb-1.5">
            <span className="text-textPrimary font-medium">{a.area}</span>
            <span className="text-textSecondary"> · {a.line}</span>
          </div>
        ))}
      </Section>
    </>
  );
}

// A course Arcanum's page: the full course once held; otherwise what it is.
export default function CourseArcanum({ arcanum }) {
  const { heldArcana, arcanaLoaded: loaded } = useAppData();
  const course = useCourse(arcanum);
  const held = heldArcana.find(h => h.slug === arcanum.slug);
  const [aboutOpen, setAboutOpen] = useState(false);

  if (!loaded || !course) {
    return (
      <div className="pt-1 pb-24 px-5">
        <BackRow />
        <div className="text-body text-textSecondary text-center mt-16">Opening…</div>
      </div>
    );
  }

  if (held) {
    return (
      <div className="pt-1 pb-24 px-5">
        <BackRow />
        <div className="mt-3">
          <CoursePath arcanum={arcanum} course={course} />
        </div>
        <div className="border-t border-borderC pt-4">
          <button type="button" onClick={() => setAboutOpen(o => !o)} aria-expanded={aboutOpen} className="w-full flex items-center justify-between py-1 mb-3">
            <span className="font-serif text-h3 text-textPrimary">About this Arcanum</span>
            <ChevronDown size={17} strokeWidth={1.75} className={`text-textMuted transition-transform duration-200 ${aboutOpen ? "rotate-180" : ""}`} />
          </button>
          {aboutOpen && <About arcanum={arcanum} course={course} showStages={false} />}
          <div className="text-caption text-textMuted text-center mt-2">
            {FORMATS[arcanum.format]} · {held.source === "gift" ? "A gift" : "Yours"} · In your Library
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <div className="mt-3">
        <CourseHero arcanum={arcanum} eyebrow={`YOUniversity · ${FORMATS[arcanum.format]}`}>
          <button disabled className="w-full min-h-[48px] rounded-full bg-surface3 text-textSecondary font-medium text-body flex items-center justify-center gap-2 cursor-not-allowed">
            {arcanum.comingSoon ? <><Clock size={17} strokeWidth={1.75} /> Coming soon</> : <><Lock size={16} strokeWidth={1.75} /> Not in your Library</>}
          </button>
          {arcanum.comingSoon && <div className="text-caption text-textMuted text-center mt-2">This Arcanum isn't available to buy yet. It's being made ready.</div>}
          <div className="mt-4 flex justify-center"><GiftCode /></div>
        </CourseHero>
      </div>
      <About arcanum={arcanum} course={course} />
    </div>
  );
}
