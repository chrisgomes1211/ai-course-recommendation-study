import yaml
import csv
import os
import signal
import sys
from datetime import datetime
from pathlib import Path
from typing import Set, Tuple, List, Dict, Any
from tqdm import tqdm

try:
    from .models import get_provider, parse_choice, parse_interview, ModelResponse
except ImportError:
    from models import get_provider, parse_choice, parse_interview, ModelResponse

RESULTS_DIR = Path("results")
RESULTS_FILE = RESULTS_DIR / "results.csv"
CSV_HEADERS = [
    "timestamp", "model", "tier", "run_number", "which_page_won",
    "q1_price", "q2_reviews", "q3_credentials", "q4_description", "q5_clarity", "q6_open",
    "choice_input_tokens", "choice_output_tokens", "choice_cost_usd",
    "interview_input_tokens", "interview_output_tokens", "interview_cost_usd"
]

shutdown_requested = False

def signal_handler(signum, frame):
    global shutdown_requested
    print("\n\nShutdown requested. Finishing current row and saving...")
    shutdown_requested = True

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def load_config() -> Dict[str, Any]:
    with open("config.yaml", "r") as f:
        return yaml.safe_load(f)

def load_pages() -> Dict[str, str]:
    pages = {}
    for path in Path("pages").glob("*.html"):
        with open(path, "r") as f:
            pages[path.name] = f.read()
    return pages

def load_prompt(name: str) -> str:
    with open(f"prompts/{name}.txt", "r") as f:
        return f.read()

def load_completed_runs() -> Set[Tuple[str, str, int]]:
    completed = set()
    if RESULTS_FILE.exists():
        with open(RESULTS_FILE, "r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                key = (row["model"], row["which_page_won"], int(row["run_number"]))
                completed.add(key)
    return completed

def load_total_cost() -> float:
    total = 0.0
    if RESULTS_FILE.exists():
        with open(RESULTS_FILE, "r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                total += float(row.get("choice_cost_usd", 0)) + float(row.get("interview_cost_usd", 0))
    return total

def append_result(row: Dict[str, Any]):
    RESULTS_DIR.mkdir(exist_ok=True)
    file_exists = RESULTS_FILE.exists()
    with open(RESULTS_FILE, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_HEADERS)
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)

def build_page_html_block(pages: Dict[str, str]) -> str:
    blocks = []
    for page_id, html in pages.items():
        blocks.append(f"=== {page_id} ===\n{html}\n")
    return "\n".join(blocks)

def main():
    config = load_config()
    models = config["models"]
    runs_per_condition = config["runs_per_condition"]
    budget_cap = config["budget_cap_usd"]
    pricing = config["pricing"]
    
    pages = load_pages()
    page_ids = list(pages.keys())
    if not page_ids:
        print("No pages found in pages/ directory")
        sys.exit(1)
    
    buying_prompt_template = load_prompt("buying_question")
    interview_prompt_template = load_prompt("exit_interview")
    
    page_html_block = build_page_html_block(pages)
    
    completed = load_completed_runs()
    total_cost = load_total_cost()
    
    total_combinations = len(models) * len(page_ids) * runs_per_condition
    remaining = total_combinations - len(completed)
    
    print(f"Models: {len(models)}")
    print(f"Pages: {len(page_ids)}")
    print(f"Runs per condition: {runs_per_condition}")
    print(f"Total combinations: {total_combinations}")
    print(f"Already completed: {len(completed)}")
    print(f"Remaining: {remaining}")
    print(f"Current spend: ${total_cost:.4f} / ${budget_cap:.2f}")
    print(f"Budget remaining: ${budget_cap - total_cost:.4f}")
    print()
    
    if remaining == 0:
        print("All runs completed!")
        return
    
    if total_cost >= budget_cap:
        print("Budget cap already reached.")
        return
    
    with tqdm(total=total_combinations, initial=len(completed), desc="Experiment") as pbar:
        for model_config in models:
            provider = get_provider(model_config, pricing)
            model_name = model_config["name"]
            tier = model_config["tier"]
            
            for page_id in page_ids:
                for run_num in range(1, runs_per_condition + 1):
                    if shutdown_requested:
                        print("\nShutdown complete. Results saved.")
                        return
                    
                    key = (model_name, page_id, run_num)
                    if key in completed:
                        pbar.update(1)
                        continue
                    
                    projected_cost = 0.0
                    if total_cost + projected_cost > budget_cap:
                        print(f"\nBudget cap (${budget_cap:.2f}) would be exceeded. Stopping.")
                        return
                    
                    choice_prompt = buying_prompt_template.format(page_html=page_html_block)
                    
                    try:
                        choice_resp = provider.complete(choice_prompt)
                        chosen_page = parse_choice(choice_resp.text, page_ids)
                    except Exception as e:
                        print(f"\nError in choice phase for {model_name}/{page_id}/run{run_num}: {e}")
                        completed.add(key)
                        pbar.update(1)
                        continue
                    
                    interview_prompt = interview_prompt_template.format(choice=chosen_page)
                    
                    try:
                        interview_resp = provider.complete(interview_prompt)
                        interview_data = parse_interview(interview_resp.text)
                    except Exception as e:
                        print(f"\nError in interview phase for {model_name}/{page_id}/run{run_num}: {e}")
                        completed.add(key)
                        pbar.update(1)
                        continue
                    
                    row = {
                        "timestamp": datetime.utcnow().isoformat() + "Z",
                        "model": model_name,
                        "tier": tier,
                        "run_number": run_num,
                        "which_page_won": chosen_page,
                        "q1_price": interview_data["q1_price"],
                        "q2_reviews": interview_data["q2_reviews"],
                        "q3_credentials": interview_data["q3_credentials"],
                        "q4_description": interview_data["q4_description"],
                        "q5_clarity": interview_data["q5_clarity"],
                        "q6_open": interview_data["q6_open"],
                        "choice_input_tokens": choice_resp.input_tokens,
                        "choice_output_tokens": choice_resp.output_tokens,
                        "choice_cost_usd": f"{choice_resp.estimated_cost_usd:.6f}",
                        "interview_input_tokens": interview_resp.input_tokens,
                        "interview_output_tokens": interview_resp.output_tokens,
                        "interview_cost_usd": f"{interview_resp.estimated_cost_usd:.6f}"
                    }
                    
                    append_result(row)
                    total_cost += choice_resp.estimated_cost_usd + interview_resp.estimated_cost_usd
                    completed.add(key)
                    pbar.update(1)
                    pbar.set_postfix({"spend": f"${total_cost:.4f}", "budget": f"${budget_cap:.2f}"})
                    
                    if total_cost >= budget_cap:
                        print(f"\nBudget cap (${budget_cap:.2f}) reached. Stopping.")
                        return
    
    print(f"\nExperiment complete! Total cost: ${total_cost:.4f}")

if __name__ == "__main__":
    main()