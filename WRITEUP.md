# What Drives an LLM's Choice? A Controlled Offer-Choice Experiment

**Status: Run 2 partial (444 / 1,050 rows; 5 of 7 models complete) — figures and numbers current as of run 2e2, 2026-10-16. Remaining rows blocked on OpenAI/Google/xAI credit top-ups.**

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

## 4. Findings (Run 2 partial, 444 rows / 1,050 planned)

Five of seven models completed. Final win shares:

| Page | Wins | Share |
|---|---|---|
| Artistry Academy | 273 | 61.5% |
| Palette Masters | 152 | 34.2% |
| Brushstroke Studio | 19 | 4.3% |
| Canvas & Color | 0 | 0% |
| Creative Canvas | 0 | 0% |

The run-1 ceiling effect (Artistry 96.6%) is broken but not resolved: Artistry still
sits just above the pre-registered 60% dominance threshold. Per-model heuristics
differ sharply — this is the study's core signal:

| Model | N | Dominant pick | Note |
|---|---|---|---|
| gemini-3.1-flash-lite | 150 | Palette 69% | price-first heuristic; only model to pick Brushstroke (19) |
| mimo-v2.6-flash | 150 | Artistry 84% | credentials-first |
| deepseek-flash | 71 | Artistry 94% | credentials-first; 79 empty-response retries |
| gemini-3.8-flash | 41 | Artistry 95% | credentials-first |
| gpt-6-luna | 32 | even Art/Pal split (14/18) | most "human" disagreement pattern |

Canvas and Creative received zero picks from any model — the Canvas demotion
(4.3★, no credentials) over-corrected; those two pages' single strengths
(most reviews / gentlest pitch) never win against a credentials-or-price page.

Exit-interview Likerts track the choices closely: choosers of Artistry rate
credentials 5.00 and reviews 4.89; Palette choosers rate price 5.00; Brushstroke
choosers rate clarity, comparison table, and certificate 5.00 each. Stated reasons
revealed choices closely — a useful result for the trustworthiness of LLM explainability.

## 5. Limitations

1. **Credits:** OpenAI, Google and xAI API credits were exhausted mid-run; 4 of 7 models
   are incomplete (gpt-6-luna 32/150, gpt-4.1-mini 0/150, gemini-3.8-flash 41/150, grok 0/150).
   Mimo (150/150) and DeepSeek (71/150, blocked by empty-response errors + credits) are the
   completed/partial providers in the current file.
2. **Two zero-win pages:** after the Canvas demotion, Canvas and Creative received no picks —
   the aggregate is balanced between three pages, not five. The demotion over-corrected.
3. **Near-deterministic models:** balance depends on including models with different
   heuristics; adding more runs of the same model adds rows, not variance.
4. **Visual-layer confound (post-collection tweak, 2026-10-16):** after 444 rows were
   collected, the five pages received visual-layer-only updates (distinct layout concepts
   per page, image fixes, a CSS symlink for Canvas `/static` images). All controlled data
   values — price, rating, review counts, credentials text, badges, lessons, certificate,
   payment plans, social proof, compare tables — are byte-identical to what earlier rows
   saw. However, the remaining 4 models will read different HTML markup/layout than the
   first 5 models did. Layout is visible to the models (they parse raw HTML), so rows are
   not strictly comparable across the tweak boundary. Recommendation: either analyze
   pre-tweak and post-tweak rows as separate blocks, or re-run the completed models on
   the final pages if budget allows.

## 6. Next steps

- [x] Complete mimo + deepseek blocks — run 2e2 finished 2026-10-16 (444 rows, $13.20)
- [ ] Top up provider credits → resume gpt-6-luna (118 left), gpt-4.1-mini (150),
      gemini-3.8-flash (109), grok (150); runner resumes automatically, skipping completed rows
- [ ] Decide on the visual-layer confound: analyze pre/post-tweak blocks separately,
      or re-run completed models on final pages
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
