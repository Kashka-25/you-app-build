import { useMemo, useState } from "react";
import { SunMoon, Feather, ChevronDown, Trash2 } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { EmptyState } from "../ui/EmptyState";
import { Button } from "../ui/Button";
import QuestionnaireFlow, { AnswerSummary } from "./QuestionnaireFlow";
import { LIGHT_SHADOW_STEPS, DREAM_STAGES } from "../../constants/questionnaires";

const OUTCOME_LABEL = { planted: "Planted", held: "Held as a seed", released: "Released" };

function niceDate(iso) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// Every questionnaire sitting, newest first. Just for the Seeker: readable,
// resumable, and theirs to let go of entirely. `questionnaire` narrows it to
// one (an Arcanum's own page); `empty` replaces the empty state.
export default function ExplorationsView({ questionnaire = null, empty = null }) {
  const { reflections, deleteReflectionSession } = useAppData();
  const [openId, setOpenId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [resume, setResume] = useState(null); // session to continue

  const sessions = useMemo(() => {
    const bySession = {};
    reflections.filter(r => r.session_id && (!questionnaire || r.questionnaire === questionnaire)).forEach(r => {
      (bySession[r.session_id] ||= []).push(r);
    });
    return Object.entries(bySession).map(([id, rows]) => {
      const first = rows[0];
      const answers = Object.fromEntries(rows.map(r => [r.kind, r.body]));
      const lightShadow = first.questionnaire === "light_shadow";
      const done = lightShadow ? Boolean(answers.integration) : Boolean(answers.outcome);
      return {
        id, rows, answers, done,
        questionnaire: first.questionnaire,
        valueName: first.value_name,
        pillar: first.pillar,
        title: lightShadow ? `Light & Shadow · ${first.value_name}` : `Freeing the Dream · ${first.pillar}`,
        icon: lightShadow ? SunMoon : Feather,
        steps: lightShadow ? LIGHT_SHADOW_STEPS : DREAM_STAGES,
        at: rows.reduce((m, r) => (r.updated_at > m ? r.updated_at : m), first.inserted_at)
      };
    }).sort((a, b) => (b.at > a.at ? 1 : -1));
  }, [reflections, questionnaire]);

  if (sessions.length === 0) {
    if (empty) return empty;
    return (
      <EmptyState
        icon={SunMoon}
        title="No explorations yet"
        description="Open Light & Shadow or Freeing the Dream from your Library in YOUniversity, or from a value or Pillar in the YOU tab. What you write stays here, just for you."
      />
    );
  }

  return (
    <div>
      {sessions.map(s => {
        const open = openId === s.id;
        const Icon = s.icon;
        return (
          <div key={s.id} className="rounded-card bg-surface1 shadow-card p-4 mb-3">
            <button onClick={() => setOpenId(open ? null : s.id)} className="w-full flex items-center gap-3 text-left">
              <Icon size={18} strokeWidth={1.75} className="text-forestAccent flex-none" />
              <div className="flex-1 min-w-0">
                <div className="text-body text-textPrimary">{s.title}</div>
                <div className="text-caption text-textMuted">
                  {niceDate(s.at)} · {s.answers.outcome ? OUTCOME_LABEL[s.answers.outcome] : s.done ? "Complete" : "In progress"}
                </div>
              </div>
              <ChevronDown size={16} strokeWidth={1.75} className={`text-textMuted flex-none transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
              <div className="pt-3">
                <AnswerSummary steps={s.steps} answers={s.answers} />
                <div className="flex gap-2.5">
                  {!s.done && (
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => setResume(s)}>
                      Continue
                    </Button>
                  )}
                  {confirmId === s.id ? (
                    <>
                      <Button variant="ghost" size="sm" className="flex-1" onClick={() => setConfirmId(null)}>Keep them</Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => { deleteReflectionSession(s.id); setConfirmId(null); setOpenId(null); }}
                      >
                        Yes, let them go
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" size="sm" icon={Trash2} className="flex-1" onClick={() => setConfirmId(s.id)}>
                      Let these words go
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <QuestionnaireFlow
        open={Boolean(resume)}
        onClose={() => setResume(null)}
        questionnaire={resume?.questionnaire}
        valueName={resume?.valueName}
        pillar={resume?.pillar}
        sessionId={resume?.id}
      />
    </div>
  );
}
