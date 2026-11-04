# Final report — outline (v2, revised per Victor's 1 Nov feedback)

**Report working title:** *What Drives an LLM's Choice? A Controlled Offer-Choice Experiment*
**Data:** `results/results.csv` — run 2: 1,041 trials of 1,050 (of which **597 on the final frozen pages**) · `results/results_run3.csv` — run 3: 210 planned / **206 completed** (v3 pages) · 7 models · 5 pages · temperature 0.1 · $54.57 total spend

> **Revision 2 — what changed from the outline reviewed on 1 Nov**
> 1. **Run 3 moved into Results as §5.5**, immediately after the DeepSeek before/after (§5.3) — not a separate section after the Discussion. The Discussion (§6) now draws on both runs, and the review-volume "bundle" question is answered where §5.5 presents the test.
> 2. **Run 3 is compared with Run 2 on the same pages.** The pooled figure (Canvas 3 of 1,041) includes trials on the earlier pages; on the final frozen pages Canvas won **3 of 597 (0.5%)**. mimo-v2.6-flash and gemini-3.1-flash-lite saw only the earlier pages in Run 2, so their Run 3 shift mixes the redesign and the rating change and is reported as such. Counts are given beside every percentage, and the result is worded as **support for H1**, not confirmation.
> 3. The live report page has been updated accordingly: "causally isolates" is removed and the Run 3 tables now show the same-pages baseline and counts.

---

## 1. Abstract (~250 words)
- Question: how do low-tier LLMs choose between five controlled course offers, and what drives the pick?
- Design in one line: 7 models × 5 pages shown together, shuffled, single choice + exit survey; 1,041 run-2 trials (597 on the final frozen pages) and 206 run-3 trials.
- Headline: no page ≥60%; aggregate balance arises from **models disagreeing** — credentials-first vs price-first.
- Run 3 in one sentence: raising only Canvas's rating (4.3★ → 4.6★) moves it from 3/597 to 55/206 — **support for H1** (rating was the binding constraint for the middle models), with Artistry still first.
- Honest caveats up front: page-version change mid-run (sensitivity analysis in §5.3), post-hoc survey (§5.4), ~30 trials per model in Run 3.

## 2. Introduction & research question
- LLMs increasingly act as product/course recommenders; their choice = recommendation.
- Human choice heuristics this study maps onto: price–quality inference, social proof, authority/credentials.
- RQ: *How do low-tier LLMs distribute choices across controlled offers, and do their choices track their stated reasons?*

## 3. Background / related work
- Heuristics and biases in human decision making (price–quality, social proof, authority; Cialdini's levers).
- Prior work on LLM choice behaviour and prompt/order sensitivity.
- Self-report vs behaviour in LLMs (and why the survey must be read cautiously — see §5.4).

## 4. Method
### 4.1 Stimuli and the controlled-feature design
- Five fictional oil-painting course pages; every feature controlled in `pages/features.yaml`.
- Principle: exactly **one strength + one honest tradeoff** per page (price ladder 4.3–4.8★, reviews 180–260, credentials, one certificate, payment plans, badges).

### 4.2 Page-version history (DECLARED — feedback point 1)
- **v1 (trials of 16 Oct 2026):** run-2 final layout A — 444 trials. Controlled feature values **already at their final run-2 settings**: the Canvas demotion (260 reviews @ 4.3★, community-taught, no credentials) was the **pilot-2b fix applied before any Run-2 trial** — *not* part of the v2 redesign (an earlier outline draft attributed it to v2; corrected here).
- **v2 (trials of 17 Oct 2026 → frozen):** **visual-layer-only** update (layouts/images; commit `f38306a`, "distinct layouts per page") — 597 trials, controlled values byte-identical to v1 (winner attributes match across the boundary; v1 reasonings quote "260 reviews" 52× and "4.3" 113×, and never the pre-rebalance "15 reviews"/"4.0"). This is the like-for-like baseline for Run 3 (§5.5).
- **v3 (Run 3, 22–23 Oct 2026):** v2 with one change — Canvas rating 4.3★ → 4.6★ (§5.5).
- Which models saw which version in run 2:
  | Model | Version seen |
  |---|---|
  | gemini-3.1-flash-lite, mimo-v2.6-flash | v1 only (150 each) |
  | gpt-4.1-mini, grok-3-mini | v2 only (150 each) |
  | deepseek-flash, gpt-6-luna, gemini-3.8-flash | **both** (71/72, 32/118, 41/107) |
- From 17 Oct onward pages are **frozen**; Run 3 is the only sanctioned change (§5.5).

### 4.3 Procedure
- All five pages as raw HTML in one prompt, order shuffled per trial; choose exactly one + justify.
- Exit survey (11 items, 1–5) in the **same conversation, after** the choice — explicitly described as post-choice self-report.
- **Temperature 0.1** for every provider (stated because "near-deterministic" depends on it); max output tokens 2,000; ≤3 choice attempts, ≤10 interview attempts (observed maxima 3 and 5).
- 30 trials per model → 1,050 planned (run 2); 210 planned (run 3).

### 4.4 Models
- Table: 7 low-tier models across 6 providers (OpenAI ×2, Google ×2, xAI, Xiaomi, DeepSeek), pricing per 1M tokens.

### 4.5 Failures, retries and dropped trials (feedback point 4)
- Failure sources from run logs: grok — xAI credits exhausted (150 failed attempts, **all recovered** after top-up); deepseek — ~110 empty/invalid responses ("No JSON with 'choice' key"); gpt-6-luna — 1 credit exhaustion; mimo — rate/blank retries; gemini-3.8-flash — 2 × "Deadline Exceeded".
- Retry policy: automatic re-run (up to 3 choice / 5 interview attempts) — 87 choice calls and 24 interview calls succeeded only after retries.
- **Run 2: 9 trials dropped** (never completed): 7 deepseek-flash, 2 gemini-3.8-flash → 1,041 / 1,050 = 99.1% completion.
- **Run 3: 4 trials dropped** (DeepSeek empty-response flakes, same failure mode) → 206 / 210 = 98.1% completion.
- Denominators = completed trials per model (Run 2: 143–150; Run 3: 26–30); sensitivity: even if all 7 dropped deepseek trials were Palette picks, deepseek's Palette share moves only 17.5% (25/143) → 21.3% (32/150) — conclusions unchanged.

### 4.6 Cost accounting
- **$54.57** total across all runs (run 1 $13.59 + run 2 $34.16 + run 3 $6.82), token-priced, cap $100 — the cost-log figure is authoritative everywhere (supersedes the $50–60 figure quoted verbally in the demo video).

## 5. Results
### 5.1 Descriptives — did the redesign work?
- Run 2 shares (all 1,041): Artistry 56.1% (584) · Palette 40.0% (416) · Brushstroke 2.3% (24) · Creative 1.3% (14) · Canvas 0.3% (3).
- Of those, 444 trials used the earlier pages (16 Oct) and 597 the final frozen pages (17 Oct); Canvas could not win on the earlier pages, so the like-for-like baseline is the 597 (§5.5).
- No page ≥60% dominance line; run-1 ceiling (96.6%) resolved.

### 5.2 Per-model choice distributions
- Table + stacked figure: credentials-first (gemini-3.8, mimo, deepseek) vs price-first (grok, gemini-lite, luna) vs heterogeneous (gpt-4.1-mini, all five pages picked).
- Near-determinism at temperature 0.1: within a version, no model approaches uniform 20% across pages.

### 5.3 Version sensitivity — the DeepSeek before/after (feedback point 1)
| Model | 16 Oct (v1) | 17 Oct (v2) | Shift |
|---|---|---|---|
| deepseek-flash | n=71: A 94% · P 6% | n=72: A 71% · P 29% | **−23pp Artistry** |
| gpt-6-luna | n=32: P 56% · A 44% | n=118: P 57% · A 43% | stable (±1pp) |
| gemini-3.8-flash | n=41: A 95% · P 5% | n=107: A 93% · P 7% | stable (2pp) |
- Interpretation: two of three dual-version models hold their signature; deepseek does shift with the pages → **part of the between-model difference may be stimulus version, not model identity**; the claim "all variance is between models" is qualified accordingly. Single-version models (lite, mimo, 4.1-mini, grok) are version-pooled with the caveat noted.

### 5.4 Stated vs revealed choice (feedback point 2 — worded as consistency, not cause)
- Exit survey comes **after** the choice, same conversation → answers may rationalise a decision already made.
- Report as **consistency/association**: Artistry choosers rate credentials 4.99 & price 3.30; Palette choosers rate price 5.00 & credentials 2.51 — self-reports align with behaviour; they **cannot establish** that the rated factor caused the choice.

### 5.5 Run 3 — rating as the single-variable test (COMPLETE)

*Placed here, in Results, so the test sits with the other results and the Discussion (§6) can draw on both runs.*

- **Design (one change only):** Canvas rating 4.3★ → 4.6★ (off the floor; now ties Palette). Every other feature and the other four pages byte-identical to the frozen v2 pages (`pages_run3/`, diff-verified). Same protocol: temperature 0.1, all 7 models × 30 = 210 planned, **206 completed**; `page_version=v3` in `results/results_run3.csv`.
- **H1 / H2:** H1 — if rating was the binding constraint, Canvas rises materially above its final-pages baseline. H2 — it stays low → the bundle reading stands.
- **Like-for-like aggregate (run 2 final pages, n = 597 → run 3, n = 206):**

| Page | Run 2 final pages | Run 3 | Shift |
|---|---|---|---|
| Artistry Academy | 311 (52.1%) | 90 (43.7%) | −8.4pp |
| Palette Masters | 264 (44.2%) | 55 (26.7%) | −17.5pp |
| **Canvas & Color** | **3 (0.5%)** | **55 (26.7%)** | **+26.2pp** |
| Brushstroke Studio | 5 (0.8%) | 4 (1.9%) | +1.1pp |
| Creative Canvas | 14 (2.3%) | 2 (1.0%) | −1.3pp |

- **Baseline note (Victor's check):** pooled across all 1,041 run-2 trials Canvas is 3 (0.3%), but 444 of those trials used the earlier pages, where Canvas could not win. The like-for-like baseline is **3 of 597 (0.5%)** on the final frozen pages.
- **Per model on the same pages** (Canvas wins / trials; every Run 3 model has ≈30 completed trials):

| Model | Run 2 · Canvas (same pages) | Run 3 · counts | Reading |
|---|---|---|---|
| gpt-6-luna | 0/118 | Canvas 17/30 (57%) | flipped outright |
| deepseek-flash | 0/72 | Artistry 14/26 (54%) · Canvas 11/26 (42%) | split |
| grok-3-mini | 0/150 | Palette 12/30 (40%) · Canvas 11/30 (37%) | split |
| mimo-v2.6-flash \* | 0/150 | Artistry 17/30 (57%) · Canvas 10/30 (33%) | moderate |
| gpt-4.1-mini | 3/150 | Artistry 15/30 (50%) · Canvas 6/30 (20%) | moderate |
| gemini-3.1-flash-lite \* | 0/150 | Palette 24/30 (80%) | unmoved |
| gemini-3.8-flash | 0/107 | Artistry 30/30 (100%) | unmoved |

\* **Declared confound:** mimo-v2.6-flash and gemini-3.1-flash-lite saw only the **earlier pages** in Run 2, so their Run 3 change mixes the page redesign with the rating change and is **not** a clean rating effect. The other five models are like-for-like (final pages in both runs).

- **Reading — support for H1:** the rating bump moved Canvas from 3/597 to 55/206, driven by the price-leaning and heterogeneous models; the two extreme-signature models did not move (gemini-3.8 30/30 Artistry; gemini-lite 24/30 Palette). The result **supports H1** — rating was the binding constraint for the middle models — and points the same way as the run-2 bundle reading: review volume alone never won; volume plus a non-lowest rating wins 26.7%, enough for second place. **Artistry still leads Run 3 (43.7%) and Canvas ties Palette for second (26.7% each)** — not a takeover. At ≈30 trials per model these are tendencies, not precise effects; the wording throughout is "support for H1", never "confirms" or "causally isolates".
- **Cost & failures:** $6.82 for 206 completed trials; 4 dropped (DeepSeek empty-response flakes, the same failure mode as run 2), counted out of 210 planned and never imputed; percentages use completed trials as the denominator.

## 6. Discussion (draws on both runs)
### 6.1 Main finding, properly hedged
- Aggregate balance from heuristic disagreement between models; qualified by §5.3 version sensitivity.
### 6.2 What models heeded — and what they ignored
- Likert drivers (Description 4.61 ≈ Reviews 4.56 > … > Anchoring 2.00); badges/anchors/payment plans barely register.
### 6.3 Review volume: a bundle, not an isolated driver (feedback point 3)
- Canvas = most reviews **+** lowest rating **+** community teaching — the run-2 0.3% result is about the bundle; no claim that review volume per se is powerless.
- **Answered by §5.5:** lifting only the rating moves Canvas to 55/206 — the bundle reading holds, and rating was the binding constraint for the middle models (support for H1). Volume + a non-lowest rating is worth second place, not first.

## 7. Threats to validity & limitations
- Page-version confound (mitigated: declared, sensitivity-analysed, pages frozen; Run 3 compared on the same pages).
- Post-choice survey design (mitigated: association language only).
- Run 3 power: ≈30 trials per model → counts reported beside every percentage; result worded as support for H1, not confirmation.
- Run 3 baseline confound for mimo and gemini-3.1-flash-lite (earlier pages only in run 2) — declared in §5.5, not pooled into the rating effect.
- Low-tier models only, temperature 0.1 → findings characterise this tier; between-model inference, not frontier models.
- Fictional courses / synthetic reviews; single-item-per-page bundling (can't fully separate features within a page — addressed partly by Run 3).
- 9 dropped trials (run 2, 0.9%) and 4 (run 3, 1.9%) with sensitivity bounds.
- Budget-bounded sample ($54.57 of $100 cap).

## 8. Conclusion
- The redesign removed dominance; balance comes from models disagreeing with each other. Run 3's single-variable test (§5.5) supports H1: rating was the binding constraint for the middle models, while Artistry's credentials still anchor first place. Future work: human baseline arm, frontier models, Creative-bundle separating test.

## 9. Appendices
- A: full feature manifest (`features.yaml`). B: model × page win table. C: failure/retry log summary. D: cost ledger + provider statements. E: data dictionary (`results/README.md`). F: demo video link + live site URL.
