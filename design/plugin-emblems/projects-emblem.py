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

# ── The folder, with a seedling growing out of it ──
base_img, img = img, layer()
def poly_mask(pts, rounded=0):
    m = Image.new("L", (N, N), 0)
    ImageDraw.Draw(m).polygon([(s(x), s(y)) for x, y in pts], fill=255)
    return m.filter(ImageFilter.GaussianBlur(K * 0.6)) if rounded else m

# back panel and tab
back = poly_mask([(170, 236), (232, 236), (246, 252), (342, 252), (342, 366), (170, 366)])
img.alpha_composite(wash(back, (226, 205, 168), (196, 168, 124), 245))
ImageDraw.Draw(img).line([(s(x), s(y)) for x, y in [(170, 366), (170, 236), (232, 236), (246, 252), (342, 252), (342, 366)]], fill=GOLD + (230,), width=s(2.2))

# the seedling, between the panels
sd = ImageDraw.Draw(img)
sd.line([(s(256), s(318)), (s(256), s(214))], fill=(88, 112, 76, 255), width=s(3.5))
img.alpha_composite(leaf(s(232), s(222), s(58), s(24), 155, *SAGE))
img.alpha_composite(leaf(s(280), s(206), s(64), s(26), 25, *DEEP))
img.alpha_composite(leaf(s(244), s(184), s(40), s(17), 120, *SAGE))
img.alpha_composite(star(s(278), s(166), s(12), s(3), GOLD + (255,)))

# front panel, slanted, with a gold rim
front = poly_mask([(160, 286), (352, 286), (338, 372), (174, 372)])
img.alpha_composite(wash(front, (242, 228, 200), (214, 190, 146), 250))
ImageDraw.Draw(img).line([(s(x), s(y)) for x, y in [(160, 286), (352, 286), (338, 372), (174, 372), (160, 286)]], fill=GOLD + (240,), width=s(2.4))
ImageDraw.Draw(img).line([(s(196), s(312)), (s(316), s(312))], fill=GOLD + (150,), width=s(1.6))

# The picture, drawn on its own, then enlarged about its centre.
motif, img = img, base_img
F = 1.24
big = motif.resize((int(N * F), int(N * F)), Image.LANCZOS)
ox, oy = int(s(256) * (F - 1)), int(s(286) * (F - 1))
img.alpha_composite(big.crop((ox, oy, ox + N, oy + N)))

final = img.resize((512, 512), Image.LANCZOS)
final.save(out + "/projects@4x.png")
final.resize((128, 128), Image.LANCZOS).save(out + "/projects.png")
