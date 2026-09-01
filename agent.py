"""
AI Trading Agent Module
Uses Google Gemini API to analyze market news and produce strict structured trading signals.
"""

import json
import re
from typing import Dict, Any, Optional
from config import config

SYSTEM_PROMPT = """You are an institutional financial analyst and quantitative trading AI agent.
Your objective is to evaluate financial news headlines and summaries, identify the primary affected publicly traded equity symbol, and output a disciplined, structured trading decision.

CRITICAL CONSTRAINTS:
1. You MUST respond with ONLY a valid, raw JSON object (no Markdown fences, no explanations outside the JSON).
2. The JSON object MUST strictly adhere to this schema:
{
  "symbol": "TICKER_SYMBOL_HERE",
  "signal": "BUY" | "SELL" | "HOLD",
  "confidence": <float between 0.00 and 1.00>,
  "risk": "LOW" | "MEDIUM" | "HIGH",
  "reason": "<One concise, data-backed sentence explaining the catalyst and decision>"
}
3. SIGNAL RULES:
   - "BUY": Substantial positive catalyst (earnings beat, massive revenue expansion, breakthrough product, rating upgrade).
   - "SELL": Strong negative catalyst (guidance reduction, SEC investigation, severe supply disruption, structural margin decline).
   - "HOLD": Neutral news, macro data without single-company impact, ambiguous impact, or low conviction.
4. SYMBOL RULES:
   - Extract the valid US stock ticker (e.g., AAPL, NVDA, TSLA, MSFT, AMZN, GOOGL, AMD, META).
   - NEVER invent or hallucinate a ticker symbol.
   - If the news discusses general economy, broad sentiment, or no specific company can be identified with confidence, set "symbol": "SPY" or "HOLD" and set "signal": "HOLD".
5. Confidence MUST be a float strictly between 0.0 and 1.0.
"""

def clean_json_response(raw_text: str) -> str:
    """Strips markdown code blocks, backticks, and whitespace to extract pure JSON."""
    cleaned = raw_text.strip()
    # Remove markdown code fences like ```json ... ```
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()

def analyze_news_with_gemini(headline: str, summary: str, source: str = "Market News") -> Dict[str, Any]:
    """
    Sends financial news to the Gemini AI model and returns a validated structured trading signal.
    Falls back gracefully to Demo Simulation if Gemini credentials are not configured or on network errors.
    """
    user_prompt = f"""Analyze the following market catalyst:
Source: {source}
Headline: {headline}
Summary: {summary}

Evaluate the sentiment, calculate confidence (0.0 to 1.0), assess the risk level, and output the required strict JSON decision."""

    if not config.has_gemini_key():
        # Safe deterministic Demo Mode simulation
        return simulate_ai_decision(headline, summary)

    try:
        # Modern google-genai SDK
        try:
            from google import genai
            from google.genai import types
            client = genai.Client(api_key=config.GEMINI_API_KEY)
            response = client.models.generate_content(
                model=config.GEMINI_MODEL,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    temperature=0.2,
                    response_mime_type="application/json"
                )
            )
            raw_output = response.text or ""
        except ImportError:
            # Fallback for google.generativeai legacy package
            import google.generativeai as legacy_genai
            legacy_genai.configure(api_key=config.GEMINI_API_KEY)
            model = legacy_genai.GenerativeModel(
                model_name=config.GEMINI_MODEL,
                system_instruction=SYSTEM_PROMPT,
                generation_config={"temperature": 0.2, "response_mime_type": "application/json"}
            )
            res = model.generate_content(user_prompt)
            raw_output = res.text or ""

        cleaned = clean_json_response(raw_output)
        parsed = json.loads(cleaned)
        
        # Validate output schema
        return validate_ai_decision(parsed)
        
    except Exception as e:
        # Fallback to intelligent rule-based simulation if API call fails
        simulated = simulate_ai_decision(headline, summary)
        simulated["reason"] = f"[AI Failover Mode]: {simulated['reason']} (API Notice: {str(e)[:60]}...)"
        return simulated

def validate_ai_decision(data: Dict[str, Any]) -> Dict[str, Any]:
    """Ensures the dictionary complies strictly with the hackathon specification."""
    symbol = str(data.get("symbol", "SPY")).upper().strip()
    signal = str(data.get("signal", "HOLD")).upper().strip()
    if signal not in ["BUY", "SELL", "HOLD"]:
        signal = "HOLD"
        
    try:
        confidence = float(data.get("confidence", 0.50))
        confidence = max(0.0, min(1.0, confidence))
    except (ValueError, TypeError):
        confidence = 0.50

    risk = str(data.get("risk", "MEDIUM")).upper().strip()
    if risk not in ["LOW", "MEDIUM", "HIGH"]:
        risk = "MEDIUM"

    reason = str(data.get("reason", "Analyzed financial catalyst based on market fundamentals."))

    return {
        "symbol": symbol,
        "signal": signal,
        "confidence": round(confidence, 2),
        "risk": risk,
        "reason": reason
    }

def simulate_ai_decision(headline: str, summary: str) -> Dict[str, Any]:
    """Deterministic simulated AI analyzer for Demo Mode & offline testing."""
    combined = (headline + " " + summary).lower()
    
    # Identify symbol
    symbol = "SPY"
    if "nvidia" in combined or "nvda" in combined or "blackwell" in combined:
        symbol = "NVDA"
    elif "apple" in combined or "aapl" in combined or "iphone" in combined or "app store" in combined:
        symbol = "AAPL"
    elif "tesla" in combined or "tsla" in combined or "musk" in combined:
        symbol = "TSLA"
    elif "microsoft" in combined or "msft" in combined or "azure" in combined:
        symbol = "MSFT"
    elif "amazon" in combined or "amzn" in combined or "aws" in combined:
        symbol = "AMZN"
    elif "google" in combined or "googl" in combined or "alphabet" in combined:
        symbol = "GOOGL"
    elif "amd" in combined:
        symbol = "AMD"

    # Sentiment classification
    bullish_keywords = ["record", "accelerate", "growth", "expansion", "beat", "wins", "upgrade", "outperform", "orders", "surge"]
    bearish_keywords = ["delays", "regulatory", "bottleneck", "downgrade", "decline", "slowdown", "investigation", "deficit", "plunge"]

    bull_score = sum(1 for kw in bullish_keywords if kw in combined)
    bear_score = sum(1 for kw in bearish_keywords if kw in combined)

    if bull_score > bear_score:
        signal = "BUY"
        confidence = round(0.78 + min(0.18, bull_score * 0.05), 2)
        risk = "LOW" if confidence > 0.85 else "MEDIUM"
        reason = f"Strong bullish catalyst detected for {symbol} with expanding revenue/order momentum."
    elif bear_score > bull_score:
        signal = "SELL"
        confidence = round(0.75 + min(0.15, bear_score * 0.05), 2)
        risk = "HIGH"
        reason = f"Operational headwinds and supply/regulatory friction indicate downward risk for {symbol}."
    else:
        signal = "HOLD"
        confidence = 0.55
        risk = "MEDIUM"
        reason = f"Catalyst metrics are neutral or macroeconomic; waiting for clear directional confirmation on {symbol}."

    return {
        "symbol": symbol,
        "signal": signal,
        "confidence": confidence,
        "risk": risk,
        "reason": reason
    }
