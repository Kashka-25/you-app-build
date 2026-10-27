import { Link } from "react-router-dom";
import { describeSources, useAiSources } from "../../lib/aiSources";

// "Draws from your YOUrnal, Moments and harvests · Change" under an AI
// feature, so it's always clear where it looks (Cassidy, Oct 27). `uses` is
// every source the feature can read; only the allowed ones are named.
export default function DrawsFrom({ uses, className = "" }) {
  const allowed = useAiSources();
  const on = uses.filter(k => allowed.has(k));
  const off = uses.filter(k => !allowed.has(k));
  return (
    <div className={`text-caption text-textMuted ${className}`}>
      Draws from {describeSources(on)}
      {off.length > 0 && <> (not {describeSources(off).replace(/^your /, "")})</>}
      {" · "}
      <Link to="/settings#ai" className="underline underline-offset-2">Change what AI can read</Link>
    </div>
  );
}
