import os
import csv
import yaml
import traceback
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional

from flask import Flask, render_template, request, jsonify, send_file, redirect, url_for
from dotenv import load_dotenv

load_dotenv()

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from models import get_provider, parse_choice, parse_interview, ModelResponse
from run_experiment import (
    load_config, load_pages, load_prompt, build_page_html_block,
    append_result, CSV_HEADERS, RESULTS_FILE, RESULTS_DIR
)

app = Flask(__name__)

@app.route("/debug/env")
def debug_env():
    return jsonify({
        "openai": bool(os.getenv("OPENAI_API_KEY")),
        "anthropic": bool(os.getenv("ANTHROPIC_API_KEY")),
        "google": bool(os.getenv("GOOGLE_API_KEY")),
        "openai_prefix": os.getenv("OPENAI_API_KEY", "")[:10] if os.getenv("OPENAI_API_KEY") else None,
    })

@app.route("/debug/test-provider/<model_name>")
def debug_test_provider(model_name):
    try:
        config = load_config()
        model_config = next((m for m in config["models"] if m["name"] == model_name), None)
        if not model_config:
            return jsonify({"error": "Model not found"}), 404
        
        pricing = config["pricing"]
        provider = get_provider(model_config, pricing)
        
        # Simple test prompt
        test_prompt = "Reply with just the word 'OK'"
        resp = provider.complete(test_prompt)
        
        return jsonify({
            "success": True,
            "model": model_name,
            "response": resp.text[:100],
            "input_tokens": resp.input_tokens,
            "output_tokens": resp.output_tokens,
            "cost": resp.estimated_cost_usd
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "trace": traceback.format_exc()
        }), 500

@app.route("/debug/test-full/<model_name>")
def debug_test_full(model_name):
    """Test the full flow with a small prompt"""
    try:
        config = load_config()
        model_config = next((m for m in config["models"] if m["name"] == model_name), None)
        if not model_config:
            return jsonify({"error": "Model not found"}), 404
        
        pricing = config["pricing"]
        provider = get_provider(model_config, pricing)
        
        # Simulate the actual choice prompt but with minimal HTML
        pages = load_pages()
        page_ids = list(pages.keys())
        buying_prompt_template = load_prompt("buying_question")
        
        # Use only one page for testing
        test_html = "<html><body>Test Course</body></html>"
        page_html_block = f"=== test.html ===\n{test_html}\n"
        choice_prompt = buying_prompt_template.format(page_html=page_html_block)
        
        app.logger.info(f"Test prompt length: {len(choice_prompt)} chars")
        
        choice_resp = provider.complete(choice_prompt)
        app.logger.info(f"Choice response: {choice_resp.text[:200]}")
        
        chosen_page = parse_choice(choice_resp.text, page_ids)
        
        return jsonify({
            "success": True,
            "model": model_name,
            "chosen_page": chosen_page,
            "choice_tokens": choice_resp.input_tokens + choice_resp.output_tokens,
            "choice_cost": choice_resp.estimated_cost_usd
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "trace": traceback.format_exc()
        }), 500

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

def get_next_run_number(model_name: str, page_id: str) -> int:
    max_run = 0
    if RESULTS_FILE.exists():
        with open(RESULTS_FILE, "r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row["model"] == model_name and row["which_page_won"] == page_id:
                    try:
                        run_num = int(row["run_number"])
                        if run_num > max_run:
                            max_run = run_num
                    except ValueError:
                        pass
    return max_run + 1

def run_single_experiment(model_name: str) -> Dict[str, Any]:
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
    page_ids = list(pages.keys())
    if not page_ids:
        return {"success": False, "error": "No pages found in pages/ directory"}
    
    buying_prompt_template = load_prompt("buying_question")
    interview_prompt_template = load_prompt("exit_interview")
    page_html_block = build_page_html_block(pages)
    
    try:
        provider = get_provider(model_config, pricing)
    except ValueError as e:
        return {"success": False, "error": str(e), "trace": traceback.format_exc()}
    
    choice_prompt = buying_prompt_template.format(page_html=page_html_block)
    
    # Debug: log prompt size
    app.logger.info(f"Choice prompt length: {len(choice_prompt)} chars")
    
    try:
        choice_resp = provider.complete(choice_prompt)
        app.logger.info(f"Choice response: {choice_resp.text[:200]}")
        chosen_page = parse_choice(choice_resp.text, page_ids)
    except Exception as e:
        return {"success": False, "error": f"Choice phase failed: {e}", "trace": traceback.format_exc()}
    
    interview_prompt = interview_prompt_template.format(choice=chosen_page)
    
    try:
        interview_resp = provider.complete(interview_prompt)
        interview_data = parse_interview(interview_resp.text)
    except Exception as e:
        return {"success": False, "error": f"Interview phase failed: {e}", "trace": traceback.format_exc()}
    
    run_number = get_next_run_number(model_name, chosen_page)
    
    row = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "model": model_name,
        "tier": model_config["tier"],
        "run_number": run_number,
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
    
    total_cost = choice_resp.estimated_cost_usd + interview_resp.estimated_cost_usd
    
    return {
        "success": True,
        "chosen_page": chosen_page,
        "interview_data": interview_data,
        "choice_resp": {
            "input_tokens": choice_resp.input_tokens,
            "output_tokens": choice_resp.output_tokens,
            "cost_usd": choice_resp.estimated_cost_usd
        },
        "interview_resp": {
            "input_tokens": interview_resp.input_tokens,
            "output_tokens": interview_resp.output_tokens,
            "cost_usd": interview_resp.estimated_cost_usd
        },
        "total_cost_usd": total_cost,
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

@app.route("/")
def index():
    return redirect(url_for("run_test"))

@app.route("/run-test")
def run_test():
    config = load_config()
    models = config["models"]
    pages = load_pages()
    return render_template("run_test.html", models=models, pages=pages)

@app.route("/api/run-test", methods=["POST"])
def api_run_test():
    data = request.get_json()
    model_name = data.get("model")
    if not model_name:
        return jsonify({"success": False, "error": "No model specified"}), 400
    
    result = run_single_experiment(model_name)
    return jsonify(result)

@app.route("/results")
def results():
    return render_template("results.html")

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

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)