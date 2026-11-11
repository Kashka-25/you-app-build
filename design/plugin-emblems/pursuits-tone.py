# Tones the painted PursYOUts emblem into the house set (Build Note, 9 Nov 2026):
# olive leaves to sage, strong orange to soft peach, and the pale haze behind
# the sun lighter so it does not read as a white disc on dark.
#   python design/plugin-emblems/pursuits-tone.py <in.png> <out.png>
# The untoned originals are pursuits-v2-before-toning(.png|@4x.png).
import sys, colorsys
import numpy as np
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert("RGBA")).astype(np.float32) / 255
rgb, a = im[..., :3], im[..., 3]
mx, mn = rgb.max(-1), rgb.min(-1)
l = (mx + mn) / 2
sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
# hue (0..1) via vectorised colorsys
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
d = np.maximum(mx - mn, 1e-6)
h = np.select([mx == r, mx == g], [((g - b) / d) % 6, (b - r) / d + 2], (r - g) / d + 4) / 6
v = mx
# 1 greens/olives (hue .12-.40) -> sage: hue toward .33, less saturated
green = (h > 0.12) & (h < 0.42) & (sat > 0.15)
h = np.where(green, h * 0.4 + 0.30 * 0.6, h)
sat = np.where(green, sat * 0.55, sat)
# 2 oranges/reds (hue < .12 or > .95) -> softer peach/terracotta
warm = ((h < 0.12) | (h > 0.95)) & (sat > 0.2)
sat = np.where(warm, sat * 0.78, sat)
v = np.where(warm, v * 0.97, v)
# 3 everything a touch quieter
sat = sat * 0.9
# back to rgb (HSV)
i = np.floor(h * 6) % 6; f = h * 6 - np.floor(h * 6)
p = v * (1 - sat); q = v * (1 - f * sat); t = v * (1 - (1 - f) * sat)
out = np.stack([
  np.select([i == 0, i == 1, i == 2, i == 3, i == 4], [v, q, p, p, t], v),
  np.select([i == 0, i == 1, i == 2, i == 3, i == 4], [t, v, v, q, p], p),
  np.select([i == 0, i == 1, i == 2, i == 3, i == 4], [p, p, t, v, v], q)], -1)
# 4 pale cream haze (very light, low saturation) fades out, so dark mode shows no white disc
pale = np.clip((l - 0.87) / 0.10, 0, 1) * np.clip((0.35 - sat) / 0.35, 0, 1)
a = a * (1 - 0.55 * pale)
res = np.dstack([out, a])
Image.fromarray((np.clip(res, 0, 1) * 255).astype(np.uint8), "RGBA").save(dst)
