#!/usr/bin/env python3
"""Refresh all pages from live URLs and save to pages/."""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from src.page_fetcher import PageFetcher

def main():
    parser = argparse.ArgumentParser(description="Refresh course pages from live URLs")
    parser.add_argument("--config", default="pages/urls.yaml", help="URL config file")
    parser.add_argument("--output", default="pages", help="Output directory")
    parser.add_argument("--force-js", action="store_true", help="Force Playwright rendering")
    parser.add_argument("--only", nargs="+", help="Only refresh specific page IDs")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be fetched")
    args = parser.parse_args()

    fetcher = PageFetcher(args.config, args.output)

    if args.dry_run:
        print("Would fetch:")
        for page_id, cfg in fetcher.config.items():
            if args.only and page_id not in args.only:
                continue
            print(f"  {page_id}: {cfg['url']}")
        return

    # Filter to only specified pages if requested
    if args.only:
        original_config = fetcher.config
        fetcher.config = {k: v for k, v in fetcher.config.items() if k in args.only}

    fetcher.save_all(force_js=args.force_js)
    print("Done!")

if __name__ == "__main__":
    main()