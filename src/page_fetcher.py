"""Fetch and extract page content from live URLs."""

import asyncio
import time
from pathlib import Path
from typing import Optional, Dict, Any
import requests
import yaml
from bs4 import BeautifulSoup

# Optional: Playwright for JS rendering
try:
    from playwright.async_api import async_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False


class PageFetcher:
    def __init__(self, config_path: str = "pages/urls.yaml", cache_dir: str = "pages"):
        self.config = self._load_config(config_path)
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (compatible; ResearchBot/1.0; +https://github.com/yourrepo)"
        })

    def _load_config(self, path: str) -> Dict:
        with open(path) as f:
            return yaml.safe_load(f) or {}

    def fetch_static(self, url: str, headers: Dict = None) -> str:
        """Fetch static HTML via requests."""
        resp = self.session.get(url, headers=headers or {}, timeout=15)
        resp.raise_for_status()
        return resp.text

    async def fetch_js(self, url: str, wait_for: str = None, headers: Dict = None) -> str:
        """Fetch JS-rendered HTML via Playwright."""
        if not PLAYWRIGHT_AVAILABLE:
            raise RuntimeError("Playwright not installed. Run: pip install playwright && playwright install chromium")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            if headers:
                await page.set_extra_http_headers(headers)
            await page.goto(url, wait_until="networkidle")
            if wait_for:
                await page.wait_for_selector(wait_for, timeout=10000)
            html = await page.content()
            await browser.close()
        return html

    def extract_content(self, html: str, selector: str = None) -> str:
        """Extract relevant content using CSS selector."""
        soup = BeautifulSoup(html, "html.parser")
        if selector:
            element = soup.select_one(selector)
            if element:
                return str(element)
        # Return body content or full HTML
        body = soup.body
        return str(body) if body else str(soup)

    def fetch_page(self, page_id: str, force_js: bool = False) -> str:
        """Fetch single page by ID from config."""
        config = self.config.get(page_id)
        if not config:
            raise ValueError(f"No config for page_id: {page_id}")

        url = config["url"]
        selector = config.get("selector")
        wait_for = config.get("wait_for")
        headers = config.get("headers", {})
        use_js = force_js or wait_for is not None

        if use_js:
            html = asyncio.run(self.fetch_js(url, wait_for, headers))
        else:
            html = self.fetch_static(url, headers)

        return self.extract_content(html, selector)

    def fetch_all(self, force_js: bool = False) -> Dict[str, str]:
        """Fetch all pages from config."""
        results = {}
        for page_id in self.config:
            try:
                print(f"Fetching {page_id}...")
                results[page_id] = self.fetch_page(page_id, force_js)
                time.sleep(1)  # Be polite
            except Exception as e:
                print(f"Error fetching {page_id}: {e}")
                results[page_id] = f"<!-- ERROR: {e} -->"
        return results

    def save_all(self, force_js: bool = False) -> None:
        """Fetch all pages and save to cache_dir as .html files."""
        pages = self.fetch_all(force_js)
        for page_id, html in pages.items():
            path = self.cache_dir / f"{page_id}.html"
            path.write_text(html, encoding="utf-8")
            print(f"Saved {path}")

# Convenience function for load_pages()
def load_live_pages(force_js: bool = False) -> Dict[str, str]:
    fetcher = PageFetcher()
    return fetcher.fetch_all(force_js)