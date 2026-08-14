from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
LANDMARK_DIRECTORY = ROOT / "assets" / "v2" / "landmarks"
LANDMARKS = (
    ("Roppongi Hills", "roppongi-hills"),
    ("Tokyo Midtown", "tokyo-midtown"),
    ("Azabudai Hills", "azabudai-hills"),
    ("Azabudai Garden Plaza", "azabudai-garden-plaza"),
    ("Tokyo Tower", "tokyo-tower"),
    ("Zojoji", "zojoji"),
)


def crop_landmark(label: str, slug: str) -> None:
    source = LANDMARK_DIRECTORY / f"{slug}-transparent.png"
    output = LANDMARK_DIRECTORY / f"{slug}.png"
    image = Image.open(source).convert("RGBA")
    alpha = image.getchannel("A")
    bounds = alpha.point(lambda value: 255 if value > 8 else 0).getbbox()
    if bounds is None:
        raise RuntimeError(f"No visible landmark pixels found in {source}.")

    padding = 16
    left = max(0, bounds[0] - padding)
    top = max(0, bounds[1] - padding)
    right = min(image.width, bounds[2] + padding)
    bottom = min(image.height, bounds[3] + padding)
    cropped = image.crop((left, top, right, bottom))
    cropped.save(output)
    print(f"{label}: {cropped.width}x{cropped.height} -> {output}")


def main() -> None:
    for label, slug in LANDMARKS:
        crop_landmark(label, slug)


if __name__ == "__main__":
    main()
