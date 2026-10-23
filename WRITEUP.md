# What Drives an LLM's Choice? A Controlled Offer-Choice Experiment

**Status: Run 2 COMPLETE (1,041 / 1,050 rows) and Run 3 COMPLETE (206 / 210 rows). Total API spend $54.57 on a $100 cap. Figures current as of 2026-10-23.**

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
  temperature 0.1 (set identically for every provider; near-deterministic sampling).
- **Protocol per trial:** model sees all five pages as raw HTML (order shuffled), returns one
  choice as JSON, then answers an 11-question exit interview *in the same conversation*
  (10 Likert 1–5 influence ratings + 1 free-text rationale).
- **Design:** models × pages × 30 repetitions = 1,050 planned rows; resumable runner with
  budget cap; one CSV row per completed trial (`results/results.csv`), regression-ready.
- **Denominator policy:** percentages are computed over *completed* trials; dropped trials
  (transient API failures after final retry) are reported as an explicit count out of the
  planned total (run 2: 9 of 1,050 dropped, 1,041 analyzed).

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

### 4.1 Page-version sensitivity: the DeepSeek before/after (declared mid-run page change)

The five pages received a visual-layer update partway through run 2 (the 444-row boundary,
16→17 Oct). Controlled data values stayed byte-identical, but the HTML layout models parse
changed. Three models saw both versions. Their picks, before (v1) and after (v2) the change:

| Model | Versions seen | v1 picks | v2 picks | Shift |
|---|---|---|---|---|
| deepseek-flash | both | n=71: A 94% · P 6% | n=72: A 71% · P 29% | **−23pp Artistry** |
| gpt-6-luna | both | n=32: P 56% · A 44% | n=118: P 57% · A 43% | stable (±1pp) |
| gemini-3.8-flash | both | n=41: A 95% · P 5% | n=107: A 93% · P 7% | stable (2pp) |
| gemini-3.1-flash-lite, mimo-v2.6-flash | v1 only | 150 each | — | — |
| gpt-4.1-mini, grok-3-mini | v2 only | — | 150 each | — |

**The headline of this subsection: DeepSeek's own choice distribution moved when the pages
moved** (Artistry 94%→71%), while the two other dual-version models held their signatures.
Stimulus version is therefore a live covariate for DeepSeek specifically; the “all variance
is between models” reading is qualified accordingly, and all pages are frozen from 17 Oct
onward. This is also what motivates the pre-registered single-variable Run 3 below.

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

## 5. Run 3: the rating manipulation (COMPLETE — 206 / 210 rows, $6.82)

**Pre-registration (set before any run-3 trial):** exactly one feature changes — Canvas &
Color's star rating 4.3★ → 4.6★ (raising it off the floor of the five; it now ties Palette
at 4.6★). Every other feature, and the other four pages, byte-identical to run 2
(`pages_run3/`, diff-verified; the only consequential knock-on is the compare-tables'
worst-in-row `dim` annotation, which moves to Creative's 4.4★ as a factual consequence of
the rating change). Same protocol: temperature 0.1, all 7 models × 30 trials = 210 rows,
each tagged `page_version=v3` (`results/results_run3.csv`). **H1:** if rating was the
binding constraint, Canvas's share rises materially above 0.3%. **H2:** it stays low → the
bundle interpretation stands.

**Result: H1, decisively.** Canvas goes from 0.3% (3/1,041) to **26.7% (55/206)** — a
single feature flip makes the dead page competitive. Aggregates (run 3, n=206 completed of
210 planned; 4 dropped DeepSeek trials, counted not imputed):

| Page | Run 2 share | Run 3 share |
|---|---|---|
| Artistry Academy | 56.1% | 43.7% |
| Palette Masters | 40.0% | 26.7% |
| **Canvas & Color** | **0.3%** | **26.7%** |
| Brushstroke Studio | 2.3% | 1.9% |
| Creative Canvas | 1.3% | 1.0% |

Per model — the run-2 heuristic signatures predict exactly who moves:

| Model | Run 2 | Run 3 | Moved? |
|---|---|---|---|
| gpt-6-luna | Palette 57% | **Canvas 57%** | flipped outright |
| deepseek-flash | Artistry 83% | Artistry 54%, Canvas 42% (n=26) | split |
| grok-3-mini | Palette 72% | Palette 40%, Canvas 37% | split |
| mimo-v2.6-flash | Artistry 84% | Artistry 57%, Canvas 33% | moderate |
| gpt-4.1-mini | Artistry 54% | Artistry 50%, Canvas 20% | moderate |
| gemini-3.1-flash-lite | Palette 69% | Palette 80% | **unmoved** (price-first) |
| gemini-3.8-flash | Artistry 94% | Artistry 100% | **unmoved** (credentials-first) |

**Reading.** The price-leaning and heterogeneous models all moved toward Canvas the moment
its rating ceased to be the lowest — while the two extreme-signature models (credentials-
first gemini-3.8, price-first gemini-lite) did not move at all. This causally isolates
rating as the binding constraint for the middle models and confirms the run-2 bundle
reading: review volume alone never won; volume + a non-lowest rating wins 26.7% of trials.
Canvas's remaining deficits (no credentials, no certificate) still cost it Artistry's
credentials-first segment — so the five-way balance Run 2 was designed for remains
two-strong (Artistry/Palette) plus a rating-sensitive Canvas, not five equal pages.

**Cost & failures.** Run 3 cost $6.82 (4 dropped trials, all DeepSeek empty-response
flakes — the same failure mode seen in run 2, at a higher per-trial rate this run; a
second resume pass recovered 6 of the first 10). Grand total across all runs: $54.57 of
the $100 cap. Denominator policy as in §2: percentages over completed trials, drops
reported as counts out of planned (210 planned, 206 completed).



## 6. Limitations

1. **Cost:** total API spend across all runs was $54.57 (run 1: $13.59, run 2: $34.16,
   run 3: $6.82) on a $100 cap. Free-tier/low-tier providers only; premium models
   (GPT-5-class, Claude Opus-class) were out of scope by design.
2. **Model sample:** 7 low-tier chat models, one per provider family, each near-deterministic
   at temperature 0.1 — findings characterize this tier, not frontier models.
3. **One feature isolated at a time:** Run 3 isolates rating; Creative's near-death has no
   separating test (its gentle-pitch/installment bundle was not manipulated), so claims
   about *why* Creative stays low remain associational. The five-way balance we designed
   for did not emerge in either run.
4. **Fictional pages:** all courses, reviews, instructors and enrollments are synthetic;
   models may behave differently with real brands and real review text.
5. **Visual-layer confound (post-collection tweak, 2026-10-16):** after 444 rows were
   collected, the five pages received visual-layer-only updates (distinct layout concepts
   per page, image fixes). All controlled data values — price, rating, review counts,
   credentials text, badges, lessons, certificate, payment plans, social proof, compare
   tables — are byte-identical to what earlier rows saw. However, later models read
   different HTML markup/layout than earlier models did. Layout is visible to the models
   (they parse raw HTML), so pre/post blocks are separable by `timestamp` and noted as a
   covariate in the dataset README. §4.1 quantifies the effect: DeepSeek moved, two
   dual-version models did not.
6. **Lost trials** (counted, not imputed; completed-trials denominator per §2): run 2 lost
   9 of 1,050 (7 deepseek, 2 gemini-3.8-flash — transient API errors after final retry);
   run 3 lost 4 of 210 (all deepseek empty-response flakes — same failure mode, higher
   per-trial rate; a second resume pass recovered 6 of the first 10).

## 7. Next steps

- [x] Run 2 complete: all 7 models, 1,041 rows, $34.16 (2026-10-17)
- [x] **Run 3 complete (pre-registered single-variable test):** Canvas 4.3★ → 4.6★,
      210 planned / 206 completed, $6.82, `page_version=v3` — H1 confirmed (Canvas
      0.3% → 26.7%) (2026-10-23). See §5.
- [ ] Final report: assemble §1–§6 into the professor-facing write-up per the reviewed
      outline (`REPORT_OUTLINE.md`), folding Run 3 into the live `/report` page
- [ ] Regression: feature matrix → choice (conditional logit over all 5 alternatives
      per row, features from `pages/features.yaml`)
- [x] Demo video (recorded, embedded in `/report`)
- [ ] Optional robustness: Creative-bundle separating test (only if Victor asks — would
      exceed the small-run budget)

## Appendix: artifacts

- Data: `results/results.csv` (1,041 rows, run 2 complete 2026-10-17), `results/results_run3.csv`
  (210 planned / 206 completed, run 3, `page_version` column = v3, 2026-10-23),
  `results_backup/*.csv` (aborted runs 1, 2a–2c)
- Run-3 stimulus: `pages_run3/` (byte-identical to `pages/` except Canvas rating 4.3★→4.6★;
  diff-verified)
- Cost ledger: `results/cost_ledger.md` (run 1: $13.59; run 2: $34.16; run 3: $6.82; grand total $54.57)
- Figures: `src/figures.py` → `results/figures/*.png` (regenerated from 1,041 rows)
- Page QA screenshots: `results/qa/*_{settled,full}.png` (`scripts/qa_screenshots.py`, Playwright + system Chrome)
- Analyzer: `python -m src.analyze`
