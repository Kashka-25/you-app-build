import { useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { SectionTitle } from "../Primitives";
import { GlowBubble } from "../ui/GlowBubble";
import { PILLAR_COLORS } from "../../constants/app.const";

// Mock feed — no Kronk/CommYOUnity backend exists yet (rename-only per
// BUILD-BACKLOG.md). Likes are local state, not persisted. Each mock
// poster gets a fixed pillar color so avatars read as distinct people
// rather than one uniform color repeated — same "break up the uniform
// look" treatment as Values.
const MOCK_POSTS = [
  { id: 1, name: "Maya", initial: "M", tag: "Seeker", text: "Sunsets + good company + open hearts = magic.", likes: 12, color: PILLAR_COLORS.Spirit },
  { id: 2, name: "Kai", initial: "K", tag: "Seeker", text: "What's one thing you're grateful for today?", likes: 8, color: PILLAR_COLORS.Adventure },
  { id: 3, name: "Raptor", initial: "R", tag: "Seeker", text: "Grateful for this community & the little moments that change everything.", likes: 21, color: PILLAR_COLORS.Relationships }
];

function PostCard({ post, liked, onLike }) {
  return (
    <div className="rounded-card bg-surface1 shadow-card p-4 mb-3">
      <div className="flex items-center gap-3 mb-2.5">
        <GlowBubble size={40} color={post.color}>{post.initial}</GlowBubble>
        <div>
          <div className="text-h3 font-medium text-textPrimary">{post.name}</div>
          <div className="text-label uppercase text-gold">{post.tag}</div>
        </div>
      </div>
      <div className="text-bodySm text-textSecondary mb-3">{post.text}</div>
      <div className="flex items-center gap-4 text-caption text-textMuted">
        <button onClick={onLike} className={`flex items-center gap-1 ${liked ? "text-ember" : ""}`}>
          <Heart size={14} strokeWidth={1.75} fill={liked ? "currentColor" : "none"} />
          {post.likes + (liked ? 1 : 0)}
        </button>
        <span className="flex items-center gap-1">
          <MessageCircle size={14} strokeWidth={1.75} />
          Reply
        </span>
      </div>
    </div>
  );
}

export default function Community() {
  const [liked, setLiked] = useState([]);

  function toggleLike(id) {
    setLiked(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  }

  return (
    <div className="pt-1 pb-24 px-5">
      <SectionTitle>CommYOUnity</SectionTitle>
      {MOCK_POSTS.map(post => (
        <PostCard key={post.id} post={post} liked={liked.includes(post.id)} onLike={() => toggleLike(post.id)} />
      ))}
    </div>
  );
}
