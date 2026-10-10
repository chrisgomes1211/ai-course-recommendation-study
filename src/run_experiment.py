import argparse
import csv
import os
import random
import re
import signal
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Set, Tuple, List, Dict, Any, Optional
from tqdm import tqdm

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

try:
    from .models import get_provider, parse_choice, parse_interview, ModelResponse, run_phase
except ImportError:
    from models import get_provider, parse_choice, parse_interview, ModelResponse, run_phase

RESULTS_DIR = Path("results")
RESULTS_FILE = RESULTS_DIR / "results.csv"
LOG_DIR = Path("logs")

CSV_HEADERS = [
    "timestamp", "provider", "model", "tier", "condition_page", "run_number",
    "which_page_won", "page_order",
    "q1_price", "q2_reviews", "q3_credentials", "q4_description", "q5_clarity", "q6_open",
    "choice_reasoning",
    "choice_input_tokens", "choice_output_tokens", "choice_cost_usd",
    "interview_input_tokens", "interview_output_tokens", "interview_cost_usd",
    "total_row_cost_usd",
    "latency_choice_s", "latency_interview_s",
    "choice_attempts", "interview_attempts",
    "win_name", "win_category",
    "win_price_display", "win_price_value",
    "win_reviews_level", "win_reviews_count", "win_reviews_rating",
    "win_credentials_present", "win_credentials_detail",
    "win_description_detail", "win_structure_level",
]

shutdown_requested = False
_log_file = None


def log(msg: str):
    line = f"[{datetime.utcnow().isoformat()}Z] {msg}"
    print(line, flush=True)
    if _log_file:
        _log_file.write(line + "\n")
        _log_file.flush()


def start_log_file(prefix: str = "run") -> Path:
    global _log_file
    LOG_DIR.mkdir(exist_ok=True)
    path = LOG_DIR / f"{prefix}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.log"
    _log_file = open(path, "a", encoding="utf-8")
    return path


def signal_handler(signum, frame):
    global shutdown_requested
    print("\n\nShutdown requested. Finishing current row and saving...", flush=True)
    shutdown_requested = True

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)


def load_config() -> Dict[str, Any]:
    with open("config.yaml", "r") as f:
        import yaml
        return yaml.safe_load(f)


def load_pages() -> Dict[str, str]:
    pages = {}
    for path in Path("pages").glob("*.html"):
        with open(path, "r") as f:
            pages[path.name] = f.read()
    return pages


def load_features() -> Dict[str, Any]:
    import yaml
    features_path = Path("pages/features.yaml")
    if features_path.exists():
        with open(features_path, "r") as f:
            return yaml.safe_load(f) or {}
    return {}


def load_prompt(name: str) -> str:
    with open(f"prompts/{name}.txt", "r") as f:
        return f.read()


def load_completed_runs() -> Set[Tuple[str, str, int]]:
    """Resume keys: (model, condition_page, run_number)."""
    completed = set()
    if RESULTS_FILE.exists():
        with open(RESULTS_FILE, "r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    key = (row["model"], row.get("condition_page") or "", int(row["run_number"]))
                    completed.add(key)
                except (KeyError, ValueError):
                    continue
    return completed


def load_total_cost() -> float:
    total = 0.0
    if RESULTS_FILE.exists():
        with open(RESULTS_FILE, "r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    total += float(row.get("choice_cost_usd", 0) or 0)
                    total += float(row.get("interview_cost_usd", 0) or 0)
                except ValueError:
                    continue
    return total


def append_result(row: Dict[str, Any]):
    RESULTS_DIR.mkdir(exist_ok=True)
    file_exists = RESULTS_FILE.exists()
    with open(RESULTS_FILE, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_HEADERS, extrasaction="ignore")
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)


def build_page_html_block(pages: Dict[str, str]) -> str:
    block, _ = build_page_html_block_ordered(pages)
    return block


def build_page_html_block_ordered(pages: Dict[str, str]) -> Tuple[str, List[str]]:
    """Return (prompt block with pages shuffled, list of page ids in shown order)."""
    items = list(pages.items())
    random.shuffle(items)
    blocks = []
    for page_id, html in items:
        html = re.sub(r"<!--.*?-->", "", html, flags=re.DOTALL)
        html = re.sub(r"\n{3,}", "\n\n", html)
        blocks.append(f"=== {page_id} ===\n{html}\n")
    return "\n".join(blocks), [pid for pid, _ in items]


def run_phase_counted(provider, prompt: str, parse_fn, attempts: int = 3):
    """Like models.run_phase but also returns the number of attempts used."""
    last_err = None
    last_raw = None
    for n in range(1, attempts + 1):
        resp = provider.complete(prompt)
        try:
            return resp, parse_fn(resp.text), n
        except Exception as e:
            last_err = e
            last_raw = resp.text[:600]
    raise RuntimeError(f"{last_err} | last raw response: {last_raw!r}")


def extract_choice_reasoning(response_text: str) -> str:
    """Free-text reasoning the model output before the strict JSON line."""
    m = re.search(r'\{[^}]*"choice"[^}]*\}', response_text)
    reasoning = response_text[:m.start()] if m else response_text
    reasoning = re.sub(r"\s+", " ", reasoning).strip()
    return reasoning[:2000]


def flatten_winner_features(features: Dict[str, Any], winner: str) -> Dict[str, Any]:
    f = features.get(winner) or {}
    price = f.get("price") or {}
    reviews = f.get("reviews") or {}
    creds = f.get("credentials") or {}
    desc = f.get("description") or {}
    struct = f.get("structure") or {}
    rating = reviews.get("rating")
    value = price.get("value")
    return {
        "win_name": f.get("name", ""),
        "win_category": f.get("category", ""),
        "win_price_display": price.get("display", ""),
        "win_price_value": "" if value is None else value,
        "win_reviews_level": reviews.get("level", ""),
        "win_reviews_count": reviews.get("count", ""),
        "win_reviews_rating": "" if rating is None else rating,
        "win_credentials_present": str(bool(creds.get("present"))).lower(),
        "win_credentials_detail": creds.get("detail", ""),
        "win_description_detail": desc.get("detail", ""),
        "win_structure_level": struct.get("level", ""),
    }


def perform_run(
    model_config: Dict[str, Any],
    pricing: Dict[str, Any],
    pages: Dict[str, str],
    features: Dict[str, Any],
    buying_template: str,
    interview_template: str,
    condition_page: str,
    run_number: int,
    choice_attempts: int = 3,
    interview_attempts: int = 10,
) -> Dict[str, Any]:
    """Execute one full run (choice + interview). Returns a row dict or error dict.

    Does not append to CSV — caller decides.
    """
    page_ids = list(pages.keys())
    provider = get_provider(model_config, pricing)
    model_name = model_config["name"]

    page_html_block, page_order = build_page_html_block_ordered(pages)
    choice_prompt = buying_template.format(page_html=page_html_block)

    t0 = time.perf_counter()
    try:
        choice_resp, chosen_page, choice_tries = run_phase_counted(
            provider, choice_prompt, lambda t: parse_choice(t, page_ids), attempts=choice_attempts
        )
    except Exception as e:
        return {"success": False, "error": f"Choice phase failed: {e}"}
    latency_choice = time.perf_counter() - t0

    interview_prompt = interview_template.format(choice=chosen_page)
    t1 = time.perf_counter()
    try:
        interview_resp, interview_data, interview_tries = run_phase_counted(
            provider, interview_prompt, parse_interview, attempts=interview_attempts
        )
    except Exception as e:
        return {"success": False, "error": f"Interview phase failed: {e}"}
    latency_interview = time.perf_counter() - t1

    total_cost = choice_resp.estimated_cost_usd + interview_resp.estimated_cost_usd
    row = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "provider": model_config.get("provider", ""),
        "model": model_name,
        "tier": model_config.get("tier", ""),
        "condition_page": condition_page,
        "run_number": run_number,
        "which_page_won": chosen_page,
        "page_order": "|".join(page_order),
        "q1_price": interview_data["q1_price"],
        "q2_reviews": interview_data["q2_reviews"],
        "q3_credentials": interview_data["q3_credentials"],
        "q4_description": interview_data["q4_description"],
        "q5_clarity": interview_data["q5_clarity"],
        "q6_open": interview_data["q6_open"],
        "choice_reasoning": extract_choice_reasoning(choice_resp.text),
        "choice_input_tokens": choice_resp.input_tokens,
        "choice_output_tokens": choice_resp.output_tokens,
        "choice_cost_usd": f"{choice_resp.estimated_cost_usd:.6f}",
        "interview_input_tokens": interview_resp.input_tokens,
        "interview_output_tokens": interview_resp.output_tokens,
        "interview_cost_usd": f"{interview_resp.estimated_cost_usd:.6f}",
        "total_row_cost_usd": f"{total_cost:.6f}",
        "latency_choice_s": f"{latency_choice:.1f}",
        "latency_interview_s": f"{latency_interview:.1f}",
        "choice_attempts": choice_tries,
        "interview_attempts": interview_tries,
    }
    row.update(flatten_winner_features(features, chosen_page))
    return {"success": True, "row": row, "chosen_page": chosen_page, "total_cost_usd": total_cost}


def main():
    parser = argparse.ArgumentParser(description="Run the course-page choice experiment")
    parser.add_argument("--models", type=str, default=None,
                        help="Comma-separated model names (default: all in config)")
    parser.add_argument("--runs", type=int, default=None,
                        help="Runs per condition (default: config runs_per_condition)")
    parser.add_argument("--budget", type=float, default=None,
                        help="Budget cap USD (default: config budget_cap_usd)")
    parser.add_argument("--log-prefix", type=str, default="run")
    args = parser.parse_args()

    config = load_config()
    models = config["models"]
    if args.models:
        wanted = {m.strip() for m in args.models.split(",") if m.strip()}
        models = [m for m in models if m["name"] in wanted]
        missing = wanted - {m["name"] for m in models}
        if missing:
            print(f"WARNING: not in config: {sorted(missing)}")
        if not models:
            print("No matching models."); sys.exit(1)

    runs_per_condition = args.runs or config["runs_per_condition"]
    budget_cap = args.budget if args.budget is not None else config["budget_cap_usd"]
    pricing = config["pricing"]

    pages = load_pages()
    page_ids = list(pages.keys())
    if not page_ids:
        print("No pages found in pages/ directory"); sys.exit(1)

    features = load_features()
    buying_prompt_template = load_prompt("buying_question")
    interview_prompt_template = load_prompt("exit_interview")

    completed = load_completed_runs()
    total_cost = load_total_cost()

    keys_in_space = {
        (m["name"], p, r)
        for m in models
        for p in page_ids
        for r in range(1, runs_per_condition + 1)
    }
    initial_done = len(keys_in_space & completed)
    remaining = len(keys_in_space) - initial_done
    total_combinations = len(keys_in_space)

    log(f"Models: {len(models)} ({', '.join(m['name'] for m in models)})")
    log(f"Pages: {len(page_ids)} | Runs per condition: {runs_per_condition}")
    log(f"Total combinations: {total_combinations} | Already completed: {len(completed)} | Remaining: {remaining}")
    log(f"Current spend: ${total_cost:.4f} / ${budget_cap:.2f}")

    if remaining == 0:
        log("All runs completed!"); return
    if total_cost >= budget_cap:
        log("Budget cap already reached."); return

    errors = 0
    with tqdm(total=total_combinations, initial=total_combinations - remaining, desc="Experiment") as pbar:
        for model_config in models:
            model_name = model_config["name"]
            for page_id in page_ids:
                for run_num in range(1, runs_per_condition + 1):
                    if shutdown_requested:
                        log("Shutdown complete. Results saved."); return

                    key = (model_name, page_id, run_num)
                    if key in completed:
                        pbar.update(1)
                        continue

                    if total_cost >= budget_cap:
                        log(f"Budget cap (${budget_cap:.2f}) reached. Stopping."); return

                    result = perform_run(
                        model_config, pricing, pages, features,
                        buying_prompt_template, interview_prompt_template,
                        condition_page=page_id, run_number=run_num,
                    )

                    if result["success"]:
                        append_result(result["row"])
                        total_cost += result["total_cost_usd"]
                        completed.add(key)
                        r = result["row"]
                        log(f"OK {model_name} {page_id} run{run_num}: won={result['chosen_page']} "
                            f"cost=${result['total_cost_usd']:.4f} total=${total_cost:.4f}")
                    else:
                        errors += 1
                        log(f"ERROR {model_name} {page_id} run{run_num}: {result['error']} (will retry on next run)")

                    pbar.update(1)
                    pbar.set_postfix({"spend": f"${total_cost:.4f}", "err": errors})

    log(f"Experiment complete! Rows: {len(completed)} | Cost: ${total_cost:.4f} | Errors: {errors}")


if __name__ == "__main__":
    log_path = start_log_file()
    log(f"Log file: {log_path}")
    main()
    if _log_file:
        _log_file.close()
