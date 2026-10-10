# Model Price Comparison — Final Dataset Selection

Prepared 9 Oct 2026, updated 10 Oct 2026. Prices per 1M tokens (USD), verified Oct 2026 from provider pricing pages.

## Why these 6 models

Supervisor guidance: low-tier models only, ~2 per company, max 8, compare price per API call first.
Final set (10 Oct): **6 low-tier models** across **4 companies** (OpenAI ×2, Google ×2, xAI ×1, Xiaomi ×1).

Anthropic (claude-haiku-4-5) was dropped on 10 Oct: it was a 10× price outlier versus every other
low-tier model, and the account ran out of credit mid-run. Its 19 completed rows remain in the
dataset as bonus data. Xiaomi MiMo (mimo-v2.6-flash) was added to keep 6 models and 4 companies.

## Price per API call

Every run = 2 API calls (choice + exit interview), prompted with the full 5-page set.

Measured token usage (from pilot rows in `results_backup/`):

| Call | Input tokens | Output tokens |
|---|---|---|
| Choice | 41,771 | ~839 |
| Interview | 252 | ~139 |
| **Per run** | **42,023** | **978** |

| Model | Company | $/1M in | $/1M out | $/run | $/1,000 runs |
|---|---|---|---|---|---|
| gpt-6-luna | OpenAI | 0.10 | 0.50 | $0.0047 | $4.70 |
| gpt-4.1-mini | OpenAI | 0.15 | 0.60 | $0.0069 | $6.90 |
| gemini-3.1-flash-lite | Google | 0.25 | 1.50 | $0.0120 | $12.00 |
| gemini-3.8-flash | Google | 0.75 | 3.75 | $0.0352 | $35.20 |
| grok-3-mini | xAI | 0.30 | 1.50 | $0.0141 | $14.10 |
| mimo-v2.6-flash | Xiaomi | 0.14 | 0.28 | $0.0062 | $6.20 |

Per-run cost = (42,023 × input_price + 978 × output_price) / 1,000,000.

## Dataset cost projection

Design: 6 models × 5 course pages × 34 runs = **1,020 rows** (170 rows per model).

| Model | Rows | Est. cost |
|---|---|---|
| gpt-6-luna | 170 | $0.80 |
| gpt-4.1-mini | 170 | $1.17 |
| gemini-3.1-flash-lite | 170 | $2.04 |
| gemini-3.8-flash | 170 | $5.98 |
| grok-3-mini | 170 | $2.40 |
| mimo-v2.6-flash | 170 | $1.05 |
| **Total** | **1,020** | **≈ $13.4** |

Budget cap: $100.00 → projected spend uses ~13% of cap.
(Plus 19 bonus rows from claude-haiku-4-5 collected before the Anthropic account ran out of credit.)

## Considered but excluded (low tier only)

| Model | Company | Reason excluded |
|---|---|---|
| gpt-4o-mini | OpenAI | Same price as gpt-4.1-mini; would make OpenAI 3 of 6 |
| claude-sonnet-4-6 | Anthropic | **High tier** ($0.141/run) — excluded per low-tier-only direction |
| gpt-5.6-terra | OpenAI | **High tier** ($0.095/run) — excluded per low-tier-only direction |
| grok-3 | xAI | **High tier** ($0.141/run) — excluded per low-tier-only direction |
| gemini-3.5-flash | Google | High tier ($0.072/run) |
| claude-haiku-4-5 | Anthropic | Dropped 10 Oct: 10× price outlier + account out of credit; 19 rows kept |

Anthropic ships only one low-tier model (Haiku), and it proved both the priciest option and
operationally unreliable, so the final set uses Xiaomi's mimo-v2.6-flash instead — the second
cheapest model in the comparison. Row count exceeds 1,000 at 34 runs per condition.
