# Dataset: AI Offer-Choice Experiment — Run 2 (`results.csv`)

**What is this?** 1,041 experimental trials in which a low-tier LLM was shown five fictional
oil-painting course landing pages (order shuffled each trial), asked to recommend exactly one,
then interviewed in the same conversation about *why*. One row = one complete trial.

**Design:** 7 models × 5 page-conditions × 30 replications = 1,050 planned.
Final: 1,041 rows (7 deepseek + 2 gemini-3.8-flash trials lost to transient API errors
after their final retry). Total API spend: **$34.16**.

**Models:** gpt-6-luna, gpt-4.1-mini (OpenAI) · gemini-3.1-flash-lite, gemini-3.8-flash (Google)
· grok-3-mini (xAI) · mimo-v2.6-flash (Xiaomi) · deepseek-flash (DeepSeek). All at temperature 0.1.

**Pages:** artistry_academy (elite credentials, $299, 4.8★) · palette_masters (best price,
$149, 4.6★) · canvas_color (most reviewed, 260, 4.3★, community-taught) · brushstroke_studio
(only certificate, $249, 4.5★) · creative_canvas (beginner-friendly, $179, 4.4★).
Controlled feature values live in [`pages/features.yaml`](../pages/features.yaml).

---

## Column dictionary (43 columns)

### Trial identity
| Column | Meaning |
|---|---|
| `timestamp` | UTC datetime the trial completed |
| `run_id` | Unique 12-char id for this row |
| `provider` | API provider: `openai`, `google`, `xai`, `xiaomi`, `deepseek` |
| `model` | Model name (see list above) |
| `tier` | Cost tier of the model (`low`) |

### Trial setup
| Column | Meaning |
|---|---|
| `condition_page` | The loop variable for this trial — which page the run counter was on. **Does not limit the choice**: the model always saw all 5 pages and could pick any of them |
| `run_number` | Replication counter, 1–30, per (model × condition_page) |
| `page_order` | Pipe-delimited (`\|`) shuffled presentation order of the 5 pages. Controls for position bias — include as a covariate or blocking factor |

### Outcome
| Column | Meaning |
|---|---|
| `which_page_won` | **The dependent variable**: filename of the recommended page |

### Exit interview — stated drivers (the model's self-explanation of ITS OWN choice)
Scale **1–5** (1 = not at all influential, 5 = very influential). These are *stated*
influences, measured after the choice was made — the core material for
revealed-vs-stated-preference analysis.

| Column | Question asked |
|---|---|
| `q1_price` | How much did the PRICE (transparency, value) influence your choice? |
| `q2_reviews` | How much did STUDENT REVIEWS/RATINGS influence your choice? |
| `q3_credentials` | How much did INSTRUCTOR CREDENTIALS influence your choice? |
| `q4_description` | How much did COURSE DESCRIPTION DETAIL influence your choice? |
| `q5_clarity` | How much did PAGE CLARITY/STRUCTURE influence your choice? |
| `q6_badge` | How much did the BADGE/POSITIONING LABEL (Best Seller, Editor's Choice…) influence your choice? |
| `q7_social_proof` | How much did SOCIAL PROOF (enrollment counts, students this month) influence your choice? |
| `q8_comparison` | How much did the COMPARISON TABLE (side-by-side features) influence your choice? |
| `q9_anchoring` | How much did PRICE ANCHORING (struck-through original price) influence your choice? |
| `q10_payment_plan` | How much did the PAYMENT PLAN (installments) influence your choice? |
| `q11_open` | Open text: any other factor that mattered? |

### Free-text reasoning
| Column | Meaning |
|---|---|
| `choice_reasoning` | The model's full justification from the choice phase (before the interview) |

### API accounting & telemetry (per trial: two calls — choice, then interview)
| Column | Meaning |
|---|---|
| `choice_input_tokens`, `choice_output_tokens` | Token usage of the choice call |
| `choice_cost_usd` | Dollar cost of the choice call |
| `latency_choice_s` | Wall-clock seconds, choice call |
| `interview_input_tokens`, `interview_output_tokens` | Token usage of the interview call (multi-turn, same conversation, so input ≈ prompt + full choice exchange) |
| `interview_cost_usd` | Dollar cost of the interview call |
| `latency_interview_s` | Wall-clock seconds, interview call |
| `total_row_cost_usd` | `choice_cost_usd + interview_cost_usd` |
| `choice_attempts`, `interview_attempts` | How many tries until the response parsed as valid JSON (1 = first try). High values flag unreliable responses |

### Winner's feature profile (convenience join — attributes of the CHOSEN page)
These are the controlled features of `which_page_won`, joined from `features.yaml`, so quick
analyses ("what do winners look like?") need no join. **They describe the winner only** —
for a proper conditional/multinomial logit you need all five alternatives' features, which
come from `pages/features.yaml` keyed by the filenames in `page_order` / `which_page_won`.

| Column | Meaning (possible values) |
|---|---|
| `win_name` | Full display name of the chosen course |
| `win_category` | `Art` |
| `win_price_display` | Price shown or hidden (`shown` / `hidden`) |
| `win_price_value` | Numeric price in USD |
| `win_reviews_level` | Ordinal review volume (`few` / `many`…) |
| `win_reviews_count` | Numeric review count |
| `win_reviews_rating` | Star rating (4.3–4.8 in this run) |
| `win_credentials_present` | Elite credentials shown? (`true` / `false`) |
| `win_credentials_detail` | `detailed` / `minimal` / `none` |
| `win_description_detail` | `detailed` / `short` |
| `win_structure_level` | `structured` / `unstructured` |

---

## Headline results (Run 2 final)

| Page | Wins | Share |
|---|---|---|
| Artistry Academy | 584 | 56.1% |
| Palette Masters | 416 | 40.0% |
| Brushstroke Studio | 24 | 2.3% |
| Creative Canvas | 14 | 1.3% |
| Canvas & Color | 3 | 0.3% |

Per-model heuristics (why aggregate balance exists at all — each model is near-deterministic):
gemini-3.8-flash → Artistry 94% · mimo → Artistry 84% · deepseek → Artistry 83% ·
gpt-6-luna → Palette-leaning split · gemini-3.1-flash-lite → Palette 69% ·
grok-3-mini → Palette 72% · gpt-4.1-mini → heterogeneous (the only model to pick Canvas).

## Known caveats

1. **Visual-layer confound:** after the first 444 rows, the pages received visual-only
   updates (layouts/images; all controlled data byte-identical). Models ran after that point
   read different HTML markup — pre/post blocks are separable by `timestamp` (2026-10-17 ≈ post).
2. **9 missing trials** (7 deepseek, 2 gemini-3.8-flash) — transient API failures, not budget.
3. **Near-determinism:** temperature 0.1 → within-model variance ≈ 0; all cross-page
   variance comes from between-model heuristic differences.
