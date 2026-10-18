import { useEffect, useRef, useState } from "react";
import { ArrowUp, ArrowUpRight, ExternalLink, Heart, Link2, MessageCircle, Repeat2, Send } from "lucide-react";
import { BackRow, PageBanner } from "../Primitives";
import { Button } from "../ui/Button";
import { useAuth } from "../../lib/AuthContext";
import {
  KRONK_HOME, KRONK_PUBLISH, KRONK_URL, KRONK_YOU_HUB, goToKronk, kronkThread, kronkTimeline, likeOnKronk, postToKronk,
  useKronkFeeds, useKronkLink
} from "../../lib/kronk";
import KommYOUnity from "../KommYOUnity";
import { usePlugin } from "../../lib/plugins";
import { SegmentedControl } from "../ui/SegmentedControl";

// KommYOUnity: the Kronk community (kronk.info) seen from YOU. The feed of
// mates you follow, in YOU's look, scrolling on as you read, where you can
// froth and komment. New posts are written on Kronk itself (the link at the
// top), and YOU offers to share at meaningful moments (ShareToKronk).
const PAGE = 15;
// The Kronk feed last looked at, on this device.
const LAST_FEED = "you.kronk.feed";

// Mastodon ids are numeric strings too long for a JS number.
const laterId = (a, b) => a.length !== b.length ? a.length > b.length : a > b;

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
      <PageBanner title={<KommYOUnity />} image="/images/home/community.webp" className="mt-3" />
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
          KommYOUnity lives on Kronk, a small community built together. Connect your Kronk account to see your mates here, in YOU.
        </p>
        <ul className="space-y-1.5 mb-5">
          {["What your mates are sharing, in YOU's calm look", "Share a moment from YOU when it feels right", "Sign in to YOU with Kronk next time"].map(t => (
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
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(true);
  const [error, setError] = useState(null);
  // Paging carries on from the last post Kronk sent.
  const [cursor, setCursor] = useState(undefined);
  // The newest post Kronk has given us, and new ones waiting behind the pill.
  const newest = useRef(undefined);
  const [fresh, setFresh] = useState([]);
  const heading = useRef(null);
  const endless = usePlugin("endless_feed");

  // Which of Kronk's feeds to show: the ones chosen in Your Own Universe,
  // starting on the one last looked at on this device (else Orbit).
  const { feeds } = useKronkFeeds();
  const [feed, setFeedState] = useState(() => {
    let last = null;
    try { last = localStorage.getItem(LAST_FEED); } catch { /* fine */ }
    return [last, "orbit"].find(v => feeds.some(f => f.value === v)) || feeds[0].value;
  });
  const shownFeed = feeds.some(f => f.value === feed) ? feed : feeds[0].value;
  const feedNow = useRef(shownFeed);
  feedNow.current = shownFeed;
  function setFeed(v) {
    setFeedState(v);
    try { localStorage.setItem(LAST_FEED, v); } catch { /* fine */ }
  }

  async function load(reset) {
    const asked = shownFeed;
    setLoading(true);
    setError(null);
    if (reset) setPosts([]);
    try {
      const { posts: page } = await kronkTimeline(asked, { limit: PAGE, maxId: reset ? undefined : cursor });
      // Switched to another feed meanwhile? Then this page isn't wanted.
      if (feedNow.current !== asked) return;
      setCursor(page[page.length - 1]?.id);
      if (reset) { newest.current = page[0]?.id; setFresh([]); }
      // Everything in the chosen feed, your own posts included.
      setPosts(p => (reset ? page : [...p, ...page.filter(x => !p.some(y => y.id === x.id))]));
      setMore(page.length >= PAGE);
    } catch (e) {
      if (feedNow.current === asked) setError(e);
    }
    if (feedNow.current === asked) setLoading(false);
  }

  useEffect(() => { newest.current = undefined; setFresh([]); load(true); }, [link.handle, shownFeed]);

  // Live: while the page is open and on screen, look for new posts once a
  // minute. They wait behind a quiet pill; nothing moves until it's tapped.
  useEffect(() => {
    async function check() {
      if (document.hidden || !newest.current) return;
      try {
        const since = newest.current;
        const asked = feedNow.current;
        const { posts: page } = await kronkTimeline(asked, { limit: 20, sinceId: since });
        if (feedNow.current !== asked) return;
        // Kronk ids grow over time; only count what's truly newer.
        const newer = page.filter(x => laterId(x.id, since));
        if (!newer.length) return;
        newest.current = newer[0].id;
        setFresh(f => [...newer, ...f.filter(x => !newer.some(t => t.id === x.id))]);
      } catch { /* the next minute will try again */ }
    }
    const timer = setInterval(check, 60 * 1000);
    document.addEventListener("visibilitychange", check);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", check); };
  }, [link.handle, shownFeed]);

  function showFresh() {
    setPosts(p => [...fresh, ...p.filter(x => !fresh.some(f => f.id === x.id))]);
    setFresh([]);
    heading.current?.scrollIntoView({ block: "start" });
  }

  // Endless scroll (a Make YOU yours choice, on by default): the next page
  // loads as the end comes into view. Off, it waits for "Show more".
  const end = useRef(null);
  const busy = useRef(false);
  busy.current = loading;
  useEffect(() => {
    const el = end.current;
    if (!endless || !el || !more || error || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !busy.current) load(false);
    }, { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [endless, more, error, cursor]);

  return (
    <div>
      {/* Posting happens on Kronk itself; this is the way there. */}
      <a
        href={KRONK_PUBLISH}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-card bg-surface1 shadow-card p-3.5 mb-5"
      >
        {link.avatar_url
          ? <img src={link.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-none" />
          : <span className="w-10 h-10 rounded-full bg-surface3 flex-none" aria-hidden="true" />}
        <span className="flex-1 min-w-0">
          <span className="block text-body text-textMuted">What's on your mind?</span>
          <span className="block text-caption text-textMuted truncate">Share on Kronk as {link.handle}</span>
        </span>
        <span className="inline-flex items-center gap-1 text-bodySm text-forestAccent font-medium flex-none">
          Share <ArrowUpRight size={16} strokeWidth={1.75} />
        </span>
      </a>

      <div ref={heading} className="scroll-mt-4 mb-3">
        {feeds.length > 1 ? (
          <SegmentedControl options={feeds} value={shownFeed} onChange={setFeed} />
        ) : (
          <h2 className="font-serif text-h3 text-textPrimary m-0">{feeds[0].label}</h2>
        )}
        <div className="text-caption text-textMuted mt-1.5">{feeds.find(f => f.value === shownFeed)?.desc}</div>
      </div>

      {fresh.length > 0 && (
        <div className="sticky top-2 z-10 flex justify-center mb-2.5" role="status">
          <button
            type="button"
            onClick={showFresh}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-full bg-forestAccent text-onAccent text-bodySm font-medium shadow-card"
          >
            <ArrowUp size={15} strokeWidth={2} />
            {fresh.length === 1 ? "1 new post" : `${fresh.length >= 20 ? "20+" : fresh.length} new posts`}
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-card bg-surface1 p-4 text-bodySm text-textSecondary mb-3">
          {error.message}
          {error.code === "relink" && (
            <Button size="sm" variant="secondary" className="mt-3" onClick={() => goToKronk("link", "/community")}>Connect again</Button>
          )}
        </div>
      )}

      {posts.map(p => <FeedPost key={p.id} post={p} />)}

      {!loading && !error && posts.length === 0 && (
        <div className="rounded-card bg-surface1 p-4 text-bodySm text-textSecondary mb-3">
          Quiet for now. When the mates you follow on Kronk share something, it shows here.
        </div>
      )}
      {loading && <div className="text-bodySm text-textMuted py-6 text-center">Looking in on your mates…</div>}
      {/* The scroll trigger; with endless scroll on, the button is only a
          fallback for keyboards and older browsers. */}
      <div ref={end} aria-hidden="true" />
      {!loading && !error && more && posts.length > 0 && (
        <Button variant={endless ? "ghost" : "secondary"} size="sm" className="w-full mt-1" onClick={() => load(false)}>
          {endless ? "Load more" : "Show more"}
        </Button>
      )}
      {!more && posts.length > 0 && <div className="text-caption text-textMuted text-center py-3">You're all caught up.</div>}

      <a
        href={KRONK_HOME}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 w-full min-h-[48px] rounded-sm border border-borderC text-textPrimary inline-flex items-center justify-center gap-2 text-bodySm"
      >
        Continue on Kronk <ArrowUpRight size={16} strokeWidth={1.75} />
      </a>
    </div>
  );
}

// Kronk's magenta, for a frothed heart (lighter in the Cosmos).
const LIKED = "text-[color:oklch(0.5_0.2_326)] dark:text-[color:oklch(0.72_0.17_326)]";

// One post: who, when, the words and images, with Froth and Komment (Kronk's words for like and reply).
function FeedPost({ post }) {
  const [reveal, setReveal] = useState(!post.warning);
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [replies, setReplies] = useState(post.replies);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);

  async function toggleLike() {
    const next = !liked;
    setLiked(next);
    setLikes(n => Math.max(0, n + (next ? 1 : -1)));
    setError(null);
    try {
      const res = await likeOnKronk(post.target_id, next);
      setLiked(res.liked);
      setLikes(res.likes);
    } catch (e) {
      setLiked(!next);
      setLikes(n => Math.max(0, n + (next ? -1 : 1)));
      setError(e);
    }
  }

  return (
    <article className="rounded-card bg-surface1 shadow-card p-4 mb-2.5">
      {post.boosted_by && (
        <div className="flex items-center gap-1.5 text-caption text-textMuted mb-2">
          <Repeat2 size={13} strokeWidth={1.75} /> shared by {post.boosted_by.name}
        </div>
      )}
      <PostHead account={post.account} when={post.created_at} />
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
          {post.text && <p className="text-bodySm text-textSecondary whitespace-pre-line break-words m-0">{post.text}</p>}
          {post.media.length > 0 && (
            <div className={`grid gap-1.5 mt-2.5 ${post.media.length > 1 ? "grid-cols-2" : ""}`}>
              {post.media.map(m => (
                <a key={m.preview} href={m.full || m.preview} target="_blank" rel="noopener noreferrer">
                  <img src={m.preview} alt={m.alt} loading="lazy" className="w-full max-h-72 object-cover rounded-sm" />
                </a>
              ))}
            </div>
          )}
        </>
      )}

      <div className="flex items-center gap-1 mt-2 -ml-2">
        <button
          type="button"
          onClick={toggleLike}
          aria-pressed={liked}
          className={`inline-flex items-center gap-1.5 min-h-[40px] px-2 rounded-sm text-caption ${liked ? LIKED : "text-textMuted"}`}
        >
          <Heart size={16} strokeWidth={1.75} fill={liked ? "currentColor" : "none"} />
          {liked ? "Frothed" : "Froth"}{likes > 0 && ` · ${likes}`}
        </button>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 min-h-[40px] px-2 rounded-sm text-caption text-textMuted"
        >
          <MessageCircle size={16} strokeWidth={1.75} />
          Komment{replies > 0 && ` · ${replies}`}
        </button>
        {post.url && (
          <a href={post.url} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 text-caption text-forestAccent min-h-[40px] px-1">
            Kronk <ExternalLink size={12} strokeWidth={1.75} />
          </a>
        )}
      </div>
      {error && <ActionError error={error} />}
      {open && <Thread post={post} onReplied={() => setReplies(n => n + 1)} />}
    </article>
  );
}

function PostHead({ account, when, small = false }) {
  const size = small ? "w-7 h-7" : "w-9 h-9";
  return (
    <div className="flex items-center gap-2.5 mb-2">
      {account.avatar
        ? <img src={account.avatar} alt="" loading="lazy" className={`${size} rounded-full object-cover flex-none`} />
        : <span className={`${size} rounded-full bg-surface3 flex-none`} aria-hidden="true" />}
      <div className="flex-1 min-w-0">
        <div className="text-bodySm font-medium text-textPrimary truncate">{account.name || account.handle}</div>
        <div className="text-caption text-textMuted truncate">{timeAgo(when)}</div>
      </div>
    </div>
  );
}

function ActionError({ error }) {
  return (
    <div className="text-caption text-red-500 mt-1">
      {error.message}
      {error.code === "relink" && (
        <button type="button" onClick={() => goToKronk("link", "/community")} className="ml-1.5 underline underline-offset-2 text-forestAccent">
          Connect again
        </button>
      )}
    </div>
  );
}

// The komments under a post, and a box to add one. A reply mentions the
// person and keeps the post's own visibility, as Kronk does.
function Thread({ post, onReplied }) {
  const [items, setItems] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  async function loadThread() {
    try {
      setItems((await kronkThread(post.target_id)).replies);
    } catch (e) {
      setError(e);
      setItems([]);
    }
  }
  useEffect(() => { loadThread(); }, []);

  async function reply() {
    setSending(true);
    setError(null);
    try {
      // "@name" is enough for someone on Kronk itself.
      const mention = post.account.handle.replace(/@kronk\.info$/i, "");
      const visibility = post.visibility === "direct" ? "private" : post.visibility;
      await postToKronk(`${mention} ${text.trim()}`, visibility, post.target_id);
      setText("");
      onReplied();
      await loadThread();
    } catch (e) {
      setError(e);
    }
    setSending(false);
  }

  return (
    <div className="mt-2 pt-3 border-t border-borderC">
      {items === null ? (
        <div className="text-caption text-textMuted py-2">Opening the conversation…</div>
      ) : items.length === 0 ? (
        <div className="text-caption text-textMuted pb-2">No komments yet.</div>
      ) : (
        <div className="space-y-3 mb-3">
          {items.map(c => (
            <div key={c.id} className="pl-3 border-l-2 border-borderC">
              <PostHead account={c.account} when={c.created_at} small />
              <p className="text-bodySm text-textSecondary whitespace-pre-line break-words m-0">
                {c.warning ? `${c.warning} (open it on Kronk)` : c.text}
              </p>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <label htmlFor={`reply-${post.id}`} className="sr-only">Write a komment</label>
        <textarea
          id={`reply-${post.id}`}
          rows={1}
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={5000}
          placeholder="Write a komment…"
          className="flex-1 min-w-0 bg-surface2 border border-borderC rounded-sm px-3 py-2 text-bodySm text-textPrimary outline-none focus:border-forestAccent resize-none"
        />
        <button
          type="button"
          onClick={reply}
          disabled={!text.trim() || sending}
          className="min-h-[40px] px-3 rounded-sm bg-forestAccent text-onAccent text-caption font-medium inline-flex items-center gap-1.5 disabled:opacity-40"
        >
          <Send size={14} strokeWidth={1.75} /> {sending ? "Sending…" : "Send"}
        </button>
      </div>
      {error && <ActionError error={error} />}
    </div>
  );
}
