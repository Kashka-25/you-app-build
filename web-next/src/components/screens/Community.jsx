import { useEffect, useState } from "react";
import { ExternalLink, Heart, Link2, MessageCircle, Repeat2, Send } from "lucide-react";
import { BackRow, PageBanner } from "../Primitives";
import { Button } from "../ui/Button";
import { SegmentedControl } from "../ui/SegmentedControl";
import { useAuth } from "../../lib/AuthContext";
import {
  KRONK_URL, KRONK_YOU_HUB, goToKronk, kronkTimeline, postToKronk, useKronkLink
} from "../../lib/kronk";

// CommYOUnity: the Kronk community (kronk.info), inside YOU. Connected
// Seekers see their Kronk feed in YOU's own look and can post to it; the
// credit line stays on every view. Kronk is invite-only, so anyone without
// an account is pointed to a friend for an invite, never a dead end.
const FEEDS = [
  { value: "home", label: "Following" },
  { value: "local", label: "All of Kronk" }
];
const VISIBILITY = [
  { value: "public", label: "Everyone" },
  { value: "unlisted", label: "Quietly" },
  { value: "private", label: "Mates only" }
];

function timeAgo(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function Credit() {
  return (
    <a href={KRONK_URL} target="_blank" rel="noopener noreferrer" className="block text-center text-caption text-textMuted mt-6 mb-2">
      Proudly powered and supported by <span className="text-gold font-medium">Kronk</span>
    </a>
  );
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
        <Connected link={link} />
      ) : (
        <Invitation />
      )}
      <Credit />
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
          CommYOUnity lives on Kronk, a small community built together. Connect your Kronk account to see your mates here and share with them, without leaving YOU.
        </p>
        <ul className="space-y-1.5 mb-5">
          {["Your Kronk feed, in YOU's own calm look", "Post to Kronk from here", "Sign in to YOU with Kronk next time"].map(t => (
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
          Kronk will ask you to approve YOU. YOU can read your feed and post only when you ask; nothing you write in YOU goes to Kronk unless you post it.
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

function Connected({ link }) {
  const [feed, setFeed] = useState("home");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(true);
  const [error, setError] = useState(null);

  async function load(reset) {
    setLoading(true);
    setError(null);
    try {
      const last = reset ? undefined : posts[posts.length - 1]?.id;
      const { posts: page } = await kronkTimeline(feed, last);
      setPosts(p => (reset ? page : [...p, ...page]));
      setMore(page.length >= 20);
    } catch (e) {
      setError(e);
    }
    setLoading(false);
  }

  useEffect(() => { setPosts([]); load(true); }, [feed]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        {link.avatar_url
          ? <img src={link.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-none" />
          : <span className="w-10 h-10 rounded-full bg-surface3 flex-none" aria-hidden="true" />}
        <div className="flex-1 min-w-0">
          <div className="text-body text-textPrimary truncate">{link.display_name || link.handle}</div>
          <div className="text-caption text-textMuted truncate">{link.handle}</div>
        </div>
        {link.profile_url && (
          <a href={link.profile_url} target="_blank" rel="noopener noreferrer" className="text-caption text-forestAccent inline-flex items-center gap-1 min-h-[44px]">
            Kronk <ExternalLink size={12} strokeWidth={1.75} />
          </a>
        )}
      </div>

      <Composer onPosted={() => feed === "home" ? load(true) : setFeed("home")} />

      <div className="mt-5 mb-3">
        <SegmentedControl options={FEEDS} value={feed} onChange={setFeed} />
      </div>

      {error && (
        <div className="rounded-card bg-surface1 p-4 text-bodySm text-textSecondary mb-3">
          {error.message}
          {error.code === "relink" && (
            <Button size="sm" variant="secondary" className="mt-3" onClick={() => goToKronk("link", "/community")}>Connect again</Button>
          )}
        </div>
      )}

      {posts.map(p => <Post key={`${feed}-${p.id}`} post={p} />)}

      {!loading && !error && posts.length === 0 && (
        <div className="text-bodySm text-textMuted text-center py-8">
          {feed === "home" ? "Quiet here for now. Follow a few mates on Kronk, or look at All of Kronk." : "Nothing on Kronk yet."}
        </div>
      )}
      {loading && <div className="text-bodySm text-textMuted text-center py-6">Gathering posts…</div>}
      {!loading && more && posts.length > 0 && (
        <Button variant="secondary" size="sm" className="w-full mt-2" onClick={() => load(false)}>Show more</Button>
      )}
    </div>
  );
}

function Composer({ onPosted }) {
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function send() {
    setBusy(true);
    setError("");
    setNote("");
    try {
      await postToKronk(text.trim(), visibility);
      setText("");
      setNote("Shared on Kronk.");
      onPosted();
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  }

  return (
    <div className="rounded-card bg-surface1 shadow-card p-4">
      <label htmlFor="kronk-post" className="sr-only">Share with your Kronk mates</label>
      <textarea
        id="kronk-post"
        rows={3}
        value={text}
        onChange={e => { setText(e.target.value); setNote(""); }}
        maxLength={5000}
        placeholder="Share something with your mates…"
        className="w-full bg-surface2 border border-borderC rounded-sm px-3.5 py-3 text-body text-textPrimary outline-none focus:border-forestAccent shadow-field mb-3"
      />
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5 flex-1 min-w-0" role="radiogroup" aria-label="Who can see it">
          {VISIBILITY.map(v => (
            <button
              key={v.value}
              type="button"
              role="radio"
              aria-checked={visibility === v.value}
              onClick={() => setVisibility(v.value)}
              className={`text-caption px-2.5 py-1.5 rounded-full ${visibility === v.value ? "bg-forestAccent text-onAccent" : "bg-surface3 text-textMuted"}`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <Button size="sm" icon={Send} disabled={!text.trim() || busy} onClick={send}>
          {busy ? "Posting…" : "Post"}
        </Button>
      </div>
      {note && <div className="text-caption text-sage mt-2">{note}</div>}
      {error && <div className="text-caption text-red-500 mt-2">{error}</div>}
    </div>
  );
}

function Post({ post }) {
  const [reveal, setReveal] = useState(!post.warning);
  return (
    <article className="rounded-card bg-surface1 shadow-card p-4 mb-3">
      {post.boosted_by && (
        <div className="flex items-center gap-1.5 text-caption text-textMuted mb-2">
          <Repeat2 size={13} strokeWidth={1.75} /> {post.boosted_by.name} boosted
        </div>
      )}
      <div className="flex items-center gap-3 mb-2.5">
        {post.account.avatar
          ? <img src={post.account.avatar} alt="" loading="lazy" className="w-10 h-10 rounded-full object-cover flex-none" />
          : <span className="w-10 h-10 rounded-full bg-surface3 flex-none" aria-hidden="true" />}
        <div className="flex-1 min-w-0">
          <div className="text-body font-medium text-textPrimary truncate">{post.account.name || post.account.handle}</div>
          <div className="text-caption text-textMuted truncate">{post.account.handle} · {timeAgo(post.created_at)}</div>
        </div>
      </div>

      {post.warning && (
        <button type="button" onClick={() => setReveal(r => !r)} className="w-full text-left text-bodySm text-textPrimary bg-surface2 rounded-sm px-3 py-2 mb-2">
          {post.warning} · <span className="text-forestAccent">{reveal ? "Hide" : "Show"}</span>
        </button>
      )}
      {reveal && (
        <>
          {post.text && <p className="text-bodySm text-textSecondary whitespace-pre-line break-words mb-3">{post.text}</p>}
          {post.media.length > 0 && (
            <div className={`grid gap-1.5 mb-3 ${post.media.length > 1 ? "grid-cols-2" : ""}`}>
              {post.media.map(m => (
                <a key={m.preview} href={m.full || m.preview} target="_blank" rel="noopener noreferrer">
                  <img src={m.preview} alt={m.alt} loading="lazy" className="w-full max-h-72 object-cover rounded-sm" />
                </a>
              ))}
            </div>
          )}
        </>
      )}

      <div className="flex items-center gap-4 text-caption text-textMuted">
        <span className="inline-flex items-center gap-1"><MessageCircle size={13} strokeWidth={1.75} /> {post.replies}</span>
        <span className="inline-flex items-center gap-1"><Repeat2 size={13} strokeWidth={1.75} /> {post.boosts}</span>
        <span className="inline-flex items-center gap-1"><Heart size={13} strokeWidth={1.75} /> {post.likes}</span>
        {post.url && (
          <a href={post.url} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 text-forestAccent min-h-[32px]">
            Open on Kronk <ExternalLink size={12} strokeWidth={1.75} />
          </a>
        )}
      </div>
    </article>
  );
}
