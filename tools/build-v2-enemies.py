from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "v2" / "past-enemies-sheet-source.png"
OUTPUT = ROOT / "assets" / "v2" / "past-enemies"
NAMES = ("mist-slime.png", "gutter-goblin.png", "rune-wolf.png")


def crop_visible(image: Image.Image, padding: int = 18) -> Image.Image:
    alpha = image.getchannel("A")
    bounds = alpha.getbbox()
    if not bounds:
        raise ValueError("Enemy sprite has no visible pixels")
    left, top, right, bottom = bounds
    return image.crop((
        max(0, left - padding),
        max(0, top - padding),
        min(image.width, right + padding),
        min(image.height, bottom + padding),
    ))


def main() -> None:
    sheet = Image.open(SOURCE).convert("RGBA")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    cell_width = sheet.width // 3
    for index, name in enumerate(NAMES):
        cell = sheet.crop((index * cell_width, 0, (index + 1) * cell_width, sheet.height))
        sprite = crop_visible(cell)
        sprite.save(OUTPUT / name)
        print(f"enemy {name}: {sprite.width}x{sprite.height}")


if __name__ == "__main__":
    main()
