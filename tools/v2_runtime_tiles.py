from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def build_runtime_tiles(source_path: Path, *, assets_path: Path) -> None:
    source_path = source_path.resolve()
    assets_path = assets_path.resolve()
    source_directory = assets_path / "past-evening-source-tiles"
    runtime_directory = assets_path / "past-evening-runtime-tiles"
    source_directory.mkdir(exist_ok=True)
    runtime_directory.mkdir(exist_ok=True)

    with Image.open(source_path) as opened:
        image = opened.convert("RGB")
    width, height = image.size
    x_edges = [0, (width + 1) // 2, width]
    y_edges = [0, (height + 1) // 2, height]
    runtime_image = image.resize((width * 4, height * 4), Image.Resampling.LANCZOS)
    runtime_x_edges = [0, runtime_image.width // 2, runtime_image.width]
    runtime_y_edges = [0, runtime_image.height // 2, runtime_image.height]
    tile_hashes: dict[str, str] = {}

    for row in range(2):
        for col in range(2):
            filename = f"{col}-{row}.png"
            tile = image.crop((x_edges[col], y_edges[row], x_edges[col + 1], y_edges[row + 1]))
            tile.save(source_directory / filename, optimize=True)
            runtime = runtime_image.crop(
                (
                    runtime_x_edges[col],
                    runtime_y_edges[row],
                    runtime_x_edges[col + 1],
                    runtime_y_edges[row + 1],
                )
            )
            runtime_path = runtime_directory / filename
            runtime.save(runtime_path, optimize=True)
            tile_hashes[filename] = file_sha256(runtime_path)

    manifest = {
        "source": source_path.relative_to(assets_path.parent.parent).as_posix(),
        "sourceSha256": file_sha256(source_path),
        "tiles": tile_hashes,
    }
    (runtime_directory / "manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    assets = root / "assets" / "v2"
    build_runtime_tiles(assets / "roppongi-roads-past-evening.png", assets_path=assets)
