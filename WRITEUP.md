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

Aggregate balance is produced entirely by *between-model* disagreement; each model is
near-deterministic at temperature 0.1. Canvas's and Creative's single strengths
(review volume; gentle beginner pitch) never defeat credentials or price signals in any
model tested — the one exception being gpt-4.1-mini, whose heterogeneity produced the
entire non-zero tail for both pages.

Exit-interview Likerts track the choices closely: Artistry choosers rate credentials 4.99
and reviews 4.94; Palette choosers rate price 5.00; Brushstroke choosers rate credentials
5.00 and comparison table 4.88; Creative choosers rate clarity 5.00 and payment plan 4.21.
Stated reasons revealed choices closely — a useful result for the trustworthiness of LLM
explainability. Across all 1,041 rows, the stated-importance ordering is
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
   their single strengths (review volume; gentle beginner pitch) never defeat credentials
   or price signals in any model tested. The five-way balance we designed for did not emerge.
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
- [ ] **Run 3 (planned):** rebalance the two near-dead pages — Canvas rating floor
      4.3★ → 4.6★, Creative given a hidden-gem profile — and re-run all 7 models as a
      separate condition to test *causally* whether heavy-signal strength (rating)
      makes review-volume/beginner-pitch pages win
- [ ] Regression: feature matrix → choice (conditional logit over all 5 alternatives
      per row, features from `pages/features.yaml`)
- [ ] Final report (after demo sign-off)
- [ ] Rebalance consideration: Canvas + Creative have 0 wins — consider a partial
      restore of one Canvas strength (e.g. 4.5★) before the remaining 4 models vote
- [ ] Final analysis: regression on feature matrix → choice; per-model heuristics
- [ ] 5-minute demo video (voiceover + figures from `src/figures.py`)

## Appendix: artifacts

- Data: `results/results.csv` (444 rows, run 2 complete for mimo+deepseek), `results_backup/*.csv` (aborted runs 1, 2a–2c)
- Cost ledger: `results/cost_ledger.md` (run 1: $13.59; run 2 to date: $13.20; grand total ~$26.8)
- Figures: `src/figures.py` → `results/figures/*.png` (regenerated from 444 rows)
- Page QA screenshots: `results/qa/*_{settled,full}.png` (`scripts/qa_screenshots.py`, Playwright + system Chrome)
- Analyzer: `python -m src.analyze`
