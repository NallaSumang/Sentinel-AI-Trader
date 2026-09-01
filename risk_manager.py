"""
Risk Management Module
Enforces strict institutional capital preservation rules before any paper order reaches Alpaca.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from config import config

@dataclass
class RiskCheckResult:
    approved: bool
    symbol: str
    signal: str
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
        current_positions: List[Dict[str, Any]],
        estimated_price: float = 150.0,
        requested_qty: Optional[int] = None
    ) -> RiskCheckResult:
        """
        Runs comprehensive multi-stage risk assessment on the AI's signal.
        All rules must pass for an order to be approved.
        """
        symbol = str(ai_decision.get("symbol", "")).upper()
        signal = str(ai_decision.get("signal", "HOLD")).upper()
        confidence = float(ai_decision.get("confidence", 0.0))
        
        qty = requested_qty if requested_qty and requested_qty > 0 else config.DEFAULT_TRADE_QTY
        
        passed: List[str] = []
        failed: List[str] = []

        # 1. HOLD Signal Check
        if signal == "HOLD":
            return RiskCheckResult(
                approved=False,
                symbol=symbol,
                signal=signal,
                requested_qty=qty,
                approved_qty=0,
                passed_checks=["Signal is valid action"],
                failed_checks=["Action is HOLD (no execution required)"],
                rejection_reason="AI evaluated signal as HOLD. No market order triggered."
            )

        if signal not in ["BUY", "SELL"]:
            return RiskCheckResult(
                approved=False,
                symbol=symbol,
                signal=signal,
                requested_qty=qty,
                approved_qty=0,
                failed_checks=[f"Unrecognized signal '{signal}'"],
                rejection_reason=f"Invalid signal type: {signal}"
            )
        passed.append(f"Signal validation passed: {signal}")

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
        final_qty = min(qty, self.max_order_qty)
        if qty > self.max_order_qty:
            passed.append(f"Order quantity capped from {qty} to max allowed {self.max_order_qty}")
        else:
            passed.append(f"Order quantity ({qty}) is within max limit ({self.max_order_qty})")

        # Portfolio metrics for sizing
        portfolio_val = float(account_info.get("portfolio_value", 100000.0))
        buying_power = float(account_info.get("buying_power", account_info.get("cash", 100000.0)))
        cash = float(account_info.get("cash", 100000.0))

        # Find existing position for this symbol
        existing_pos = next((p for p in current_positions if p.get("symbol") == symbol), None)
        existing_qty = int(float(existing_pos.get("qty", 0))) if existing_pos else 0
        existing_market_value = float(existing_pos.get("market_value", 0.0)) if existing_pos else 0.0

        # 5. BUY Order Rules: Cash & Concentration Checks
        if signal == "BUY":
            est_order_cost = final_qty * estimated_price
            
            # Buying power / cash check
            if est_order_cost > cash:
                failed.append(f"Insufficient cash: Required ${est_order_cost:,.2f}, Available Cash: ${cash:,.2f}")
            else:
                passed.append(f"Cash liquidity verified (Cost: ${est_order_cost:,.2f} <= Cash: ${cash:,.2f})")

            # Max Portfolio Allocation / Position Size Limit Check
            max_allowed_position_value = portfolio_val * self.max_position_pct
            post_trade_position_value = existing_market_value + est_order_cost
            if post_trade_position_value > max_allowed_position_value:
                failed.append(
                    f"Position concentration limit exceeded: Projected ${post_trade_position_value:,.2f} > max allowed ${max_allowed_position_value:,.2f} ({int(self.max_position_pct*100)}% of portfolio)"
                )
            else:
                passed.append(f"Portfolio concentration within safety limit ({int(self.max_position_pct*100)}% cap)")

        # 6. SELL Order Rules: Position Inventory Check
        if signal == "SELL":
            if existing_qty <= 0:
                failed.append(f"Cannot execute SELL for {symbol}: No existing long position in account.")
            elif existing_qty < final_qty:
                final_qty = existing_qty
                passed.append(f"Sell quantity adjusted to match available inventory ({existing_qty} shares)")
            else:
                passed.append(f"Position inventory verified ({existing_qty} shares held)")

        # Final Approval Determination
        is_approved = (len(failed) == 0)
        rejection_msg = " | ".join(failed) if failed else None

        return RiskCheckResult(
            approved=is_approved,
            symbol=symbol,
            signal=signal,
            requested_qty=qty,
            approved_qty=final_qty if is_approved else 0,
            passed_checks=passed,
            failed_checks=failed,
            rejection_reason=rejection_msg
        )
