from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
MODULE_PATH = ROOT / "tools" / "build-v2-past-assets.py"
SPEC = importlib.util.spec_from_file_location("build_v2_past_assets", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class RemoveHorizontalEdgeFragmentsTests(unittest.TestCase):
    def test_removes_only_components_connected_to_left_or_right_edge(self) -> None:
        image = Image.new("RGBA", (12, 9), (0, 0, 0, 0))

        for x in range(4, 8):
            for y in range(2, 8):
                image.putpixel((x, y), (180, 80, 40, 255))

        for x in range(0, 2):
            for y in range(3, 7):
                image.putpixel((x, y), (30, 120, 40, 255))

        for x in range(10, 12):
            for y in range(1, 5):
                image.putpixel((x, y), (30, 120, 40, 255))

        image.putpixel((3, 1), (220, 210, 80, 255))

        cleaned = MODULE.remove_horizontal_edge_fragments(image)

        self.assertEqual(cleaned.getpixel((0, 4))[3], 0)
        self.assertEqual(cleaned.getpixel((11, 2))[3], 0)
        self.assertEqual(cleaned.getpixel((5, 4))[3], 255)
        self.assertEqual(cleaned.getpixel((3, 1))[3], 255)

    def test_does_not_mutate_the_input_image(self) -> None:
        image = Image.new("RGBA", (4, 4), (0, 0, 0, 0))
        image.putpixel((0, 2), (30, 120, 40, 255))

        MODULE.remove_horizontal_edge_fragments(image)

        self.assertEqual(image.getpixel((0, 2))[3], 255)


if __name__ == "__main__":
    unittest.main()
