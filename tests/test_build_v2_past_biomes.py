from __future__ import annotations

import importlib.util
import inspect
import tempfile
import unittest
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
MODULE_PATH = ROOT / "tools" / "build-v2-past-biomes.py"
SPEC = importlib.util.spec_from_file_location("build_v2_past_biomes", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class BuildBiomeMapTests(unittest.TestCase):
    def test_uses_the_clean_biome_art_across_the_entire_background(self) -> None:
        """Roads are rendered later, so no pre-biome city pixels should be restored."""
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            terrain_path = root / "clean-biomes.png"
            output_path = root / "map-background.png"

            terrain = Image.new("RGB", (65, 49), (17, 43, 91))
            for y in range(terrain.height):
                terrain.putpixel((terrain.width // 2, y), (91, 32, 17))
            terrain.save(terrain_path)
            source_bytes = terrain_path.read_bytes()

            composed = MODULE.build_map(
                terrain_path=terrain_path,
                output_path=output_path,
            )

            self.assertEqual(composed.tobytes(), terrain.tobytes())
            with Image.open(output_path) as output:
                self.assertEqual(output.convert("RGB").tobytes(), terrain.tobytes())
            self.assertEqual(terrain_path.read_bytes(), source_bytes)

    def test_defers_tile_publication_until_after_roads_are_rendered(self) -> None:
        self.assertNotIn("assets_path", inspect.signature(MODULE.build_map).parameters)

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            terrain_path = root / "clean-biomes.png"
            output_path = root / "map-background.png"
            terrain = Image.new("RGB", (5, 3))
            for y in range(terrain.height):
                for x in range(terrain.width):
                    terrain.putpixel((x, y), (x * 30, y * 60, x + y))
            terrain.save(terrain_path)

            MODULE.build_map(
                terrain_path=terrain_path,
                output_path=output_path,
            )

            self.assertEqual(sorted(path.name for path in root.iterdir()), [
                "clean-biomes.png",
                "map-background.png",
            ])


if __name__ == "__main__":
    unittest.main()
