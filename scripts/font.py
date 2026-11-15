#!/usr/bin/env python3
"""Builds the game's own display typeface ("NB Display": caps, digits, basic punctuation) -> src/font.woff.
Original glyphs defined below as strokes on a 4x6 grid, expanded to outlines. Dev-time only (needs fonttools);
the built font is committed, so scripts/build.mjs stays dependency-free.
Usage: python3 scripts/font.py   (in an environment with `pip install fonttools`)"""
import math, os
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

UX, UY, SW, GAP = 128, 116, 104, 110          # grid unit x/y, stroke weight, side bearing total
CAP = 6 * UY
O = "1,0 3,0 4,1 4,5 3,6 1,6 0,5 0,1 1,0"
G = {  # glyph -> (strokes, width in grid units). A stroke is a polyline "x,y x,y ..."; a single point is a dot.
    'A': ("0,0 0,5 1,6 3,6 4,5 4,0|0,2.6 4,2.6", 4), 'B': ("0,0 0,6 3,6 4,5 4,4 3,3 0,3|3,3 4,2 4,1 3,0 0,0", 4),
    'C': ("4,5 3,6 1,6 0,5 0,1 1,0 3,0 4,1", 4), 'D': ("0,0 0,6 3,6 4,5 4,1 3,0 0,0", 4),
    'E': ("4,6 0,6 0,0 4,0|0,3 3,3", 4), 'F': ("4,6 0,6 0,0|0,3 3,3", 4),
    'G': ("4,5 3,6 1,6 0,5 0,1 1,0 3,0 4,1 4,3 2.2,3", 4), 'H': ("0,0 0,6|4,0 4,6|0,3 4,3", 4),
    'I': ("0,0 0,6", 0), 'J': ("3.6,6 3.6,1 2.6,0 1,0 0,1", 3.6), 'K': ("0,0 0,6|4,6 1,3 4,0|0,3 1,3", 4),
    'L': ("0,6 0,0 3.6,0", 3.6), 'M': ("0,0 0,6 2.5,2.6 5,6 5,0", 5), 'N': ("0,0 0,6 4,0 4,6", 4), 'O': (O, 4),
    'P': ("0,0 0,6 3,6 4,5 4,4 3,3 0,3", 4), 'Q': (O + "|2.4,1.6 4.2,-0.3", 4), 'R': ("0,0 0,6 3,6 4,5 4,4 3,3 0,3|2,3 4,0", 4),
    'S': ("4,5 3,6 1,6 0,5 0,4 1,3 3,3 4,2 4,1 3,0 1,0 0,1", 4), 'T': ("0,6 4,6|2,6 2,0", 4),
    'U': ("0,6 0,1 1,0 3,0 4,1 4,6", 4), 'V': ("0,6 2,0 4,6", 4), 'W': ("0,6 1.2,0 2.6,4 4,0 5.2,6", 5.2),
    'X': ("0,6 4,0|0,0 4,6", 4), 'Y': ("0,6 2,3 4,6|2,3 2,0", 4), 'Z': ("0,6 4,6 0,0 4,0", 4),
    '0': (O + "|2,2.6 2,3.4", 4), '1': ("0.8,4.8 2,6 2,0|0.6,0 3.4,0", 4), '2': ("0,5 1,6 3,6 4,5 4,4 0,0 4,0", 4),
    '3': ("0,5 1,6 3,6 4,5 4,4 3,3 4,2 4,1 3,0 1,0 0,1|1.8,3 3,3", 4), '4': ("3.2,0 3.2,6 0,2 4,2", 4),
    '5': ("4,6 0,6 0,3.2 3,3.2 4,2.2 4,1 3,0 1,0 0,1", 4), '6': ("4,5 3,6 1,6 0,5 0,1 1,0 3,0 4,1 4,2.2 3,3.2 0,3.2", 4),
    '7': ("0,6 4,6 1.6,0", 4), '8': ("1,3 0,4 0,5 1,6 3,6 4,5 4,4 3,3 1,3 0,2 0,1 1,0 3,0 4,1 4,2 3,3", 4),
    '9': ("0,1 1,0 3,0 4,1 4,5 3,6 1,6 0,5 0,3.8 1,2.8 4,2.8", 4),
    '.': ("0,0", 0), ',': ("0,0 -0.5,-1", 0), ':': ("0,0.8|0,3.8", 0), '!': ("0,6 0,2|0,0", 0), '?': ("0,5 1,6 2.4,6 3.4,5 3.4,4 1.7,2.6 1.7,2|1.7,0", 3.4),
    '+': ("0.4,3 3.2,3|1.8,1.6 1.8,4.4", 3.6), '-': ("0.4,3 3.2,3", 3.6), '/': ("0,0 2.6,6", 2.6), "'": ("0,6 0,4.8", 0),
    '%': ("0,5.6|3.4,0.4|0.2,0 3.2,6", 3.4), '&': ("4,0 0.6,4.4 0.6,5.2 1.4,6 2.2,6 3,5.2 3,4.4 0,2 0,1 1,0 2.4,0 4,2", 4),
    '(': ("1.2,6.6 0,5 0,1 1.2,-0.6", 1.2), ')': ("0,6.6 1.2,5 1.2,1 0,-0.6", 1.2), '>': ("0,5 3,3 0,1", 3), '<': ("3,5 0,3 3,1", 3),
    '=': ("0.4,2 3.2,2|0.4,4 3.2,4", 3.6), '#': ("1,0 1.6,6|2.6,0 3.2,6|0,2 4,2|0.2,4 4.2,4", 4.2), '*': ("0.3,3 2.7,3|0.9,1.9 2.1,4.1|0.9,4.1 2.1,1.9", 3),
}
EXTRA = {0x00B7: ("0,3", 0), 0x2212: G['-'], 0x00D7: ("0.4,1.6 3,4.4|0.4,4.4 3,1.6", 3.4)}  # middle dot, minus, multiply

def octagon(cx, cy, r):
    return [(cx + r * math.cos(-i * math.pi / 4 + math.pi / 8), cy + r * math.sin(-i * math.pi / 4 + math.pi / 8)) for i in range(8)]  # clockwise (y up)
def segment(a, b, h):
    dx, dy = b[0] - a[0], b[1] - a[1]; d = math.hypot(dx, dy) or 1; nx, ny = -dy / d * h, dx / d * h
    return [(a[0] + nx, a[1] + ny), (b[0] + nx, b[1] + ny), (b[0] - nx, b[1] - ny), (a[0] - nx, a[1] - ny)]         # clockwise
def draw(spec):
    pen = TTGlyphPen(None); h = SW / 2
    for stroke in spec.split('|'):
        pts = [(float(x) * UX + h + GAP * 0.45, float(y) * UY + h * 0.0) for x, y in (p.split(',') for p in stroke.split())]
        pts = [(x, y + h) for x, y in pts]                       # keep strokes inside the 0..CAP+SW box
        shapes = [octagon(x, y, h * 1.04) for x, y in pts] + [segment(pts[i], pts[i + 1], h) for i in range(len(pts) - 1)]
        for sh in shapes:
            pen.moveTo((round(sh[0][0]), round(sh[0][1])))
            for p in sh[1:]: pen.lineTo((round(p[0]), round(p[1])))
            pen.closePath()
    return pen.glyph()

order, cmap, glyphs, metrics = ['.notdef', 'space'], {32: 'space', 0xA0: 'space'}, {}, {}
empty = TTGlyphPen(None).glyph(); glyphs['.notdef'] = empty; glyphs['space'] = TTGlyphPen(None).glyph()
metrics['.notdef'] = (400, 0); metrics['space'] = (2 * UX + 40, 0)
def add(cp, spec, w):
    name = 'u%04X' % cp; order.append(name); cmap[cp] = name; glyphs[name] = draw(spec); metrics[name] = (round(w * UX + SW + GAP), 0); return name
for ch, (spec, w) in G.items():
    n = add(ord(ch), spec, w)
    if ch.isalpha(): cmap[ord(ch.lower())] = n                  # caps-only face: lowercase maps to capitals
for cp, (spec, w) in EXTRA.items(): add(cp, spec, w)
digit_w = metrics['u0030'][0]
for d in '0123456789': assert metrics['u%04X' % ord(d)][0] == digit_w  # tabular digits

fb = FontBuilder(1000, isTTF=True)
fb.setupGlyphOrder(order); fb.setupCharacterMap(cmap); fb.setupGlyf(glyphs); fb.setupHorizontalMetrics(metrics)
asc, desc = CAP + SW + 60, -160
fb.setupHorizontalHeader(ascent=asc, descent=desc)
fb.setupNameTable({'familyName': 'NB Display', 'styleName': 'Regular'})
fb.setupOS2(sTypoAscender=asc, sTypoDescender=desc, usWinAscent=asc, usWinDescent=-desc, sCapHeight=CAP + SW, sxHeight=CAP + SW)
fb.setupPost()
out = os.path.join(os.path.dirname(__file__), '..', 'src', 'font.woff')
fb.font.flavor = 'woff'; fb.save(out)
print('wrote', os.path.normpath(out), os.path.getsize(out), 'bytes,', len(order), 'glyphs')
