from pathlib import Path
from PIL import Image


PROJECT = Path("/home/ubuntu/shramsetu-ai-mobile")
SOURCE = PROJECT / "assets/images/icon.png"
TARGETS = [
    PROJECT / "assets/images/icon.png",
    PROJECT / "assets/images/splash-icon.png",
    PROJECT / "assets/images/favicon.png",
    PROJECT / "assets/images/android-icon-foreground.png",
]


def main() -> None:
    image = Image.open(SOURCE).convert("RGBA")
    image.thumbnail((512, 512), Image.Resampling.LANCZOS)
    for target in TARGETS:
        image.save(target, format="PNG", optimize=True, compress_level=9)
        print(f"Optimized {target.name}: {target.stat().st_size} bytes")


if __name__ == "__main__":
    main()
