from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
GENERATED_ROOT = Path.home() / ".codex" / "generated_images" / "019fda35-90a3-7903-bfb1-31deeabd2ab7"
BACKGROUND_SOURCE = GENERATED_ROOT / "exec-e19f1538-e506-4902-8921-cc7f2533f432.png"
SHEET_SOURCE = GENERATED_ROOT / "exec-5f265270-f118-4a61-b490-ba7cd0eeea45.png"
PROTAGONIST_SOURCE = GENERATED_ROOT / "exec-6d762f87-5fce-4053-b15f-81db65617b64.png"
BACKGROUND_OUTPUT = ROOT / "assets" / "v2" / "roppongi-city-blocks-past-evening-source.png"
LANDMARK_OUTPUT = ROOT / "assets" / "v2" / "past-landmarks"
PROTAGONIST_OUTPUT = ROOT / "assets" / "v2" / "past-protagonist"

LANDMARKS = (
    ("roppongi-hills", 0, 0),
    ("tokyo-midtown", 1, 0),
    ("azabudai-hills", 2, 0),
    ("azabudai-garden-plaza", 0, 1),
    ("tokyo-tower", 1, 1),
    ("zojoji", 2, 1),
)
FACINGS = (
    ("down", 0, 0),
    ("left", 1, 0),
    ("right", 0, 1),
    ("up", 1, 1),
)


def remove_magenta(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            red, green, blue, _ = pixels[x, y]
            magenta_strength = min(red, blue) - green
            if red > 150 and blue > 140 and magenta_strength > 55:
                alpha = max(0, min(255, 255 - round((magenta_strength - 55) * 2.2)))
                pixels[x, y] = (red, green, blue, alpha)
    return image


def crop_visible(image: Image.Image, padding: int = 12) -> Image.Image:
    alpha = image.getchannel("A")
    bounds = alpha.point(lambda value: 255 if value > 16 else 0).getbbox()
    if bounds is None:
        raise RuntimeError("No visible sprite content found after chroma-key removal.")
    left = max(0, bounds[0] - padding)
    top = max(0, bounds[1] - padding)
    right = min(image.width, bounds[2] + padding)
    bottom = min(image.height, bounds[3] + padding)
    return image.crop((left, top, right, bottom))


def remove_horizontal_edge_fragments(
    image: Image.Image,
    alpha_threshold: int = 16,
) -> Image.Image:
    """Remove sprite-sheet bleed connected to the left or right cell edge."""
    cleaned = image.convert("RGBA").copy()
    alpha = cleaned.getchannel("A")
    queue: deque[tuple[int, int]] = deque()
    visited: set[tuple[int, int]] = set()

    for y in range(cleaned.height):
        for x in (0, cleaned.width - 1):
            if alpha.getpixel((x, y)) > alpha_threshold:
                point = (x, y)
                visited.add(point)
                queue.append(point)

    while queue:
        x, y = queue.popleft()
        for offset_x, offset_y in (
            (-1, -1), (0, -1), (1, -1),
            (-1, 0),           (1, 0),
            (-1, 1),  (0, 1),  (1, 1),
        ):
            neighbor = (x + offset_x, y + offset_y)
            if neighbor in visited:
                continue
            neighbor_x, neighbor_y = neighbor
            if not (0 <= neighbor_x < cleaned.width and 0 <= neighbor_y < cleaned.height):
                continue
            if alpha.getpixel(neighbor) <= alpha_threshold:
                continue
            visited.add(neighbor)
            queue.append(neighbor)

    pixels = cleaned.load()
    for x, y in visited:
        red, green, blue, _ = pixels[x, y]
        pixels[x, y] = (red, green, blue, 0)
    return cleaned


def main() -> None:
    BACKGROUND_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    background = Image.open(BACKGROUND_SOURCE).convert("RGB")
    background = background.resize((1505, 1045), Image.Resampling.LANCZOS)
    background.save(BACKGROUND_OUTPUT)

    sheet = Image.open(SHEET_SOURCE).convert("RGB")
    cell_width = sheet.width // 3
    cell_height = sheet.height // 2
    LANDMARK_OUTPUT.mkdir(parents=True, exist_ok=True)
    for slug, column, row in LANDMARKS:
        cell = sheet.crop((
            column * cell_width,
            row * cell_height,
            (column + 1) * cell_width if column < 2 else sheet.width,
            (row + 1) * cell_height if row < 1 else sheet.height,
        ))
        processed = remove_magenta(cell)
        if slug == "tokyo-tower":
            processed = remove_horizontal_edge_fragments(processed)
        sprite = crop_visible(processed)
        output = LANDMARK_OUTPUT / f"{slug}.png"
        sprite.save(output)
        print(f"{slug}: {sprite.width}x{sprite.height} -> {output}")

    protagonist = Image.open(PROTAGONIST_SOURCE).convert("RGB")
    cell_width = protagonist.width // 2
    cell_height = protagonist.height // 2
    PROTAGONIST_OUTPUT.mkdir(parents=True, exist_ok=True)
    for facing, column, row in FACINGS:
        cell = protagonist.crop((
            column * cell_width,
            row * cell_height,
            (column + 1) * cell_width if column < 1 else protagonist.width,
            (row + 1) * cell_height if row < 1 else protagonist.height,
        )).convert("RGBA")
        pixels = cell.load()
        for y in range(cell.height):
            for x in range(cell.width):
                red, green, blue, _ = pixels[x, y]
                green_strength = green - max(red, blue)
                if green > 100 and green_strength > 25:
                    alpha = max(0, min(255, 255 - round((green_strength - 25) * 1.5)))
                    pixels[x, y] = (red, green, blue, alpha)
        sprite = crop_visible(cell, padding=16)
        output = PROTAGONIST_OUTPUT / f"{facing}.png"
        sprite.save(output)
        print(f"protagonist {facing}: {sprite.width}x{sprite.height} -> {output}")
    print(f"background: {background.width}x{background.height} -> {BACKGROUND_OUTPUT}")


if __name__ == "__main__":
    main()
