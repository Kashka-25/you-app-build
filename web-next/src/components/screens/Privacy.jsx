import { AuthCard, BetaBadge } from "../SignIn";

// Plain-language privacy note and beta terms. Readable signed out
// (App checks /privacy before the sign-in gate).
// Written from what the code actually does (Oct 18). Keep it true: if a new
// service starts receiving anyone's data, add it under "Who else is involved".
// Not legal advice — worth a look from someone qualified before a public launch.
const UPDATED = "18 October 2026";

const SECTIONS = [
  {
    title: "What YOU keeps",
    body: [
      "Your email and password (the password is stored scrambled; nobody can read it, including us).",
      "What you create: journal entries, reflections, values, pursuits, moments, photos, wanderings, courses and everything else you add.",
      "Only you can see your own things. The database checks this on every request, not just the app.",
      "If a screen crashes, a short technical note is saved so we can fix it: the error, the page and your browser type. Never what you wrote."
    ]
  },
  {
    title: "AI reflections",
    body: [
      "AI is off until you say yes, and you can turn it off at any time in Your Own Universe.",
      "When you ask for a reflection, only the words that reflection needs are sent to Claude, made by Anthropic, to write it. Under Anthropic's API terms they aren't used to train its models.",
      "We keep a count of how much AI each person uses, so the beta stays affordable. That count holds no words."
    ]
  },
  {
    title: "What we never do",
    body: [
      "No ads, no selling or sharing your data, no tracking or analytics on what you write.",
      "Nobody at YOU reads your journal. The one exception is anything you choose to share, like a Showcase piece or a feedback note."
    ]
  },
  {
    title: "Who else is involved",
    body: [
      "Supabase stores the app's data and photos. Netlify serves the app itself.",
      "Maps come from OpenFreeMap, and place search from Photon (komoot). Only what you type into a place search is sent there.",
      "Feedback you send from the app goes to our private Notion workspace so we can act on it.",
      "Kronk (kronk.info), only if you connect it. YOU then keeps a key to your Kronk account so it can show your feed and post what you choose to post. Disconnect any time in Your Own Universe, and the key is handed back."
    ]
  },
  {
    title: "Your choices",
    body: [
      "Download everything you've made, any time: Your Own Universe → Your data.",
      "Delete your account and everything in it: Your Own Universe → Your data. This can't be undone."
    ]
  },
  {
    title: "The beta",
    body: [
      "YOU is still being built. Things will change, and sometimes break. Please keep your own copy of anything precious (the download above makes that easy).",
      "AI has a small monthly allowance per person while we're in beta. Everything else is free.",
      "YOU is a self-love and personal-growth app. It isn't therapy, medical care or a crisis service. If you're in danger or need urgent support, please contact local emergency services or find a helpline at findahelpline.com.",
      "Be kind with anything you share with others, and only share work that's yours to share."
    ]
  }
];

export default function Privacy() {
  return (
    <AuthCard>
      <div className="max-w-[560px] mx-auto w-full py-4">
        <a href="/" className="text-bodySm text-textSecondary">&larr; back to YOU</a>
        <h1 className="font-serif text-h1 text-textPrimary mt-4 mb-1 flex items-center gap-2.5">
          Privacy &amp; beta terms <BetaBadge />
        </h1>
        <div className="text-caption text-textMuted mb-6">Updated {UPDATED}</div>
        <p className="text-body text-textSecondary mb-6">
          Your Own Universe is yours. Here's what happens to what you put in it, in plain words.
        </p>
        {SECTIONS.map(s => (
          <section key={s.title} className="mb-6">
            <h2 className="font-serif text-h3 text-textPrimary mb-2">{s.title}</h2>
            <ul className="space-y-2 pl-4 list-disc marker:text-gold">
              {s.body.map(line => (
                <li key={line} className="text-bodySm text-textSecondary">{line}</li>
              ))}
            </ul>
          </section>
        ))}
        <p className="text-bodySm text-textSecondary">
          Questions? Use <span className="text-textPrimary">Send feedback</span> in the side menu and it comes straight to us.
        </p>
      </div>
    </AuthCard>
  );
}
