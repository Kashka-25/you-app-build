"""Builds YOU's icons from the O of the full logo (Cassidy, Oct 23).

  App icons (home screen, install): the O on the Cosmos night, option A.
  Tab icons (favicon): the O by itself on a clear background.

Run: python design/app-icon-o/make-icons.py web-next/public
"""
import sys
from PIL import Image, ImageDraw

pub = sys.argv[1]
logo = Image.open(pub + "/logo-full.png").convert("RGBA")
CX, CY, R = 367, 312, 139  # the O inside logo-full.png (720x621)


def the_o():
    # The logo's whites are see-through, so the sea foam needs a pale disc
    # behind it; then everything outside the O's gold ring is cut away.
    backed = Image.new("RGBA", logo.size, (0, 0, 0, 0))
    ImageDraw.Draw(backed).ellipse((CX - R + 3, CY - R + 3, CX + R - 3, CY + R - 3), fill=(246, 243, 236, 255))
    backed.alpha_composite(logo)
    K = 4
    m = Image.new("L", (logo.size[0] * K, logo.size[1] * K), 0)
    ImageDraw.Draw(m).ellipse(((CX - R) * K, (CY - R) * K, (CX + R) * K, (CY + R) * K), fill=255)
    out = Image.new("RGBA", logo.size, (0, 0, 0, 0))
    out.paste(backed, mask=m.resize(logo.size, Image.LANCZOS))
    return out.crop((CX - R, CY - R, CX + R, CY + R))


def night(size):
    g = Image.new("RGBA", (size, size))
    d = ImageDraw.Draw(g)
    for y in range(size):
        t = y / (size - 1)
        d.line((0, y, size, y), fill=(int(25 - 15 * t), int(25 - 15 * t), int(61 - 33 * t), 255))
    return g


O = the_o()

# App icons: full-bleed squares (phones round the corners themselves).
for name, size in (("icon-512x512.png", 512), ("icon-192x192.png", 192), ("apple-touch-icon.png", 180)):
    bg = night(size)
    w = int(size * 0.80)
    bg.alpha_composite(O.resize((w, w), Image.LANCZOS), ((size - w) // 2, (size - w) // 2))
    bg.convert("RGB").save(f"{pub}/{name}", optimize=True)

# Tab icons: the O alone, filling the square.
big = O.resize((256, 256), Image.LANCZOS)
for s in (32, 64):
    big.resize((s, s), Image.LANCZOS).save(f"{pub}/favicon-{s}x{s}.png", optimize=True)
big.save(pub + "/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
