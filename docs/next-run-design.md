# Next Run Design — Single-Factor Pairwise Choice Experiment

Status: design sketch for review (Victor) before any further spend.
Repo: `ai-offer-choice/` · results: `results/results.csv` · config: `config.yaml`

> **Revision after design meeting (approved direction).** Pages are now built as
> *competitive product listings* in the Amazon-shopping sense: every page shows a
> visible price, star rating with review count, review cards, instructor bio and a
> structured offer — a product a shopper would actually compare. The baseline is no
> longer artificially weak; it is a realistic mid-market listing. Each variant still
> raises exactly one feature, so attribution is preserved, but the choice now reads
> as a genuine between-store comparison rather than "best-everything vs straw man".
>
> **Competitive pass (Victor, post-approval, 2026-10-15).** Pages approved as "very good";
> direction confirmed with the Amazon shopping analogy (shoppers read reviews, ratings and
> compare across sellers). Compare table expanded from 2 to 4 rival listings with mixed
> strengths — no column dominates any row — plus a "Customers who viewed this item also
> viewed" strip and a constant "#2 Best Seller" badge. All competitive context is identical
> across the six pages; single-feature diffs unchanged.

## 1. Why the previous run could not answer the research question

`pages/artistry_academy.html` sat at the top level on **all five features simultaneously**
(price shown $249, 150 reviews at 4.9, detailed credentials, detailed description, structured
layout), so it won 1,152 of 1,192 choices (96.6%). All 40 non-artistry wins came from only
3 models (grok-3-mini 26, gemini-3.1-flash-lite 10, claude-haiku-4-5 4); OpenAI, Xiaomi and
DeepSeek models chose artistry 100% of the time. Because one page was best on everything,
wins cannot be attributed to any individual feature — the run is confounded, not inconclusive.

## 2. Page set — 6 pages, single-factor design (competitive listings)

Baseline is a realistic mid-market listing (price shown, modest reviews, basic bio);
each variant raises exactly **one** feature to a clearly better level.

| page | price | reviews | credentials | description | structure |
|---|---|---|---|---|---|
| v0_baseline | $249 shown | typical (48, 4.2) | basic | medium | simple |
| v1_price | **$149 shown** | typical (48, 4.2) | basic | medium | simple |
| v2_reviews | $249 shown | **many (280, 4.8)** | basic | medium | simple |
| v3_credentials | $249 shown | typical (48, 4.2) | **detailed** | medium | simple |
| v4_description | $249 shown | typical (48, 4.2) | basic | **detailed** | simple |
| v5_structure | $249 shown | typical (48, 4.2) | basic | medium | **structured** |

Amazon-style elements identical on every page (same copy, same placement): visible
price box, "Enroll now" CTA, "What you'll learn" bullets, curriculum list, instructor
section, star rating with count, footer. A model comparing any two pages is doing
what a shopper does: reading two real listings that differ in one respect.

Controls held identical across all six pages:

- Same course title and content: "Oil Painting Foundations"
- Same instructor name
- Same imagery (identical image files/alt text)
- Same copy everywhere except the manipulated feature cell above
- Same HTML skeleton/CSS; only the feature block differs

Files live in `pages/variants/` with a `features.csv` manifest
(page, price, reviews, credentials, description, structure) so the analysis script can join
outcomes to the manipulated factor without hard-coding names.

## 3. Comparison schedule

Primary design: **5 pairs**, each variant vs baseline.

| pair | comparison | isolated feature |
|---|---|---|
| P1 | v1_price vs v0_baseline | price |
| P2 | v2_reviews vs v0_baseline | reviews |
| P3 | v3_credentials vs v0_baseline | credentials |
| P4 | v4_description vs v0_baseline | description |
| P5 | v5_structure vs v0_baseline | structure |

- Each pair isolates exactly one feature (all other cells equal by construction).
- Randomize left/right page order per trial (logged in `page_order`).
- Randomize pair order per run so a given feature is not always shown first.
- Optional stretch: full round-robin (15 pairs) — **recommended NOT for run 1** of this
  design; it triples rows and cost for comparisons (variant vs variant) we do not need yet.
  Revisit only if the 5-pair results are ambiguous.

## 4. Trial math and cost estimate

Rows: 5 pairs x 7 models x 25 repetitions = **875 rows**

Models (from `config.yaml`, 7 low-tier entries):
gpt-6-luna, gpt-4.1-mini, gemini-3.1-flash-lite, gemini-3.8-flash, grok-3-mini,
mimo-v2.6-flash, deepseek-flash.
claude-haiku-4-5 appeared in the prior run (19 rows) but is dropped for cost; restoring it
would give 5 x 8 x 25 = 1,000 rows.

Cost arithmetic:

- Prior run: $13.59 / 1,192 rows = **$0.0114/row** at mean 38,391 input tokens (5 pages in
  context) — choice $13.28, interview $0.31.
- Pairwise trials put 2 pages in context, not 5: expect ~14-16k input tokens per turn.
  15,000 / 38,391 ~= 0.39 of the input; input dominates row cost, so
  $0.0114 x 0.39 ~= **$0.004-0.006/row**.
- 875 x $0.005 ~= **$4.4** → plausible range **$4-6** for the choice turns.
- Caveat: once the interview is a second turn in the same conversation, that turn re-sends
  the ~15k context instead of 256 tokens, roughly doubling input per row. Budget
  **$8-12 all-in** as the honest ceiling. Still far under `budget_cap_usd: 100`.

Note: exact token counts are unknown until a pilot (2-page prompts are new). See §7.

## 5. Run hygiene rules (freeze protocol)

Preconditions — the run does not start until all three hold:

1. **Git tag.** `git tag next-run-v1` on the exact commit used; every row in
   `results/results.csv` records the tag/commit hash (new column). No tag, no run.
2. **No page edits during the run.** Pages are frozen from tag time until results are
   written. (Prior run: `pages/canvas_color.html` was edited mid-evening — cosmetic, but the
   rule stands: an edit invalidates comparability across rows.)
3. **Interview in the same conversation.** The interview must be asked as a follow-up turn
   in the *same* conversation as the choice, with both pages still in context. Current bug:
   the interview is a separate call with ~256 input tokens vs ~38,400 for the choice, which
   is why answers read "seemed like a good fit". **This code change is a precondition for
   the run — do not run before it lands.**

Also: results append only (no overwrites of `results/results.csv`); `page_order`, pair ID,
and feature name written per row.

Config deltas in `config.yaml` before the run:

- `runs_per_condition`: 34 -> 25 (was tuned for 5 pages x 34 = 1,190 rows)
- add a `pairwise: true` (or `mode:`) switch so the runner loads `pages/variants/` pairs
  instead of the 5 top-level `pages/*.html` files
- leave `pricing:` and `budget_cap_usd: 100.0` unchanged; verify provider pricing page
  before launch (the file already carries a "USER MUST VERIFY" warning)

## 6. Analysis plan

- **Primary:** per-feature win rate = variant wins / 25 per model per pair, with 95%
  binomial (Wilson) confidence intervals. Pooled across models: n = 175 per pair.
- **Secondary:** per-model breakdown to test whether feature sensitivity differs by model
  family (OpenAI / Google / xAI / Xiaomi / DeepSeek).
- **Tertiary:** q1-q5 ratings (price, reviews, credentials, description, clarity) as
  supporting evidence for the stated reason, not as the outcome measure.
- Decision rule: a feature is "supported" if the pooled variant win rate CI excludes 50%;
  per-model cells at n=25 are directional only (CI at p=0.5 is roughly +/-19 points).

## 7. Open items

- Token counts for 2-page prompts are estimates; run **1 pilot pair first** (e.g. P1, one
  model, 3 reps) to measure real input tokens and re-price before the full 875 rows.
- Interview-in-same-conversation fix not yet implemented; cost ceiling above assumes it.
- claude-haiku-4-5 remains out (cost); can be added later as a separate, budgeted extension.
- Round-robin (15 pairs) deferred; revisit only if 5-pair results are ambiguous.
