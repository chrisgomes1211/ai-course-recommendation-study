import csv
import sys
from collections import Counter, defaultdict
from pathlib import Path

RESULTS_FILE = Path("results/results.csv")
LIKERT_KEYS = ["q1_price", "q2_reviews", "q3_credentials", "q4_description", "q5_clarity",
               "q6_badge", "q7_social_proof", "q8_comparison", "q9_anchoring", "q10_payment_plan"]
LIKERT_LABELS = {
    "q1_price": "Price", "q2_reviews": "Reviews", "q3_credentials": "Credentials",
    "q4_description": "Description", "q5_clarity": "Clarity", "q6_badge": "Badge",
    "q7_social_proof": "Social proof", "q8_comparison": "Comparison table",
    "q9_anchoring": "Price anchoring", "q10_payment_plan": "Payment plan",
}
PAGE_SHORT = {
    "artistry_academy.html": "Artistry",
    "palette_masters.html": "Palette",
    "canvas_color.html": "Canvas",
    "brushstroke_studio.html": "Brushstroke",
    "creative_canvas.html": "Creative",
}


def load_rows():
    if not RESULTS_FILE.exists():
        print("No results/results.csv"); sys.exit(1)
    with open(RESULTS_FILE) as f:
        return list(csv.DictReader(f))


def pct(n, d):
    return 100.0 * n / d if d else 0.0


def main():
    rows = load_rows()
    total = len(rows)
    cost = sum(float(r.get("total_row_cost_usd") or 0) for r in rows)
    print(f"=== Run 2 analysis ===")
    print(f"Rows: {total} | Spend: ${cost:.4f}")
    errors = sum(1 for r in rows if not r.get("which_page_won"))
    print(f"Rows missing winner: {errors}")
    print()

    wins = Counter(r["which_page_won"] for r in rows if r.get("which_page_won"))
    print(f"--- Win counts (balance check: ~20% each = balanced) ---")
    print(f"{'Page':<12} {'Wins':>6} {'Share':>8}")
    for page, n in wins.most_common():
        short = PAGE_SHORT.get(page, page)
        print(f"{short:<12} {n:>6} {pct(n, total):>7.1f}%")
    shares = [pct(n, total) for n in wins.values()]
    if shares:
        spread = max(shares) - min(shares)
        print(f"Spread (max-min): {spread:.1f} pts")
        if max(shares) >= 60:
            print("WARNING: still a dominant page (>=60%) — ceiling effect persists")
        else:
            print("OK: no page dominates — run 1 ceiling effect is broken")
    print()

    print("--- Wins per model ---")
    by_model = defaultdict(Counter)
    for r in rows:
        if r.get("which_page_won"):
            by_model[r["model"]][r["which_page_won"]] += 1
    print(f"{'Model':<24} {'N':>5}  " + "  ".join(f"{PAGE_SHORT[p]:>11}" for p in PAGE_SHORT))
    for model in sorted(by_model):
        c = by_model[model]
        n = sum(c.values())
        cells = "  ".join(f"{c.get(p, 0):>11}" for p in PAGE_SHORT)
        print(f"{model:<24} {n:>5}  {cells}")
    print()

    print("--- Mean Likert (1-5) by chosen page ---")
    sums = defaultdict(lambda: defaultdict(float))
    counts = Counter()
    for r in rows:
        w = r.get("which_page_won")
        if not w:
            continue
        counts[w] += 1
        for k in LIKERT_KEYS:
            try:
                sums[w][k] += float(r[k])
            except (KeyError, ValueError):
                pass
    header = f"{'Page':<12} " + " ".join(f"{LIKERT_LABELS[k][:6]:>7}" for k in LIKERT_KEYS)
    print(header)
    for page in PAGE_SHORT:
        if counts[page] == 0:
            continue
        cells = " ".join(f"{sums[page][k] / counts[page]:>7.2f}" for k in LIKERT_KEYS)
        print(f"{PAGE_SHORT[page]:<12} {cells}")
    print()

    print("--- Overall mean Likert (all rows) ---")
    for k in LIKERT_KEYS:
        vals = []
        for r in rows:
            try:
                vals.append(float(r[k]))
            except (KeyError, ValueError):
                pass
        if vals:
            print(f"  {LIKERT_LABELS[k]:<18} {sum(vals) / len(vals):.2f}  (n={len(vals)})")
    print()

    print("--- Attempts / parse health ---")
    ca = Counter(r.get("choice_attempts") for r in rows)
    ia = Counter(r.get("interview_attempts") for r in rows)
    print(f"choice_attempts:    {dict(sorted(ca.items()))}")
    print(f"interview_attempts: {dict(sorted(ia.items()))}")


if __name__ == "__main__":
    main()
