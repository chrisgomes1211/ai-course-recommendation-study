# AI Offer Choice Experiment

Automated study showing AI models competing fictional online course pages, asking each to recommend one, then conducting an exit interview about the choice. Results logged to CSV for regression analysis.

## Quick Start (CLI Experiment)

```bash
# 1. Clone and enter directory
cd ai-offer-choice

# 2. Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure API keys
cp .env.example .env
# Edit .env with your OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY

# 5. Verify cost estimate (no API calls made)
python -m src.estimate_cost

# 6. Run experiment
python -m src.run_experiment
```

## Web Application (Local Demo)

Run the web interface for interactive testing:

```bash
# From project root (after steps 1-4 above)
python app.py
# → Opens http://localhost:5000
```

**Screens:**
- **Run a Test** — Pick a model, click "Run Test", see live choice + exit survey + cost. **NEW:** Feature tags on each course card showing controlled variables (price display, reviews, credentials, description detail, structure). **NEW:** Batch Run section to run large-scale experiments.
- **Results** — Dashboard with stats, charts (overall + by-model), summary line, recent runs table, CSV download.

**No API calls** until you click "Run Test" or "Start Batch". All settings from `config.yaml`.

### Batch Run (for 1,000+ choices)

1. On the "Run a Test" screen, scroll to **Batch Run** section
2. Select which models to include (checkboxes, default: all from config.yaml)
3. Set **Runs per Model per Page** (default: 1, configurable)
4. Click **Start Batch Run** — runs all combinations in background
5. Live progress shows: completed/total, running cost, current model/page
6. Respects `budget_cap_usd` from config.yaml (stops before exceeding)
7. Resumable — if interrupted, re-run to continue from where it left off
8. Results append to same `results/results.csv` as single runs

## Project Structure

```
ai-offer-choice/
├── README.md              # This file
├── app.py                 # Flask web app
├── config.yaml            # All configuration (models, runs, budget, pricing)
├── .env.example           # API key template
├── .env                   # Your API keys (gitignored)
├── requirements.txt       # Python dependencies
├── .gitignore             # Ignores results/, .env, __pycache__/
├── pages/                 # Fictional course HTML pages (4 included)
│   ├── course_art.html           # Many reviews, clear price, detailed instructor, structured
│   ├── course_music.html         # No reviews, hidden price, no instructor creds, unstructured
│   ├── course_design.html        # Many reviews, clear price, no instructor creds, detailed desc
│   ├── course_photography.html   # Few reviews, clear price, detailed instructor, minimal desc
│   └── features.yaml             # Controlled features for each page (NEW)
├── prompts/
│   ├── buying_question.txt   # Asks model to pick ONE course, return JSON {"choice": "page_id"}
│   └── exit_interview.txt    # 5 Likert (1-5) + 1 open-ended, return JSON
├── src/
│   ├── models.py             # Provider wrappers (OpenAI, Anthropic, Google)
│   ├── run_experiment.py     # Main loop: sequential, resumable, budget-aware
│   └── estimate_cost.py      # Standalone cost estimator
├── templates/               # Jinja2 templates
│   ├── base.html
│   ├── run_test.html
│   └── results.html
├── static/                  # CSS/JS
│   ├── style.css
│   └── app.js
└── results/                  # CSV output (gitignored)
    └── results.csv           # One row per choice
```

## Configuration (`config.yaml`)

All tunable parameters live here:

```yaml
models:
  - name: gpt-4o-mini
    provider: openai
    tier: low
  # ... add/remove models freely

runs_per_condition: 50        # Total choices = models × pages × runs
budget_cap_usd: 100.0         # Hard stop when reached

pricing:                      # USER MUST VERIFY against current provider pricing
  gpt-4o-mini: {input: 0.15, output: 0.60}
  # ...

avg_prompt_tokens: 3000       # For cost estimation only
avg_completion_tokens_choice: 50
avg_completion_tokens_interview: 400
```

**Add/remove models** by editing the `models` list. Each needs `name` (exact API model ID), `provider` (openai/anthropic/google), and `tier` (your label).

## Course Page Features (`pages/features.yaml`)

Each course page has documented controlled features for experimental reproducibility:

| Page | Category | Price | Reviews | Credentials | Description | Structure |
|------|----------|-------|---------|-------------|-------------|-----------|
| `course_art.html` | Art | Shown ($199) | Many (127, 4.8★) | Detailed | Detailed | Structured |
| `course_music.html` | Music | Hidden | None | None | Short | Unstructured |
| `course_design.html` | Design | Shown ($149) | Many (89, 4.6★) | None | Detailed | Structured |
| `course_photography.html` | Photography | Shown ($299) | Few (12, 4.2★) | Detailed | Short | Structured |

Feature tags are displayed on the "Run a Test" screen for each course card. Edit `pages/features.yaml` to modify or add pages — the UI reads from this file automatically.

## Results CSV Schema (`results/results.csv`)

One row per completed choice + interview:

| Column | Description |
|--------|-------------|
| `timestamp` | ISO 8601 UTC when row written |
| `model` | Model name from config |
| `tier` | Tier label from config |
| `run_number` | 1..runs_per_condition |
| `which_page_won` | Page ID chosen (e.g., `course_art.html`) |
| `q1_price` | Likert 1-5: price influence |
| `q2_reviews` | Likert 1-5: reviews influence |
| `q3_credentials` | Likert 1-5: instructor credentials influence |
| `q4_description` | Likert 1-5: course description detail influence |
| `q5_clarity` | Likert 1-5: page clarity/structure influence |
| `q6_open` | Free-text: why this course? |
| `choice_input_tokens` | Tokens in choice prompt |
| `choice_output_tokens` | Tokens in choice response |
| `choice_cost_usd` | Estimated cost for choice call |
| `interview_input_tokens` | Tokens in interview prompt |
| `interview_output_tokens` | Tokens in interview response |
| `interview_cost_usd` | Estimated cost for interview call |

## Resumability

The experiment is **fully resumable**:
- On startup, reads existing `results/results.csv`
- Skips any `(model, page, run_number)` already completed
- Tracks running spend from CSV cost columns
- Stops before next call if it would exceed `budget_cap_usd`
- Safe to `Ctrl+C` anytime — re-run to continue

## Cost Estimation

Run before experimenting:
```bash
python -m src.estimate_cost
```

Outputs per-model and grand total estimates using `config.yaml` pricing and token assumptions. Exits non-zero if estimated cost > `budget_cap_usd`.

**Verify pricing** in `config.yaml` against current provider rates before relying on estimates.

## Prompt Details

### Buying Question (`prompts/buying_question.txt`)
Shows all 4 course pages (raw HTML) simultaneously. Model must return:
```json
{"choice": "course_art.html"}
```
Parsing extracts the last JSON object with a `choice` key matching a page filename.

### Exit Interview (`prompts/exit_interview.txt`)
Asks 6 questions about the chosen course. Model returns:
```json
{
  "q1_price": 4,
  "q2_reviews": 2,
  "q3_credentials": 5,
  "q4_description": 3,
  "q5_clarity": 4,
  "q6_open": "I chose this course because..."
}
```
All 6 keys required; Likert values validated as integers 1-5.

## Replication Checklist

For another researcher to replicate exactly:

1. [ ] Same `config.yaml` (models, runs, budget, pricing)
2. [ ] Same `pages/*.html` files (4 courses with documented feature differences)
3. [ ] Same `prompts/*.txt` files
4. [ ] Same Python dependencies (`requirements.txt` versions)
5. [ ] API access to all configured providers
6. [ ] Run `python -m src.estimate_cost` → confirm estimate matches
7. [ ] Run `python -m src.run_experiment` → wait for completion or budget cap
8. [ ] Analyze `results/results.csv`

## Adding Pages

Drop `.html` files in `pages/`. Each filename becomes a `page_id`. Update prompts if you change the number of pages shown simultaneously.

## License

MIT — use freely for research.