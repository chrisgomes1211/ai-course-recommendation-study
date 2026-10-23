# API cost ledger

## Run 1 (archived: `results_backup/results_run1.csv`)

| Item | Value |
|---|---|
| Rows | 1,192 |
| Choice calls | $13.28 |
| Interview calls | $0.31 (separate tiny calls — the context bug) |
| Total | **$13.59** |
| Outcome | Artistry Academy 96.6% — ceiling effect, data unusable |

## Run 2 (current: `results/results.csv`)

Design: 7 models × 5 pages × 30 runs = 1,050 rows.
Interview is a multi-turn follow-up in the same conversation (~57k input tokens),
so estimator now charges full prompt size per interview call.

| Item | Value |
|---|---|
| Estimator total (pre-run) | $24.47 |
| Budget cap | $100.00 |

### Run-2 attempts (all archived under `results_backup/`)

| Attempt | Rows | Cost | Outcome |
|---|---|---|---|
| 2a (`results_run2a_partial.csv`) | 180 | $2.27 | Canvas 98.8% — review-count knockout, aborted |
| 2b (`results_run2b_partial.csv`) | 106 | $1.24 | gpt-6-luna 100% Canvas again — aborted, Canvas demoted (260 reviews @ 4.3★, no credentials) |
| 2c + 2c-nonopenai + 2e2 (`results.csv`, live) | 444 by 2026-10-16 | $13.20 | Ceiling broken mid-run; OpenAI + Google + xAI credits exhausted |
| 2e3 deepseek retry | +54 (498 total) | $1.01 | 54 of 79 empty-response failures recovered |
| 2f (final: luna, 4.1-mini, gemini-3.8, grok, deepseek tail) | 1,041 total | $10.55 | **Run 2 complete 2026-10-17**: Artistry 56.1% / Palette 40.0% / Brushstroke 2.3% / Creative 1.3% / Canvas 0.3% — no page ≥60%, ceiling effect resolved |

| Item | Value |
|---|---|
| **Run-2 final spend (2a → 2f)** | **$34.16** |
| **Grand total (run 1 + run 2 + smoke tests)** | **~$47.75** |
| Budget cap | $100.00 (headroom ~$52) |
| Per-row average (run 2) | ~$0.033/row (2 calls/row: choice + exit interview) |
| Rows collected | 1,041 / 1,050 planned (9 lost to transient API errors: 7 deepseek, 2 gemini-3.8-flash) |

## Provider billing statements (screenshots 2026-10-20, published on /report §07)

Provider-side dashboards — the actual charges behind the computed ledger above:

| Provider | Dashboard figure | Window |
|---|---|---|
| Google Gemini API | €17.32 | Oct 1–19, 2026 |
| xAI (Grok) | $17.03 credits usage · 2,453 requests · $8.12 remaining | 30 days to Oct 20, 2026 |
| OpenAI | $13.53 paid invoices ($7.38 Oct 17 + $6.15 Jul 26) | as dated |
| DeepSeek | $2.12 total cost · $0.34 balance | account to date |
| Anthropic (Claude) | $6.15 credit grant (expires Oct 7, 2027) | granted Oct 6, 2026 |

Screenshots: `static/billing/*.png`. Statement windows are wider than the runs and include free
credit grants, so they are receipts rather than a re-computation — the computed **$47.75** total
above remains the experiment's accounting. Everything stays well under the $100 cap.

## Run 3 — rating manipulation (2026-10-23)

Pre-registered single-variable follow-up: Canvas rating 4.3★ → 4.6★, all other features and
the other four pages byte-identical to v2 (`pages_run3/`, diff-verified). Temp 0.1, all 7
models × 30 = 210 planned; `page_version=v3` column in `results/results_run3.csv`. H1 (rating
was the binding constraint) confirmed.

| Item | Value |
|---|---|
| Rows collected | 206 / 210 planned (4 lost, all deepseek empty-response flakes) |
| Run-3 spend | **$6.82** |
| Headline | Canvas 0.3% (3/1,041) → **26.7% (55/206)** |
| Second resume pass | recovered 6 of the first 10 dropped deepseek trials |

**Grand total (run 1 + run 2 + run 3) = $54.57** on the $100 cap (headroom ~$45).
