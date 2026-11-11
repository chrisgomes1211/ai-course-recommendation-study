# 5. Results

All figures below are computed from the completed trial records (`results/results.csv`,
1,041 rows; `results/results_run3.csv`, 206 rows) under the denominator policy of §4.5:
percentages use completed trials, dropped trials are reported as counts out of the planned
total, and every percentage is accompanied by its count.

## 5.1 Descriptives — did the redesign work?

Run 1 produced a ceiling effect (Artistry Academy won 96.6% of trials) because its winning
page stacked every top driver at once; runs 2a and 2b then over-corrected in the opposite
direction (a review-count knockout, then a Canvas page that won nearly everything). Both were
aborted at the design stage (§4.6). The question for the completed Run 2 is therefore whether
the rebalanced design finally produced the intended five-way spread without re-introducing
dominance.

**It removed dominance but did not produce five-way balance.** Across all 1,041 Run-2 trials:

| Page | Wins | Share |
|---|---|---|
| Artistry Academy | 584 | 56.1% |
| Palette Masters | 416 | 40.0% |
| Brushstroke Studio | 24 | 2.3% |
| Creative Canvas | 14 | 1.3% |
| Canvas & Color | 3 | 0.3% |

No page reaches the pre-registered 60% dominance threshold — the run-1 ceiling (96.6%) is
resolved — but the distribution is two-strong rather than flat: Artistry and Palette together
take 96.1% of all picks, while Canvas and Creative together take 1.6%.

Of the 1,041 trials, **444 ran on the v1 pages (16 Oct) and 597 on the final frozen v2 pages
(17 Oct)** (§4.2). Canvas did not win a single v1 trial (0/444), and because v1 → v2 changed
only the visual layer — the controlled values being byte-identical across the boundary — the
v1 and v2 trials differ in markup, not in the data values the models reasoned about. All
like-for-like comparisons against Run 3 use the **597 final-page trials**, which are
additionally convenient because they consist exclusively of the five models that also ran in
Run 3 (§5.5).

## 5.2 Per-model choice distributions

| Model | N | Choice distribution | Signature |
|---|---|---|---|
| gemini-3.8-flash | 148 | A 93.9% (139) · P 6.1% (9) | credentials-first |
| mimo-v2.6-flash | 150 | A 84.0% (126) · P 16.0% (24) | credentials-first |
| deepseek-flash | 143 | A 82.5% (118) · P 17.5% (25) | credentials-first |
| grok-3-mini | 150 | P 72.0% (108) · A 18.7% (28) · Cr 8.7% (13) · B 0.7% (1) | price-first |
| gemini-3.1-flash-lite | 150 | P 69.3% (104) · A 18.0% (27) · B 12.7% (19) | price-first |
| gpt-6-luna | 150 | P 56.7% (85) · A 43.3% (65) | price-leaning, genuinely split |
| gpt-4.1-mini | 150 | A 54.0% (81) · P 40.7% (61) · B 2.7% (4) · C 2.0% (3) · Cr 0.7% (1) | heterogeneous (all five pages) |

Three observations:

1. **The aggregate balance is between-model, not within-model.** At temperature 0.1 no model
   is anywhere near uniform over the five offers; each has a dominant pick between 54% and
   94%. The pooled spread across the five pages — two-strong overall, as §5.1 shows — is
   produced by models disagreeing
   with *each other* — credentials-first models and price-first models cancelling out — not
   by any individual model weighing options evenly.
2. **Three heuristic signatures recur:** credentials-first (gemini-3.8-flash, mimo,
   deepseek — all anchor on Artistry's Yale MFA/MoMA profile), price-first (grok,
   gemini-lite, luna — anchor on Palette's $149), and one heterogeneous model
   (gpt-4.1-mini — the only model to pick all five pages, and the only model whose Run-2
   Canvas picks are non-zero).
3. **The two weak pages fail for different reasons and are rescued by different models.**
   Brushstroke's weakness (fewest reviews, second-highest price) is mostly overlooked by
   gemini-lite (19 of 24 picks; gpt-4.1-mini 4, grok-3-mini 1); Creative's gentle-pitch/
   installment bundle is taken almost only by grok (13 of 14; gpt-4.1-mini 1). Canvas — most reviews but lowest rating, no credentials, no certificate —
   is picked by exactly one model, once every ~50 trials (gpt-4.1-mini, 3/150).

## 5.3 Version sensitivity — the DeepSeek before/after

Three models ran on both page versions inside Run 2, which makes them a natural check on
whether the visual-layer change (§4.2) moved choices. Their picks, before (v1, 16 Oct) and
after (v2, 17 Oct):

| Model | v1 picks | v2 picks | Shift |
|---|---|---|---|
| deepseek-flash | n=71: A 67 (94%) · P 4 (6%) | n=72: A 51 (71%) · P 21 (29%) | **−23pp Artistry** |
| gpt-6-luna | n=32: P 18 (56%) · A 14 (44%) | n=118: P 67 (57%) · A 51 (43%) | stable (±1pp) |
| gemini-3.8-flash | n=41: A 39 (95%) · P 2 (5%) | n=107: A 100 (93%) · P 7 (7%) | stable (2pp) |

Two of the three dual-version models hold their signature across the change. **DeepSeek does
not:** its Artistry share falls 23 percentage points and its Palette share roughly quintuples,
even though every controlled value it could reason about is byte-identical between the two
blocks. The most economical reading is that DeepSeek's choice is sensitive to the *presentation*
layer (layout, imagery, markup structure) that the v2 redesign altered — a stimulus-version
effect on a model that was otherwise one of the most stable in the pool.

The consequences are carried into every later claim: (i) part of the between-model variance
observed in §5.2 is stimulus version, not model identity, so "all variance is between models"
is stated only with this qualification; (ii) single-version models (gemini-lite, mimo — v1
only; gpt-4.1-mini, grok — v2 only) are version-pooled in §5.2 with that caveat attached;
(iii) all between-run comparisons in §5.5 are restricted to the frozen v2/v3 pages; and
(iv) from 17 Oct onward the pages are frozen, with Run 3 as the only sanctioned change.

## 5.4 Stated vs revealed choice

The exit survey (§4.3) is administered **after** the choice, in the same conversation, so its
answers are post-choice self-report: they may simply rationalise a decision the model has
already made. It is therefore analysed for **consistency between stated and revealed
preference**, never as evidence that a rated factor caused the choice.

**Consistency is high.** Choosing models' survey ratings track their choices closely:

| Choosers of… | N | Rate highest | Rate lowest |
|---|---|---|---|
| Artistry Academy | 584 | Credentials 4.99 · Reviews 4.94 | Price 3.30 |
| Palette Masters | 416 | Price 5.00 | Credentials 2.51 |
| Brushstroke Studio | 24 | Credentials 5.00 · Comparison 4.88 | Reviews 3.46 |
| Creative Canvas | 14 | Clarity 5.00 · Price 5.00 | — (Payment plan 4.21) |

Across all 1,041 trials, the stated-importance ordering is **Description 4.61 ≈ Reviews 4.56
> Clarity 4.41 > Price 4.03 ≈ Comparison 3.99 ≈ Credentials 3.96 > Social proof 3.10 >
Badge 2.61 > Payment plan 2.24 > Anchoring 2.00.**

Two readings follow. First, what models *say* and what models *do* line up: the credentials-
first models rate credentials highest, the price-first group rates price highest, and the
never-chosen levers (badges, strike-through anchoring, installments) are also the levers
models rate as least influential. Second, the classic conversion-optimisation toolkit —
positioning badges, price anchoring, installment plans — barely registers as a stated driver
for any model in this tier, while description detail and review counts dominate. Because the
survey is post-choice, both readings are reported as association/consistency; the design
cannot establish that the rated factor *caused* the pick.

## 5.5 Run 3 — rating as the single-variable test

**Design.** Run 3 changes exactly one feature: Canvas & Color's star rating 4.3★ → 4.6★
(raising it off the floor of the five; it now ties Palette at 4.6★). Every other feature, and
the other four pages, are byte-identical to the frozen v2 pages (`pages_run3/`, diff-verified;
§4.2). Protocol identical: temperature 0.1, all 7 models × 30 = 210 planned, **206 completed**
(4 dropped, §4.5), rows tagged `page_version=v3`.

- **H1:** if rating was the binding constraint in Run 2, Canvas's share rises materially above
  its baseline.
- **H2:** it stays low → the bundle reading of §5.1–5.2 stands.

**Headline — model set held constant.** The cleanest comparison restricts to the five models
that ran in both runs on the same (v2/v3) pages — gpt-6-luna, deepseek-flash, grok-3-mini,
gpt-4.1-mini, gemini-3.8-flash. Their Run-2 final-page trials are exactly the 597, and their
Run-3 trials are 146 of the 206:

| | Run 2 (v2 pages) | Run 3 (v3 pages) | Shift |
|---|---|---|---|
| **Canvas share, five models in both runs** | **3 / 597 (0.5%)** | **45 / 146 (30.8%)** | **+30.3pp** |

The two remaining models — mimo-v2.6-flash and gemini-3.1-flash-lite — ran Run 2 on the v1
pages and therefore have no same-pages baseline; their Run-3 results are reported separately:
**Canvas 10 of 60 (16.7%)** (mimo 10/30, gemini-lite 0/30). Their comparison crosses the
visual redesign *and* the rating change; because v1 → v2 altered only the visual layer, the
data-value confound for them is nil, but the presentation-layer confound (which §5.3 showed
can move a model) remains — so they are kept out of the headline and declared here.

Pooled across all seven models, Run 3 gives Canvas **55 of 206 (26.7%)**; the pooled figure
is reported wherever the whole run is described, with the two groups identifiable.

**Aggregate movement (all 206 Run-3 trials):**

| Page | Run 2 · final pages (n=597) | Run 3 (n=206) | Shift |
|---|---|---|---|
| Artistry Academy | 311 (52.1%) | 90 (43.7%) | −8.4pp |
| Palette Masters | 264 (44.2%) | 55 (26.7%) | −17.5pp |
| **Canvas & Color** | **3 (0.5%)** | **55 (26.7%)** | **+26.2pp** |
| Brushstroke Studio | 5 (0.8%) | 4 (1.9%) | +1.1pp |
| Creative Canvas | 14 (2.3%) | 2 (1.0%) | −1.3pp |

**Per model — Run 2 Canvas (pages seen) vs Run 3 counts:**

| Model | Run 2 · Canvas | Run 3 · counts | Reading |
|---|---|---|---|
| gpt-6-luna | 0/118 (v2) | Canvas 17/30 (57%) | flipped outright |
| deepseek-flash | 0/72 (v2) | Artistry 14/26 (54%) · Canvas 11/26 (42%) | split |
| grok-3-mini | 0/150 (v2) | Palette 12/30 (40%) · Canvas 11/30 (37%) | split |
| mimo-v2.6-flash \* | 0/150 (v1) | Artistry 17/30 (57%) · Canvas 10/30 (33%) | moderate |
| gpt-4.1-mini | 3/150 (v2) | Artistry 15/30 (50%) · Canvas 6/30 (20%) | moderate |
| gemini-3.1-flash-lite \* | 0/150 (v1) | Palette 24/30 (80%) | unmoved |
| gemini-3.8-flash | 0/107 (v2) | Artistry 30/30 (100%) | unmoved |

\* Ran Run 2 on the v1 pages — no same-pages baseline; confound discussed above and in §7.

**Reading — support for H1.** The movement is structured exactly as the Run-2 signatures
predict. Every price-leaning or heterogeneous model shifted toward Canvas the moment its
rating ceased to be the lowest of the five: gpt-6-luna flipped outright (0/118 → 17/30),
deepseek and grok split their votes between their original anchor and Canvas, and
gpt-4.1-mini — already the only model picking Canvas in Run 2 — doubled its share. The two
extreme-signature models did not move at all: gemini-3.8-flash chose Artistry 30/30, and
gemini-lite stayed with price-first Palette (24/30). For the five like-for-like models this
is **Canvas 3/597 (0.5%) → 45/146 (30.8%)** from a single feature change — which supports
H1: rating was the binding constraint for the middle of the field.

The same result answers the bundle question of §5.1–5.2 (feedback point 3): review volume
alone never won a trial for any model (Canvas's 260 reviews sat with the lowest rating and
never won), but volume *plus* a non-lowest rating wins 30.8% for the like-for-like five —
second place in the aggregate, not first. Volume was never powerless; it was masked by the
rating floor. Canvas's remaining deficits (no credentials, no certificate) still cost it the
credentials-first segment, which is why Artistry still leads Run 3 overall (43.7%) and the
field reads **Artistry first, Palette and Canvas tied for second (26.7% each pooled)** — not
a takeover, and still not five equal pages.

**Evidential strength.** With ≈30 trials per model (26 for deepseek), these are tendencies,
not precise effect estimates; counts are given beside every percentage and the claim is
worded throughout as *support for H1*, never confirmation or causal isolation.

**Cost and failures.** Run 3 cost **$6.82** for the 206 completed trials; the 4 dropped
trials were all DeepSeek empty-response flakes (the same failure mode as Run 2, at a higher
per-trial rate — a second resume pass recovered 6 of the first 10), counted out of 210
planned and never imputed (§4.5).

---

# 6. Discussion

## 6.1 Main finding, properly hedged

Seven low-tier models, shown the same five controlled offers, do not behave like a single
"LLM buyer". They behave like a small population of consistent heuristic shoppers: within a
model, choices are near-deterministic at temperature 0.1; between models, choices disagree
sharply — credentials-first (three models), price-first (three models), one heterogeneous
generalist. The aggregate therefore shows no dominance (no page ≥60%), but that balance is a
*census of disagreeing models*, not evidence of per-model uncertainty. Two qualifications are
declared rather than smoothed away: stimulus version can move a model (DeepSeek's 23pp shift,
§5.3), so part of the between-model spread reflects which page version each model saw; and
≈30 trials per model in Run 3 means all run-3 statements are tendencies at the level of
counts, not point estimates.

## 6.2 What models heeded — and what they ignored

The stated-driver ordering (§5.4) and the choices point the same way. Models heeded
**description detail (4.61)**, **review counts (4.56)**, clarity of structure (4.41), and —
split by signature — either price (4.03) or credentials (3.96). The classic conversion-
optimisation levers barely registered: badge 2.61, installment plan 2.24, price anchoring
2.00 — and the choices confirm the irrelevance, since no page won by stacking them. For this
model tier, a positioning badge or a strike-through "was $349" is close to invisible; a
concrete, legible price and a coherent credential or review story is not. The consistency
between the two (stated ≈ revealed) is itself a result: unlike human survey respondents,
these models' post-hoc explanations are not obviously confabulated — though the post-choice
design means the agreement is reported as consistency, never as causal evidence.

## 6.3 Review volume: a bundle, not an isolated driver

Run 2's starkest number — Canvas 3 of 1,041 (0.3%), despite carrying the most reviews (260)
— is a statement about **a bundle**: most reviews arriving together with the *lowest* rating
of the five, no credentials, no certificate, community teaching. Run 3 was designed to cut
that bundle apart by moving exactly one strand: rating 4.3★ → 4.6★, everything else
byte-identical. For the five models present in both runs the effect is 0.5% → 30.8% (3/597 →
45/146). The reading that survives both runs is therefore: **review volume is a strong signal
that was masked by a rating floor, not a weak signal**; volume plus a non-lowest rating is
worth second place; and rating was the binding constraint for the middle of the field, while
credentials still anchor first place for the credentials-first segment. H1 is supported, not
confirmed — one rating change on one page, ~30 trials per model — and the two models without
a same-pages baseline contribute 10 of 60 Canvas picks that are kept separate from the
headline. What Run 3 cannot do is separate the *within-bundle* roles of credentials and
certificate for Canvas (they were not manipulated), which is why claims about why Canvas
still finishes behind Artistry remain associational.
