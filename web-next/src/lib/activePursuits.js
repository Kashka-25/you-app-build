import { useAuth } from "./AuthContext";

// Which pursuits are active (Cassidy, Nov 2): the ones being lived right now
// are highlighted and show on Home; the rest rest quietly on PursYOUts until
// they're activated. Every pursuit is active unless rested, so nothing goes
// missing for anyone. Kept per account (prefs.resting, a list of ids), like
// Extras, so it follows the Seeker to every device with no migration.
export function useActivePursuits() {
  const { prefs, setPrefs } = useAuth();
  const resting = new Set(prefs?.resting || []);
  const isActive = item => !item.done && !resting.has(item.id);
  async function setActive(item, active) {
    const next = new Set(resting);
    if (active) next.delete(item.id);
    else next.add(item.id);
    await setPrefs({ resting: [...next] });
  }
  return { isActive, setActive };
}
