# 4. Method

This section describes the experiment exactly as run: the stimuli, the page-version history
(including the mid-run change, declared in full), the trial procedure, the model set, failure
handling, and cost accounting. Every figure below is taken from the code
(`src/run_experiment.py`, `src/models.py`), the stimulus manifest (`pages/features.yaml`),
the model configuration (`config.yaml`), the trial data (`results/results.csv`,
`results/results_run3.csv`) and the cost ledger (`results/cost_ledger.md`).

## 4.1 Stimuli and the controlled-feature design

The stimuli are **five fictional oil-painting course landing pages**
(`pages/artistry_academy.html`, `palette_masters.html`, `canvas_color.html`,
`brushstroke_studio.html`, `creative_canvas.html`), served to the models as **raw HTML**
(no rendering, no JavaScript). Each page instantiates a distinct offer profile drawn from a
controlled feature matrix (`pages/features.yaml`), in which eleven features are varied per
page: price level and display, review count, star rating, instructor credentials, course
description detail, page structure, completion certificate, positioning badge, enrollment
social proof, a five-way comparison table, price anchoring, and installment payment plan.

The design principle (set after two aborted pilot attempts, §4.2) is that **each page gets
exactly one strength and one honest tradeoff**: star ratings are compressed into a narrow
4.3–4.8 band, review counts form a tight 180–260 ladder, only one page offers a
certificate, and the five newer competitive signals (badge, enrollment social proof,
comparison table, anchoring, installments) are deliberately distributed across pages rather
than stacked on one. The five profiles as run:

| Feature | Artistry Academy | Palette Masters | Canvas & Color | Brushstroke Studio | Creative Canvas |
|---|---|---|---|---|---|
| Price | $299 (anchored from $349) | **$149** (lowest) | $199 | $249 (anchored from $299) | $179 (6 × $29.83) |
| Reviews | 240 · 4.8★ | 220 · 4.6★ | **260 (most) · 4.3★ (lowest)** | **180 (fewest)** · 4.5★ | 200 · 4.4★ |
| Credentials | Yale MFA, MoMA exhibitor | none (studio collective) | none (community-taught, 12 yrs) | MFA Slade, former Chelsea lecturer | none (self-taught duo) |
| Certificate | no | no | no | **yes (only one)** | no |
| Lessons | 96 | 72 | 64 | 80 | **58 (fewest)** |
| Badge | Best Seller | Best Value | Most Reviewed | New & Trending | Editor's Choice |
| Enrollment social proof | 2,847 enrolled | 4,120 enrolled | **6,340 (largest community)** | **410 (smallest)** | 1,560 enrolled |
| Comparison table | yes | yes | no | yes | no |
| Price anchoring | yes ($349 → $299) | no | no | yes ($299 → $249) | no |
| Payment plan | no | 3 × $49.67 | no | 3 × $83 | 6 × $29.83 |
| Stated tradeoff | Priciest; no certificate | No certificate, no credentialed instructor | Lowest rating; no credentials/certificate/installments | Fewest reviews; second-highest price | Lowest rating; fewest lessons |

**All five pages are shown together in every trial** — the choice is a five-way forced
choice, not a sequence of pairwise comparisons. Page order within the prompt is shuffled on
every trial and recorded (`page_order` column), so order effects are auditable.

## 4.2 Page-version history (declared)

The stimuli were not frozen from the first trial. Three page versions exist; the boundary
falls inside Run 2 and is declared here rather than buried:

- **v1 — trials of 16 Oct 2026 (444 rows).** Run-2 final layout A. The controlled feature
  values were already at their final run-2 settings in this version: the Canvas demotion
  (260 reviews @ 4.3★, community-taught, no credentials) was the fix applied at the end of
  **pilot 2b — before any Run-2 trial**, not part of the later redesign. (An earlier draft of
  the outline attributed the demotion to the v2 change; that attribution was wrong and is
  corrected here.)
- **v2 — trials of 17 Oct 2026 (597 rows), frozen thereafter.** A **visual-layer-only**
  update: layouts, imagery and per-page styling changed (commit `f38306a`, *"distinct
  layouts per page"*); the controlled data values did not. This is verified two ways from the
  trial records themselves:
  1. every recorded winner attribute is byte-identical across the boundary (e.g. Artistry
     240 reviews · 4.8★ · credentials on both dates; Palette 220 · 4.6★ on both);
  2. the v1 models' own free-text reasoning quotes the final values — "260 reviews" appears
     in 52 of the 444 v1 reasonings and "4.3" in 113 — while the pre-rebalance values
     ("15 reviews", "4.0") appear in **zero** v1 reasonings.
- **v3 — Run 3, 22–23 Oct 2026 (210 planned / 206 completed).** v2 with exactly one change:
  Canvas's star rating 4.3★ → 4.6★. Everything else, and the other four pages, are
  byte-identical to v2 (diff-verified against `pages_run3/`).

Because models ran on both v1 and v2 inside Run 2, stimulus version is a potential
confound for between-model comparisons. Which models saw which version:

| Model | Versions seen in Run 2 | Trials (v1 / v2) |
|---|---|---|
| gemini-3.1-flash-lite | **v1 only** | 150 / 0 |
| mimo-v2.6-flash | **v1 only** | 150 / 0 |
| gpt-4.1-mini | v2 only | 0 / 150 |
| grok-3-mini | v2 only | 0 / 150 |
| deepseek-flash | both | 71 / 72 |
| gpt-6-luna | both | 32 / 118 |
| gemini-3.8-flash | both | 41 / 107 |

Two consequences are carried forward into the analysis: (i) the three dual-version models
are checked for a version effect (§5.3, the DeepSeek before/after), and (ii) Run 3 is
compared against Run 2 **on the same pages** — the 597 v2 trials — rather than against the
pooled 1,041 (§5.5). From 17 Oct onward the pages are frozen; Run 3 is the only sanctioned
change.

## 4.3 Procedure

One trial = one choice phase + one exit-survey phase, both from the same conversation:

1. **Choice phase.** The model receives a single prompt containing all five pages as raw
   HTML in shuffled order, with the instruction to *"recommend exactly ONE course that you
   believe is the best choice for a typical learner"*, to reason briefly over price
   transparency, reviews/ratings, credentials, description detail and page structure, and to
   end with a strict JSON line `{"choice": "page_id"}`.
2. **Exit survey.** In the **same conversation, immediately after the choice**, the model is
   asked why it chose that course: ten 1–5 influence ratings (price, reviews, credentials,
   description, clarity/structure, badge, social proof, comparison table, price anchoring,
   payment plan; 1 = not at all influential, 5 = very influential) plus one free-text item.
   Because the survey is answered post-choice with the decision already in context, it is
   analysed as **post-choice self-report** (§5.4), never as an independent causal measure.

**Sampling parameters.** Temperature is fixed at **0.1 for every provider** (stated because
the study's near-determinism claims depend on it — `src/models.py` sets it per provider),
with a maximum of 2,000 output tokens per call.

**Retries.** A trial may retry a failed or unparseable phase up to **3 attempts for the
choice** and **10 for the interview**. In Run 2, 87 of 1,041 choice phases and 24 exit
surveys succeeded only after retries (observed maxima: 3 and 5 respectively); in Run 3, 22
choice phases needed retries (max 3) and one survey (3). A trial that still fails after its
final attempt is **dropped, not imputed** (§4.5).

**Schedule.** The runner iterates model × page-condition × repetition, where
`condition_page` is a **scheduling/resume key only** — every trial presents all five pages
regardless of the condition label (each model therefore contributes up to 30 × 5 = 150 rows
in Run 2 and 30 rows in Run 3). Run 2 planned **7 models × 5 conditions × 30 = 1,050** rows;
Run 3 planned **7 × 5 × 6 = 210**. The runner is resumable (completed keys are skipped on
re-launch), logs one CSV row per completed trial with token counts, latencies, costs and
attempts, and enforces the **$100 budget cap** at run time.

## 4.4 Models

Seven low-tier models across five providers were selected per supervisor direction
(9 Oct 2026: *low tier only, ~2 per company*): OpenAI (×2), Google (×2), xAI, Xiaomi and
DeepSeek. Anthropic was dropped on 10 Oct 2026 — the
only low-tier Haiku option was a ~10× price outlier and the account was out of credit.
Prices are the per-1M-token rates used for cost accounting (`config.yaml`, verified against
provider pricing in October 2026):

| Model | Provider | Input $/1M | Output $/1M |
|---|---|---|---|
| gpt-6-luna | OpenAI | 0.10 | 0.50 |
| gpt-4.1-mini | OpenAI | 0.15 | 0.60 |
| gemini-3.1-flash-lite | Google | 0.25 | 1.50 |
| gemini-3.8-flash | Google | 0.75 | 3.75 |
| grok-3-mini | xAI | 0.30 | 1.50 |
| mimo-v2.6-flash | Xiaomi | 0.14 | 0.28 |
| deepseek-flash | DeepSeek | 0.15 | 0.60 (off-peak) |

All seven completed both runs; findings characterise this tier, not frontier models.

## 4.5 Failures, retries and dropped trials

Failure sources, from the run logs:

- **grok-3-mini** — xAI credits exhausted mid-run (150 failed attempts; all recovered after
  a top-up).
- **deepseek-flash** — empty/invalid responses ("No JSON with 'choice' key"): ~110 across
  Run 2 and the Run 3 flakes; 54 of 79 recovered by a dedicated resume pass in Run 2.
- **gpt-6-luna** — 1 credit-exhaustion event; **mimo-v2.6-flash** — rate-limit/blank
  retries; **gemini-3.8-flash** — 2 × "Deadline Exceeded".

All were transient and retried in-flight (§4.3). After the final retry:

- **Run 2: 9 trials dropped of 1,050 planned** — 7 deepseek-flash, 2 gemini-3.8-flash —
  giving **1,041 analysed (99.1% completion)**.
- **Run 3: 4 trials dropped of 210 planned** — all deepseek empty-response flakes, the same
  failure mode at a higher per-trial rate (a second resume pass recovered 6 of the first 10)
  — giving **206 analysed (98.1%)**.

**Denominator policy.** Percentages are computed over **completed trials** (Run 2: 143–150
per model; Run 3: 26–30 per model); dropped trials are reported as explicit counts out of
the planned total and never imputed. As a sensitivity bound, even if all 7 dropped deepseek
trials had been Palette picks, deepseek's Palette share would move only from 25/143 = 17.5%
to 32/150 = 21.3% — no conclusion changes.

## 4.6 Cost accounting

Costs are computed from measured token counts × the published per-1M rates in
`config.yaml`, logged per row. The authoritative figures (`results/cost_ledger.md`):

| Run | Spend | Note |
|---|---|---|
| Run 1 (archived) | $13.59 | ceiling-effect run, unusable data (interview called as a separate context) |
| Run 2 (incl. aborted attempts 2a/2b) | $34.16 | 2a $2.27 + 2b $1.24 (both aborted at design stage) are part of this total; ~$0.033 per completed row |
| Run 3 | $6.82 | 206 completed trials |
| **Total** | **$54.57** | **of the $100 cap (54.6%)** |

Provider billing dashboards (Google, xAI, OpenAI, DeepSeek; screenshots dated 20 Oct 2026,
published with the report) are retained as receipts, but their windows are wider than the
runs — the **$54.57 ledger total is the figure used everywhere in this report** (it
supersedes the $50–60 estimate quoted verbally in the demo video).
