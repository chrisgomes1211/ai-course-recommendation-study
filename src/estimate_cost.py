import yaml
from pathlib import Path

def load_config() -> dict:
    with open("config.yaml", "r") as f:
        return yaml.safe_load(f)

def count_pages() -> int:
    return len(list(Path("pages").glob("*.html")))

def estimate_cost():
    config = load_config()
    models = config["models"]
    runs_per_condition = config["runs_per_condition"]
    budget_cap = config["budget_cap_usd"]
    pricing = config["pricing"]
    avg_prompt = config.get("avg_prompt_tokens", 3000)
    avg_choice_completion = config.get("avg_completion_tokens_choice", 50)
    avg_interview_completion = config.get("avg_completion_tokens_interview", 400)
    
    n_pages = count_pages()
    n_models = len(models)
    n_conditions = n_pages
    
    total_choice_calls = n_models * n_conditions * runs_per_condition
    total_interview_calls = total_choice_calls
    total_calls = total_choice_calls + total_interview_calls
    
    print(f"=== Cost Estimation ===")
    print(f"Models: {n_models}")
    print(f"Pages (conditions): {n_conditions}")
    print(f"Runs per condition: {runs_per_condition}")
    print(f"Total choice calls: {total_choice_calls}")
    print(f"Total interview calls: {total_interview_calls}")
    print(f"Total API calls: {total_calls}")
    print()
    
    print(f"Token assumptions:")
    print(f"  Avg prompt tokens: {avg_prompt:,}")
    print(f"  Avg choice completion tokens: {avg_choice_completion:,}")
    print(f"  Avg interview completion tokens: {avg_interview_completion:,}")
    print()
    
    total_estimated_cost = 0.0
    
    print(f"{'Model':<35} {'Tier':<6} {'Choice Calls':>12} {'Interview Calls':>14} {'Est. Cost':>12}")
    print("-" * 85)
    
    for model_config in models:
        name = model_config["name"]
        tier = model_config["tier"]
        model_pricing = pricing.get(name, {"input": 0, "output": 0})
        input_price = model_pricing.get("input", 0)
        output_price = model_pricing.get("output", 0)
        
        if input_price == 0 and output_price == 0:
            print(f"{name:<35} {tier:<6} {'NO PRICING DATA':>28}")
            continue
        
        choice_calls = n_conditions * runs_per_condition
        interview_calls = choice_calls
        
        choice_input_tokens = choice_calls * avg_prompt
        choice_output_tokens = choice_calls * avg_choice_completion
        interview_input_tokens = interview_calls * avg_prompt
        interview_output_tokens = interview_calls * avg_interview_completion
        
        total_input_tokens = choice_input_tokens + interview_input_tokens
        total_output_tokens = choice_output_tokens + interview_output_tokens
        
        cost = (total_input_tokens / 1_000_000) * input_price + (total_output_tokens / 1_000_000) * output_price
        total_estimated_cost += cost
        
        print(f"{name:<35} {tier:<6} {choice_calls:>12,} {interview_calls:>14,} ${cost:>11.2f}")
    
    print("-" * 85)
    print(f"{'TOTAL':<35} {'':<6} {total_choice_calls:>12,} {total_interview_calls:>14,} ${total_estimated_cost:>11.2f}")
    print()
    print(f"Budget cap: ${budget_cap:.2f}")
    print(f"Estimated total: ${total_estimated_cost:.2f}")
    print(f"Remaining budget: ${budget_cap - total_estimated_cost:.2f}")
    
    if total_estimated_cost > budget_cap:
        print("\n⚠ WARNING: Estimated cost exceeds budget cap!")
        return 1
    else:
        print("\n✓ Estimated cost within budget.")
        return 0

if __name__ == "__main__":
    exit(estimate_cost())