from __future__ import annotations

import json
import math
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

from v2_runtime_tiles import build_runtime_tiles


ROOT = Path(__file__).resolve().parent.parent
LAYOUT_PATH = ROOT / "assets" / "v2" / "map-layout.json"
BACKGROUND_PATH = ROOT / "assets" / "v2" / "roppongi-city-blocks-day-source.png"
PAST_BACKGROUND_PATH = ROOT / "assets" / "v2" / "roppongi-city-blocks-past-evening-island-source.png"
MAP_PATH = ROOT / "assets" / "v2" / "roppongi-roads-day-geographic-v3.png"
PAST_MAP_PATH = ROOT / "assets" / "v2" / "roppongi-roads-past-evening.png"
MASK_PATH = ROOT / "assets" / "v2" / "road-collision-mask.png"
PREVIEW_PATH = ROOT / "tmp" / "v2-road-geographic-preview.png"
LANDMARK_PREVIEW_PATH = ROOT / "tmp" / "v2-geographic-landmark-preview.png"
PAST_LANDMARK_PREVIEW_PATH = ROOT / "tmp" / "v2-past-evening-landmark-preview.png"
PAST_LAND_MASK_PATH = ROOT / "assets" / "v2" / "past-land-mask.png"
COLLISION_DATA_PATH = ROOT / "assets" / "v2" / "road-collision-data.js"
PAST_COLLISION_DATA_PATH = ROOT / "assets" / "v2" / "road-collision-past-data.js"
LAYOUT_DATA_PATH = ROOT / "assets" / "v2" / "map-layout-data.js"
SUPERSAMPLE = 4


def scaled_point(point: list[int] | tuple[float, float]) -> tuple[int, int]:
    return round(point[0] * SUPERSAMPLE), round(point[1] * SUPERSAMPLE)


def draw_round_line(
    draw: ImageDraw.ImageDraw,
    points: list[list[int]],
    fill: tuple[int, ...] | int,
    width: int,
) -> None:
    scaled = [scaled_point(point) for point in points]
    scaled_width = round(width * SUPERSAMPLE)
    radius = scaled_width // 2
    draw.line(scaled, fill=fill, width=scaled_width, joint="curve")
    for x, y in scaled:
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=fill)


def sampled_polyline(points: list[list[int]], spacing: float = 2.0) -> list[tuple[float, float]]:
    sampled: list[tuple[float, float]] = []
    for index in range(1, len(points)):
        start = points[index - 1]
        end = points[index]
        length = math.dist(start, end)
        steps = max(1, math.ceil(length / spacing))
        for step in range(steps):
            amount = step / steps
            sampled.append((
                start[0] + (end[0] - start[0]) * amount,
                start[1] + (end[1] - start[1]) * amount,
            ))
    sampled.append(tuple(points[-1]))
    return sampled


def draw_dashed_line(
    draw: ImageDraw.ImageDraw,
    points: list[list[int]],
    fill: tuple[int, ...],
    width: int,
    dash: float,
    gap: float,
) -> None:
    sampled = sampled_polyline(points, spacing=1.5)
    period = dash + gap
    distance = 0.0
    active: list[tuple[int, int]] = []
    previous = sampled[0]
    for point in sampled:
        distance += math.dist(previous, point)
        scaled = scaled_point(point)
        if distance % period < dash:
            active.append(scaled)
        elif len(active) > 1:
            draw.line(active, fill=fill, width=width * SUPERSAMPLE)
            active = []
        previous = point
    if len(active) > 1:
        draw.line(active, fill=fill, width=width * SUPERSAMPLE)


def crosswalk_polygon(
    center: tuple[float, float],
    tangent: tuple[float, float],
    normal: tuple[float, float],
    along: float,
    width: float,
    thickness: float,
) -> list[tuple[int, int]]:
    center_x = center[0] + tangent[0] * along
    center_y = center[1] + tangent[1] * along
    half_width = width / 2
    half_thickness = thickness / 2
    return [scaled_point((
        center_x + normal[0] * half_width * normal_sign + tangent[0] * half_thickness * tangent_sign,
        center_y + normal[1] * half_width * normal_sign + tangent[1] * half_thickness * tangent_sign,
    )) for normal_sign, tangent_sign in ((-1, -1), (1, -1), (1, 1), (-1, 1))]


def road_paths(road: dict) -> list[list[list[int]]]:
    if "paths" in road:
        return road["paths"]
    return [road["points"]]


def intersection_polygon(intersection: dict, inset: float = 0) -> list[tuple[int, int]]:
    center_x, center_y = intersection["point"]
    radius = intersection["radius"] - inset
    return [
        scaled_point((
            center_x + math.cos(math.pi / 8 + index * math.pi / 4) * radius,
            center_y + math.sin(math.pi / 8 + index * math.pi / 4) * radius,
        ))
        for index in range(8)
    ]


def draw_intersection_surface(
    draw: ImageDraw.ImageDraw,
    intersection: dict,
    palette: dict,
) -> None:
    draw.polygon(intersection_polygon(intersection), fill=palette["road_edge"])
    outline = intersection_polygon(intersection)
    draw.line(
        outline + [outline[0]],
        fill=palette["road_border"],
        width=6 * SUPERSAMPLE,
        joint="curve",
    )
    draw.polygon(intersection_polygon(intersection, 6), fill=palette["road_center"])

    if palette.get("fantasy"):
        center_x, center_y = scaled_point(intersection["point"])
        ring_radius = round(intersection["radius"] * SUPERSAMPLE * 0.48)
        draw.ellipse(
            (center_x - ring_radius, center_y - ring_radius, center_x + ring_radius, center_y + ring_radius),
            outline=palette["route_line"],
            width=2 * SUPERSAMPLE,
        )
        return

    center = tuple(intersection["point"])
    radius = intersection["radius"]
    for angle in intersection["approachAngles"]:
        tangent = math.cos(angle), math.sin(angle)
        normal = -tangent[1], tangent[0]
        crossing_center = (
            center[0] + tangent[0] * radius * 0.62,
            center[1] + tangent[1] * radius * 0.62,
        )
        for along in (-7.5, -4.5, -1.5, 1.5, 4.5, 7.5):
            draw.polygon(
                crosswalk_polygon(
                    crossing_center,
                    tangent,
                    normal,
                    along,
                    radius * 0.86,
                    2.0,
                ),
                fill=palette["crosswalk"],
            )
        stop_center = (
            center[0] + tangent[0] * radius * 0.39,
            center[1] + tangent[1] * radius * 0.39,
        )
        draw.polygon(
            crosswalk_polygon(stop_center, tangent, normal, 0, radius * 0.92, 1.7),
            fill=palette["stop_line"],
        )


def draw_intersection_mask(draw: ImageDraw.ImageDraw, intersection: dict) -> None:
    draw.polygon(intersection_polygon(intersection, 5), fill=255)


def past_land_mask(size: tuple[int, int]) -> Image.Image:
    """Stable island boundary shared by the past artwork, roads and collision."""
    width, height = size
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    shoreline = [
        (145, 78), (326, 44), (520, 70), (713, 52), (902, 69), (1122, 50),
        (1348, 102), (1458, 237), (1472, 443), (1452, 666), (1390, 866),
        (1242, 988), (1025, 1012), (797, 994), (580, 1015), (356, 985),
        (177, 904), (68, 756), (39, 550), (53, 344), (84, 178),
    ]
    draw.polygon(shoreline, fill=255)
    # Soft antialiased coast while retaining a deterministic gameplay edge.
    return mask.resize((width // 4, height // 4), Image.Resampling.LANCZOS).resize(size, Image.Resampling.LANCZOS)


def mask_to_runs(mask: Image.Image) -> list[list[list[int]]]:
    rows: list[list[list[int]]] = []
    pixels = mask.load()
    for y in range(mask.height):
        runs: list[list[int]] = []
        x = 0
        while x < mask.width:
            if pixels[x, y] <= 127:
                x += 1
                continue
            start = x
            while x < mask.width and pixels[x, y] > 127:
                x += 1
            runs.append([start, x])
        rows.append(runs)
    return rows


def render_map(layout: dict, background_path: Path, output_path: Path, palette: dict) -> Image.Image:
    width, height = layout["width"], layout["height"]
    background = Image.open(background_path).convert("RGBA")
    canvas = background.resize(
        (width * SUPERSAMPLE, height * SUPERSAMPLE),
        Image.Resampling.LANCZOS,
    )
    draw = ImageDraw.Draw(canvas, "RGBA")

    road_layers = ((palette["road_edge"], 10), (palette["road_border"], 5), (palette["road_center"], 0))
    for fill, extra_width in road_layers:
        for road in layout["roads"]:
            for path in road_paths(road):
                draw_round_line(draw, path, fill, road["width"] + extra_width)

    if not palette.get("fantasy"):
        for road in layout["roads"]:
            for path in road_paths(road):
                draw_dashed_line(
                    draw,
                    path,
                    palette["route_line"] if road.get("routeBadge") else palette["lane_line"],
                    1,
                    10,
                    9,
                )

    for intersection in layout["intersections"]:
        draw_intersection_surface(draw, intersection, palette)

    if palette.get("fantasy"):
        # A clipped, deterministic field of small irregular joints makes the
        # shared OSM road surface read as old cobblestone instead of asphalt.
        cobble_mask = Image.new("L", canvas.size, 0)
        cobble_mask_draw = ImageDraw.Draw(cobble_mask)
        for road in layout["roads"]:
            for path in road_paths(road):
                draw_round_line(cobble_mask_draw, path, 255, road["width"])
        for intersection in layout["intersections"]:
            cobble_mask_draw.polygon(intersection_polygon(intersection, 6), fill=255)
        cobbles = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        cobble_draw = ImageDraw.Draw(cobbles, "RGBA")
        step_x = 7 * SUPERSAMPLE
        step_y = 5 * SUPERSAMPLE
        for row, y in enumerate(range(0, canvas.height, step_y)):
            offset = (row % 2) * step_x // 2
            for x in range(-step_x, canvas.width + step_x, step_x):
                left = x + offset
                cobble_draw.arc(
                    (left, y, left + 6 * SUPERSAMPLE, y + 4 * SUPERSAMPLE),
                    8,
                    176,
                    fill=(211, 165, 105, 92),
                    width=1 * SUPERSAMPLE,
                )
        cobbles.putalpha(ImageChops.multiply(cobbles.getchannel("A"), cobble_mask))
        canvas = Image.alpha_composite(canvas, cobbles)

    map_image = canvas.resize((width, height), Image.Resampling.LANCZOS).convert("RGB")
    if palette.get("fantasy"):
        land_mask = past_land_mask((width, height))
        PAST_LAND_MASK_PATH.parent.mkdir(parents=True, exist_ok=True)
        land_mask.save(PAST_LAND_MASK_PATH)
        island = Image.open(PAST_BACKGROUND_PATH).convert("RGB").resize((width, height), Image.Resampling.LANCZOS)
        # Keep the generated sea outside the stable island mask and all deterministic road work inside it.
        map_image = Image.composite(map_image, island, land_mask)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    map_image.save(output_path)
    return map_image


def render_landmark_preview(
    map_image: Image.Image,
    layout: dict,
    asset_directory: str,
    output_path: Path,
) -> None:
    preview = map_image.convert("RGBA")
    for landmark in sorted(layout["landmarks"], key=lambda item: item["depthY"]):
        sprite_path = ROOT / "assets" / "v2" / asset_directory / landmark["image"]
        sprite = Image.open(sprite_path).convert("RGBA")
        sprite_width = landmark["sprite"]["width"]
        sprite_height = landmark["sprite"]["height"]
        sprite = sprite.resize((sprite_width, sprite_height), Image.Resampling.LANCZOS)
        anchor_x, anchor_y = landmark["anchor"]
        preview.alpha_composite(
            sprite,
            (round(anchor_x - sprite_width / 2), round(anchor_y - sprite_height)),
        )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    preview.convert("RGB").save(output_path)


def main() -> None:
    layout = json.loads(LAYOUT_PATH.read_text(encoding="utf-8"))
    modern_palette = {
        "road_edge": (80, 88, 88, 255), "road_border": (204, 198, 178, 255),
        "road_center": (24, 40, 53, 255), "route_line": (218, 190, 96, 225),
        "lane_line": (207, 218, 218, 205), "crosswalk": (240, 241, 231, 245),
        "stop_line": (233, 219, 168, 230),
    }
    past_palette = {
        "road_edge": (58, 42, 34, 255), "road_border": (153, 112, 69, 255),
        "road_center": (91, 68, 57, 255), "route_line": (235, 175, 72, 225),
        "lane_line": (196, 157, 101, 205), "crosswalk": (213, 169, 104, 235),
        "stop_line": (250, 202, 99, 220), "fantasy": True,
    }
    map_image = render_map(layout, BACKGROUND_PATH, MAP_PATH, modern_palette)
    past_map_image = render_map(layout, PAST_BACKGROUND_PATH, PAST_MAP_PATH, past_palette)
    build_runtime_tiles(PAST_MAP_PATH, assets_path=ROOT / "assets" / "v2")
    width, height = layout["width"], layout["height"]

    render_landmark_preview(map_image, layout, "landmarks", LANDMARK_PREVIEW_PATH)
    render_landmark_preview(
        past_map_image,
        layout,
        "past-landmarks",
        PAST_LANDMARK_PREVIEW_PATH,
    )

    high_resolution_mask = Image.new("L", (width * SUPERSAMPLE, height * SUPERSAMPLE), 0)
    mask_draw = ImageDraw.Draw(high_resolution_mask)
    for road in layout["roads"]:
        for path in road_paths(road):
            draw_round_line(mask_draw, path, 255, max(10, road["width"] - 4))
    for intersection in layout["intersections"]:
        draw_intersection_mask(mask_draw, intersection)
    mask = high_resolution_mask.resize((width, height), Image.Resampling.LANCZOS)
    mask = mask.point(lambda value: 255 if value >= 160 else 0)
    mask.save(MASK_PATH)
    # In the remembered past, the sea is the protagonist's hard action limit.
    past_mask = ImageChops.multiply(
        mask,
        past_land_mask((width, height)).point(lambda value: 255 if value >= 160 else 0),
    )

    overlay = Image.new("RGBA", map_image.size, (0, 0, 0, 0))
    overlay_pixels = overlay.load()
    mask_pixels = mask.load()
    for y in range(height):
        for x in range(width):
            if mask_pixels[x, y] > 127:
                overlay_pixels[x, y] = (0, 225, 149, 102)
    Image.alpha_composite(map_image.convert("RGBA"), overlay).convert("RGB").save(PREVIEW_PATH)

    payload = {"width": width, "height": height, "runs": mask_to_runs(mask)}
    COLLISION_DATA_PATH.write_text(
        "window.V2_ROAD_COLLISION=" + json.dumps(payload, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    past_payload = {"width": width, "height": height, "runs": mask_to_runs(past_mask)}
    PAST_COLLISION_DATA_PATH.write_text(
        "window.V2_ROAD_COLLISION_PAST=" + json.dumps(past_payload, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    LAYOUT_DATA_PATH.write_text(
        "window.V2_MAP_LAYOUT=" + json.dumps(layout, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print(f"map: {MAP_PATH} ({width}x{height})")
    print(f"past map: {PAST_MAP_PATH} ({width}x{height})")
    print(f"landmark preview: {LANDMARK_PREVIEW_PATH}")
    print(f"past landmark preview: {PAST_LANDMARK_PREVIEW_PATH}")
    print(f"mask: {MASK_PATH}")
    print(f"collision data: {COLLISION_DATA_PATH}")
    print(f"past collision data: {PAST_COLLISION_DATA_PATH}")
    print(f"layout data: {LAYOUT_DATA_PATH}")


if __name__ == "__main__":
    main()
