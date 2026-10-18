#!/usr/bin/env python3
"""Regenerate favicon PNGs + .ico from static/favicon.svg.

Renders the SVG at each size with headless system Chrome (same approach as
qa_screenshots.py), then builds favicon.ico from the 16/32/48 renders.

Outputs (filenames referenced by templates):
    static/favicon-neon-16.png
    static/favicon-neon-32.png
    static/apple-touch-icon-neon-180.png
    static/favicon.ico
"""
import io
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SVG = ROOT / "static" / "favicon.svg"

# (viewport size, output path)
RENDERS = [
    (16, ROOT / "static" / "favicon-neon-16.png"),
    (32, ROOT / "static" / "favicon-neon-32.png"),
    (180, ROOT / "static" / "apple-touch-icon-neon-180.png"),
]
ICO_SRC = 48  # render size for the .ico layers (16/32 derived by downscale)


def main() -> None:
    pngs: dict[int, bytes] = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        for size, out in RENDERS:
            ctx = browser.new_context(viewport={"width": size, "height": size},
                                      device_scale_factor=1)
            page = ctx.new_page()
            page.goto(SVG.as_uri())
            page.wait_for_timeout(150)  # let filters/gradients settle
            data = page.screenshot(clip={"x": 0, "y": 0, "width": size, "height": size})
            out.write_bytes(data)
            pngs[size] = data
            print(f"wrote {out.name} ({size}x{size}, {len(data)} bytes)")
            ctx.close()

        # 48px render for the .ico
        ctx = browser.new_context(viewport={"width": ICO_SRC, "height": ICO_SRC},
                                  device_scale_factor=1)
        page = ctx.new_page()
        page.goto(SVG.as_uri())
        page.wait_for_timeout(150)
        pngs[ICO_SRC] = page.screenshot(
            clip={"x": 0, "y": 0, "width": ICO_SRC, "height": ICO_SRC})
        ctx.close()
        browser.close()

    ico = ROOT / "static" / "favicon.ico"
    layers = []
    for size in (16, 32, ICO_SRC):
        img = Image.open(io.BytesIO(pngs[size])).convert("RGBA")
        if img.size != (size, size):
            img = img.resize((size, size), Image.LANCZOS)
        layers.append(img)
    layers[-1].save(ico, format="ICO", sizes=[(16, 16), (32, 32), (ICO_SRC, ICO_SRC)])
    print(f"wrote {ico.name} ({ico.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
