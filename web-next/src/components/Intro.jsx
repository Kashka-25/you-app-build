import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, Compass, Download, Feather, MoreVertical, Share, SquarePlus, Sprout, X } from "lucide-react";
import { BetaBadge } from "./SignIn";
import { devicePlatform, isInstalled, isIPhoneSafari, useInstallPrompt } from "../lib/install";
import { easeOut } from "./ui/motion";

// Seen once per device, before signing in for the first time.
export const INTRO_SEEN = "you.intro.seen";
export function introSeen() {
  try { return localStorage.getItem(INTRO_SEEN) === "1"; } catch { return false; }
}
export function markIntroSeen() {
  try { localStorage.setItem(INTRO_SEEN, "1"); } catch { /* private window */ }
}

const WAYS = [
  { icon: Sprout, text: "Sow a few habits, goals and dreams each week, and tend them one small step at a time." },
  { icon: Compass, text: "Find the values that guide you, and let them become your compass." },
  { icon: Feather, text: "Write down what's on your mind in your YOUrnal. It stays private to you." }
];

// The first page a brand-new YOUser sees: what YOU is for, how to keep it on
// their phone, then into creating an account. Also at /welcome, so the
// link can be shared. onContinue("signup" | "signin").
export default function Intro({ onContinue, between = null }) {
  const reduceMotion = useReducedMotion();
  const rise = (delay = 0) =>
    reduceMotion
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } }
      : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay, ease: easeOut } };

  function go(mode) {
    markIntroSeen();
    onContinue(mode);
  }

  return (
    <div className="min-h-dvh you-sky flex justify-center font-sans">
      <main
        className="w-full max-w-[480px] px-6 flex flex-col"
        style={{ paddingTop: "max(env(safe-area-inset-top), 28px)", paddingBottom: "max(env(safe-area-inset-bottom), 28px)" }}
      >
        <motion.div {...rise()} className="flex flex-col items-center text-center">
          <img src="/logo-full.png" alt="YOU — Your Own Universe" width="720" height="621" className="w-full max-w-[200px] h-auto" />
          <BetaBadge className="mt-3" />
        </motion.div>

        <motion.section {...rise(0.1)} className="mt-8">
          <h1 className="font-serif text-h1 text-textPrimary leading-tight mb-4 text-center">Welcome to Your Own Universe</h1>
          <div className="rounded-card bg-[color-mix(in_srgb,var(--surface-1)_88%,transparent)] shadow-card p-5">
            <p className="text-body text-textPrimary mb-3">
              YOU is a quiet place to grow into who you already are, at your own pace.
            </p>
            <ul className="space-y-3 mb-4">
              {WAYS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-bodySm text-textSecondary">
                  <Icon size={18} strokeWidth={1.75} className="text-gold flex-none mt-0.5" aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
            <p className="text-bodySm text-textSecondary mb-4">
              No streaks to keep and nothing to catch up on. Over time, your days become your story.
            </p>
            <p className="text-bodySm text-textSecondary">
              YOU is in beta, and you're one of the first to walk through it. What you tell us shapes what it becomes.
            </p>
            <p className="font-serif italic text-body text-textMuted mt-4 text-right">A message directly from YOU</p>
          </div>
        </motion.section>

        {between}

        <motion.div {...rise(0.2)}>
          <InstallCard />
        </motion.div>
        <SharePointer />

        <motion.div {...rise(0.3)} className="mt-8 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => go("signup")}
            className="min-h-[50px] rounded-sm bg-forestAccent text-onAccent font-medium"
          >
            Create my account
          </button>
          <button type="button" onClick={() => go("signin")} className="min-h-[44px] text-bodySm text-textSecondary">
            I already have an account
          </button>
          <a href="/privacy" className="block text-center text-caption text-textMuted mt-2 underline underline-offset-2">
            Privacy &amp; beta terms
          </a>
        </motion.div>
      </main>
    </div>
  );
}

// How to keep YOU on this phone. Hidden once it's opened from the home screen.
export function InstallCard() {
  const [platform] = useState(devicePlatform);
  const { canPrompt, install } = useInstallPrompt();
  const [added, setAdded] = useState(false);
  if (isInstalled()) return null;

  return (
    <section className="mt-6 rounded-card border border-borderC bg-[color-mix(in_srgb,var(--surface-1)_70%,transparent)] p-5">
      <h2 className="font-serif text-h3 text-textPrimary mb-1">Keep YOU on your phone</h2>
      <p className="text-bodySm text-textSecondary mb-4">
        No app store needed. YOU installs straight from this page and opens like any other app.
      </p>

      {added ? (
        <p className="text-bodySm text-sage">Added. You'll find YOU on your home screen.</p>
      ) : canPrompt ? (
        <button
          type="button"
          onClick={async () => setAdded(await install())}
          className="w-full min-h-[46px] rounded-sm border border-forestAccent text-textPrimary font-medium inline-flex items-center justify-center gap-2"
        >
          <Download size={17} strokeWidth={1.75} /> Add YOU to my home screen
        </button>
      ) : platform === "ios" ? (
        <Steps
          steps={[
            [Share, <>Tap the <b>Share</b> button in your browser's toolbar. On newer iPhones, tap <b>•••</b> first.</>],
            [SquarePlus, <>Scroll down and choose <b>Add to Home Screen</b>.</>],
            [null, <>Tap <b>Add</b>. YOU appears with your other apps.</>]
          ]}
        />
      ) : platform === "android" ? (
        <Steps
          steps={[
            [MoreVertical, <>Tap the <b>⋮</b> menu in the top corner of Chrome.</>],
            [SquarePlus, <>Choose <b>Install app</b> or <b>Add to Home screen</b>.</>],
            [null, <>Tap <b>Install</b>. YOU appears with your other apps.</>]
          ]}
        />
      ) : (
        <ScanToOpen />
      )}
    </section>
  );
}

function Steps({ steps }) {
  return (
    <ol className="space-y-3">
      {steps.map(([Icon, text], n) => (
        <li key={n} className="flex items-start gap-3 text-bodySm text-textSecondary">
          <span className="w-6 h-6 rounded-full bg-[color-mix(in_srgb,var(--gold)_18%,transparent)] text-gold text-caption font-semibold flex items-center justify-center flex-none">
            {n + 1}
          </span>
          <span className="pt-0.5 [&_b]:text-textPrimary [&_b]:font-medium">
            {text}
            {Icon && <Icon size={15} strokeWidth={1.75} className="inline ml-1.5 -mt-0.5 text-textMuted" aria-hidden="true" />}
          </span>
        </li>
      ))}
    </ol>
  );
}

// On a computer: a code to scan with the phone's camera, which opens this
// same page there, ready to install.
function ScanToOpen() {
  const url = `${window.location.origin}/welcome`;
  const [svg, setSvg] = useState("");
  useEffect(() => {
    // Dark on light in both modes: phone cameras read it most reliably.
    QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#3A2618", light: "#FFFDF8" } })
      .then(setSvg)
      .catch(e => console.error("[Intro] QR code failed:", e));
  }, [url]);
  return (
    <div className="flex items-center gap-4">
      <div
        className="w-[120px] h-[120px] flex-none rounded-sm overflow-hidden bg-[#FFFDF8] p-1.5 shadow-card [&_svg]:w-full [&_svg]:h-full"
        role="img"
        aria-label={`QR code that opens ${url}`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className="text-bodySm text-textSecondary">
        Point your phone's camera at the code to open YOU there, then add it to your home screen. Or visit{" "}
        <b className="text-textPrimary font-medium break-all">{window.location.host}</b>. You can use YOU here on the computer too.
      </p>
    </div>
  );
}

// In Safari on an iPhone the Share button sits in the toolbar below the
// page, so a small note points down at it. Dismissable, and gone once YOU
// is opened from the home screen.
export function SharePointer({ lift = 0 }) {
  const reduceMotion = useReducedMotion();
  const [show, setShow] = useState(() => isIPhoneSafari() && !isInstalled());
  if (!show) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.2, ease: easeOut }}
      className="fixed inset-x-0 z-20 flex justify-center px-4 pointer-events-none"
      style={{ bottom: `calc(max(env(safe-area-inset-bottom), 12px) + ${lift}px)` }}
    >
      <div className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-forestAccent text-onAccent shadow-card pl-4 pr-1.5 py-1.5 text-bodySm">
        <motion.span
          animate={reduceMotion ? undefined : { y: [0, 4, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className="flex"
          aria-hidden="true"
        >
          <ArrowDown size={16} strokeWidth={2} />
        </motion.span>
        <span>
          Tap <Share size={14} strokeWidth={2} className="inline -mt-0.5" aria-label="Share" /> below, then <b className="font-medium">Add to Home Screen</b>
        </span>
        <button type="button" onClick={() => setShow(false)} aria-label="Hide this tip" className="w-8 h-8 rounded-full flex items-center justify-center">
          <X size={15} strokeWidth={2} />
        </button>
      </div>
    </motion.div>
  );
}
