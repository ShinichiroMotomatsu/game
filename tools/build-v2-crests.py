from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUTPUT = ROOT / "assets" / "v2" / "past-events"
SUPERSAMPLE = 4


def star_points(
    center: tuple[float, float],
    outer_radius: float,
    inner_radius: float,
) -> list[tuple[int, int]]:
    cx, cy = center
    points: list[tuple[int, int]] = []
    for index in range(16):
        angle = -math.pi / 2 + index * math.pi / 8
        radius = outer_radius if index % 2 == 0 else inner_radius
        points.append((
            round((cx + math.cos(angle) * radius) * SUPERSAMPLE),
            round((cy + math.sin(angle) * radius) * SUPERSAMPLE),
        ))
    return points


def vertical_gradient(size: tuple[int, int], top: tuple[int, ...], bottom: tuple[int, ...]) -> Image.Image:
    image = Image.new("RGBA", size)
    pixels = image.load()
    denominator = max(1, size[1] - 1)
    for y in range(size[1]):
        amount = y / denominator
        color = tuple(round(top[channel] + (bottom[channel] - top[channel]) * amount) for channel in range(4))
        for x in range(size[0]):
            pixels[x, y] = color
    return image


def draw_star(
    canvas: Image.Image,
    center: tuple[float, float],
    outer_radius: float,
    inner_radius: float,
    glass_top: tuple[int, int, int, int],
    glass_bottom: tuple[int, int, int, int],
) -> None:
    size = canvas.size
    mask = Image.new("L", size, 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.polygon(star_points(center, outer_radius, inner_radius), fill=255)

    glow = Image.new("RGBA", size, (*glass_top[:3], 0))
    glow.putalpha(mask.filter(ImageFilter.GaussianBlur(9 * SUPERSAMPLE)).point(lambda value: round(value * 0.18)))
    canvas.alpha_composite(glow)

    draw = ImageDraw.Draw(canvas, "RGBA")
    glass = vertical_gradient(size, glass_top, glass_bottom)
    canvas.alpha_composite(Image.composite(glass, Image.new("RGBA", size), mask))
    outline = star_points(center, outer_radius, inner_radius)
    closed_outline = outline + [outline[0]]
    draw.line(closed_outline, fill=(68, 39, 12, 255), width=13 * SUPERSAMPLE, joint="curve")
    draw.line(closed_outline, fill=(217, 164, 64, 255), width=8 * SUPERSAMPLE, joint="curve")

    cx, cy = (round(value * SUPERSAMPLE) for value in center)
    center_radius = round(34 * outer_radius / 196 * SUPERSAMPLE)
    draw.ellipse(
        (cx - center_radius - 5 * SUPERSAMPLE, cy - center_radius - 5 * SUPERSAMPLE,
         cx + center_radius + 5 * SUPERSAMPLE, cy + center_radius + 5 * SUPERSAMPLE),
        fill=(71, 40, 12, 255),
    )
    draw.ellipse(
        (cx - center_radius, cy - center_radius, cx + center_radius, cy + center_radius),
        fill=(226, 178, 76, 255),
    )
    inner_center = round(center_radius * 0.72)
    draw.ellipse(
        (cx - inner_center, cy - inner_center, cx + inner_center, cy + inner_center),
        fill=glass_top,
    )
    highlight = max(2, round(inner_center * 0.23))
    draw.ellipse(
        (cx - inner_center * 0.45, cy - inner_center * 0.45,
         cx - inner_center * 0.45 + highlight, cy - inner_center * 0.45 + highlight),
        fill=(255, 255, 255, 205),
    )


def render_blue_star() -> Image.Image:
    size = (512 * SUPERSAMPLE, 512 * SUPERSAMPLE)
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    draw_star(
        canvas,
        (256, 256),
        196,
        76,
        (84, 198, 255, 255),
        (12, 55, 151, 255),
    )
    return canvas.resize((512, 512), Image.Resampling.LANCZOS)


def render_twin_star() -> Image.Image:
    size = (640 * SUPERSAMPLE, 512 * SUPERSAMPLE)
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas, "RGBA")
    route = [(205 * SUPERSAMPLE, 190 * SUPERSAMPLE), (320 * SUPERSAMPLE, 256 * SUPERSAMPLE), (435 * SUPERSAMPLE, 322 * SUPERSAMPLE)]
    draw.line(route, fill=(68, 39, 12, 255), width=24 * SUPERSAMPLE, joint="curve")
    draw.line(route, fill=(221, 171, 74, 255), width=13 * SUPERSAMPLE, joint="curve")
    draw_star(
        canvas,
        (205, 190),
        148,
        57,
        (84, 198, 255, 255),
        (12, 55, 151, 255),
    )
    draw_star(
        canvas,
        (435, 322),
        148,
        57,
        (255, 213, 111, 255),
        (170, 73, 20, 255),
    )
    return canvas.resize((640, 512), Image.Resampling.LANCZOS)


def blue_star_svg() -> str:
    uses = "\n".join(
        f'    <use href="#blue-ray" transform="rotate({index * 45} 256 256)" />'
        for index in range(8)
    )
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-labelledby="title desc">
  <title id="title">青星紋</title>
  <desc id="desc">等しい八方向と中央の帰る場所を表す、地図師エルドの旅印</desc>
  <defs>
    <linearGradient id="blue-glass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#54c6ff"/><stop offset="1" stop-color="#0c3797"/>
    </linearGradient>
    <path id="blue-ray" d="M256 58 L281 202 L256 244 L231 202 Z" fill="url(#blue-glass)" stroke="#d9a440" stroke-width="11" stroke-linejoin="round"/>
  </defs>
  <g data-crest="blue-star" data-rays="8" data-equal-rays="true" data-meaning="return-place">
{uses}
    <circle cx="256" cy="256" r="38" fill="#d9a440" stroke="#44270c" stroke-width="8"/>
    <circle cx="256" cy="256" r="25" fill="url(#blue-glass)"/>
  </g>
</svg>
'''


def svg_star_path(center: tuple[int, int], outer_radius: int, inner_radius: int) -> str:
    points = []
    for index in range(16):
        angle = -math.pi / 2 + index * math.pi / 8
        radius = outer_radius if index % 2 == 0 else inner_radius
        points.append(f"{center[0] + math.cos(angle) * radius:.2f},{center[1] + math.sin(angle) * radius:.2f}")
    return " ".join(points)


def twin_star_svg() -> str:
    blue_points = svg_star_path((205, 190), 148, 57)
    amber_points = svg_star_path((435, 322), 148, 57)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="640" height="512" viewBox="0 0 640 512" role="img" aria-labelledby="title desc">
  <title id="title">双星紋</title>
  <desc id="desc">エルドとミラの等しい二つの星を一本の道で結んだ共同の旅印</desc>
  <defs>
    <linearGradient id="blue-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#54c6ff"/><stop offset="1" stop-color="#0c3797"/></linearGradient>
    <linearGradient id="amber-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd56f"/><stop offset="1" stop-color="#aa4914"/></linearGradient>
  </defs>
  <path d="M205 190 Q320 256 435 322" fill="none" stroke="#44270c" stroke-width="24" stroke-linecap="round" data-meaning="road-between-two-people"/>
  <path d="M205 190 Q320 256 435 322" fill="none" stroke="#d9a440" stroke-width="13" stroke-linecap="round"/>
  <g data-owner="エルド" data-color="blue-glass">
    <polygon points="{blue_points}" fill="url(#blue-glass)" stroke="#d9a440" stroke-width="10" stroke-linejoin="round"/>
    <circle cx="205" cy="190" r="27" fill="url(#blue-glass)" stroke="#d9a440" stroke-width="9"/>
  </g>
  <g data-owner="ミラ" data-color="amber-glass">
    <polygon points="{amber_points}" fill="url(#amber-glass)" stroke="#d9a440" stroke-width="10" stroke-linejoin="round"/>
    <circle cx="435" cy="322" r="27" fill="url(#amber-glass)" stroke="#d9a440" stroke-width="9"/>
  </g>
</svg>
'''


def build_crest_assets(output_directory: Path = DEFAULT_OUTPUT) -> dict[str, dict[str, object]]:
    output_directory = Path(output_directory)
    source_directory = output_directory / "crest-sources"
    source_directory.mkdir(parents=True, exist_ok=True)

    blue_png = output_directory / "blue-star-crest.png"
    blue_svg = source_directory / "blue-star-crest.svg"
    twin_png = output_directory / "twin-star-crest.png"
    twin_svg = source_directory / "twin-star-crest.svg"

    render_blue_star().save(blue_png, optimize=True)
    render_twin_star().save(twin_png, optimize=True)
    blue_svg.write_text(blue_star_svg(), encoding="utf-8")
    twin_svg.write_text(twin_star_svg(), encoding="utf-8")

    return {
        "blue-star": {"png": blue_png, "svg": blue_svg, "size": [512, 512]},
        "twin-star": {"png": twin_png, "svg": twin_svg, "size": [640, 512]},
    }


if __name__ == "__main__":
    for name, files in build_crest_assets().items():
        print(f"{name}: {files['png']} / {files['svg']}")
