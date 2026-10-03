// Memory photos are converted on the device before upload, whatever they
// came in as (JPEG, PNG, WebP, GIF, and HEIC where the browser can open it):
// - resized so the long edge is at most MAX_EDGE (sharp on a phone or a
//   laptop, far smaller than a camera original);
// - re-encoded as WebP (roughly 25-35% smaller than JPEG at the same
//   look), falling back to JPEG where a browser can't write WebP;
// - stripped of metadata as a side effect, including GPS location.
// A typical 3-5 MB phone photo becomes about 150-400 KB.

const MAX_EDGE = 1600;
const QUALITY = 0.8;

async function decode(file) {
  // createImageBitmap applies the photo's EXIF rotation, so portraits stay
  // upright once the metadata is gone.
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // fall through to <img>, which some browsers decode more formats with
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toBlob(canvas, type, quality) {
  return new Promise(resolve => canvas.toBlob(resolve, type, quality));
}

// Journal pages: 1568px is the largest size Claude reads an image at (it
// downsizes anything bigger), so handwriting reads just as well, and a
// touch more quality keeps fine pen strokes crisp.
export const JOURNAL_PAGE = { maxEdge: 1568, quality: 0.85 };

// Returns { blob, ext, width, height, originalBytes }. Throws an Error with
// a friendly `.friendly` message when the file can't be opened.
export async function compressImage(file, { maxEdge = MAX_EDGE, quality = QUALITY } = {}) {
  let source;
  try {
    source = await decode(file);
  } catch {
    const err = new Error("decode_failed");
    err.friendly = /heic|heif/i.test(file.type + file.name)
      ? "This photo is in HEIC format, which this browser can't open. Try choosing it from your phone, or save it as a JPEG first."
      : "That file couldn't be opened as a photo.";
    throw err;
  }

  const w = source.width || source.naturalWidth;
  const h = source.height || source.naturalHeight;
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const width = Math.max(1, Math.round(w * scale));
  const height = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  // White under transparent PNGs, so they don't turn black as JPEG.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  if (typeof source.close === "function") source.close();

  // A browser that can't write WebP hands back a PNG instead: use JPEG then.
  let blob = await toBlob(canvas, "image/webp", quality);
  let ext = "webp";
  if (!blob || blob.type !== "image/webp") {
    blob = await toBlob(canvas, "image/jpeg", 0.82);
    ext = "jpg";
  }
  if (!blob) {
    const err = new Error("encode_failed");
    err.friendly = "That photo couldn't be prepared. Try a different one.";
    throw err;
  }
  return { blob, ext, width, height, originalBytes: file.size };
}

export function formatBytes(n) {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
