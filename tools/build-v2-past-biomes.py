from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets" / "v2"
GENERATED = Path(r"C:\Users\ShinichiroMotomatu\.codex\generated_images\019fda35-90a3-7903-bfb1-31deeabd2ab7")
SPRITES = GENERATED / "exec-78419840-0a11-42a4-b2d9-7725cd8adc55.png"
TERRAIN = ASSETS / "roppongi-city-blocks-past-evening-biomes-source.png"
SOURCE = ASSETS / "roppongi-city-blocks-past-evening-island-source.png"


def build_map(
    *,
    terrain_path: Path = TERRAIN,
    output_path: Path = SOURCE,
) -> Image.Image:
    # Roads are rendered deterministically by build-v2-geographic-map.py.
    # Keep this layer terrain-only: restoring an older road reserve also
    # restores strips of the pre-biome city between roads and the new biomes.
    with Image.open(terrain_path) as terrain:
        composed = terrain.convert("RGB")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    composed.save(output_path, optimize=True)
    return composed


def build_monsters() -> None:
    sheet = Image.open(SPRITES).convert("RGB")
    names = ["bog-mandrake", "crag-harpy", "frost-wisp", "dune-scorpion", "ember-lizard", "ash-golem"]
    target = ASSETS / "past-enemies"
    target.mkdir(exist_ok=True)
    cell_w, cell_h = sheet.width // 3, sheet.height // 2
    for index, name in enumerate(names):
        col, row = index % 3, index // 3
        crop = sheet.crop((col * cell_w, row * cell_h, (col + 1) * cell_w, (row + 1) * cell_h)).convert("RGBA")
        # The artwork includes a soft atmospheric field; fade it at the cell edge for clean map compositing.
        alpha = Image.new("L", crop.size)
        pixels = alpha.load()
        rgb = crop.load()
        corners = [rgb[4, 4][:3], rgb[cell_w - 5, 4][:3], rgb[4, cell_h - 5][:3], rgb[cell_w - 5, cell_h - 5][:3]]
        for y in range(cell_h):
            for x in range(cell_w):
                nx = abs((x + .5) / cell_w * 2 - 1)
                ny = abs((y + .5) / cell_h * 2 - 1)
                edge = max(nx, ny)
                tx, ty = x / max(1, cell_w - 1), y / max(1, cell_h - 1)
                background = tuple(
                    corners[0][channel] * (1 - tx) * (1 - ty)
                    + corners[1][channel] * tx * (1 - ty)
                    + corners[2][channel] * (1 - tx) * ty
                    + corners[3][channel] * tx * ty
                    for channel in range(3)
                )
                distance = sum((rgb[x, y][channel] - background[channel]) ** 2 for channel in range(3)) ** .5
                subject = max(0, min(1, (distance - 18) / 42))
                edge_fade = max(0, min(1, (1 - edge) / .13))
                pixels[x, y] = round(255 * subject * edge_fade)
        crop.putalpha(alpha)
        crop.save(target / f"{name}.png", optimize=True)


if __name__ == "__main__":
    build_map()
    build_monsters()
