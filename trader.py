"""
Alpaca Paper Trading Module
Interfaces with the Alpaca Paper Trading API using alpaca-py.
Guarantees paper trading only; never connects to live broker endpoints.
"""

import datetime
import uuid
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
        """Retrieves paper account balance and equity information."""
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
                # Fail gracefully to demo mock with error notification
                demo_acc = dict(DEMO_STATE["account"])
                demo_acc["notice"] = f"Alpaca API notice: {str(e)}"
                return demo_acc
                
        return dict(DEMO_STATE["account"])

    def get_positions(self) -> List[Dict[str, Any]]:
        """Retrieves list of all current open paper positions."""
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

    def submit_buy_order(self, symbol: str, qty: int, estimated_price: float = 180.0) -> Dict[str, Any]:
        """Submits a paper BUY market order to Alpaca (or simulated in demo mode)."""
        symbol = symbol.upper()
        
        if self.client:
            try:
                from alpaca.trading.requests import MarketOrderRequest
                from alpaca.trading.enums import OrderSide, TimeInForce
                
                req = MarketOrderRequest(
                    symbol=symbol,
                    qty=qty,
                    side=OrderSide.BUY,
                    time_in_force=TimeInForce.DAY
                )
                order = self.client.submit_order(order_data=req)
                return {
                    "id": str(order.id),
                    "symbol": str(order.symbol),
                    "qty": float(order.qty),
                    "side": "buy",
                    "status": str(order.status),
                    "submitted_at": str(order.submitted_at or datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
                    "is_demo": False
                }
            except Exception as e:
                # If market is closed or API errors, record in demo fallback
                return self._simulate_buy(symbol, qty, estimated_price, note=f"Alpaca response: {str(e)}")

        return self._simulate_buy(symbol, qty, estimated_price)

    def submit_sell_order(self, symbol: str, qty: int, estimated_price: float = 180.0) -> Dict[str, Any]:
        """Submits a paper SELL market order to Alpaca (or simulated in demo mode)."""
        symbol = symbol.upper()

        if self.client:
            try:
                from alpaca.trading.requests import MarketOrderRequest
                from alpaca.trading.enums import OrderSide, TimeInForce
                
                req = MarketOrderRequest(
                    symbol=symbol,
                    qty=qty,
                    side=OrderSide.SELL,
                    time_in_force=TimeInForce.DAY
                )
                order = self.client.submit_order(order_data=req)
                return {
                    "id": str(order.id),
                    "symbol": str(order.symbol),
                    "qty": float(order.qty),
                    "side": "sell",
                    "status": str(order.status),
                    "submitted_at": str(order.submitted_at or datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
                    "is_demo": False
                }
            except Exception as e:
                return self._simulate_sell(symbol, qty, estimated_price, note=f"Alpaca response: {str(e)}")

        return self._simulate_sell(symbol, qty, estimated_price)

    def get_orders(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Retrieves recent paper trading orders."""
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

    # Internal Demo Mode simulation helpers
    def _simulate_buy(self, symbol: str, qty: int, price: float, note: Optional[str] = None) -> Dict[str, Any]:
        cost = qty * price
        DEMO_STATE["account"]["cash"] = max(0.0, DEMO_STATE["account"]["cash"] - cost)
        DEMO_STATE["account"]["buying_power"] = DEMO_STATE["account"]["cash"] * 2.0
        
        # Update positions
        pos = next((p for p in DEMO_STATE["positions"] if p["symbol"] == symbol), None)
        if pos:
            total_qty = pos["qty"] + qty
            pos["avg_entry_price"] = round(((pos["qty"] * pos["avg_entry_price"]) + (qty * price)) / total_qty, 2)
            pos["qty"] = total_qty
            pos["current_price"] = price
            pos["market_value"] = round(total_qty * price, 2)
        else:
            DEMO_STATE["positions"].append({
                "symbol": symbol,
                "qty": qty,
                "avg_entry_price": price,
                "current_price": price,
                "market_value": round(qty * price, 2),
                "unrealized_pl": 0.0,
                "unrealized_plpc": 0.0
            })

        order_record = {
            "id": f"ord-paper-{uuid.uuid4().hex[:6]}",
            "symbol": symbol,
            "qty": qty,
            "side": "buy",
            "order_type": "market",
            "status": "filled",
            "submitted_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "filled_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "filled_avg_price": price,
            "note": note or "Simulated Paper Trade"
        }
        DEMO_STATE["orders"].insert(0, order_record)
        return order_record

    def _simulate_sell(self, symbol: str, qty: int, price: float, note: Optional[str] = None) -> Dict[str, Any]:
        proceeds = qty * price
        DEMO_STATE["account"]["cash"] += proceeds
        DEMO_STATE["account"]["buying_power"] = DEMO_STATE["account"]["cash"] * 2.0
        
        pos = next((p for p in DEMO_STATE["positions"] if p["symbol"] == symbol), None)
        if pos:
            pos["qty"] = max(0, pos["qty"] - qty)
            pos["market_value"] = round(pos["qty"] * price, 2)
            if pos["qty"] == 0:
                DEMO_STATE["positions"].remove(pos)

        order_record = {
            "id": f"ord-paper-{uuid.uuid4().hex[:6]}",
            "symbol": symbol,
            "qty": qty,
            "side": "sell",
            "order_type": "market",
            "status": "filled",
            "submitted_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "filled_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "filled_avg_price": price,
            "note": note or "Simulated Paper Trade"
        }
        DEMO_STATE["orders"].insert(0, order_record)
        return order_record
