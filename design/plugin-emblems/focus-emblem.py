import math, random, sys
from PIL import Image, ImageDraw, ImageFilter, ImageChops

out = sys.argv[1]
K = 4                      # draw big, shrink for smooth edges
N = 512 * K
GOLD = (201, 152, 72)
GOLD_LT = (226, 186, 112)
random.seed(7)

def layer():
    return Image.new("RGBA", (N, N), (0, 0, 0, 0))

def s(v):
    return int(v * K)

img = layer()

# ── Gold ring, open at the top (for the star) and bottom (for the leaves) ──
ring = layer(); d = ImageDraw.Draw(ring)
cx, cy, r = s(256), s(258), s(198)
d.arc((cx - r, cy - r, cx + r, cy + r), start=-80, end=260, fill=GOLD + (235,), width=s(3))
img.alpha_composite(ring)

# ── Four-point star on top, with the bead line ──
def star(cx, cy, R, rr, col):
    L = layer(); dd = ImageDraw.Draw(L)
    pts = []
    for i in range(8):
        a = -math.pi / 2 + i * math.pi / 4
        rad = R if i % 2 == 0 else rr
        pts.append((cx + rad * math.cos(a), cy + rad * math.sin(a)))
    dd.polygon(pts, fill=col)
    return L
glow = star(s(256), s(64), s(40), s(9), GOLD_LT + (120,)).filter(ImageFilter.GaussianBlur(s(6)))
img.alpha_composite(glow)
img.alpha_composite(star(s(256), s(64), s(36), s(7), GOLD + (255,)))
d = ImageDraw.Draw(img)
for y, rad in ((s(14), s(3.2)), (s(112), s(4)), (s(500), s(4))):
    d.ellipse((s(256) - rad, y - rad, s(256) + rad, y + rad), fill=GOLD + (230,))
d.line((s(256), s(102), s(256), s(126)), fill=GOLD + (200,), width=s(2))

# ── Watercolour-ish fill helper: soft vertical gradient + grain ──
def wash(mask, top, bottom, alpha=235):
    w, h = mask.size
    g = Image.new("RGBA", (w, h))
    gd = ImageDraw.Draw(g)
    for y in range(0, h, K):
        t = y / h
        col = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        gd.rectangle((0, y, w, y + K), fill=col + (alpha,))
    noise = Image.effect_noise((w // 8, h // 8), 22).resize((w, h)).convert("L")
    g.putalpha(ImageChops.multiply(mask, ImageChops.add(noise, Image.new("L", (w, h), 170))))
    return g

def leaf_at(bx, by, length, width, angle, top, bottom):
    """A pointed leaf whose base sits at (bx, by), pointing along `angle` (degrees, 0 = right, 90 = up)."""
    a = math.radians(angle)
    ux, uy = math.cos(a), -math.sin(a)
    nx, ny = -uy, ux
    pts_l, pts_r = [], []
    for i in range(25):
        t = i / 24
        w = width / 2 * (math.sin(math.pi * t) ** 0.9) * (1 - 0.25 * t)
        cxp, cyp = bx + ux * length * t, by + uy * length * t
        pts_l.append((cxp + nx * w, cyp + ny * w))
        pts_r.append((cxp - nx * w, cyp - ny * w))
    m = Image.new("L", (N, N), 0)
    ImageDraw.Draw(m).polygon(pts_l + pts_r[::-1], fill=255)
    L = layer()
    L.alpha_composite(wash(m.filter(ImageFilter.GaussianBlur(K * 0.5)), top, bottom))
    ImageDraw.Draw(L).line((bx, by, bx + ux * length * 0.8, by + uy * length * 0.8), fill=(255, 255, 255, 45), width=max(2, K))
    return L

def leaf(cx, cy, length, width, angle, top, bottom):
    a = math.radians(angle)
    bx, by = cx - math.cos(a) * length / 2, cy + math.sin(a) * length / 2
    return leaf_at(bx, by, length, width, angle, top, bottom)

SAGE = ((150, 168, 132), (98, 120, 92))
DEEP = ((112, 134, 100), (70, 92, 68))

# ── Branches sweeping up from the bottom, left and right ──
def stem_point(t, side):
    x = 256 + side * (22 + 160 * math.sin(t * math.pi / 2) ** 1.1)
    y = 478 - 196 * t
    return x, y

for side in (-1, 1):
    pts = [tuple(map(s, stem_point(i / 39, side))) for i in range(40)]
    ImageDraw.Draw(img).line(pts, fill=(96, 112, 84, 200), width=s(2.4), joint="curve")
    leaves = [(0.10, 74, 30), (0.24, 70, 28), (0.38, 64, 26), (0.52, 58, 23), (0.66, 50, 20), (0.80, 40, 16)]
    for i, (t, ln, wd) in enumerate(leaves):
        x, y = stem_point(t, side)
        x2, y2 = stem_point(min(1, t + 0.02), side)
        heading = math.degrees(math.atan2(-(y2 - y), (x2 - x)))
        for j, turn in enumerate((38, -38)):
            outward = turn if side > 0 else -turn
            pal = SAGE if (i + j) % 2 else DEEP
            img.alpha_composite(leaf_at(s(x), s(y), s(ln * (1 if j == 0 else 0.86)), s(wd), heading + outward, *pal))
    tx, ty = stem_point(1.0, side)
    for k in range(3):
        bx, by = s(tx + side * (2 + k * 5)), s(ty - 8 - k * 13)
        ImageDraw.Draw(img).ellipse((bx - s(4), by - s(6), bx + s(4), by + s(6)), fill=GOLD_LT + (220,))

# ── The picture in the middle ──
base_img, img = img, layer()
def poly_mask(pts, rounded=0):
    m = Image.new("L", (N, N), 0)
    ImageDraw.Draw(m).polygon([(s(x), s(y)) for x, y in pts], fill=255)
    return m.filter(ImageFilter.GaussianBlur(K * 0.6)) if rounded else m

# A single candle, lit: one thing, fully (Focus belongs to fire).
# soft halo behind the flame
halo = layer()
ImageDraw.Draw(halo).ellipse((s(206), s(150), s(306), s(250)), fill=GOLD_LT + (110,))
img.alpha_composite(halo.filter(ImageFilter.GaussianBlur(s(18))))
# the wax pillar, cream with a warm shadow, a little melt at the lip
wax = poly_mask([(222, 262), (290, 262), (292, 378), (220, 378)])
img.alpha_composite(wash(wax, (248, 238, 216), (214, 194, 156), 250))
drip = Image.new("L", (N, N), 0)
dd = ImageDraw.Draw(drip)
dd.rounded_rectangle((s(234), s(258), s(246), s(298)), radius=s(6), fill=255)
dd.rounded_rectangle((s(268), s(258), s(278), s(284)), radius=s(5), fill=255)
img.alpha_composite(wash(drip, (252, 244, 226), (236, 222, 192), 250))
pd = ImageDraw.Draw(img)
pd.line([(s(x), s(y)) for x, y in [(222, 262), (290, 262), (292, 378), (220, 378), (222, 262)]], fill=GOLD + (235,), width=s(2.4))
# a small gold dish under it
pd.ellipse((s(196), s(370), s(316), s(392)), outline=GOLD + (235,), width=s(2.4))
# the wick
pd.line((s(256), s(262), s(256), s(244)), fill=(80, 64, 48, 255), width=s(3))
# the flame: an outer gold teardrop and a pale heart
def flame(cx, base, h, w, col):
    pts = []
    for i in range(41):
        t = i / 40
        y = base - h * t
        half = w / 2 * math.sin(math.pi * min(1, t * 1.15)) ** 0.8 * (1 - t) ** 0.35
        pts.append((cx + half, y))
    pts += [(cx - x + cx - cx, y) for x, y in []]
    left = [(2 * cx - x, y) for x, y in pts[::-1]]
    m = Image.new("L", (N, N), 0)
    ImageDraw.Draw(m).polygon([(s(x), s(y)) for x, y in pts + left], fill=255)
    return wash(m.filter(ImageFilter.GaussianBlur(K * 0.6)), *col)
img.alpha_composite(flame(256, 248, 78, 40, ((246, 214, 140), (214, 150, 70), 245)))
img.alpha_composite(flame(256, 246, 40, 18, ((255, 248, 226), (250, 224, 168), 250)))
# a spark beside the flame
img.alpha_composite(star(s(304), s(176), s(12), s(3), GOLD + (255,)))

# The picture, drawn on its own, then enlarged about its centre.
motif, img = img, base_img
F = 1.24
big = motif.resize((int(N * F), int(N * F)), Image.LANCZOS)
ox, oy = int(s(256) * (F - 1)), int(s(286) * (F - 1))
img.alpha_composite(big.crop((ox, oy, ox + N, oy + N)))

final = img.resize((512, 512), Image.LANCZOS)
final.save(out + "/focus@4x.png")
final.resize((128, 128), Image.LANCZOS).save(out + "/focus.png")
