import { useEffect, useState } from "react";
import { ArrowUpRight, ExternalLink, Link2, Repeat2 } from "lucide-react";
import { BackRow, PageBanner } from "../Primitives";
import { Button } from "../ui/Button";
import { useAuth } from "../../lib/AuthContext";
import { KRONK_HOME, KRONK_URL, KRONK_YOU_HUB, goToKronk, kronkTimeline, useKronkLink } from "../../lib/kronk";

// CommYOUnity: a calm window onto Kronk (kronk.info), not a second Kronk.
// A glimpse of what a few mates shared, then the door to Kronk itself for
// the full social space. No counts, no endless scroll, no composer here:
// sharing happens at meaningful moments in YOU (ShareToKronk), by choice.
// Individual first, community second.
const GLIMPSE = 5;

const ago = (n, unit) => `${n} ${unit}${n === 1 ? "" : "s"} ago`;
function timeAgo(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return s < 120 ? "just now" : ago(Math.floor(s / 60), "minute");
  if (s < 86400) return ago(Math.floor(s / 3600), "hour");
  if (s < 604800) return ago(Math.floor(s / 86400), "day");
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default function Community() {
  const link = useKronkLink();

  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <PageBanner title="CommYOUnity" image="/images/home/community.webp" className="mt-3" />
      {link === undefined ? (
        <div className="text-bodySm text-textMuted">Opening the door to Kronk…</div>
      ) : link ? (
        <Window link={link} />
      ) : (
        <Invitation />
      )}
      <a href={KRONK_URL} target="_blank" rel="noopener noreferrer" className="block text-center text-caption text-textMuted mt-6 mb-2">
        Proudly powered and supported by <span className="text-gold font-medium">Kronk</span>
      </a>
    </div>
  );
}

function Invitation() {
  const { isDevMode } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function connect() {
    setBusy(true);
    setError("");
    try { await goToKronk("link", "/community"); } catch (e) { setError(e.message); setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-card bg-surface1 shadow-card p-5">
        <div className="font-serif text-h2 text-textPrimary mb-2">Your people, on Kronk</div>
        <p className="text-bodySm text-textSecondary mb-4">
          CommYOUnity lives on Kronk, a small community built together. Connect your Kronk account and YOU becomes a quiet window onto it.
        </p>
        <ul className="space-y-1.5 mb-5">
          {["A glimpse of what your mates are sharing", "Share a moment from YOU when it feels right", "Sign in to YOU with Kronk next time"].map(t => (
            <li key={t} className="flex items-start gap-2.5 text-bodySm text-textPrimary">
              <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-gold flex-none" aria-hidden="true" />{t}
            </li>
          ))}
        </ul>
        {error && <div className="text-bodySm text-red-500 mb-3">{error}</div>}
        <Button icon={Link2} className="w-full" disabled={busy || isDevMode} onClick={connect}>
          {busy ? "Opening Kronk…" : "Connect Kronk"}
        </Button>
        <div className="text-caption text-textMuted mt-2.5">
          Kronk will ask you to approve YOU. Nothing you write in YOU goes to Kronk unless you choose to share it.
        </div>
      </div>

      <div className="rounded-card border border-dashed border-borderC p-4">
        <div className="text-body text-textPrimary font-medium mb-1">Not on Kronk yet?</div>
        <p className="text-bodySm text-textSecondary">
          Kronk is invite-only, so it stays small and kind. Ask a friend who's on Kronk for an invite, then come back and connect.
        </p>
        <a href={KRONK_YOU_HUB} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-bodySm text-forestAccent mt-2 min-h-[44px]">
          See YOU's home on Kronk <ExternalLink size={14} strokeWidth={1.75} />
        </a>
      </div>
    </div>
  );
}

function Window({ link }) {
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let live = true;
    // Ask for a few extra, since the Seeker's own posts are left out.
    kronkTimeline("home", { limit: GLIMPSE * 3 })
      .then(({ posts: p }) => {
        if (live) setPosts(p.filter(x => x.account.handle.toLowerCase() !== link.handle.toLowerCase()).slice(0, GLIMPSE));
      })
      .catch(e => { if (live) setError(e); });
    return () => { live = false; };
  }, [link.handle]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        {link.avatar_url
          ? <img src={link.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-none" />
          : <span className="w-10 h-10 rounded-full bg-surface3 flex-none" aria-hidden="true" />}
        <div className="flex-1 min-w-0">
          <div className="text-body text-textPrimary truncate">{link.display_name || link.handle}</div>
          <div className="text-caption text-textMuted truncate">{link.handle}</div>
        </div>
      </div>

      <h2 className="font-serif text-h3 text-textPrimary mb-2.5">From your mates</h2>

      {error ? (
        <div className="rounded-card bg-surface1 p-4 text-bodySm text-textSecondary mb-3">
          {error.message}
          {error.code === "relink" && (
            <Button size="sm" variant="secondary" className="mt-3" onClick={() => goToKronk("link", "/community")}>Connect again</Button>
          )}
        </div>
      ) : posts === null ? (
        <div className="text-bodySm text-textMuted py-6 text-center">Looking in on your mates…</div>
      ) : posts.length === 0 ? (
        <div className="rounded-card bg-surface1 p-4 text-bodySm text-textSecondary mb-3">
          Quiet for now. When the mates you follow on Kronk share something, a little of it shows here.
        </div>
      ) : (
        posts.map(p => <Glimpse key={p.id} post={p} />)
      )}

      <a
        href={KRONK_HOME}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 w-full min-h-[50px] rounded-sm bg-forestAccent text-onAccent font-medium inline-flex items-center justify-center gap-2"
      >
        Continue on Kronk <ArrowUpRight size={18} strokeWidth={1.75} />
      </a>
      <p className="text-caption text-textMuted text-center mt-3">
        Want to share something? Look for “Share with your mates” after a Harvest, when a value ripens, on your highlights and in the Showcase.
      </p>
    </div>
  );
}

// One post, quietly: who, when, the words and the first image. No counts.
function Glimpse({ post }) {
  const [reveal, setReveal] = useState(!post.warning);
  const image = post.media[0];
  return (
    <article className="rounded-card bg-surface1 shadow-card p-4 mb-2.5">
      {post.boosted_by && (
        <div className="flex items-center gap-1.5 text-caption text-textMuted mb-2">
          <Repeat2 size={13} strokeWidth={1.75} /> shared by {post.boosted_by.name}
        </div>
      )}
      <div className="flex items-center gap-3 mb-2">
        {post.account.avatar
          ? <img src={post.account.avatar} alt="" loading="lazy" className="w-8 h-8 rounded-full object-cover flex-none" />
          : <span className="w-8 h-8 rounded-full bg-surface3 flex-none" aria-hidden="true" />}
        <div className="flex-1 min-w-0">
          <div className="text-bodySm font-medium text-textPrimary truncate">{post.account.name || post.account.handle}</div>
          <div className="text-caption text-textMuted truncate">{timeAgo(post.created_at)}</div>
        </div>
      </div>
      {post.warning && (
        <button
          type="button"
          onClick={() => setReveal(r => !r)}
          className="w-full text-left text-bodySm text-textPrimary bg-surface2 rounded-sm px-3 py-2 mb-2"
        >
          {post.warning} · <span className="text-forestAccent">{reveal ? "Hide" : "Show"}</span>
        </button>
      )}
      {reveal && (
        <>
          {post.text && <p className="text-bodySm text-textSecondary whitespace-pre-line break-words line-clamp-5 m-0">{post.text}</p>}
          {image && <img src={image.preview} alt={image.alt} loading="lazy" className="w-full max-h-56 object-cover rounded-sm mt-2.5" />}
        </>
      )}
      {post.url && (
        <a href={post.url} target="_blank" rel="noopener noreferrer" className="flex justify-end items-center gap-1 text-caption text-forestAccent mt-2 min-h-[32px]">
          Open on Kronk <ExternalLink size={12} strokeWidth={1.75} />
        </a>
      )}
    </article>
  );
}
