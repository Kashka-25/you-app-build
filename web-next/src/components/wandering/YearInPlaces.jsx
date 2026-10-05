import { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { Globe2, MapPin } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { placesInYear } from "../../lib/years";

const EverywhereMap = lazy(() => import("./EverywhereMap"));

// "Places you reached in <year>": shared by The Mirror and Legacy.
export default function YearInPlaces({ year, heading = true }) {
  const data = useAppData();
  const [mapOpen, setMapOpen] = useState(false);
  const { trips, countries, placeCount, memoryCount } = placesInYear(year, data);
  const isThisYear = year === new Date().getFullYear();

  return (
    <div>
      {heading && <div className="text-label uppercase text-textMuted mb-1.5">Places you reached {isThisYear ? "this year" : `in ${year}`}</div>}
      {trips.length === 0 ? (
        <p className="text-bodySm text-textSecondary">
          {isThisYear ? "No places recorded yet this year." : `No places recorded for ${year}.`}{" "}
          <Link to="/pursue" state={{ view: "wanderings" }} className="underline underline-offset-2">Your wanderings</Link>
        </p>
      ) : (
        <>
          <div className="text-body text-textPrimary">
            {placeCount} {placeCount === 1 ? "place" : "places"} · {countries.length} {countries.length === 1 ? "country" : "countries"}
            {memoryCount > 0 && ` · ${memoryCount} ${memoryCount === 1 ? "memory" : "memories"}`}
          </div>
          {countries.length > 0 && <div className="text-caption text-textMuted">{countries.join(" · ")}</div>}
          <div className="mt-2.5 space-y-2">
            {trips.map(t => (
              <Link key={t.wandering.id} to={`/wandering/${t.wandering.id}`} className="flex items-start gap-2 rounded-sm bg-surface2 border border-borderC p-2.5">
                <MapPin size={14} strokeWidth={1.75} className="text-forestAccent flex-none mt-0.5" />
                <span className="min-w-0">
                  <span className="block text-bodySm font-medium text-textPrimary">{t.wandering.title}</span>
                  <span className="block text-caption text-textSecondary">{t.places.map(p => p.stop.place_name).join(" · ")}</span>
                </span>
              </Link>
            ))}
          </div>
          <button onClick={() => setMapOpen(true)} className="mt-2.5 inline-flex items-center gap-1.5 text-caption text-forestAccent font-medium">
            <Globe2 size={13} strokeWidth={1.75} />
            See {isThisYear ? "this year" : year} on the world map
          </button>
        </>
      )}
      {mapOpen && (
        <Suspense fallback={<div className="fixed inset-0 z-[70]" style={{ background: "#07071A" }} />}>
          <EverywhereMap year={year} onClose={() => setMapOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}
