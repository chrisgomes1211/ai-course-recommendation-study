# What Drives an LLM's Choice? A Controlled Offer-Choice Experiment

**Status: Run 2 COMPLETE — 1,041 / 1,050 rows, all 7 models collected, $34.16 total API spend. Figures and numbers current as of 2026-10-17.**

## 1. Research question

Do the classic conversion levers that drive *human* buyers — review counts, star ratings,
instructor credentials, price anchoring, installment plans, trust badges — drive *LLM* buyers
the same way? When seven low-tier LLMs are shown five competing offer pages simultaneously,
which page features predict the choice, and can the models' own exit-interview reports be
trusted as explanations of their decisions?

## 2. Method

- **Stimuli:** five fictional oil-painting course landing pages (`pages/*.html`), each built
  from a distinct offer profile on a controlled feature matrix (`pages/features.yaml`):
  price level, review count + star rating, instructor credentials, description detail,
  page structure, certificate, badge, enrollment social proof, comparison table,
  price anchoring, installment plan.
- **Models:** 7 low-tier models across 6 providers (OpenAI ×2, Google ×2, xAI, Xiaomi, DeepSeek),
  temperature 0.1.
- **Protocol per trial:** model sees all five pages as raw HTML (order shuffled), returns one
  choice as JSON, then answers an 11-question exit interview *in the same conversation*
  (10 Likert 1–5 influence ratings + 1 free-text rationale).
- **Design:** models × pages × 30 repetitions = 1,050 planned rows; resumable runner with
  budget cap; one CSV row per completed trial (`results/results.csv`), regression-ready.

## 3. Design iterations (why run 1 was unusable)

| Run | Outcome | Diagnosis | Fix |
|---|---|---|---|
| 1 | Artistry 96.6% | Page stacked every top driver (rating, credentials, description, structure) | Rebalanced offer profiles |
| 2a | Canvas 98.8% | Review-count knockout: 320 reviews (2× next) + largest community + credentials | Compressed review counts to a 180–260 ladder |
| 2b | Canvas ~100% (luna) | Canvas still top on every high-weight driver at once | Demoted Canvas: most reviews but *lowest* rating (4.3★), no credentials |
| 2c+ | **No page ≥60%** | — | Ceiling effect broken |

## 4. Findings (Run 2, COMPLETE — 1,041 rows / 1,050 planned)

All seven models completed (9 trials lost to transient API errors). Final win shares:

| Page | Wins | Share |
|---|---|---|
| Artistry Academy | 584 | 56.1% |
| Palette Masters | 416 | 40.0% |
| Brushstroke Studio | 24 | 2.3% |
| Creative Canvas | 14 | 1.3% |
| Canvas & Color | 3 | 0.3% |

The run-1 ceiling effect (Artistry 96.6%) is broken — no page reaches the pre-registered
60% dominance threshold — but the five-way balance we designed for did not emerge.
Two pages (Canvas, Creative) received almost no picks. Per-model heuristics:

| Model | N | Dominant pick | Heuristic signature |
|---|---|---|---|
| gemini-3.8-flash | 148 | Artistry 94% | credentials-first |
| mimo-v2.6-flash | 150 | Artistry 84% | credentials-first |
| deepseek-flash | 143 | Artistry 83% | credentials-first |
| gemini-3.1-flash-lite | 150 | Palette 69% | price-first; only early Brushstroke adopter (19) |
| grok-3-mini | 150 | Palette 72% | price-first; only Creative adopter (13) |
| gpt-6-luna | 150 | Palette 57% | price-leaning but genuinely split |
| gpt-4.1-mini | 150 | Artistry 54% | most heterogeneous — the only model to pick Canvas (3) |

Aggregate balance is produced by *between-model* disagreement; each model is
near-deterministic at temperature 0.1. Two caveats, both quantified below: (i) the layout
change at the 444-row boundary moved deepseek's own Artistry share 94% → 71% (luna and
gemini-3.8 stable), so part of the between-model difference reflects which page version
each model saw; (ii) Canvas's and Creative's *bundles* (review volume arriving together
with the lowest rating and community teaching; gentle pitch with installment pricing)
never defeat credentials or price in any model tested — a statement about each page's
bundle, not about review volume alone (gpt-4.1-mini's heterogeneity produced the entire
non-zero tail for both pages).

**Page-version sensitivity (v1 = the 444 trials of 16 Oct; v2 = the 597 trials of 17 Oct):**

| Model | Versions seen | v1 picks | v2 picks | Shift |
|---|---|---|---|---|
| deepseek-flash | both | n=71: A 94% · P 6% | n=72: A 71% · P 29% | **−23pp Artistry** |
| gpt-6-luna | both | n=32: P 56% · A 44% | n=118: P 57% · A 43% | stable (±1pp) |
| gemini-3.8-flash | both | n=41: A 95% · P 5% | n=107: A 93% · P 7% | stable (2pp) |
| gemini-3.1-flash-lite, mimo-v2.6-flash | v1 only | 150 each | — | — |
| gpt-4.1-mini, grok-3-mini | v2 only | — | 150 each | — |

Two of the three dual-version models keep their signature across the change; deepseek does
not. Stimulus version is therefore a live covariate: the “all variance is between models”
reading is qualified accordingly, and pages are frozen from 17 Oct onward.

Exit-interview Likerts track the choices closely: Artistry choosers rate credentials 4.99
and reviews 4.94; Palette choosers rate price 5.00; Brushstroke choosers rate credentials
5.00 and comparison table 4.88; Creative choosers rate clarity 5.00 and payment plan 4.21.
Stated reasons track revealed choices closely — evidence of *consistency* between what
models say and what they do, read with care: the survey is asked after the choice, in the
same conversation, so it may rationalise a decision already made and cannot by itself show
that the rated factor caused the pick. Across all 1,041 rows, the stated-importance ordering is
Description 4.61 ≈ Reviews 4.56 > Clarity 4.41 > Price 4.03 ≈ Comparison 3.99 ≈
Credentials 3.96 > Social proof 3.10 > Badge 2.61 > Payment plan 2.24 > Anchoring 2.00 —
classic CRO levers (badges, anchors, installments) barely register as drivers.

## 5. Limitations

1. **Cost:** total API spend across both runs was ~$47.75 (run 1: $13.59, run 2: $34.16)
   on a $100 cap. Free-tier/low-tier providers only; premium models (GPT-5-class,
   Claude Opus-class) were out of scope by design.
2. **Model sample:** 7 low-tier chat models, one per provider family, each near-deterministic
   at temperature 0.1 — findings characterize this tier, not frontier models.
3. **Two near-dead pages:** Canvas (0.3%) and Creative (1.3%) received almost no picks —
   but each page's strength arrives *bundled* (Canvas carries its review volume together
   with the lowest rating and no credentials), so this does not isolate review volume as
   the failing driver; Run 3's rating-only change is the separating test. The five-way
   balance we designed for did not emerge.
4. **Fictional pages:** all courses, reviews, instructors and enrollments are synthetic;
   models may behave differently with real brands and real review text.
5. **Visual-layer confound (post-collection tweak, 2026-10-16):** after 444 rows were
   collected, the five pages received visual-layer-only updates (distinct layout concepts
   per page, image fixes). All controlled data values — price, rating, review counts,
   credentials text, badges, lessons, certificate, payment plans, social proof, compare
   tables — are byte-identical to what earlier rows saw. However, later models read
   different HTML markup/layout than earlier models did. Layout is visible to the models
   (they parse raw HTML), so pre/post blocks are separable by `timestamp` and noted as a
   covariate in the dataset README.
6. **9 lost trials** (7 deepseek, 2 gemini-3.8-flash): transient API errors after final
   retry — 1,041 of 1,050 planned rows collected.

## 6. Next steps

- [x] Run 2 complete: all 7 models, 1,041 rows, $34.16 (2026-10-17)
- [ ] **Run 3 (pre-registered, small):** ONE change — Canvas rating floor 4.3★ → 4.6★;
      every other feature and the other four pages byte-identical to run 2 (pages frozen).
      All 7 models, same protocol (temp 0.1, 30/model ≈ 210 trials, ~$7), rows tagged with
      an explicit `page_version` column (v2 baseline / v3 run-3). H1: if rating was the
      binding constraint, Canvas's share rises materially above 0.3%; H2: it stays low →
      the bundle interpretation stands. Run alongside the report writing.
- [ ] Regression: feature matrix → choice (conditional logit over all 5 alternatives
      per row, features from `pages/features.yaml`)
- [ ] Final report (after demo sign-off)
- [ ] Rebalance consideration: Canvas + Creative have 0 wins — consider a partial
      restore of one Canvas strength (e.g. 4.5★) before the remaining 4 models vote
- [ ] Final analysis: regression on feature matrix → choice; per-model heuristics
- [ ] 5-minute demo video (voiceover + figures from `src/figures.py`)

## Appendix: artifacts

- Data: `results/results.csv` (1,041 rows, run 2 complete 2026-10-17), `results_backup/*.csv` (aborted runs 1, 2a–2c)
- Cost ledger: `results/cost_ledger.md` (run 1: $13.59; run 2: $34.16; grand total ~$47.75)
- Figures: `src/figures.py` → `results/figures/*.png` (regenerated from 1,041 rows)
- Page QA screenshots: `results/qa/*_{settled,full}.png` (`scripts/qa_screenshots.py`, Playwright + system Chrome)
- Analyzer: `python -m src.analyze`
