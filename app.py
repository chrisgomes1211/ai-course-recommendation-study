import os
import csv
import yaml
import threading
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional

from flask import Flask, render_template, request, jsonify, send_file, redirect, url_for
from dotenv import load_dotenv

load_dotenv()

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from models import get_provider, parse_choice, parse_interview, ModelResponse, run_phase
from run_experiment import (
    load_config, load_pages, load_prompt, load_features, build_page_html_block,
    append_result, CSV_HEADERS, RESULTS_FILE, RESULTS_DIR, perform_run
)

app = Flask(__name__)

@app.route("/health")
def health():
    return jsonify({
        "status": "ok",
        "openai": bool(os.getenv("OPENAI_API_KEY")),
        "anthropic": bool(os.getenv("ANTHROPIC_API_KEY")),
        "google": bool(os.getenv("GOOGLE_API_KEY"))
    })

def get_models_from_config() -> List[Dict[str, Any]]:
    config = load_config()
    return config["models"]

def get_budget_cap() -> float:
    config = load_config()
    return config.get("budget_cap_usd", 100.0)

def get_current_total_cost() -> float:
    total = 0.0
    if RESULTS_FILE.exists():
        with open(RESULTS_FILE, "r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                total += float(row.get("choice_cost_usd", 0)) + float(row.get("interview_cost_usd", 0))
    return total

def get_next_run_number(model_name: str, condition_page: str) -> int:
    max_run = 0
    if RESULTS_FILE.exists():
        with open(RESULTS_FILE, "r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row["model"] == model_name and (row.get("condition_page") or "") == condition_page:
                    try:
                        run_num = int(row["run_number"])
                        if run_num > max_run:
                            max_run = run_num
                    except ValueError:
                        pass
    return max_run + 1

def run_single_experiment(model_name: str, condition_page: str = "") -> Dict[str, Any]:
    config = load_config()
    models = config["models"]
    pricing = config["pricing"]
    budget_cap = config.get("budget_cap_usd", 100.0)
    
    model_config = next((m for m in models if m["name"] == model_name), None)
    if not model_config:
        return {"success": False, "error": f"Model {model_name} not found in config"}
    
    current_cost = get_current_total_cost()
    if current_cost >= budget_cap:
        return {"success": False, "error": f"Budget cap (${budget_cap:.2f}) reached"}
    
    pages = load_pages()
    if not pages:
        return {"success": False, "error": "No pages found in pages/ directory"}
    
    buying_prompt_template = load_prompt("buying_question")
    interview_prompt_template = load_prompt("exit_interview")
    
    run_number = get_next_run_number(model_name, condition_page)
    result = perform_run(
        model_config, pricing, pages, load_features(),
        buying_prompt_template, interview_prompt_template,
        condition_page=condition_page, run_number=run_number,
    )
    if not result["success"]:
        return {"success": False, "error": result["error"]}
    
    row = result["row"]
    append_result(row)
    
    return {
        "success": True,
        "chosen_page": result["chosen_page"],
        "interview_data": {k: row[k] for k in ("q1_price", "q2_reviews", "q3_credentials",
                                               "q4_description", "q5_clarity", "q6_open")},
        "choice_resp": {
            "input_tokens": row["choice_input_tokens"],
            "output_tokens": row["choice_output_tokens"],
            "cost_usd": float(row["choice_cost_usd"])
        },
        "interview_resp": {
            "input_tokens": row["interview_input_tokens"],
            "output_tokens": row["interview_output_tokens"],
            "cost_usd": float(row["interview_cost_usd"])
        },
        "total_cost_usd": result["total_cost_usd"],
        "run_number": run_number,
        "tier": model_config["tier"]
    }

def load_results_data() -> List[Dict[str, Any]]:
    results = []
    if RESULTS_FILE.exists():
        with open(RESULTS_FILE, "r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                results.append(row)
    return list(reversed(results))

def get_stats() -> Dict[str, Any]:
    results = load_results_data()
    total_runs = len(results)
    total_cost = sum(float(r.get("choice_cost_usd", 0)) + float(r.get("interview_cost_usd", 0)) for r in results)
    models_used = set(r["model"] for r in results)
    
    course_counts = {}
    for r in results:
        course = r["which_page_won"]
        course_counts[course] = course_counts.get(course, 0) + 1
    
    model_course_counts = {}
    for r in results:
        model = r["model"]
        course = r["which_page_won"]
        if model not in model_course_counts:
            model_course_counts[model] = {}
        model_course_counts[model][course] = model_course_counts[model].get(course, 0) + 1
    
    return {
        "total_runs": total_runs,
        "total_cost": total_cost,
        "models_used": list(models_used),
        "course_counts": course_counts,
        "model_course_counts": model_course_counts
    }

# Batch run state management
class BatchRunState:
    def __init__(self):
        self.running = False
        self.completed = 0
        self.total = 0
        self.current_cost = 0.0
        self.errors = []
        self.current_model = ""
        self.current_page = ""
        self.lock = threading.Lock()
    
    def reset(self):
        with self.lock:
            self.running = False
            self.completed = 0
            self.total = 0
            self.current_cost = 0.0
            self.errors = []
            self.current_model = ""
            self.current_page = ""
    
    def start(self, total: int):
        with self.lock:
            self.running = True
            self.completed = 0
            self.total = total
            self.current_cost = get_current_total_cost()
            self.errors = []
    
    def update(self, completed: int = None, cost: float = None, model: str = None, page: str = None, error: str = None):
        with self.lock:
            if completed is not None:
                self.completed = completed
            if cost is not None:
                self.current_cost = cost
            if model is not None:
                self.current_model = model
            if page is not None:
                self.current_page = page
            if error is not None:
                self.errors.append(error)
    
    def stop(self):
        with self.lock:
            self.running = False
    
    def get_status(self) -> Dict[str, Any]:
        with self.lock:
            return {
                "running": self.running,
                "completed": self.completed,
                "total": self.total,
                "current_cost": self.current_cost,
                "errors": self.errors[-10:],  # Last 10 errors
                "current_model": self.current_model,
                "current_page": self.current_page,
            }

batch_state = BatchRunState()

def run_batch_experiment(model_names: List[str], runs_per_model_page: int) -> None:
    """Background thread function to run batch experiment."""
    config = load_config()
    models = config["models"]
    pricing = config["pricing"]
    budget_cap = config.get("budget_cap_usd", 100.0)
    pages = load_pages()
    page_ids = list(pages.keys())
    
    # Filter models
    selected_models = [m for m in models if m["name"] in model_names]
    if not selected_models:
        batch_state.update(error="No valid models selected")
        batch_state.stop()
        return
    
    # Calculate total combinations
    total_combinations = len(selected_models) * len(page_ids) * runs_per_model_page
    batch_state.start(total_combinations)
    
    completed = 0
    
    for model_config in selected_models:
        if not batch_state.running:
            break
            
        model_name = model_config["name"]
        
        for page_id in page_ids:
            if not batch_state.running:
                break
                
            for run_num in range(1, runs_per_model_page + 1):
                if not batch_state.running:
                    break
                
                batch_state.update(model=model_name, page=page_id)
                
                # Check budget
                current_cost = get_current_total_cost()
                if current_cost >= budget_cap:
                    batch_state.update(error=f"Budget cap (${budget_cap:.2f}) reached")
                    batch_state.stop()
                    return
                
                # Run single experiment (condition_page ties the row to this slot for resume)
                result = run_single_experiment(model_name, condition_page=page_id)
                
                completed += 1
                new_cost = get_current_total_cost()
                
                if result["success"]:
                    batch_state.update(completed=completed, cost=new_cost)
                else:
                    batch_state.update(completed=completed, cost=new_cost, error=f"{model_name}/{page_id}: {result['error']}")
    
    batch_state.stop()

@app.route("/")
def index():
    return redirect(url_for("run_test"))

@app.route("/run-test")
def run_test():
    config = load_config()
    models = config["models"]
    pages = load_pages()
    features = load_features()
    provider_names = {"openai": "OpenAI", "anthropic": "Anthropic", "google": "Google", "xai": "xAI"}
    grouped = {}
    for m in models:
        grouped.setdefault(m.get("provider", ""), []).append(m)
    model_groups = [
        {"key": p, "label": provider_names.get(p, p.capitalize() or "Other"), "models": ms}
        for p, ms in grouped.items()
    ]
    return render_template(
        "run_test.html",
        models=models,
        pages=pages,
        features=features,
        budget=get_budget_cap(),
        model_groups=model_groups,
    )

@app.route("/redesign")
@app.route("/v2")
def redesign():
    config = load_config()
    models = config["models"]
    pages = load_pages()
    features = load_features()
    provider_names = {"openai": "OpenAI", "anthropic": "Anthropic", "google": "Google", "xai": "xAI"}
    grouped = {}
    for m in models:
        grouped.setdefault(m.get("provider", ""), []).append(m)
    model_groups = [
        {"key": p, "label": provider_names.get(p, p.capitalize() or "Other"), "models": ms}
        for p, ms in grouped.items()
    ]
    return render_template(
        "redesign.html",
        models=models,
        pages=pages,
        features=features,
        budget=get_budget_cap(),
        model_groups=model_groups,
    )

@app.route("/api/run-test", methods=["POST"])
def api_run_test():
    data = request.get_json()
    model_name = data.get("model")
    if not model_name:
        return jsonify({"success": False, "error": "No model specified"}), 400
    
    result = run_single_experiment(model_name)
    return jsonify(result)

DATASET_FILE = Path("static/dataset_results.csv")
DATASET_LOGS = Path("static/dataset_logs.zip")

@app.route("/results")
def results():
    dataset_rows = 0
    if DATASET_FILE.exists():
        with open(DATASET_FILE, "r") as f:
            dataset_rows = max(sum(1 for _ in f) - 1, 0)
    return render_template("results.html", has_dataset=DATASET_FILE.exists(), dataset_rows=dataset_rows)

@app.route("/download-dataset")
def download_dataset():
    if DATASET_FILE.exists():
        return send_file(DATASET_FILE, as_attachment=True, download_name="course_choice_dataset.csv")
    return "Dataset not available yet", 404

@app.route("/download-dataset-logs")
def download_dataset_logs():
    if DATASET_LOGS.exists():
        return send_file(DATASET_LOGS, as_attachment=True, download_name="dataset_run_logs.zip")
    return "Logs not available yet", 404

@app.route("/api/results")
def api_results():
    stats = get_stats()
    recent_runs = load_results_data()[:20]
    return jsonify({
        "stats": stats,
        "recent_runs": recent_runs
    })

@app.route("/download-csv")
def download_csv():
    if RESULTS_FILE.exists():
        return send_file(RESULTS_FILE, as_attachment=True, download_name="results.csv")
    return "No results file found", 404

@app.route("/api/pages")
def api_pages():
    pages = load_pages()
    return jsonify(pages)

@app.route("/api/batch-start", methods=["POST"])
def api_batch_start():
    if batch_state.running:
        return jsonify({"success": False, "error": "Batch run already in progress"}), 400
    
    data = request.get_json()
    model_names = data.get("models", [])
    runs_per_model_page = data.get("runs_per_model_page", 1)
    
    if not model_names:
        return jsonify({"success": False, "error": "No models specified"}), 400
    
    if runs_per_model_page < 1:
        return jsonify({"success": False, "error": "runs_per_model_page must be >= 1"}), 400
    
    # Start batch run in background thread
    thread = threading.Thread(target=run_batch_experiment, args=(model_names, runs_per_model_page))
    thread.daemon = True
    thread.start()
    
    return jsonify({"success": True, "message": "Batch run started"})

@app.route("/api/batch-stop", methods=["POST"])
def api_batch_stop():
    batch_state.stop()
    return jsonify({"success": True, "message": "Batch run stopped"})

@app.route("/api/batch-status")
def api_batch_status():
    return jsonify(batch_state.get_status())

@app.route("/api/features")
def api_features():
    return jsonify(load_features())

@app.route("/api/keys-check")
def api_keys_check():
    try:
        return _keys_check_impl()
    except BaseException:
        import traceback
        return jsonify({"error": traceback.format_exc()[-2500:]}), 500

def _keys_check_impl():
    """Verify provider keys and list valid model IDs; probe one model per request."""
    def err_str(e):
        msg = str(e)
        if e.__class__.__name__ == "RetryError":
            try:
                msg = str(e.last_attempt.exception())
            except Exception:
                pass
        return msg[:300]

    try:
        with open("config.yaml", "r") as f:
            cfg = yaml.safe_load(f)
    except Exception as e:
        return jsonify({"error": f"config: {err_str(e)}"}), 500

    provider_keys = {
        "openai": os.getenv("OPENAI_API_KEY"),
        "anthropic": os.getenv("ANTHROPIC_API_KEY"),
        "google": os.getenv("GOOGLE_API_KEY"),
        "xai": os.getenv("XAI_API_KEY"),
    }

    def list_model_ids(provider, key):
        if provider == "openai":
            from openai import OpenAI
            return {m.id for m in OpenAI(api_key=key).models.list()}
        if provider == "anthropic":
            from anthropic import Anthropic
            return {m.id for m in Anthropic(api_key=key).models.list()}
        if provider == "google":
            import google.generativeai as genai
            genai.configure(api_key=key)
            return {m.name.removeprefix("models/") for m in genai.list_models()}
        if provider == "xai":
            from openai import OpenAI
            return {m.id for m in OpenAI(api_key=key, base_url="https://api.x.ai/v1").models.list()}
        return set()

    def probe_model(provider, model, key):
        if provider == "openai":
            from openai import OpenAI
            r = OpenAI(api_key=key).chat.completions.create(
                model=model, messages=[{"role": "user", "content": "Hi"}], max_completion_tokens=16)
            u = r.usage
            return {"tokens": {"in": u.prompt_tokens, "out": u.completion_tokens}}
        if provider == "anthropic":
            from anthropic import Anthropic
            r = Anthropic(api_key=key).messages.create(
                model=model, max_tokens=1, messages=[{"role": "user", "content": "Hi"}])
            u = r.usage
            return {"tokens": {"in": u.input_tokens, "out": u.output_tokens}}
        if provider == "google":
            import google.generativeai as genai
            genai.configure(api_key=key)
            r = genai.GenerativeModel(model).generate_content(
                "Hi", generation_config={"max_output_tokens": 16})
            if not getattr(r, "candidates", None):
                raise RuntimeError(f"no candidates (blocked?): {getattr(r, 'prompt_feedback', 'unknown')}")
            usage = getattr(r, "usage_metadata", None)
            return {"finish": r.candidates[0].finish_reason,
                    "tokens": {"in": getattr(usage, "prompt_token_count", None),
                               "out": getattr(usage, "candidates_token_count", None)}}
        if provider == "xai":
            from openai import OpenAI
            r = OpenAI(api_key=key, base_url="https://api.x.ai/v1").chat.completions.create(
                model=model, messages=[{"role": "user", "content": "Hi"}], max_tokens=16)
            return {"tokens": {"in": r.usage.prompt_tokens, "out": r.usage.completion_tokens}}
        raise ValueError(f"unknown provider {provider}")

    providers = {}
    listed = {}
    for prov, key in provider_keys.items():
        if not key:
            providers[prov] = {"key_set": False, "list_ok": False, "list_error": None}
            continue
        try:
            ids = list_model_ids(prov, key)
            listed[prov] = ids
            providers[prov] = {"key_set": True, "list_ok": True, "list_error": None, "models_available": len(ids)}
        except Exception as e:
            providers[prov] = {"key_set": True, "list_ok": False, "list_error": err_str(e)}

    probe_target = request.args.get("probe")
    if probe_target:
        prov, _, name = probe_target.partition(":")
        key = provider_keys.get(prov)
        if not key:
            return jsonify({"probe_ok": False, "probe_error": f"no {prov} key"}), 200
        if prov in listed and name not in listed[prov]:
            return jsonify({"probe_ok": False, "probe_error": "model not available for this key"}), 200
            return jsonify({"probe_ok": False, "probe_error": "model not in config.yaml"}), 200
        try:
            info = probe_model(prov, name, key)
            return jsonify({"probe_ok": True, "model": name, "provider": prov, **info})
        except Exception as e:
            return jsonify({"probe_ok": False, "model": name, "provider": prov, "probe_error": err_str(e)})

    if request.args.get("list"):
        return jsonify({"available": {p: sorted(ids) for p, ids in listed.items()}})

    models_out = []
    for m in cfg.get("models", []):
        name, prov = m["name"], m["provider"]
        entry = {"model": name, "provider": prov, "listed": None}
        if prov in listed:
            entry["listed"] = name in listed[prov]
        models_out.append(entry)

    bad = [m for m in models_out if m["listed"] is False]
    return jsonify({
        "providers": providers,
        "models": models_out,
        "not_listed": [f"{m['provider']}:{m['model']}" for m in bad],
        "budget_cap_usd": cfg.get("budget_cap_usd"),
        "note": "use ?probe=provider:model to live-test one model",
    })

@app.route("/page/<path:page_id>")
def view_page(page_id):
    """Serve the raw HTML page for viewing in a new tab."""
    page_path = Path("pages") / page_id
    if not page_path.exists():
        return "Page not found", 404
    return page_path.read_text(encoding="utf-8"), 200, {"Content-Type": "text/html"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)