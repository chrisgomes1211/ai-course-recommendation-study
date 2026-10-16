"""Generate analysis figures from results/results.csv into results/figures/."""
import csv
from collections import Counter, defaultdict
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

RESULTS_FILE = Path("results/results.csv")
OUT_DIR = Path("results/figures")

LIKERT_KEYS = ["q1_price", "q2_reviews", "q3_credentials", "q4_description", "q5_clarity",
               "q6_badge", "q7_social_proof", "q8_comparison", "q9_anchoring", "q10_payment_plan"]
LIKERT_LABELS = {
    "q1_price": "Price", "q2_reviews": "Reviews", "q3_credentials": "Credentials",
    "q4_description": "Description", "q5_clarity": "Clarity", "q6_badge": "Badge",
    "q7_social_proof": "Social proof", "q8_comparison": "Comparison table",
    "q9_anchoring": "Anchoring", "q10_payment_plan": "Payment plan",
}
PAGE_ORDER = ["artistry_academy.html", "palette_masters.html", "canvas_color.html",
              "brushstroke_studio.html", "creative_canvas.html"]
PAGE_SHORT = {
    "artistry_academy.html": "Artistry",
    "palette_masters.html": "Palette",
    "canvas_color.html": "Canvas",
    "brushstroke_studio.html": "Brushstroke",
    "creative_canvas.html": "Creative",
}
PAGE_COLORS = {
    "artistry_academy.html": "#8b5cf6",
    "palette_masters.html": "#f59e0b",
    "canvas_color.html": "#14b8a6",
    "brushstroke_studio.html": "#ef4444",
    "creative_canvas.html": "#3b82f6",
}


def load_rows():
    with open(RESULTS_FILE) as f:
        return list(csv.DictReader(f))


def fig_win_share(rows, total):
    wins = Counter(r["which_page_won"] for r in rows if r.get("which_page_won"))
    pages = [p for p in PAGE_ORDER if wins.get(p)]
    counts = [wins[p] for p in pages]
    shares = [100.0 * c / total for c in counts]

    fig, ax = plt.subplots(figsize=(9, 5))
    bars = ax.bar([PAGE_SHORT[p] for p in pages], shares,
                  color=[PAGE_COLORS[p] for p in pages], edgecolor="white")
    ax.bar_label(bars, labels=[f"{s:.1f}%\n(n={c})" for s, c in zip(shares, counts)],
                 padding=3, fontsize=10)
    ax.axhline(20, color="gray", ls="--", lw=1, label="Equal share (20%)")
    ax.set_ylabel("Share of wins (%)")
    ax.set_title(f"Course page wins — {total} choices, no page dominates")
    ax.set_ylim(0, max(shares) * 1.25 if shares else 100)
    ax.legend()
    fig.tight_layout()
    fig.savefig(OUT_DIR / "win_share.png", dpi=150)
    plt.close(fig)


def fig_wins_per_model(rows):
    by_model = defaultdict(Counter)
    for r in rows:
        if r.get("which_page_won"):
            by_model[r["model"]][r["which_page_won"]] += 1
    models = sorted(by_model)

    fig, ax = plt.subplots(figsize=(10, 5.5))
    left = [0] * len(models)
    for page in PAGE_ORDER:
        vals = [by_model[m].get(page, 0) for m in models]
        if sum(vals) == 0:
            continue
        ax.barh(models, vals, left=left, color=PAGE_COLORS[page],
                edgecolor="white", label=PAGE_SHORT[page])
        left = [l + v for l, v in zip(left, vals)]
    ax.set_xlabel("Wins")
    ax.set_title("Winning page by model — models disagree by heuristic")
    ax.legend(ncol=5, fontsize=9, loc="lower right")
    ax.invert_yaxis()
    fig.tight_layout()
    fig.savefig(OUT_DIR / "wins_per_model.png", dpi=150)
    plt.close(fig)


def fig_likert(rows):
    sums = defaultdict(float)
    counts = Counter()
    for r in rows:
        if not r.get("which_page_won"):
            continue
        for k in LIKERT_KEYS:
            try:
                sums[k] += float(r[k])
                counts[k] += 1
            except (KeyError, ValueError):
                pass
    labels = [LIKERT_LABELS[k] for k in LIKERT_KEYS]
    means = [sums[k] / counts[k] if counts[k] else 0 for k in LIKERT_KEYS]

    order = sorted(range(len(LIKERT_KEYS)), key=lambda i: means[i])
    fig, ax = plt.subplots(figsize=(9, 5))
    bars = ax.barh([labels[i] for i in order], [means[i] for i in order],
                   color="#6366f1", edgecolor="white")
    ax.bar_label(bars, labels=[f"{means[i]:.2f}" for i in order], padding=3, fontsize=10)
    ax.set_xlim(0, 5.5)
    ax.set_xlabel("Mean influence rating (1–5)")
    ax.set_title("What drove the choice — mean exit-interview Likert")
    fig.tight_layout()
    fig.savefig(OUT_DIR / "likert_drivers.png", dpi=150)
    plt.close(fig)


def main():
    rows = load_rows()
    total = len(rows)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    fig_win_share(rows, total)
    fig_wins_per_model(rows)
    fig_likert(rows)
    print(f"Figures written to {OUT_DIR}/ from {total} rows")


if __name__ == "__main__":
    main()
