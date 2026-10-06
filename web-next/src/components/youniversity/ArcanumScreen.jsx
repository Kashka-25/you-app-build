import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Plus, Check, Sparkles, BookOpen } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { FORMATS, getArcanum } from "../../constants/arcana";
import { PILLARS } from "../../constants/app.const";
import { PILLAR_ICONS } from "../../constants/pillarIcons";
import { arcanumProgress } from "../../lib/arcana";
import { BackRow } from "../Primitives";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { Modal } from "../ui/Modal";
import QuestionnaireFlow from "../questionnaires/QuestionnaireFlow";
import ExplorationsView from "../questionnaires/ExplorationsView";
import { ArcanumIcon } from "./YOUniversity";
import CourseArcanum from "../course/CourseArcanum";

function Section({ label, children }) {
  return (
    <div className="mb-6">
      <div className="text-label uppercase text-gold mb-2">{label}</div>
      {children}
    </div>
  );
}

// What a sitting is about: one of the Seeker's values, or a Pillar.
function BeginPicker({ open, onClose, arcanum, onPick }) {
  const { activeValues } = useAppData();
  const byValue = arcanum?.beginWith === "value";
  const choices = byValue
    ? activeValues.map(v => ({ key: v.name, label: v.name }))
    : PILLARS.map(p => ({ key: p, label: p, icon: PILLAR_ICONS[p] }));

  return (
    <Modal open={open} onClose={onClose} title={byValue ? "Which value?" : "Which Pillar?"}>
      {byValue && choices.length === 0 ? (
        <div className="text-bodySm text-textSecondary">
          You don't have any active values yet. <Link to="/you" className="text-forestAccent font-medium">Choose some in the YOU tab</Link>, then come back.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {choices.map(c => {
            const Icon = c.icon;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => onPick(c.key)}
                className="flex items-center gap-2 text-left text-body text-textPrimary bg-surface1 border border-borderC rounded-sm px-3 py-3 hover:border-forestAccent transition-colors duration-150"
              >
                {Icon && <Icon size={16} strokeWidth={1.75} className="text-textMuted flex-none" />}
                <span className="min-w-0 truncate">{c.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

// One Arcanum: what it is, what it adds to YOU, and (once it's in the
// Library) a way in, with every sitting so far.
export default function ArcanumScreen() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { heldArcana, addArcanum, removeArcanum, reflections } = useAppData();
  const arcanum = getArcanum(slug);
  const [picking, setPicking] = useState(false);
  const [sitting, setSitting] = useState(null); // { valueName } | { pillar }
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");

  if (!arcanum) {
    return (
      <div className="pt-1 pb-24 px-5">
        <BackRow />
        <EmptyState icon={BookOpen} title="Arcanum not found" description="It may have moved. Have a look in Explore." />
      </div>
    );
  }

  if (arcanum.format === "course") return <CourseArcanum arcanum={arcanum} />;

  const heldRow = heldArcana.find(h => h.slug === arcanum.slug);
  const p = arcanumProgress(arcanum, reflections);

  async function add() {
    setBusy(true);
    setError("");
    try {
      await addArcanum(arcanum.slug);
    } catch (e) {
      console.error("[Arcanum] add failed:", e);
      setError("Couldn't add that just now. Check your connection and try again.");
    }
    setBusy(false);
  }

  async function remove() {
    setError("");
    try {
      await removeArcanum(arcanum.slug);
      navigate("/youniversity", { replace: true });
    } catch (e) {
      console.error("[Arcanum] remove failed:", e);
      setError("Couldn't remove it just now. Try again.");
    }
  }

  function pick(key) {
    setPicking(false);
    setSitting(arcanum.beginWith === "value" ? { valueName: key } : { pillar: key });
  }

  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <div className="flex items-start gap-3 mt-4 mb-2">
        <ArcanumIcon icon={arcanum.icon} />
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-h2 font-medium m-0">{arcanum.name}</h1>
          <div className="text-caption text-textMuted mt-0.5">
            {FORMATS[arcanum.format]} · {arcanum.free ? "Free" : "Paid"}
            {heldRow && " · In your Library"}
          </div>
        </div>
      </div>
      <div className="font-serif italic text-body text-textSecondary mb-5">{arcanum.tagline}</div>

      {heldRow ? (
        <Button className="w-full mb-2" icon={Sparkles} onClick={() => setPicking(true)}>
          Begin a sitting
        </Button>
      ) : (
        <Button className="w-full mb-2" icon={Plus} disabled={busy} onClick={add}>
          {busy ? "Adding…" : arcanum.free ? "Add to Library · Free" : "Add to Library"}
        </Button>
      )}
      {error && <div role="alert" className="text-bodySm text-red-500 mb-2">{error}</div>}
      {heldRow && p.sittings > 0 && (
        <div className="text-caption text-textMuted text-center mb-2">
          {p.sittings} sitting{p.sittings === 1 ? "" : "s"}, {p.finished} finished. Unfinished ones carry on below.
        </div>
      )}
      <div className="mb-6" />

      <Section label="About">
        <div className="text-body text-textPrimary">{arcanum.about}</div>
      </Section>

      <Section label="Inside">
        <ul className="space-y-1.5">
          {arcanum.inside.map(line => (
            <li key={line} className="flex gap-2 text-bodySm text-textPrimary">
              <Check size={16} strokeWidth={2} className="text-forestAccent flex-none mt-0.5" />
              {line}
            </li>
          ))}
        </ul>
      </Section>

      <Section label="Where it lives in YOU">
        {arcanum.addsTo.map(a => (
          <div key={a.area} className="text-bodySm mb-1.5">
            <span className="text-textPrimary font-medium">{a.area}</span>
            <span className="text-textSecondary"> · {a.line}</span>
          </div>
        ))}
      </Section>

      {heldRow && (
        <>
          <Section label="Your sittings">
            <ExplorationsView
              questionnaire={arcanum.questionnaire}
              empty={<div className="text-bodySm text-textMuted">Nothing yet. Your words will gather here, just for you.</div>}
            />
          </Section>

          {heldRow.source === "free" && (
            <div className="border-t border-borderC pt-4">
              {confirm ? (
                <>
                  <div className="text-bodySm text-textSecondary text-center mb-3">
                    Your sittings stay in Reflections. You can add it back any time.
                  </div>
                  <div className="flex gap-2.5">
                    <Button variant="ghost" size="sm" className="flex-1" onClick={() => setConfirm(false)}>Keep it</Button>
                    <Button variant="secondary" size="sm" className="flex-1" onClick={remove}>Remove it</Button>
                  </div>
                </>
              ) : (
                <Button variant="ghost" size="sm" className="w-full" onClick={() => setConfirm(true)}>
                  Remove from Library
                </Button>
              )}
            </div>
          )}
        </>
      )}

      <BeginPicker open={picking} onClose={() => setPicking(false)} arcanum={arcanum} onPick={pick} />
      <QuestionnaireFlow
        open={Boolean(sitting)}
        onClose={() => setSitting(null)}
        questionnaire={arcanum.questionnaire}
        valueName={sitting?.valueName}
        pillar={sitting?.pillar}
      />
    </div>
  );
}
