import { useAppData } from "../lib/AppDataContext";
import { useProfilePicture } from "../lib/profilePicture";

// The Seeker's picture in a circle: their own, else their Kronk one, else
// their initial on the sage orb (lib/profilePicture.js).
export default function ProfileBubble({ size = 32, className = "" }) {
  const { profile } = useAppData();
  const { url } = useProfilePicture();
  const initial = (profile?.name || "").trim().charAt(0).toUpperCase();
  const box = { width: size, height: size };
  if (url) {
    return <img src={url} alt="" width={size} height={size} style={box} className={`rounded-full object-cover flex-none ${className}`} />;
  }
  return (
    <span
      style={{ ...box, fontSize: Math.round(size * 0.42), background: "radial-gradient(circle at 35% 30%, var(--sage), var(--forest) 70%)" }}
      className={`rounded-full flex-none flex items-center justify-center font-serif text-cream ${className}`}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
