# Final report — outline (for Victor's review)

**Report working title:** *What Drives an LLM's Choice? A Controlled Offer-Choice Experiment*
**Data:** `results/results.csv` — 1,041 trials · 7 models · 5 pages · temperature 0.1 · $47.75 total spend

---

## 1. Abstract (~250 words)
- Question: how do low-tier LLMs choose between five controlled course offers, and what drives the pick?
- Design in one line: 7 models × 5 pages shown together, shuffled, single choice + exit survey, 1,041 trials.
- Headline: no page ≥60%; aggregate balance arises from **models disagreeing** — credentials-first vs price-first.
- Honest caveats up front: page-version change mid-run (sensitivity analysis in §5.3), post-hoc survey.

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
- **v1 (trials of 16 Oct 2026):** original run-2 layout.
- **v2 (trials of 17 Oct 2026 → frozen):** Canvas demoted to *most-reviewed but lowest-rated (4.3★), community-taught, no credentials*; other pages held at their v1 values.
- Which models saw which version:
  | Model | Version seen |
  |---|---|
  | gemini-3.1-flash-lite, mimo-v2.6-flash | v1 only (150 each) |
  | gpt-4.1-mini, grok-3-mini | v2 only (150 each) |
  | deepseek-flash, gpt-6-luna, gemini-3.8-flash | **both** (71/72, 32/118, 41/107) |
- From 17 Oct onward pages are **frozen**; Run 3 is the only sanctioned change (§7).

### 4.3 Procedure
- All five pages as raw HTML in one prompt, order shuffled per trial; choose exactly one + justify.
- Exit survey (11 items, 1–5) in the **same conversation, after** the choice — explicitly described as post-choice self-report.
- **Temperature 0.1** for every provider (stated because "near-deterministic" depends on it); max output tokens 2,000; ≤3 choice attempts, ≤5 interview attempts.
- 30 trials per model → 1,050 planned.

### 4.4 Models
- Table: 7 low-tier models, one per provider (OpenAI, Google ×2, xAI, DeepSeek, Xiaomi ×2), pricing, context.

### 4.5 Failures, retries and dropped trials (feedback point 4)
- Failure sources from run logs: grok — xAI credits exhausted (150 failed attempts, **all recovered** after top-up); deepseek — ~110 empty/invalid responses ("No JSON with 'choice' key"); gpt-6-luna — 1 credit exhaustion; mimo — rate/blank retries; gemini-3.8-flash — 2 × "Deadline Exceeded".
- Retry policy: automatic re-run (up to 3 choice / 5 interview attempts) — 87 choice calls and 24 interview calls succeeded only after retries.
- **9 trials dropped** (never completed): 7 deepseek-flash, 2 gemini-3.8-flash → 1,041 / 1,050 = 99.1% completion.
- Denominators = completed trials per model (143–150); sensitivity: even if all 7 dropped deepseek trials were Palette picks, deepseek's Palette share moves only 17.5% → 21.5% — conclusions unchanged.

### 4.6 Cost accounting
- **$47.75** total (run 1 $13.59 + run 2 $34.16), token-priced, cap $100 — the cost-log figure is authoritative everywhere (supersedes the $50–60 figure quoted verbally in the demo video).

## 5. Results
### 5.1 Descriptives — did the redesign work?
- Run 2 shares: Artistry 56.1% (584) · Palette 40.0% (416) · Brushstroke 2.3% (24) · Creative 1.3% (14) · Canvas 0.3% (3).
- No page ≥60% dominance line; run-1 ceiling (96.6%) resolved.

### 5.2 Per-model choice distributions
- Table + stacked figure: credentials-first (gemini-3.8, mimo, deepseek) vs price-first (grok, gemini-lite, luna) vs heterogeneous (gpt-4.1-mini, all five pages picked).
- Near-determinism at temperature 0.1: within a version, no model approaches uniform 20% across pages.

### 5.3 Version sensitivity — before vs after the page change (feedback point 1)
| Model | 16 Oct (v1) | 17 Oct (v2) | Shift |
|---|---|---|---|
| deepseek-flash | n=71: A 94% · P 6% | n=72: A 71% · P 29% | **−23pp Artistry** |
| gpt-6-luna | n=32: P 56% · A 44% | n=118: P 57% · A 43% | stable (±1pp) |
| gemini-3.8-flash | n=41: A 95% · P 5% | n=107: A 93% · P 7% | stable (2pp) |
- Interpretation: two of three dual-version models hold their signature; deepseek does shift with the pages → **part of the between-model difference may be stimulus version, not model identity**; the claim "all variance is between models" is qualified accordingly. Single-version models (lite, mimo, 4.1-mini, grok) are version-pooled with the caveat noted.

### 5.4 Stated vs revealed choice (feedback point 2 — worded as consistency, not cause)
- Exit survey comes **after** the choice, same conversation → answers may rationalise a decision already made.
- Report as **consistency/association**: Artistry choosers rate credentials 4.99 & price 3.30; Palette choosers rate price 5.00 & credentials 2.51 — self-reports align with behaviour; they **cannot establish** that the rated factor caused the choice.

## 6. Discussion
### 6.1 Main finding, properly hedged
- Aggregate balance from heuristic disagreement between models; qualified by §5.3 version sensitivity.
### 6.2 What models heeded — and what they ignored
- Likert drivers (Description 4.61 ≈ Reviews 4.56 > … > Anchoring 2.00); badges/anchors/payment plans barely register.
### 6.3 Review volume: a bundle, not an isolated driver (feedback point 3)
- Canvas = most reviews **+** lowest rating **+** community teaching — the 0.3% result is about the bundle; no claim that review volume per se is powerless.
- Run 3 (§7) isolates rating as the single varying factor.

## 7. Run 3 — pre-registered extension (run small, alongside writing)
- **One change only:** Canvas rating 4.3★ → 4.6★; all other features and all four other pages frozen (files byte-identical to v2).
- Same protocol (temp 0.1, 30/model, shuffled), rows tagged with an explicit `page_version` column (v2 baseline / v3-run3) so version is always traceable in the CSV.
- Hypotheses: H1 — if review volume matters once rating is equalised, Canvas share rises materially above 0.3%; H2 — if the bundle story is right, Canvas stays low.
- Kept small (target ≈ 7 × 30 = 210 trials, ~$7) and reported as an addendum if it completes before submission.

## 8. Threats to validity & limitations
- Page-version confound (mitigated: declared, sensitivity-analysed, pages frozen).
- Post-choice survey design (mitigated: association language only).
- Low-tier models only, temperature 0.1 → findings characterise this tier; between-model inference, not frontier models.
- Fictional courses / synthetic reviews; single-item-per-page bundling (can't fully separate features within a page — addressed partly by Run 3).
- 9 dropped trials (0.9%) with sensitivity bound.
- Budget-bounded sample (~$47.75 of $100 cap).

## 9. Conclusion
- Answer to RQ; the redesign story as a methodological lesson (ceiling effects in stimulus design); future work: Run 3 result, human baseline arm, frontier models.

## 10. Appendices
- A: full feature manifest (`features.yaml`). B: model × page win table. C: failure/retry log summary. D: cost ledger + provider statements. E: data dictionary (`results/README.md`). F: demo video link + live site URL.
