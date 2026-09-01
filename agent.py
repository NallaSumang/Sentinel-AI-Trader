"""
AI Trading Agent Module
Uses Groq API (Llama 3.3 70B) to analyze market news and produce strict structured options trading signals.
"""

import json
import re
import requests
from typing import Dict, Any, Optional
from config import config

SYSTEM_PROMPT = """You are an institutional-grade quantitative OPTIONS trading AI agent.
Your objective is to evaluate financial news catalysts, identify the primary affected publicly traded equity symbol, and output a highly profitable, disciplined, structured options trading decision.

CRITICAL CONSTRAINTS:
1. You MUST respond with ONLY a valid, raw JSON object (no Markdown fences, no explanations outside the JSON).
2. The JSON object MUST strictly adhere to this schema:
{
  "symbol": "TICKER_SYMBOL_HERE",
  "signal": "BUY" | "SELL" | "HOLD",
  "option_type": "CALL" | "PUT" | "N/A",
  "strike_price": <realistic options strike near current market price>,
  "contracts": <integer 1-5>,
  "confidence": <float between 0.00 and 1.00>,
  "risk": "LOW" | "MEDIUM" | "HIGH",
  "max_premium": <max acceptable premium per contract>,
  "strategy_name": "<e.g. Long Call, Long Put, Protective Put>",
  "reason": "<One concise, data-backed sentence explaining the catalyst and options decision>"
}
3. OPTIONS SIGNAL RULES:
   - BULLISH catalyst: signal "BUY", option_type "CALL", strike slightly OUT OF THE MONEY (OTM) for maximum leverage.
   - BEARISH catalyst: signal "BUY", option_type "PUT", strike slightly OUT OF THE MONEY (OTM) for maximum leverage.
   - NEUTRAL/ambiguous: signal "HOLD", option_type "N/A"
4. PROFITABILITY & RISK MANDATE:
   - ONLY issue a "BUY" if the catalyst implies a severe market mispricing (e.g., massive earnings beat, surprise regulatory shift, unpriced geopolitical event).
   - Seek an asymmetric risk-reward ratio (e.g., risk $1 to make $4).
   - If the news is "good" but already priced in, you MUST output "HOLD". 
   - Keep "max_premium" below $5.00 to cap downside risk on speculative options.
5. SYMBOL RULES:
   - Extract valid US stock ticker (AAPL, NVDA, TSLA, MSFT, AMZN, GOOGL, AMD, META, SPY).
   - If general economy or no specific company, set "symbol": "SPY" and "signal": "HOLD".
6. CURRENT PRICES: NVDA ~$130, AAPL ~$230, TSLA ~$215, MSFT ~$430, AMD ~$155, AMZN ~$190, META ~$580, SPY ~$570
7. Confidence MUST be a float strictly between 0.0 and 1.0. ONLY BUY IF confidence > 0.85.
"""

def clean_json_response(raw_text: str) -> str:
    """Strips markdown code blocks, backticks, and whitespace to extract pure JSON."""
    cleaned = raw_text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()

def analyze_news_with_groq(headline: str, summary: str, source: str = "Market News") -> Dict[str, Any]:
    """
    Sends financial news to the Groq API and returns a validated structured options trading signal.
    Falls back gracefully to Demo Simulation if Groq credentials are not configured or on errors.
    """
    user_prompt = f"""Analyze the following market catalyst for an autonomous options trading decision:
Source: {source}
Headline: {headline}
Summary: {summary}

Evaluate the sentiment, calculate confidence (0.0 to 1.0), assess the risk level, determine the optimal options strategy (CALL/PUT), and output the required strict JSON decision."""

    if not config.has_groq_key():
        return simulate_ai_decision(headline, summary)

    try:
        headers = {
            "Authorization": f"Bearer {config.GROQ_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": config.GROQ_MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.1,
            "max_tokens": 1024,
            "response_format": {"type": "json_object"},
        }

        response = requests.post(config.GROQ_API_URL, headers=headers, json=payload, timeout=15)
        response.raise_for_status()
        
        data = response.json()
        raw_output = data.get("choices", [{}])[0].get("message", {}).get("content", "{}")
        cleaned = clean_json_response(raw_output)
        parsed = json.loads(cleaned)
        
        return validate_ai_decision(parsed)
        
    except Exception as e:
        simulated = simulate_ai_decision(headline, summary)
        simulated["reason"] = f"[AI Failover]: {simulated['reason']} (Groq: {str(e)[:60]}...)"
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

    option_type = str(data.get("option_type", "N/A")).upper().strip()
    if option_type not in ["CALL", "PUT", "N/A"]:
        option_type = "N/A"

    try:
        strike_price = float(data.get("strike_price", 0))
    except (ValueError, TypeError):
        strike_price = 0

    try:
        contracts = int(data.get("contracts", 1))
        contracts = max(1, min(5, contracts))
    except (ValueError, TypeError):
        contracts = 1

    try:
        max_premium = float(data.get("max_premium", 5.0))
    except (ValueError, TypeError):
        max_premium = 5.0

    strategy_name = str(data.get("strategy_name", ""))
    if not strategy_name:
        if option_type == "CALL":
            strategy_name = "Long Call"
        elif option_type == "PUT":
            strategy_name = "Long Put"
        else:
            strategy_name = "Hold"

    reason = str(data.get("reason", "Analyzed financial catalyst with options strategy."))

    return {
        "symbol": symbol,
        "signal": signal,
        "option_type": option_type,
        "strike_price": strike_price,
        "contracts": contracts,
        "confidence": round(confidence, 2),
        "risk": risk,
        "max_premium": max_premium,
        "strategy_name": strategy_name,
        "reason": reason
    }

def simulate_ai_decision(headline: str, summary: str) -> Dict[str, Any]:
    """Deterministic simulated AI analyzer for Demo Mode & offline testing with options."""
    combined = (headline + " " + summary).lower()
    
    # Identify symbol
    symbol = "SPY"
    base_prices = {"NVDA": 130, "AAPL": 230, "TSLA": 215, "MSFT": 430, "AMZN": 190, "AMD": 155, "GOOGL": 175, "META": 580, "SPY": 570}
    
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

    base_price = base_prices.get(symbol, 200)

    # Sentiment classification
    bullish_keywords = ["record", "accelerate", "growth", "expansion", "beat", "wins", "upgrade", "outperform", "orders", "surge"]
    bearish_keywords = ["delays", "regulatory", "bottleneck", "downgrade", "decline", "slowdown", "investigation", "deficit", "plunge"]

    bull_score = sum(1 for kw in bullish_keywords if kw in combined)
    bear_score = sum(1 for kw in bearish_keywords if kw in combined)

    if bull_score > bear_score:
        signal = "BUY"
        confidence = round(0.78 + min(0.18, bull_score * 0.05), 2)
        risk = "LOW" if confidence > 0.85 else "MEDIUM"
        option_type = "CALL"
        strike_price = round(base_price * 1.02)
        contracts = 3 if confidence > 0.85 else 2
        strategy_name = "Long Call"
        reason = f"Bullish catalyst for {symbol}: expanding demand. Deploying {strategy_name} @ ${strike_price} strike."
    elif bear_score > bull_score:
        signal = "BUY"
        confidence = round(0.75 + min(0.15, bear_score * 0.05), 2)
        risk = "HIGH"
        option_type = "PUT"
        strike_price = round(base_price * 0.98)
        contracts = 2
        strategy_name = "Long Put"
        reason = f"Bearish headwinds for {symbol}: supply/regulatory friction. Deploying {strategy_name} @ ${strike_price} strike."
    else:
        signal = "HOLD"
        confidence = 0.55
        risk = "MEDIUM"
        option_type = "N/A"
        strike_price = base_price
        contracts = 0
        strategy_name = "Hold — No Trade"
        reason = f"Catalyst for {symbol} is neutral; awaiting directional confirmation."

    return {
        "symbol": symbol,
        "signal": signal,
        "option_type": option_type,
        "strike_price": strike_price,
        "contracts": contracts,
        "confidence": confidence,
        "risk": risk,
        "max_premium": 5.00,
        "strategy_name": strategy_name,
        "reason": reason
    }
