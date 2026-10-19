import { useState } from "react";
import { Guide } from "../ui/Guide";
import { Palette } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { useShowcase } from "../../lib/showcaseApi";
import { creditLine } from "../../lib/showcase";
import { BackRow } from "../Primitives";
import { EmptyState } from "../ui/EmptyState";
import { SegmentedControl } from "../ui/SegmentedControl";
import ArtworkSheet from "../showcase/ArtworkSheet";

// Every piece artists have shared to YOU, newest feature first, so artists
// stay visible after their turn on Home. "Your collection" is what this
// Seeker has saved.
export default function ShowcaseGallery() {
  const { userId } = useAuth();
  const { works, saves, error, setSaved } = useShowcase(userId);
  const [tab, setTab] = useState("all");
  const [open, setOpen] = useState(null);

  const savedCount = Object.keys(saves).length;
  const shown = (works || []).filter(w => (tab === "saved" ? saves[w.id] : (w.placements || []).includes("gallery")));

  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <h1 className="font-serif text-h2 font-medium mt-4 mb-0 flex items-center gap-2.5">
        <img src="/images/icons/showcase@4x.png" alt="" width="52" height="52" className="w-[52px] h-[52px] flex-none" />
        Showcase
      </h1>
      <Guide className="mt-1 mb-3">
        Art and words shared by the people who made them. Tap a piece to see it in full and support the artist.
      </Guide>

      <div className="mb-4">
        <SegmentedControl
          options={[
            { value: "all", label: "Featured" },
            { value: "saved", label: savedCount ? `Your collection · ${savedCount}` : "Your collection" }
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {error && <div role="alert" className="text-bodySm text-red-500 mb-3">{error}</div>}

      {works === null ? (
        <div className="text-body text-textSecondary">Loading…</div>
      ) : shown.length === 0 ? (
        <EmptyState
          icon={Palette}
          title={tab === "saved" ? "Nothing saved yet" : "Nothing shared yet"}
          description={
            tab === "saved"
              ? "Save a piece you love and it'll wait for you here, credited to its artist."
              : "When an artist shares a piece from YOUrigin and it's approved, it appears here."
          }
        />
      ) : (
        <ul className="list-none p-0 m-0 grid grid-cols-2 gap-3">
          {shown.map(w => {
            const name = w.artist?.display_name || "An artist";
            return (
              <li key={w.id} className={w.kind === "words" ? "col-span-2" : ""}>
                <button
                  type="button"
                  onClick={() => setOpen(w)}
                  className="block w-full text-left rounded-card bg-surface1 shadow-card overflow-hidden"
                >
                  {w.kind === "image" ? (
                    w.imageUrl ? (
                      <img
                        src={w.imageUrl}
                        alt={w.alt_text || w.title || `Artwork by ${name}`}
                        loading="lazy"
                        draggable="false"
                        className="w-full aspect-[4/5] object-cover bg-surface3"
                      />
                    ) : (
                      <div className="w-full aspect-[4/5] bg-surface3" />
                    )
                  ) : (
                    <p className="font-serif italic text-body text-textPrimary m-0 p-4 pb-0 whitespace-pre-line line-clamp-4">{w.body}</p>
                  )}
                  <div className="p-3">
                    {w.title && <div className="text-bodySm font-medium text-textPrimary truncate">{w.title}</div>}
                    <div className="text-caption text-textSecondary truncate">{creditLine(name, w.credits)}</div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <ArtworkSheet work={open} saved={Boolean(open && saves[open.id])} onSavedChange={setSaved} onClose={() => setOpen(null)} />
    </div>
  );
}
