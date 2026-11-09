import { Mail } from "lucide-react";

// The invitation at the end of the demo (Cassidy, Nov 9): YOU is in beta
// testing, and anyone who'd like to join the beta or hear when it's
// published can email. A plain mailto link, so nothing is sent from here.
export const BETA_EMAIL = "YourOwnUniverse.life@gmail.com";
const SUBJECT = "YOU beta";
const BODY = "Hi,\n\nI tried the YOU demo and I'd like to (choose one):\n- join the beta test\n- hear when YOU is published\n\nThanks!";
export const BETA_MAILTO = `mailto:${BETA_EMAIL}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(BODY)}`;

export default function BetaInvite({ className = "" }) {
  return (
    <div className={`rounded-card p-4 border border-[color-mix(in_srgb,var(--gold)_45%,transparent)] bg-[color-mix(in_srgb,var(--gold)_10%,var(--surface-1))] ${className}`}>
      <p className="text-label uppercase text-textMuted m-0">YOU is in beta testing</p>
      <p className="font-serif text-h3 font-semibold text-textPrimary mt-1 mb-1">Want to join the beta, or hear when YOU is published?</p>
      <p className="text-bodySm text-textSecondary m-0">Send an email and say which you'd like.</p>
      <a
        href={BETA_MAILTO}
        className="mt-3 inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full bg-forestAccent text-onAccent text-bodySm font-medium"
      >
        <Mail size={16} strokeWidth={1.75} className="flex-none" aria-hidden="true" />
        Write an email
      </a>
      {/* The address in full too, to copy if email links don't open anything. */}
      <p className="text-caption text-textMuted mt-2 mb-0 break-all select-all">{BETA_EMAIL}</p>
    </div>
  );
}
