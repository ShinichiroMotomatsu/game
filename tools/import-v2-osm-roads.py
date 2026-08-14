from __future__ import annotations

import json
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
OUTPUT_PATH = ROOT / "assets" / "v2" / "osm-road-source.json"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
USER_AGENT = "RoppongiRPGPrototype/1.0"
SOUTH, WEST, NORTH, EAST = 35.650, 139.724, 35.672, 139.754
BBOX_QUERY = "35.650,139.724,35.672,139.754"
QUERY = f"""[out:json][timeout:45];
(
  way[highway~"^(trunk|trunk_link|primary|primary_link|secondary|secondary_link|tertiary|tertiary_link)$"][name~"六本木通り|外苑東通り|麻布通り|桜麻通り|東京タワー通り|桜田通り"]({BBOX_QUERY});
  way[highway~"^(trunk|trunk_link|primary|primary_link|secondary|secondary_link|tertiary|tertiary_link)$"][ref~"^(1|301|319|412|415)$"]({BBOX_QUERY});
);
out geom;
"""


def fetch_osm_roads() -> dict:
    encoded = urllib.parse.urlencode({"data": QUERY}).encode("utf-8")
    request = urllib.request.Request(
        OVERPASS_URL,
        data=encoded,
        headers={"User-Agent": USER_AGENT},
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.load(response)


def normalized_snapshot(response: dict) -> dict:
    elements = []
    for element in response.get("elements", []):
        tags = element.get("tags", {})
        geometry = element.get("geometry", [])
        if not tags.get("highway") or not tags.get("name") or len(geometry) < 2:
            continue
        elements.append({
            "id": element["id"],
            "tags": tags,
            "nodes": element.get("nodes", []),
            "geometry": [
                {"lat": point["lat"], "lon": point["lon"]}
                for point in geometry
            ],
        })
    elements.sort(key=lambda element: element["id"])
    return {
        "provider": "OpenStreetMap",
        "attribution": "© OpenStreetMap contributors",
        "license": "ODbL-1.0",
        "source": OVERPASS_URL,
        "bbox": [WEST, SOUTH, EAST, NORTH],
        "osmBaseTimestamp": response.get("osm3s", {}).get("timestamp_osm_base"),
        "retrievedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "query": QUERY,
        "elements": elements,
    }


def main() -> None:
    snapshot = normalized_snapshot(fetch_osm_roads())
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"saved {len(snapshot['elements'])} named highway ways from "
        f"OSM base {snapshot['osmBaseTimestamp']} to {OUTPUT_PATH}"
    )


if __name__ == "__main__":
    main()
