// "KommYOUnity", spelled with the ₭ from Kronk's logo: YOU's window onto
// the Kronk community. The ₭ wears Kronk's own magenta and serif (as on
// kronk.info's wordmark); screen readers hear plain "KommYOUnity".
export const KOMMYOUNITY = "KommYOUnity";

export default function KommYOUnity({ className = "" }) {
  return (
    <span className={className}>
      <span className="sr-only">{KOMMYOUNITY}</span>
      <span aria-hidden="true">
        {/* A touch lighter in the Cosmos, so it still reads on the night sky. */}
        <span
          className="font-bold text-[color:oklch(0.5_0.2_326)] dark:text-[color:oklch(0.72_0.17_326)]"
          style={{ fontFamily: "Georgia, 'Liberation Serif', serif" }}
        >
          ₭
        </span>
        ommYOUnity
      </span>
    </span>
  );
}
