"""Deterministic page screenshots for visual QA.

Uses system Chrome via Playwright (no browser download). Waits for network
idle + a settle delay so entry animations/counters finish, then captures the
viewport (top) and the full page.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

PAGES = [
    "artistry_academy",
    "palette_masters",
    "canvas_color",
    "brushstroke_studio",
    "creative_canvas",
]
BASE = "http://localhost:8090/{}.html"
OUT = Path("results/qa")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        ctx = browser.new_context(viewport={"width": 1440, "height": 1000})
        page = ctx.new_page()
        for name in PAGES:
            page.goto(BASE.format(name), wait_until="networkidle", timeout=60000)
            page.wait_for_timeout(3500)  # entry animations + count-ups settle
            page.screenshot(path=str(OUT / f"{name}_settled.png"))
            # scroll through the whole page so IntersectionObserver reveals fire
            height = page.evaluate("document.documentElement.scrollHeight")
            step = 700
            pos = 0
            while pos < height:
                page.evaluate(f"window.scrollTo(0, {pos})")
                page.wait_for_timeout(220)
                pos += step
            page.wait_for_timeout(1200)
            page.evaluate("window.scrollTo(0, 0)")
            page.wait_for_timeout(600)
            page.screenshot(path=str(OUT / f"{name}_full.png"), full_page=True)
            print(f"captured {name}")
        browser.close()


if __name__ == "__main__":
    main()
