"""
Configuration Module for Alpaca AI Trading Agent
Loads environment variables and sets conservative trading & risk defaults.
Uses Groq API for AI-powered analysis.
"""

import os
from dataclasses import dataclass
from dotenv import load_dotenv

# Load variables from .env if present
load_dotenv()

@dataclass
class TradingConfig:
    # API Keys
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    ALPACA_API_KEY: str = os.getenv("ALPACA_API_KEY", "")
    ALPACA_SECRET_KEY: str = os.getenv("ALPACA_SECRET_KEY", "")
    
    # Alpaca Environment: STRICTLY Paper Trading
    ALPACA_BASE_URL: str = os.getenv("ALPACA_BASE_URL", "https://paper-api.alpaca.markets")
    IS_PAPER: bool = True  # Hardcoded safeguard to guarantee paper trading only
    
    # AI Agent Parameters
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    GROQ_API_URL: str = "https://api.groq.com/openai/v1/chat/completions"
    
    # Conservative Risk Management Defaults
    MIN_CONFIDENCE: float = float(os.getenv("RISK_MIN_CONFIDENCE", "0.70"))
    MAX_POSITION_PCT: float = float(os.getenv("RISK_MAX_POSITION_PCT", "0.10"))  # Max 10% of portfolio per asset
    MAX_ORDER_QTY: int = int(os.getenv("RISK_MAX_ORDER_QTY", "25"))             # Max shares per order
    MAX_TRADES_PER_SESSION: int = int(os.getenv("RISK_MAX_TRADES_PER_SESSION", "10"))
    DEFAULT_TRADE_QTY: int = int(os.getenv("DEFAULT_TRADE_QTY", "5"))

    def has_groq_key(self) -> bool:
        return bool(self.GROQ_API_KEY and self.GROQ_API_KEY.strip() and not self.GROQ_API_KEY.startswith("your_"))



    def has_alpaca_keys(self) -> bool:
        has_key = bool(self.ALPACA_API_KEY and self.ALPACA_API_KEY.strip() and not self.ALPACA_API_KEY.startswith("your_"))
        has_sec = bool(self.ALPACA_SECRET_KEY and self.ALPACA_SECRET_KEY.strip() and not self.ALPACA_SECRET_KEY.startswith("your_"))
        return has_key and has_sec

    def is_demo_mode_needed(self) -> bool:
        return not (self.has_groq_key() and self.has_alpaca_keys())

# Global singleton configuration instance
config = TradingConfig()
