# Configuration & Replication Manual

**Companion to** *What Drives an LLM's Choice? A Controlled Offer-Choice Experiment* (FULL_DRAFT.md).
This manual carries the report's supporting operational data — the failure/retry log, the cost ledger, and the data dictionary — plus the repository map and step-by-step rerun instructions, so the report itself stays within the handbook word limit.

---

## Part 1 — Repository map

| Path | What it is |
|---|---|
| `config.yaml` | Model set (7 low-tier models, 5 providers), `runs_per_condition`, `$100` budget cap, per-1M pricing per model, token assumptions for the cost estimator |
| `pages/` | The five frozen Run-2 stimuli (`artistry_academy.html`, `palette_masters.html`, `canvas_color.html`, `brushstroke_studio.html`, `creative_canvas.html`) + `features.yaml` (the 11 × 5 controlled-feature manifest) |
| `pages_run3/` | Run-3 stimuli: byte-identical to `pages/` except Canvas's star rating 4.3★ → 4.6★ (diff-verified) |
| `prompts/` | `buying_question.txt` (choice phase) and `exit_interview.txt` (post-choice survey) |
| `src/run_experiment.py` | Main loop: sequential, resumable, budget-aware; assembles each prompt, enforces retries, appends one CSV row per completed trial |
| `src/models.py` | Provider adapters; sets temperature 0.1 per provider |
| `src/analyze.py` | Computes the tables/figures used in the report from the CSVs |
| `src/figures.py` | Regenerates the report's SVG figures into `figures/` |
| `src/estimate_cost.py` | Pre-run cost estimate from measured pilot token counts × `config.yaml` rates |
| `app.py` | Flask control app (start/stop/resume runs, budget display) |
| `results/results.csv` | Run 2 trial data — 1,041 completed rows |
| `results/results_run3.csv` | Run 3 trial data — 206 completed rows (adds `page_version`) |
| `results/cost_ledger.md` | Authoritative spend ledger — **$54.57 total of the $100 cap** |
| `results/README.md` | Full column-level data documentation |
| `templates/report.html` | Live report page — renders every table directly from the CSVs (https://ai-course-recommendation-study.onrender.com/report) |
| `figures/` | `architecture.svg` (Figure 1), `share_shift.svg` (Figure 2) |
| `FULL_DRAFT.md` | The report (sections 1–9 + Appendices A–C) |

---

## Part 2 — Configuration reference

### `config.yaml`

- **`models:`** — the seven models as run, with provider and tier. The set is fixed by supervisor direction (9 Oct 2026: *low tier only, ~2 per company*): OpenAI ×2 (gpt-6-luna, gpt-4.1-mini), Google ×2 (gemini-3.1-flash-lite, gemini-3.8-flash), xAI (grok-3-mini), Xiaomi (mimo-v2.6-flash), DeepSeek (deepseek-flash). Anthropic was dropped 10 Oct 2026 (only low-tier option was a ~10× price outlier; account out of credit).
- **`runs_per_condition: 30`** — repetitions per model × condition cell. Run 2 planned 7 × 5 × 30 = 1,050 rows; Run 3 used 7 × 5 × 6 = 210.
- **`budget_cap_usd: 100.0`** — hard cap enforced by the runner; actual spend $54.57.
- **`pricing:`** — per-1M input/output rates per model, verified October 2026 (used for cost accounting and the estimator). Re-verify against current provider pricing before any rerun.
- **`avg_prompt_tokens` / `avg_completion_tokens_*`** — measured pilot averages feeding the pre-run estimator.

### `pages/features.yaml` — the controlled-feature manifest

Eleven features × five pages with declared tradeoffs: price level and display (incl. anchoring, installments), review count, star rating, instructor credentials, description detail, page structure, completion certificate, positioning badge, enrolment social proof, and a five-way comparison table. Design rule: **each page gets exactly one strength and one honest tradeoff**; ratings compressed to 4.3–4.8★, review counts to a 180–260 ladder. This manifest is the single source of truth for every value shown to models.

### Page versions (declared)

| Version | Date | Rows | Change |
|---|---|---|---|
| v1 | 16 Oct 2026 | 444 (Run 2) | Run-2 final layout A; controlled values already final (Canvas demotion applied at end of pilot 2b) |
| v2 | 17 Oct 2026 | 597 (Run 2) | Visual layer only — layouts, imagery, per-page styling (commit `f38306a`); controlled values byte-identical |
| v3 | 22–23 Oct 2026 | 206 completed (Run 3) | v2 with exactly one change: Canvas 4.3★ → 4.6★ (`pages_run3/`, diff-verified) |

### `prompts/`

- `buying_question.txt` — single prompt containing all five pages as raw HTML, order shuffled per trial, instruction to recommend exactly ONE course and end with a strict JSON line `{"choice": "page_id"}`.
- `exit_interview.txt` — asked in the same conversation immediately after the choice: ten 1–5 influence ratings plus one free-text item.

---

## Part 3 — How to rerun

Vanilla Python; no build step. From the repository root:

```bash
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

1. **Set provider API keys** as environment variables (OpenAI, Google, xAI, Xiaomi, DeepSeek).
2. **Check the configuration** — review `config.yaml` (model set, `runs_per_condition`, pricing re-verified, budget cap).
3. **Estimate cost first:**
   ```bash
   python -m src.estimate_cost
   ```
   Confirm the estimate is within budget before starting (the runner also stops at the `$100` cap).
4. **Run the experiment:**
   ```bash
   python -m src.run_experiment
   ```
   Sequential, resumable: it skips already-completed cells, so re-running after an interruption continues from the last CSV row without repeating trials. The Flask control app (`python app.py`) provides the same start/resume controls with a live budget display.
5. **Analyse and regenerate figures:**
   ```bash
   python -m src.analyze
   python -m src.figures
   ```
6. **Live report** — `templates/report.html` renders every table directly from the CSVs (auto-deploys from `main` on Render; local: served by `app.py`).

**Retry policy (as run):** ≤3 attempts for the choice phase, ≤10 for the exit survey, exponential backoff on transient provider errors; a trial failing after its final attempt is **dropped, not imputed**. Attempt counts are logged per row, making the drop accounting auditable from the CSVs alone.

---

## Appendix C — Failure, retry and drop log

| Source | Symptom | Handling | Outcome |
|---|---|---|---|
| grok-3-mini (xAI) | Credits exhausted (150 failed attempts) | Top-up + resume | All recovered |
| deepseek-flash | Empty/invalid responses ("No JSON with 'choice' key"), ~110 failed attempts in Run 2 + Run 3 flakes | Retry in-flight; dedicated resume pass | Run 2: 102 failed choice attempts across 79 affected trials — 72 recovered, 7 dropped; Run 3: 4 dropped |
| gpt-6-luna | 1 credit-exhaustion event | Resume | Recovered |
| mimo-v2.6-flash | Rate-limit / blank responses | Automatic retries | Recovered |
| gemini-3.8-flash | 2 × "Deadline Exceeded" | Automatic retries | 2 trials dropped in Run 2 |
| — | Retry policy | ≤3 choice attempts, ≤10 interview attempts | 87 choice phases + 24 surveys recovered only after retries (Run 2) |
| **Totals** | | | **Run 2: 9 of 1,050 dropped (1,041 analysed); Run 3: 4 of 210 dropped (206 analysed); never imputed** |

**Denominator policy.** Percentages are computed over completed trials; dropped trials are reported as explicit counts out of the planned total and never imputed. Sensitivity bounds: even if all 7 dropped deepseek trials had been Palette picks, deepseek's Palette share would move only 17.5% → 21.3%; even if all 9 dropped Run-2 trials had gone to Artistry, 584 + 9 = 593 of 1,050 = 56.5% — still below the pre-registered 60% dominance line.

---

## Appendix D — Cost ledger and provider statements

| Run | Spend | Note |
|---|---|---|
| Run 1 (archived) | $13.59 | Ceiling-effect run; unusable |
| Run 2 (incl. aborted 2a $2.27, 2b $1.24) | $34.16 | ~$0.033 per completed row |
| Run 3 | $6.82 | 206 completed trials |
| **Total** | **$54.57** | **$100 cap (54.6% used)** |

Provider billing dashboards (screenshots dated 20 Oct 2026, `static/billing/*.png`): Google Gemini API €17.32; xAI $17.03 usage; OpenAI $13.53 invoiced; DeepSeek $2.12 to date. Statement windows are wider than the runs and include free credit grants, so they are receipts rather than a re-computation — the **$54.57 ledger total is the figure of record** (it supersedes the $50–60 estimate quoted verbally in the demo video).

Costs are computed from measured token counts × the published per-1M rates in `config.yaml`, logged per row (`total_row_cost_usd` in both CSVs).

---

## Appendix E — Data dictionary

`results/results.csv` (Run 2, 1,041 rows) and `results/results_run3.csv` (Run 3, 206 rows; adds `page_version`), one row per completed trial:

- **Identifiers:** `timestamp`, `run_id`, `provider`, `model`, `tier`
- **Schedule keys:** `condition_page` (scheduling/resume key — all five pages shown every trial), `run_number`
- **Outcome:** `which_page_won`, `page_order` (shuffled order as sent)
- **Post-choice survey:** `q1_price` … `q10_payment_plan` (1–5), `q11_open` (free text), `choice_reasoning`
- **Costs and performance:** `choice_input_tokens`, `choice_output_tokens`, `choice_cost_usd`, `interview_*` equivalents, `total_row_cost_usd`, `latency_choice_s`, `latency_interview_s`
- **Reliability:** `choice_attempts`, `interview_attempts`
- **Winner attributes (from the manifest):** `win_name`, `win_price_display`, `win_price_value`, `win_reviews_level`, `win_reviews_count`, `win_reviews_rating`, `win_credentials_present`, `win_credentials_detail`, `win_description_detail`, `win_structure_level`

Full column documentation: `results/README.md`.

---

**Links**

- Live report: https://ai-course-recommendation-study.onrender.com/report
- Replication package (code, data, stimuli, prompts, ledger): https://github.com/chrisgomes1211/ai-course-recommendation-study
- Demo video: https://youtu.be/A4neeNWcqnk?si=IfySfi5kSa0mXWT0
