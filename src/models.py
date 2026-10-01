from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, Any
import json
import re
import os
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

@dataclass
class ModelResponse:
    text: str
    input_tokens: int
    output_tokens: int
    estimated_cost_usd: float

class ModelProvider(ABC):
    def __init__(self, model_name: str, pricing: Dict[str, Dict[str, float]]):
        self.model_name = model_name
        self.pricing = pricing.get(model_name, {"input": 0, "output": 0})
    
    @abstractmethod
    def complete(self, prompt: str) -> ModelResponse:
        pass
    
    def _calculate_cost(self, input_tokens: int, output_tokens: int) -> float:
        input_cost = (input_tokens / 1_000_000) * self.pricing.get("input", 0)
        output_cost = (output_tokens / 1_000_000) * self.pricing.get("output", 0)
        return input_cost + output_cost

class OpenAIProvider(ModelProvider):
    def __init__(self, model_name: str, pricing: Dict[str, Dict[str, float]], api_key: str):
        super().__init__(model_name, pricing)
        from openai import OpenAI
        self.client = OpenAI(api_key=api_key)
    
    @retry(
        wait=wait_exponential(multiplier=1, min=2, max=10),
        stop=stop_after_attempt(3),
        retry=retry_if_exception_type(Exception)
    )
    def complete(self, prompt: str) -> ModelResponse:
        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=2000
        )
        text = response.choices[0].message.content
        input_tokens = response.usage.prompt_tokens
        output_tokens = response.usage.completion_tokens
        cost = self._calculate_cost(input_tokens, output_tokens)
        return ModelResponse(text=text, input_tokens=input_tokens, output_tokens=output_tokens, estimated_cost_usd=cost)

class AnthropicProvider(ModelProvider):
    def __init__(self, model_name: str, pricing: Dict[str, Dict[str, float]], api_key: str):
        super().__init__(model_name, pricing)
        from anthropic import Anthropic
        self.client = Anthropic(api_key=api_key)
    
    @retry(
        wait=wait_exponential(multiplier=1, min=2, max=10),
        stop=stop_after_attempt(3),
        retry=retry_if_exception_type(Exception)
    )
    def complete(self, prompt: str) -> ModelResponse:
        response = self.client.messages.create(
            model=self.model_name,
            max_tokens=2000,
            temperature=0.1,
            messages=[{"role": "user", "content": prompt}]
        )
        text = response.content[0].text
        input_tokens = response.usage.input_tokens
        output_tokens = response.usage.output_tokens
        cost = self._calculate_cost(input_tokens, output_tokens)
        return ModelResponse(text=text, input_tokens=input_tokens, output_tokens=output_tokens, estimated_cost_usd=cost)

class GoogleProvider(ModelProvider):
    def __init__(self, model_name: str, pricing: Dict[str, Dict[str, float]], api_key: str):
        super().__init__(model_name, pricing)
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model_name)
    
    @retry(
        wait=wait_exponential(multiplier=1, min=2, max=10),
        stop=stop_after_attempt(3),
        retry=retry_if_exception_type(Exception)
    )
    def complete(self, prompt: str) -> ModelResponse:
        response = self.model.generate_content(
            prompt,
            generation_config={"temperature": 0.1, "max_output_tokens": 2000}
        )
        text = response.text
        usage = response.usage_metadata
        input_tokens = usage.prompt_token_count
        output_tokens = usage.candidates_token_count
        cost = self._calculate_cost(input_tokens, output_tokens)
        return ModelResponse(text=text, input_tokens=input_tokens, output_tokens=output_tokens, estimated_cost_usd=cost)

def get_provider(model_config: Dict[str, Any], pricing: Dict[str, Dict[str, float]]) -> ModelProvider:
    provider_type = model_config["provider"]
    model_name = model_config["name"]
    api_key_env = {
        "openai": "OPENAI_API_KEY",
        "anthropic": "ANTHROPIC_API_KEY",
        "google": "GOOGLE_API_KEY"
    }
    api_key = os.getenv(api_key_env.get(provider_type, ""))
    if not api_key:
        raise ValueError(f"API key not found for {provider_type}. Set {api_key_env[provider_type]} in .env")
    
    if provider_type == "openai":
        return OpenAIProvider(model_name, pricing, api_key)
    elif provider_type == "anthropic":
        return AnthropicProvider(model_name, pricing, api_key)
    elif provider_type == "google":
        return GoogleProvider(model_name, pricing, api_key)
    else:
        raise ValueError(f"Unknown provider: {provider_type}")

def parse_choice(response_text: str, valid_page_ids: list) -> str:
    json_match = re.search(r'\{[^}]*"choice"[^}]*\}', response_text)
    if not json_match:
        raise ValueError("No JSON with 'choice' key found in response")
    try:
        data = json.loads(json_match.group())
        choice = data.get("choice", "").strip()
        if choice not in valid_page_ids:
            raise ValueError(f"Invalid choice: {choice}. Must be one of {valid_page_ids}")
        return choice
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse choice JSON: {e}")

def parse_interview(response_text: str) -> Dict[str, Any]:
    json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
    if not json_match:
        raise ValueError("No JSON object found in response")
    try:
        data = json.loads(json_match.group())
        required_keys = ["q1_price", "q2_reviews", "q3_credentials", "q4_description", "q5_clarity", "q6_open"]
        for key in required_keys:
            if key not in data:
                raise ValueError(f"Missing required key: {key}")
        for key in ["q1_price", "q2_reviews", "q3_credentials", "q4_description", "q5_clarity"]:
            val = data[key]
            if not isinstance(val, int) or not (1 <= val <= 5):
                raise ValueError(f"{key} must be integer 1-5, got: {val}")
        if not isinstance(data["q6_open"], str):
            raise ValueError("q6_open must be a string")
        return data
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse interview JSON: {e}")