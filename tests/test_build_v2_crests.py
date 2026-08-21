from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
SCRIPT_PATH = ROOT / "tools" / "build-v2-crests.py"


def load_builder():
    spec = importlib.util.spec_from_file_location("build_v2_crests", SCRIPT_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class CrestAssetBuilderTests(unittest.TestCase):
    def test_builder_outputs_two_transparent_runtime_pngs_and_vector_sources(self) -> None:
        builder = load_builder()
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            manifest = builder.build_crest_assets(output)

            self.assertEqual(set(manifest), {"blue-star", "twin-star"})
            for item in manifest.values():
                png = Image.open(item["png"]).convert("RGBA")
                self.assertEqual(png.size, tuple(item["size"]))
                self.assertEqual(png.getpixel((0, 0))[3], 0)
                self.assertIsNotNone(png.getchannel("A").getbbox())
                self.assertTrue(Path(item["svg"]).exists())
                published_png = ROOT / "assets" / "v2" / "past-events" / Path(item["png"]).name
                published_svg = ROOT / "assets" / "v2" / "past-events" / "crest-sources" / Path(item["svg"]).name
                self.assertEqual(Path(item["png"]).read_bytes(), published_png.read_bytes())
                self.assertEqual(Path(item["svg"]).read_text(encoding="utf-8"), published_svg.read_text(encoding="utf-8"))

            blue_svg = Path(manifest["blue-star"]["svg"]).read_text(encoding="utf-8")
            twin_svg = Path(manifest["twin-star"]["svg"]).read_text(encoding="utf-8")
            self.assertEqual(blue_svg.count('href="#blue-ray"'), 8)
            self.assertEqual(twin_svg.count('data-owner="'), 2)
            self.assertIn('data-meaning="return-place"', blue_svg)
            self.assertIn('data-meaning="road-between-two-people"', twin_svg)


if __name__ == "__main__":
    unittest.main()
