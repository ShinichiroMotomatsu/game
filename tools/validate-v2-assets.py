import json
from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
MASK_PATH = ROOT / "assets" / "v2" / "road-collision-mask.png"
COLLISION_DATA_PATH = ROOT / "assets" / "v2" / "road-collision-data.js"
PAST_COLLISION_DATA_PATH = ROOT / "assets" / "v2" / "road-collision-past-data.js"
PAST_LAND_MASK_PATH = ROOT / "assets" / "v2" / "past-land-mask.png"
LAYOUT_PATH = ROOT / "assets" / "v2" / "map-layout.json"
LAYOUT_DATA_PATH = ROOT / "assets" / "v2" / "map-layout-data.js"
ASPHALT_MAP_PATH = ROOT / "assets" / "v2" / "roppongi-roads-day-geographic-v3.png"
PAST_MAP_PATH = ROOT / "assets" / "v2" / "roppongi-roads-past-evening.png"
LANDMARK_DIRECTORY = ROOT / "assets" / "v2" / "landmarks"
PAST_LANDMARK_DIRECTORY = ROOT / "assets" / "v2" / "past-landmarks"
LANDMARKS = (
    ("Roppongi Hills", "roppongi-hills"),
    ("Tokyo Midtown", "tokyo-midtown"),
    ("Azabudai Hills", "azabudai-hills"),
    ("Azabudai Garden Plaza", "azabudai-garden-plaza"),
    ("Tokyo Tower", "tokyo-tower"),
    ("Zojoji", "zojoji"),
)
SPRITE_DIRECTORY = ROOT / "assets" / "v2" / "protagonist"
PAST_SPRITE_DIRECTORY = ROOT / "assets" / "v2" / "past-protagonist"
PAST_ENEMY_DIRECTORY = ROOT / "assets" / "v2" / "past-enemies"


def validate_mask() -> None:
    layout = json.loads(LAYOUT_PATH.read_text(encoding="utf-8"))
    image = Image.open(MASK_PATH).convert("L")
    width, height = image.size
    pixels = image.load()
    crossing = next(
        item for item in layout["intersections"] if item["id"] == "roppongi-crossing"
    )
    start = tuple(crossing["point"])
    sample_offsets = (
        (0, 0), (3, 0), (-3, 0), (0, 3), (0, -3),
        (2, 2), (2, -2), (-2, 2), (-2, -2),
    )
    assert (width, height) == (1505, 1045)
    assert all(pixels[start[0] + dx, start[1] + dy] > 127 for dx, dy in sample_offsets)
    off_road_samples = ((100, 100), (600, 400), (900, 300), (1400, 200), (300, 800), (600, 900))
    assert all(pixels[x, y] <= 127 for x, y in off_road_samples)

    white_pixels = sum(image.histogram()[128:])
    queue = deque([start])
    visited = {start}
    while queue:
        x, y = queue.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            next_point = (x + dx, y + dy)
            if (
                0 <= next_point[0] < width
                and 0 <= next_point[1] < height
                and next_point not in visited
                and pixels[next_point[0], next_point[1]] > 127
            ):
                visited.add(next_point)
                queue.append(next_point)

    connected_ratio = len(visited) / white_pixels
    assert connected_ratio > 0.995
    coverage = white_pixels / (width * height)
    assert 0.08 < coverage < 0.18
    print(
        f"mask {width}x{height}: {coverage:.2%} walkable, "
        f"{connected_ratio:.2%} connected from start"
    )

    script = COLLISION_DATA_PATH.read_text(encoding="utf-8")
    prefix = "window.V2_ROAD_COLLISION="
    assert script.startswith(prefix) and script.endswith(";\n")
    collision_data = json.loads(script[len(prefix):-2])
    assert collision_data["width"] == width and collision_data["height"] == height
    reconstructed = Image.new("L", (width, height), 0)
    reconstructed_pixels = reconstructed.load()
    for y, runs in enumerate(collision_data["runs"]):
        for start_x, end_x in runs:
            for x in range(start_x, end_x):
                reconstructed_pixels[x, y] = 255
    expected = image.point(lambda value: 255 if value > 127 else 0)
    assert reconstructed.tobytes() == expected.tobytes()
    print(f"collision data: {COLLISION_DATA_PATH.stat().st_size / 1024:.1f} KiB, exact PNG match")


def validate_asphalt_map() -> None:
    image = Image.open(ASPHALT_MAP_PATH).convert("RGB")
    assert image.size == (1505, 1045)
    print(f"asphalt map: {image.width}x{image.height}")


def validate_layout_data() -> None:
    expected = json.loads(LAYOUT_PATH.read_text(encoding="utf-8"))
    script = LAYOUT_DATA_PATH.read_text(encoding="utf-8")
    prefix = "window.V2_MAP_LAYOUT="
    assert script.startswith(prefix) and script.endswith(";\n")
    actual = json.loads(script[len(prefix):-2])
    assert actual == expected
    assert len(actual["roads"]) == 7
    assert len(actual["intersections"]) == 3
    assert len(actual["labels"]) == 10
    assert len(actual["landmarks"]) == 6
    assert actual["roadSource"]["provider"] == "OpenStreetMap"
    assert "landmarkCollisionEnabled" not in actual
    assert all("footprint" not in landmark for landmark in actual["landmarks"])
    assert all("entrance" not in landmark for landmark in actual["landmarks"])
    print(
        "layout data: 7 OSM roads, 3 intersection surfaces, 10 labels, "
        "no entrances or landmark collision data"
    )


def validate_sprites() -> None:
    for facing in ("down", "left", "right", "up"):
        image = Image.open(SPRITE_DIRECTORY / f"{facing}.png").convert("RGBA")
        alpha = image.getchannel("A")
        bounds = alpha.getbbox()
        assert bounds is not None
        assert bounds[0] <= 10 and bounds[1] <= 10
        assert bounds[2] >= image.width - 10 and bounds[3] >= image.height - 10
        assert image.height >= 450
        print(f"sprite {facing}: {image.width}x{image.height}")


def validate_landmarks() -> None:
    for label, slug in LANDMARKS:
        image = Image.open(LANDMARK_DIRECTORY / f"{slug}.png").convert("RGBA")
        assert image.width >= 400 and image.height >= 500
        alpha = image.getchannel("A")
        assert alpha.getbbox() is not None
        assert alpha.getpixel((0, 0)) == 0
        visible_pixels = sum(alpha.histogram()[1:])
        coverage = visible_pixels / (image.width * image.height)
        assert coverage > 0.12
        print(
            f"landmark {label}: {image.width}x{image.height}, "
            f"{coverage:.1%} visible, transparent PNG"
        )


def validate_past_assets() -> None:
    image = Image.open(PAST_MAP_PATH).convert("RGB")
    assert image.size == (1505, 1045)
    for _, slug in LANDMARKS:
        sprite = Image.open(PAST_LANDMARK_DIRECTORY / f"{slug}.png").convert("RGBA")
        assert sprite.getchannel("A").getbbox() is not None
        assert sprite.getchannel("A").getpixel((0, 0)) == 0
    for facing in ("down", "left", "right", "up"):
        sprite = Image.open(PAST_SPRITE_DIRECTORY / f"{facing}.png").convert("RGBA")
        assert sprite.getchannel("A").getbbox() is not None
    land_mask = Image.open(PAST_LAND_MASK_PATH).convert("L")
    assert land_mask.size == (1505, 1045)
    assert all(land_mask.getpixel(point) < 20 for point in ((0, 0), (1504, 0), (0, 1044), (1504, 1044)))
    past_collision_script = PAST_COLLISION_DATA_PATH.read_text(encoding="utf-8")
    assert past_collision_script.startswith("window.V2_ROAD_COLLISION_PAST=")
    for name in ("mist-slime", "gutter-goblin", "rune-wolf"):
        enemy = Image.open(PAST_ENEMY_DIRECTORY / f"{name}.png").convert("RGBA")
        alpha = enemy.getchannel("A")
        assert alpha.getbbox() is not None
        assert alpha.getpixel((0, 0)) == 0
    print("past edition: island map, ports, memory fog, 3 enemy sprites / 4 road encounters / 1 tinted mid-boss, 6 fantasy landmarks")


if __name__ == "__main__":
    validate_asphalt_map()
    validate_layout_data()
    validate_mask()
    validate_sprites()
    validate_landmarks()
    validate_past_assets()
