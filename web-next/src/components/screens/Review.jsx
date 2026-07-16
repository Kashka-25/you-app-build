import { useState } from "react";
import { BackRow, SectionTitle } from "../Primitives";
import { Button } from "../ui/Button";

// In-app feedback / suggestion box -- confirmed purpose per
// BUILD-BACKLOG.md. No feedback backend exists yet, so submission is
// honest about not persisting anywhere real (same pattern as the
// Add-sheet's journal entry).
const CATEGORIES = ["Feature request", "Bug report", "Something to remove"];

export default function Review() {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <SectionTitle>Review</SectionTitle>
      <div className="text-bodySm text-textSecondary mb-4">
        Tell us what's working, what isn't, or what you'd like to see.
      </div>

      {submitted ? (
        <div className="rounded-card bg-surface1 shadow-card p-4">
          <div className="text-body text-textPrimary mb-1">Thank you.</div>
          <div className="text-bodySm text-textSecondary">
            Noted — there's no feedback inbox wired up yet, so this isn't stored anywhere real yet, but the flow's ready for when it is.
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-1.5 mb-3">
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`text-caption px-2.5 py-1.5 rounded-full ${
                  category === c ? "bg-forestAccent text-surface2" : "bg-surface3 text-textMuted"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <textarea
            className="w-full bg-surface1 border border-borderC rounded-sm px-3.5 py-3 text-body outline-none focus:border-forestAccent mb-3"
            rows={5}
            placeholder="Share your thoughts..."
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <Button variant="primary" className="w-full" disabled={!text.trim()} onClick={() => setSubmitted(true)}>
            Submit
          </Button>
        </>
      )}
    </div>
  );
}
