#!/usr/bin/env python3
"""Render the README banner from the terminal's actual tokens, type and echo mark."""
from pathlib import Path
import math
import re
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
WIDTH, HEIGHT, SCALE = 1000, 380, 2
CSS = (ROOT / 'apps/web/src/styles/tokens.css').read_text()
FONT_ROOT = ROOT / 'apps/web/public/fonts'


def token(name):
    value = re.search(r'--' + re.escape(name) + r':\s*(#[0-9a-fA-F]{3,6})(?=;)', CSS).group(1)[1:]
    if len(value) == 3:
        value = ''.join(char * 2 for char in value)
    return tuple(int(value[index:index + 2], 16) for index in (0, 2, 4))


BG, INK, MUTED, ACCENT, RULE = [token(name) for name in ('bg', 'ink', 'muted', 'accent', 'rule')]


def font(size, kind='sans'):
    if kind == 'display':
        candidates = [FONT_ROOT / 'syne-regular.ttf']
    elif kind == 'mono':
        candidates = [Path('/System/Library/Fonts/Menlo.ttc'), Path('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf')]
    else:
        candidates = [Path('/System/Library/Fonts/Helvetica.ttc'), Path('/System/Library/Fonts/Supplemental/Arial.ttf'), Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')]
    for file in candidates:
        if file.is_file():
            return ImageFont.truetype(file, round(size * SCALE))
    raise RuntimeError(f'Cannot find the frontend {kind} font')


def blend(color, strength):
    return tuple(round(BG[i] + (color[i] - BG[i]) * strength) for i in range(3))


def echo_mark(draw, x, y, size, color, stroke=1.25):
    # Exact arc geometry from LogoMark in apps/web/src/components/brand.tsx.
    for endpoint, radius, half_height in ((26, 16, 15), (23, 9, 8), (20, 2.5, 2)):
        center_x = endpoint - math.sqrt(radius * radius - half_height * half_height)
        start = math.degrees(math.asin(half_height / radius))
        draw.arc(tuple(round(value * SCALE) for value in (
            x + (center_x - radius) * size / 36, y + (18 - radius) * size / 36,
            x + (center_x + radius) * size / 36, y + (18 + radius) * size / 36,
        )), start=start, end=360 - start, fill=color, width=max(1, round(stroke * size / 36 * SCALE)))


def render():
    frames = []
    for step in range(48):
        phase = step / 48
        image = Image.new('RGB', (WIDTH * SCALE, HEIGHT * SCALE), BG)
        draw = ImageDraw.Draw(image)

        def line(points, color, width=1):
            draw.line([(round(x * SCALE), round(y * SCALE)) for x, y in points], fill=color, width=max(1, round(width * SCALE)))

        def text(x, y, value, size, color=INK, kind='sans'):
            draw.text((round(x * SCALE), round(y * SCALE)), value, font=font(size, kind), fill=color)

        echo_mark(draw, 42, 26, 29, INK)
        text(82, 28, 'EKO', 24)
        text(660, 37, 'SIGNAL / EVIDENCE / CONTROL', 10, MUTED, 'mono')
        line([(42, 78), (958, 78)], RULE)
        text(44, 103, 'A HARNESS FOR TRADING AGENTS', 10, MUTED, 'mono')
        text(40, 130, 'Less noise.', 65, INK, 'display')
        text(40, 198, 'More evidence.', 65, INK, 'display')
        text(44, 282, 'Give your agent a harness.', 17, MUTED)

        # The landing's ice-blue signal treatment, confined to a black chart plate.
        for ring in range(5):
            radius = 40 + ring * 22
            brightness = .08 + .07 * (1 + math.sin(math.tau * phase - ring * .7)) / 2
            box = tuple(round(value * SCALE) for value in (811 - radius, 202 - radius, 811 + radius, 202 + radius))
            draw.ellipse(box, outline=blend(ACCENT, brightness), width=SCALE)
        for layer in range(5):
            points = []
            for index in range(281):
                x = 664 + index
                envelope = math.sin(math.pi * index / 280) ** 2
                y = 203 + envelope * (27 * math.sin(index * .058 + math.tau * phase + layer * .62) + 8 * math.sin(index * .131 - math.tau * phase))
                points.append((x, y + (layer - 2) * 4))
            line(points, blend(ACCENT, .13 + .12 * layer), .65)
        echo_mark(draw, 773, 164, 76, blend(INK, .85), .85)
        line([(664, 289), (944, 289)], RULE)
        text(665, 303, 'INDEPENDENT READINGS.', 10, MUTED, 'mono')
        text(665, 321, 'VISIBLE REASONS.', 10, MUTED, 'mono')

        line([(42, 343), (958, 343)], RULE)
        text(44, 355, '01 / SENSES', 10, ACCENT, 'mono')
        text(274, 355, '02 / GUARDRAILS', 10, MUTED, 'mono')
        text(552, 355, '03 / FLIGHT RECORDER', 10, MUTED, 'mono')
        image = image.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
        frames.append(image.convert('P', palette=Image.Palette.ADAPTIVE, colors=96))
    output = ROOT / 'docs/media/banner.gif'
    frames[0].save(output, save_all=True, append_images=frames[1:], duration=80, loop=0, optimize=True, disposal=2)
    print(f'Generated {len(frames)} frames, {WIDTH} x {HEIGHT}, frontend colors and Syne type')


if __name__ == '__main__':
    render()
