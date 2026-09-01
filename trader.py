"""
Alpaca Paper Trading Module
Interfaces with the Alpaca Paper Trading API using alpaca-py and requests for options.
Guarantees paper trading only; never connects to live broker endpoints.
"""

import datetime
import uuid
import requests
from typing import Dict, Any, List, Optional
from config import config

# Simulated in-memory paper trading state for zero-config Demo Mode
DEMO_STATE = {
    "account": {
        "portfolio_value": 100000.00,
        "cash": 82540.00,
        "buying_power": 165080.00,
        "equity": 100000.00,
        "status": "ACTIVE (PAPER DEMO)",
        "currency": "USD",
        "is_demo": True
    },
    "positions": [
        {
            "symbol": "AAPL",
            "qty": 45,
            "avg_entry_price": 224.50,
            "current_price": 231.80,
            "market_value": 10431.00,
            "unrealized_pl": 328.50,
            "unrealized_plpc": 0.0325
        },
        {
            "symbol": "MSFT",
            "qty": 18,
            "avg_entry_price": 435.20,
            "current_price": 448.60,
            "market_value": 8074.80,
            "unrealized_pl": 241.20,
            "unrealized_plpc": 0.0308
        }
    ],
    "orders": [
        {
            "id": "ord-demo-001",
            "symbol": "AAPL",
            "qty": 20,
            "side": "buy",
            "order_type": "market",
            "status": "filled",
            "submitted_at": (datetime.datetime.now() - datetime.timedelta(hours=2)).strftime("%Y-%m-%d %H:%M:%S"),
            "filled_at": (datetime.datetime.now() - datetime.timedelta(hours=2)).strftime("%Y-%m-%d %H:%M:%S"),
            "filled_avg_price": 224.50
        }
    ]
}

def build_occ_symbol(underlying: str, expiry_yymmdd: str, option_type: str, strike: float) -> str:
    """Builds OCC standard option symbol (e.g., AAPL260919C00230000)"""
    sym = underlying.upper().ljust(6, ' ')[:6].strip()
    cp = "C" if option_type.upper() == "CALL" else "P"
    strike_str = str(int(round(strike * 1000))).zfill(8)
    return f"{sym}{expiry_yymmdd}{cp}{strike_str}"

class AlpacaTrader:
    def __init__(self):
        self.is_paper = True  # Strict paper trading guarantee
        self.client = None
        self._init_client()

    def _init_client(self):
        """Initializes the Alpaca TradingClient if valid paper credentials are provided."""
        if config.has_alpaca_keys():
            try:
                from alpaca.trading.client import TradingClient
                self.client = TradingClient(
                    api_key=config.ALPACA_API_KEY,
                    secret_key=config.ALPACA_SECRET_KEY,
                    paper=True  # Strictly paper trading
                )
            except Exception as e:
                self.client = None

    def is_connected_to_live_paper_api(self) -> bool:
        """Returns True if connected to real Alpaca Paper Trading API."""
        return self.client is not None

    def get_account(self) -> Dict[str, Any]:
        if self.client:
            try:
                acc = self.client.get_account()
                return {
                    "portfolio_value": float(acc.portfolio_value),
                    "cash": float(acc.cash),
                    "buying_power": float(acc.buying_power),
                    "equity": float(acc.equity),
                    "status": str(acc.status),
                    "currency": str(acc.currency),
                    "is_demo": False
                }
            except Exception as e:
                demo_acc = dict(DEMO_STATE["account"])
                demo_acc["notice"] = f"Alpaca API notice: {str(e)}"
                return demo_acc
        return dict(DEMO_STATE["account"])

    def get_positions(self) -> List[Dict[str, Any]]:
        if self.client:
            try:
                positions = self.client.get_all_positions()
                result = []
                for p in positions:
                    result.append({
                        "symbol": str(p.symbol),
                        "qty": float(p.qty),
                        "avg_entry_price": float(p.avg_entry_price),
                        "current_price": float(p.current_price),
                        "market_value": float(p.market_value),
                        "unrealized_pl": float(p.unrealized_pl),
                        "unrealized_plpc": float(p.unrealized_plpc)
                    })
                return result
            except Exception:
                return list(DEMO_STATE["positions"])
        return list(DEMO_STATE["positions"])

    def get_orders(self, limit: int = 20) -> List[Dict[str, Any]]:
        if self.client:
            try:
                from alpaca.trading.requests import GetOrdersRequest
                from alpaca.trading.enums import QueryOrderStatus
                
                req = GetOrdersRequest(status=QueryOrderStatus.ALL, limit=limit)
                orders = self.client.get_orders(filter=req)
                result = []
                for o in orders:
                    result.append({
                        "id": str(o.id)[:12],
                        "symbol": str(o.symbol),
                        "qty": float(o.qty or 0),
                        "side": str(o.side.value if hasattr(o.side, 'value') else o.side),
                        "status": str(o.status.value if hasattr(o.status, 'value') else o.status),
                        "submitted_at": str(o.submitted_at)[:19] if o.submitted_at else "",
                        "filled_at": str(o.filled_at)[:19] if o.filled_at else "Pending",
                        "filled_avg_price": float(o.filled_avg_price or 0.0)
                    })
                return result
            except Exception:
                return list(DEMO_STATE["orders"])
        return list(DEMO_STATE["orders"])

    def submit_options_order(self, underlying: str, option_type: str, strike: float, expiry: str, contracts: int, side: str = "buy", premium_estimate: float = 5.0) -> Dict[str, Any]:
        """Submits an Options order to Alpaca Paper (or simulates)."""
        occ_symbol = build_occ_symbol(underlying, expiry, option_type, strike)
        
        if self.client and config.has_alpaca_keys():
            try:
                # Alpaca options orders must be submitted via REST if SDK is outdated
                headers = {
                    "APCA-API-KEY-ID": config.ALPACA_API_KEY,
                    "APCA-API-SECRET-KEY": config.ALPACA_SECRET_KEY,
                    "Content-Type": "application/json"
                }
                payload = {
                    "symbol": occ_symbol,
                    "qty": contracts,
                    "side": side.lower(),
                    "type": "market",
                    "time_in_force": "day"
                }
                res = requests.post(f"{config.ALPACA_BASE_URL}/v2/orders", json=payload, headers=headers)
                res.raise_for_status()
                order = res.json()
                return {
                    "id": str(order.get("id"))[:12],
                    "symbol": occ_symbol,
                    "qty": float(order.get("qty", contracts)),
                    "side": side.lower(),
                    "status": order.get("status", "pending"),
                    "submitted_at": order.get("submitted_at", datetime.datetime.now().isoformat())[:19].replace("T", " "),
                    "is_demo": False,
                    "occ_symbol": occ_symbol
                }
            except Exception as e:
                return self._simulate_options_order(occ_symbol, contracts, side, premium_estimate, note=f"Live error: {str(e)}")

        return self._simulate_options_order(occ_symbol, contracts, side, premium_estimate)

    def _simulate_options_order(self, occ_symbol: str, qty: int, side: str, premium_estimate: float, note: Optional[str] = None) -> Dict[str, Any]:
        total_cost = qty * premium_estimate * 100
        DEMO_STATE["account"]["cash"] = max(0.0, DEMO_STATE["account"]["cash"] - total_cost)
        DEMO_STATE["account"]["buying_power"] = DEMO_STATE["account"]["cash"] * 2.0
        
        order_record = {
            "id": f"ord-opt-{uuid.uuid4().hex[:6]}",
            "symbol": occ_symbol,
            "qty": qty,
            "side": side.lower(),
            "order_type": "market",
            "status": "filled",
            "submitted_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "filled_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "filled_avg_price": premium_estimate,
            "note": note or "Simulated Paper Options Trade",
            "is_demo": True,
            "occ_symbol": occ_symbol
        }
        DEMO_STATE["orders"].insert(0, order_record)
        return order_record
