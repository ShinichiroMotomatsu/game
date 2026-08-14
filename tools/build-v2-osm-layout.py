from __future__ import annotations

import json
import math
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SOURCE_PATH = ROOT / "assets" / "v2" / "osm-road-source.json"
LAYOUT_PATH = ROOT / "assets" / "v2" / "map-layout.json"
WEST, SOUTH, EAST, NORTH = 139.724, 35.652, 139.754, 35.669

ROAD_SPECS = (
    {
        "id": "roppongi-dori", "displayName": "六本木通り", "routeBadge": "412",
        "width": 22, "refs": {"412"}, "names": {"六本木通り", "六本木通り(六本木六丁目)"},
    },
    {
        "id": "gaien-higashi", "displayName": "外苑東通り", "routeBadge": "319",
        "width": 24, "refs": {"319"}, "names": {"外苑東通り", "環状三号線"},
    },
    {
        "id": "route-1", "displayName": "国道1号線（桜田通り）", "routeBadge": "1",
        "width": 26, "refs": {"1"}, "names": {"桜田通り"},
    },
    {
        "id": "azabu-dori", "displayName": "麻布通り", "routeBadge": "415",
        "width": 22, "refs": {"415"}, "names": {"高輪麻布線"},
    },
    {
        "id": "sakura-asa-dori", "displayName": "桜麻通り", "width": 18,
        "refs": set(), "names": {"桜麻通り"},
    },
    {
        "id": "tokyo-tower-dori", "displayName": "東京タワー通り", "width": 18,
        "refs": set(), "names": {"東京タワー通り"},
    },
    {
        "id": "route-301", "displayName": "都道301号線（祝田通り）", "routeBadge": "301",
        "width": 22, "refs": {"301"}, "names": {"祝田通り"},
    },
)

INTERSECTION_SPECS = (
    {
        "id": "roppongi-crossing", "label": "六本木交差点",
        "nodeIds": [1061683019, 2398054976, 2398054975, 1061683056],
        "roads": ["roppongi-dori", "gaien-higashi"], "radius": 38,
        "approachAngles": [-0.50, 1.08, 2.64, -2.06],
    },
    {
        "id": "iikura-katamachi", "label": "飯倉片町",
        "nodeIds": [264443321, 2398054974, 254365841, 2398054986],
        "roads": ["gaien-higashi", "azabu-dori"], "radius": 33,
        "approachAngles": [-0.12, 1.43, 3.02, -1.71],
    },
    {
        "id": "iikura", "label": "飯倉",
        "nodeIds": [2398054941, 1064214387, 2138849614, 2398054931],
        "roads": ["gaien-higashi", "route-1", "tokyo-tower-dori"], "radius": 35,
        "approachAngles": [-0.05, 1.48, 3.09, -1.66],
    },
)

LANDMARK_GEO = {
    "roppongi-hills": (139.72920, 35.66045),
    "tokyo-midtown": (139.73120, 35.66510),
    "azabudai-hills": (139.74020, 35.66020),
    "azabudai-garden-plaza": (139.74170, 35.65925),
    "tokyo-tower": (139.74545, 35.65860),
    "zojoji": (139.74820, 35.65730),
}

# The geographic anchors remain available as source-of-truth metadata. These
# small art-direction offsets place each pseudo-3D base beside, not on top of,
# the walkable road surface.
LANDMARK_MAP_OFFSETS = {
    "roppongi-hills": (20, 55),
    "tokyo-midtown": (-24, 0),
    "azabudai-hills": (50, -8),
    "azabudai-garden-plaza": (0, -38),
    "tokyo-tower": (-24, 44),
}

LABEL_SPECS = (
    ("label-roppongi-dori", "六本木通り", "road", "roppongi-dori", (139.7286, 35.6611), "412"),
    ("label-gaien-higashi", "外苑東通り", "road", "gaien-higashi", (139.7353, 35.6620), "319"),
    ("label-route-1", "国道1号線", "road", "route-1", (139.7440, 35.6572), "1"),
    ("label-azabu-dori", "麻布通り", "road", "azabu-dori", (139.7370, 35.6557), "415"),
    ("label-sakura-asa-dori", "桜麻通り", "road", "sakura-asa-dori", (139.7390, 35.6632), None),
    ("label-tokyo-tower-dori", "東京タワー通り", "road", "tokyo-tower-dori", (139.7450, 35.6592), None),
    ("label-route-301", "都道301号線", "road", "route-301", (139.7486, 35.6556), "301"),
)


def projection(width: int, height: int) -> tuple[float, float, float, float, float]:
    latitude = (SOUTH + NORTH) / 2
    meters_per_lon = 111_320 * math.cos(math.radians(latitude))
    meters_per_lat = 110_574
    span_x = (EAST - WEST) * meters_per_lon
    span_y = (NORTH - SOUTH) * meters_per_lat
    scale = min(width / span_x, height / span_y)
    offset_x = (width - span_x * scale) / 2
    offset_y = (height - span_y * scale) / 2
    return meters_per_lon, meters_per_lat, scale, offset_x, offset_y


def project(lon: float, lat: float, settings: tuple[float, float, float, float, float]) -> list[int]:
    meters_per_lon, meters_per_lat, scale, offset_x, offset_y = settings
    return [
        round(offset_x + (lon - WEST) * meters_per_lon * scale),
        round(offset_y + (NORTH - lat) * meters_per_lat * scale),
    ]


def road_matches(element: dict, spec: dict) -> bool:
    tags = element["tags"]
    return tags.get("ref") in spec["refs"] or tags.get("name") in spec["names"]


def projected_path(element: dict, settings: tuple[float, float, float, float, float]) -> list[list[int]]:
    points = [project(point["lon"], point["lat"], settings) for point in element["geometry"]]
    deduplicated = [points[0]]
    for point in points[1:]:
        if point != deduplicated[-1]:
            deduplicated.append(point)
    return deduplicated


def path_intersects_canvas(path: list[list[int]], width: int, height: int) -> bool:
    return (
        max(point[0] for point in path) >= -80
        and min(point[0] for point in path) <= width + 80
        and max(point[1] for point in path) >= -80
        and min(point[1] for point in path) <= height + 80
    )


def distance_to_segment(point: list[int], start: list[int], end: list[int]) -> tuple[float, float]:
    segment_x = end[0] - start[0]
    segment_y = end[1] - start[1]
    squared_length = segment_x ** 2 + segment_y ** 2
    if squared_length == 0:
        return math.dist(point, start), 0
    amount = max(0, min(1, (
        (point[0] - start[0]) * segment_x + (point[1] - start[1]) * segment_y
    ) / squared_length))
    closest = [start[0] + segment_x * amount, start[1] + segment_y * amount]
    return math.dist(point, closest), math.atan2(segment_y, segment_x)


def nearest_road_angle(road: dict, point: list[int]) -> float:
    best_distance = math.inf
    best_angle = 0.0
    for path in road["paths"]:
        for index in range(1, len(path)):
            distance, angle = distance_to_segment(point, path[index - 1], path[index])
            if distance < best_distance:
                best_distance = distance
                best_angle = angle
    if best_angle > math.pi / 2:
        best_angle -= math.pi
    if best_angle < -math.pi / 2:
        best_angle += math.pi
    return round(best_angle, 3)


def build_roads(source: dict, settings: tuple[float, float, float, float, float], width: int, height: int) -> list[dict]:
    roads = []
    for spec in ROAD_SPECS:
        elements = [element for element in source["elements"] if road_matches(element, spec)]
        paths = [projected_path(element, settings) for element in elements]
        paths = [path for path in paths if len(path) >= 2 and path_intersects_canvas(path, width, height)]
        road = {
            "id": spec["id"],
            "displayName": spec["displayName"],
            "width": spec["width"],
            "osmWayIds": [element["id"] for element in elements],
            "osmNames": sorted({element["tags"]["name"] for element in elements}),
            "paths": paths,
        }
        if "routeBadge" in spec:
            road["routeBadge"] = spec["routeBadge"]
        roads.append(road)
    return roads


def node_coordinate_index(source: dict) -> dict[int, tuple[float, float]]:
    coordinates = {}
    for element in source["elements"]:
        for node_id, point in zip(element.get("nodes", []), element["geometry"]):
            coordinates[node_id] = point["lon"], point["lat"]
    return coordinates


def build_intersections(source: dict, settings: tuple[float, float, float, float, float]) -> list[dict]:
    coordinates = node_coordinate_index(source)
    intersections = []
    for spec in INTERSECTION_SPECS:
        points = [coordinates[node_id] for node_id in spec["nodeIds"]]
        longitude = sum(point[0] for point in points) / len(points)
        latitude = sum(point[1] for point in points) / len(points)
        intersections.append({
            "id": spec["id"],
            "label": spec["label"],
            "point": project(longitude, latitude, settings),
            "style": "intersection-surface",
            "radius": spec["radius"],
            "crosswalks": len(spec["approachAngles"]),
            "approachAngles": spec["approachAngles"],
            "osmNodeIds": spec["nodeIds"],
            "roads": spec["roads"],
        })
    return intersections


def build_labels(roads: list[dict], intersections: list[dict], settings: tuple[float, float, float, float, float]) -> list[dict]:
    road_by_id = {road["id"]: road for road in roads}
    labels = []
    for label_id, text, kind, road_id, geo_point, badge in LABEL_SPECS:
        point = project(*geo_point, settings)
        label = {
            "id": label_id,
            "text": text,
            "kind": kind,
            "point": point,
            "angle": nearest_road_angle(road_by_id[road_id], point),
            "renderMode": "dynamic",
        }
        if badge:
            label["badge"] = badge
        labels.append(label)
    for intersection in intersections:
        labels.append({
            "id": f"label-{intersection['id']}",
            "text": intersection["label"],
            "kind": "intersection",
            "point": [intersection["point"][0], intersection["point"][1] - intersection["radius"] - 16],
            "renderMode": "dynamic",
        })
    return labels


def update_landmarks(layout: dict, settings: tuple[float, float, float, float, float]) -> None:
    for landmark in layout["landmarks"]:
        old_anchor = landmark["anchor"]
        depth_offset = landmark["depthY"] - old_anchor[1]
        longitude, latitude = LANDMARK_GEO[landmark["id"]]
        new_anchor = project(longitude, latitude, settings)
        map_offset = LANDMARK_MAP_OFFSETS.get(landmark["id"], (0, 0))
        new_anchor = [
            new_anchor[0] + map_offset[0],
            new_anchor[1] + map_offset[1],
        ]
        landmark["anchor"] = new_anchor
        landmark["geoAnchor"] = [longitude, latitude]
        landmark["mapOffset"] = list(map_offset)
        landmark.pop("footprint", None)
        landmark["depthY"] = new_anchor[1] + depth_offset
        landmark.pop("entrance", None)

    touches = {
        "roppongi-hills": ["roppongi-dori"],
        "tokyo-midtown": ["gaien-higashi"],
        "azabudai-hills": ["gaien-higashi"],
        "azabudai-garden-plaza": ["route-1"],
        "tokyo-tower": ["tokyo-tower-dori"],
        "zojoji": [],
    }
    for landmark in layout["landmarks"]:
        landmark["touches"] = touches[landmark["id"]]


def main() -> None:
    source = json.loads(SOURCE_PATH.read_text(encoding="utf-8"))
    layout = json.loads(LAYOUT_PATH.read_text(encoding="utf-8"))
    width, height = layout["width"], layout["height"]
    settings = projection(width, height)
    roads = build_roads(source, settings, width, height)
    intersections = build_intersections(source, settings)
    layout["version"] = 7
    layout["roadSource"] = {
        "provider": source["provider"],
        "attribution": source["attribution"],
        "license": source["license"],
        "snapshot": "assets/v2/osm-road-source.json",
        "osmBaseTimestamp": source["osmBaseTimestamp"],
        "projectionBbox": [WEST, SOUTH, EAST, NORTH],
    }
    layout["roads"] = roads
    layout["intersections"] = intersections
    layout["labels"] = build_labels(roads, intersections, settings)
    update_landmarks(layout, settings)
    LAYOUT_PATH.write_text(
        json.dumps(layout, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"updated {LAYOUT_PATH} with {sum(len(road['paths']) for road in roads)} "
        f"OSM paths across {len(roads)} road groups"
    )


if __name__ == "__main__":
    main()
