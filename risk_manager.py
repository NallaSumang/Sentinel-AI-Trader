"""
Risk Management Module
Enforces strict institutional capital preservation rules before any paper order reaches Alpaca.
Includes updated logic for options trading risk control.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from config import config

@dataclass
class RiskCheckResult:
    approved: bool
    symbol: str
    signal: str
    option_type: str
    requested_qty: int
    approved_qty: int
    passed_checks: List[str] = field(default_factory=list)
    failed_checks: List[str] = field(default_factory=list)
    rejection_reason: Optional[str] = None

class RiskManager:
    def __init__(
        self,
        min_confidence: float = config.MIN_CONFIDENCE,
        max_position_pct: float = config.MAX_POSITION_PCT,
        max_order_qty: int = config.MAX_ORDER_QTY,
        max_trades_per_session: int = config.MAX_TRADES_PER_SESSION
    ):
        self.min_confidence = min_confidence
        self.max_position_pct = max_position_pct
        self.max_order_qty = max_order_qty
        self.max_trades_per_session = max_trades_per_session
        self.session_trades_count = 0

    def reset_session(self):
        """Resets session trade counter."""
        self.session_trades_count = 0

    def increment_session_trades(self):
        """Records an approved & executed trade."""
        self.session_trades_count += 1

    def evaluate_decision(
        self,
        ai_decision: Dict[str, Any],
        account_info: Dict[str, Any],
        current_positions: List[Dict[str, Any]]
    ) -> RiskCheckResult:
        """
        Runs comprehensive multi-stage risk assessment on the AI's signal (Options-first).
        All rules must pass for an order to be approved.
        """
        symbol = str(ai_decision.get("symbol", "")).upper()
        signal = str(ai_decision.get("signal", "HOLD")).upper()
        option_type = str(ai_decision.get("option_type", "N/A")).upper()
        confidence = float(ai_decision.get("confidence", 0.0))
        contracts = int(ai_decision.get("contracts", 1))
        max_premium = float(ai_decision.get("max_premium", 5.0))
        
        passed: List[str] = []
        failed: List[str] = []

        # 1. HOLD Signal Check
        if signal == "HOLD":
            return RiskCheckResult(
                approved=False,
                symbol=symbol,
                signal=signal,
                option_type=option_type,
                requested_qty=contracts,
                approved_qty=0,
                passed_checks=["Signal is valid action"],
                failed_checks=["Action is HOLD (no execution required)"],
                rejection_reason="AI evaluated signal as HOLD. No market order triggered."
            )

        if signal not in ["BUY", "SELL"]:
            return RiskCheckResult(
                approved=False, symbol=symbol, signal=signal, option_type=option_type,
                requested_qty=contracts, approved_qty=0,
                failed_checks=[f"Unrecognized signal '{signal}'"],
                rejection_reason=f"Invalid signal type: {signal}"
            )
        
        if option_type not in ["CALL", "PUT"]:
            return RiskCheckResult(
                approved=False, symbol=symbol, signal=signal, option_type=option_type,
                requested_qty=contracts, approved_qty=0,
                failed_checks=[f"Invalid option type '{option_type}'"],
                rejection_reason=f"Invalid option type: {option_type}"
            )

        passed.append(f"Signal validation passed: {signal} {option_type}")

        # 2. AI Confidence Threshold Check
        if confidence < self.min_confidence:
            failed.append(f"AI Confidence {confidence:.2f} is below minimum threshold {self.min_confidence:.2f}")
        else:
            passed.append(f"Confidence check passed: {confidence:.2f} >= {self.min_confidence:.2f}")

        # 3. Session Trade Limit Check
        if self.session_trades_count >= self.max_trades_per_session:
            failed.append(f"Session trade limit reached ({self.session_trades_count}/{self.max_trades_per_session})")
        else:
            passed.append(f"Session trade headroom available ({self.session_trades_count}/{self.max_trades_per_session})")

        # 4. Maximum Order Quantity Cap Check
        final_contracts = min(contracts, 5) # Max 5 contracts per trade for safety
        if contracts > 5:
            passed.append(f"Order contracts capped from {contracts} to max allowed 5")
        else:
            passed.append(f"Order contracts ({contracts}) is within max limit (5)")

        # Portfolio metrics for sizing
        cash = float(account_info.get("cash", 100000.0))

        # 5. BUY Options Rules: Cash & Premium Limits
        if signal == "BUY":
            total_premium_cost = final_contracts * max_premium * 100
            
            # Options specific cash check: premium cannot exceed 5% of cash
            max_cash_risk = cash * 0.05
            if total_premium_cost > max_cash_risk:
                failed.append(f"Premium cost (${total_premium_cost:,.2f}) exceeds 5% of cash (${max_cash_risk:,.2f})")
            else:
                passed.append(f"Premium risk: ${total_premium_cost:,.2f} within 5% cash limit")

            passed.append(f"Defined risk: Max loss capped at premium paid (${total_premium_cost:,.2f})")

        # Final Approval Determination
        is_approved = (len(failed) == 0)
        rejection_msg = " | ".join(failed) if failed else None

        return RiskCheckResult(
            approved=is_approved,
            symbol=symbol,
            signal=signal,
            option_type=option_type,
            requested_qty=contracts,
            approved_qty=final_contracts if is_approved else 0,
            passed_checks=passed,
            failed_checks=failed,
            rejection_reason=rejection_msg
        )
