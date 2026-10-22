import sys
from PIL import Image, ImageDraw, ImageFilter
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGBA")
CX, CY, R = 367, 312, 139

BASE = None
def backed():
    # the logo's whites are see-through; back the O with a pale disc
    b = Image.new("RGBA", im.size, (0,0,0,0))
    ImageDraw.Draw(b).ellipse((CX-R+3, CY-R+3, CX+R-3, CY+R-3), fill=(246,243,236,255))
    b.alpha_composite(im); return b

def orb_only():
    im = backed()
    m = Image.new("L", im.size, 0)
    ImageDraw.Draw(m).ellipse((CX-R, CY-R, CX+R, CY+R), fill=255)
    o = Image.new("RGBA", im.size, (0,0,0,0)); o.paste(im, mask=m)
    return o.crop((CX-R, CY-R, CX+R, CY+R))

def orb_axis():
    # the O plus its vertical axis: crescent moon above, gold bead below
    im = backed()
    m = Image.new("L", im.size, 0); d = ImageDraw.Draw(m)
    d.ellipse((CX-R, CY-R, CX+R, CY+R), fill=255)
    d.rectangle((CX-42, 40, CX+42, CY), fill=255)
    d.rectangle((CX-22, CY, CX+22, 500), fill=255)
    m = m.filter(ImageFilter.GaussianBlur(1.2))
    o = Image.new("RGBA", im.size, (0,0,0,0)); o.paste(im, mask=m)
    top, bot = 40, 500; h = bot-top; w = h
    return o.crop((CX-w//2, top, CX+w//2, bot))

def vgrad(size, c1, c2):
    g = Image.new("RGBA", (size, size))
    d = ImageDraw.Draw(g)
    for y in range(size):
        t = y/(size-1); d.line((0,y,size,y), fill=tuple(int(c1[i]+(c2[i]-c1[i])*t) for i in range(3))+(255,))
    return g

def place(bg, art, scale):
    S = bg.size[0]; a = art.copy(); w = int(S*scale)
    a = a.resize((w, int(a.size[1]*w/a.size[0])), Image.LANCZOS)
    bg = bg.copy(); bg.alpha_composite(a, ((S-a.size[0])//2, (S-a.size[1])//2)); return bg

N = 512
night = vgrad(N, (25,25,61), (10,10,28))
cream = vgrad(N, (250,245,236), (238,226,208))
variants = {
  "A-orb-night": place(night, orb_only(), 0.80),
  "B-orb-cream": place(cream, orb_only(), 0.80),
  "C-axis-night": place(night, orb_axis(), 0.86),
}
for k, v in variants.items(): v.save(f"{out}/{k}.png")

# preview: each at 160px rounded like a phone icon, plus 32px tab size, on light and dark strips
def rounded(img, s):
    i = img.resize((s, s), Image.LANCZOS); m = Image.new("L", (s, s), 0)
    ImageDraw.Draw(m).rounded_rectangle((0,0,s-1,s-1), radius=int(s*0.22), fill=255)
    o = Image.new("RGBA", (s, s), (0,0,0,0)); o.paste(i, mask=m); return o
W, H = 3*220+40, 2*260
sheet = Image.new("RGBA", (W, H), (0,0,0,255))
for row, bgc in enumerate([(247,241,232,255), (18,18,40,255)]):
    ImageDraw.Draw(sheet).rectangle((0, row*260, W, row*260+260), fill=bgc)
    for col, (k, v) in enumerate(variants.items()):
        x = 30 + col*220
        sheet.alpha_composite(rounded(v, 160), (x, row*260+20))
        sheet.alpha_composite(v.resize((32,32), Image.LANCZOS), (x+64, row*260+200))
sheet.save(f"{out}/preview.png")
