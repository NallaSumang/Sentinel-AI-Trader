import time
import datetime
import sys
from news import get_latest_market_news
from agent import analyze_news_with_groq
from risk_manager import RiskManager
from trader import AlpacaTrader
from config import config

def print_log(msg: str):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {msg}")

def run_autonomous_loop():
    print_log("🚀 Initializing Autonomous 24/7 Trading Agents...")
    
    trader = AlpacaTrader()
    risk_manager = RiskManager()
    
    if not config.has_groq_key() or not trader.is_connected_to_live_paper_api():
        print_log("⚠️ WARNING: API keys missing. Running in local simulation mode.")
    else:
        print_log("✅ Alpaca Paper Trading & Groq AI Connected.")

    print_log("System fully engaged. Beginning autonomous polling cycle (Ctrl+C to exit).")
    print_log("-" * 60)

    # We keep track of processed news to avoid duplicate trades
    processed_news_ids = set()

    try:
        while True:
            # 1. Agent 1: The Market Scanner (Ingestion)
            news_items = get_latest_market_news(limit=3)
            
            for item in news_items:
                if item["id"] in processed_news_ids:
                    continue
                
                print_log(f"📰 New Catalyst Detected: {item['headline'][:80]}...")
                
                # 2. Agent 2: The Quantitative Analyst (Groq LLM)
                decision = analyze_news_with_groq(
                    headline=item["headline"],
                    summary=item["summary"],
                    source=item.get("source", "Market Feed")
                )
                
                print_log(f"🧠 AI Decision: {decision['signal']} {decision.get('option_type', '')} on {decision['symbol']} (Confidence: {decision['confidence']})")
                
                if decision['signal'] != "HOLD":
                    # 3. Agent 3: The Risk & Execution Manager
                    current_positions = trader.get_positions()
                    account_info = trader.get_account()
                    
                    risk_res = risk_manager.evaluate_decision(decision, account_info, current_positions)
                    
                    if risk_res.approved:
                        print_log(f"🛡️ Risk Gate APPROVED. Submitting order for {risk_res.approved_qty} contracts...")
                        
                        # Execute Trade
                        order = trader.submit_options_order(
                            underlying=risk_res.symbol,
                            option_type=decision["option_type"],
                            strike=decision["strike_price"],
                            expiry="261016", # Oct 2026 hackathon demo expiry
                            contracts=risk_res.approved_qty,
                            side="buy",
                            premium_estimate=decision.get("max_premium", 5.0)
                        )
                        risk_manager.increment_session_trades()
                        print_log(f"✅ Executed Options Order: {order.get('occ_symbol', order.get('symbol', ''))}")
                    else:
                        print_log(f"🛑 Risk Gate BLOCKED Trade: {risk_res.rejection_reason}")
                
                # Mark as processed
                processed_news_ids.add(item["id"])
                print_log("-" * 60)
            
            # Sleep before next polling cycle (e.g. 15 seconds)
            time.sleep(15)

    except KeyboardInterrupt:
        print_log("🛑 Autonomous loop halted by user. Shutting down agents safely.")
        sys.exit(0)

if __name__ == "__main__":
    run_autonomous_loop()
