"""
Streamlit Web Dashboard for Alpaca AI Trading Agent
Hackathon: Alpaca AI Trading Agents Hackathon (28 Aug - 4 Sept 2026)
Autonomous pipeline: NEWS -> GROQ AI -> OPTIONS SIGNAL -> RISK MANAGEMENT -> ALPACA PAPER ORDER
"""

import datetime
import pandas as pd
import streamlit as st

from config import config
from news import get_latest_market_news
from agent import analyze_news_with_groq
from risk_manager import RiskManager
from trader import AlpacaTrader

# Page Configuration
st.set_page_config(
    page_title="Alpaca AI Trading Agent",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS styling for dark institutional dashboard aesthetic
st.markdown("""
<style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 800;
        color: #f8fafc;
        margin-bottom: 0.2rem;
    }
    .sub-header {
        color: #94a3b8;
        font-size: 1.05rem;
        margin-bottom: 1.5rem;
    }
    .pipeline-step {
        background: #0f172a;
        border: 1px solid #1e293b;
        border-radius: 8px;
        padding: 12px 16px;
        text-align: center;
        color: #cbd5e1;
        font-weight: 600;
    }
    .pipeline-arrow {
        text-align: center;
        color: #64748b;
        font-size: 1.4rem;
        font-weight: bold;
    }
    .metric-card {
        background-color: #0f172a;
        border: 1px solid #1e293b;
        border-radius: 8px;
        padding: 16px;
    }
    .badge-buy {
        background-color: #10b981;
        color: #ffffff;
        padding: 4px 12px;
        border-radius: 6px;
        font-weight: bold;
    }
    .badge-sell {
        background-color: #ef4444;
        color: #ffffff;
        padding: 4px 12px;
        border-radius: 6px;
        font-weight: bold;
    }
    .badge-hold {
        background-color: #f59e0b;
        color: #ffffff;
        padding: 4px 12px;
        border-radius: 6px;
        font-weight: bold;
    }
    .badge-call {
        background-color: #3b82f6;
        color: #ffffff;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: bold;
    }
    .badge-put {
        background-color: #ec4899;
        color: #ffffff;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: bold;
    }
    .audit-pass {
        color: #10b981;
        font-weight: 500;
    }
    .audit-fail {
        color: #ef4444;
        font-weight: 500;
    }
</style>
""", unsafe_allow_html=True)

# Initialize Session State
if "trader" not in st.session_state:
    st.session_state.trader = AlpacaTrader()

if "risk_manager" not in st.session_state:
    st.session_state.risk_manager = RiskManager()

if "logs" not in st.session_state:
    st.session_state.logs = [
        f"[{datetime.datetime.now().strftime('%H:%M:%S')}] System initialized in Paper Trading Mode.",
        f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Risk Management layer active. Institutional safeguards applied."
    ]

if "last_news" not in st.session_state:
    st.session_state.last_news = get_latest_market_news(limit=6)

if "last_decision" not in st.session_state:
    st.session_state.last_decision = None

if "last_risk_result" not in st.session_state:
    st.session_state.last_risk_result = None

if "last_order_result" not in st.session_state:
    st.session_state.last_order_result = None

def add_log(msg: str):
    timestamp = datetime.datetime.now().strftime('%H:%M:%S')
    st.session_state.logs.insert(0, f"[{timestamp}] {msg}")
    if len(st.session_state.logs) > 50:
        st.session_state.logs.pop()

# Sidebar Configuration & Safeguards
st.sidebar.image("https://img.icons8.com/color/96/000000/artificial-intelligence.png", width=64)
st.sidebar.title("Agent Controls")

# Mode indicator
is_connected_alpaca = st.session_state.trader.is_connected_to_live_paper_api()
has_groq = config.has_groq_key()

if not (is_connected_alpaca and has_groq):
    st.sidebar.warning("⚠️ **DEMO / SIMULATION MODE**")
    st.sidebar.caption("API keys not fully detected. Running safe local options trading simulation.")
else:
    st.sidebar.success("✅ **ALPACA PAPER CONNECTED**")
    st.sidebar.caption("Connected to Alpaca Paper Trading API & Groq AI.")

st.sidebar.markdown("---")
st.sidebar.subheader("🛡️ Risk Controls")
min_conf = st.sidebar.slider("Min AI Confidence Threshold", min_value=0.50, max_value=0.95, value=0.70, step=0.05)
max_pos_pct = st.sidebar.slider("Max Position Size (% Portfolio)", min_value=0.05, max_value=0.30, value=0.10, step=0.05)
max_session_trades = st.sidebar.number_input("Max Session Trades", min_value=1, max_value=50, value=10)

# Update Risk Manager instance params
st.session_state.risk_manager.min_confidence = min_conf
st.session_state.risk_manager.max_position_pct = max_pos_pct
st.session_state.risk_manager.max_trades_per_session = max_session_trades

if st.sidebar.button("🔄 Reset Session Trades Counter"):
    st.session_state.risk_manager.reset_session()
    add_log("Session trade counter manually reset to 0.")
    st.sidebar.success("Session trades reset!")

st.sidebar.markdown("---")
st.sidebar.caption("🔒 **Paper Trading Guarantee**: Live broker routing is hard-disabled. All orders are submitted strictly to the Alpaca Paper sandbox environment.")

# Header
st.markdown('<div class="main-header">⚡ Alpaca AI Options Trading Agent</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-header">Autonomous Market News Evaluator, Groq Signal Generation, and Risk-Managed Paper Options Execution</div>', unsafe_allow_html=True)

# 5-Stage Architecture Pipeline Visualizer
st.markdown("### 🔄 Autonomous Options Execution Pipeline")
col1, col_a1, col2, col_a2, col3, col_a3, col4, col_a4, col5 = st.columns([2, 0.4, 2, 0.4, 2.5, 0.4, 2.2, 0.4, 2.2])

with col1:
    st.markdown('<div class="pipeline-step">1. NEWS INGESTION<br><small style="color:#94a3b8">Market Catalysts</small></div>', unsafe_allow_html=True)
with col_a1:
    st.markdown('<div class="pipeline-arrow">➔</div>', unsafe_allow_html=True)
with col2:
    st.markdown('<div class="pipeline-step">2. GROQ AI<br><small style="color:#94a3b8">Llama 3.3 70B</small></div>', unsafe_allow_html=True)
with col_a2:
    st.markdown('<div class="pipeline-arrow">➔</div>', unsafe_allow_html=True)
with col3:
    st.markdown('<div class="pipeline-step">3. OPTIONS SIGNAL<br><small style="color:#94a3b8">CALL / PUT + STRIKE</small></div>', unsafe_allow_html=True)
with col_a3:
    st.markdown('<div class="pipeline-arrow">➔</div>', unsafe_allow_html=True)
with col4:
    st.markdown('<div class="pipeline-step">4. RISK GATE<br><small style="color:#94a3b8">Capital Rules Check</small></div>', unsafe_allow_html=True)
with col_a4:
    st.markdown('<div class="pipeline-arrow">➔</div>', unsafe_allow_html=True)
with col5:
    st.markdown('<div class="pipeline-step">5. ALPACA PAPER<br><small style="color:#94a3b8">Paper Execution</small></div>', unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# Top Metrics Row (Account & Portfolio)
account_info = st.session_state.trader.get_account()
portfolio_val = account_info.get("portfolio_value", 100000.0)
cash_val = account_info.get("cash", 82540.0)
buying_power = account_info.get("buying_power", 165080.0)
session_count = st.session_state.risk_manager.session_trades_count

m_col1, m_col2, m_col3, m_col4 = st.columns(4)
with m_col1:
    st.metric(label="💼 Portfolio Value", value=f"${portfolio_val:,.2f}")
with m_col2:
    st.metric(label="💵 Available Cash", value=f"${cash_val:,.2f}")
with m_col3:
    st.metric(label="⚡ Buying Power", value=f"${buying_power:,.2f}")
with m_col4:
    st.metric(label="📊 Session Trades", value=f"{session_count} / {max_session_trades}")

st.markdown("---")

# Main Action Buttons
btn_col1, btn_col2, btn_col3 = st.columns([1.5, 1.5, 3])
with btn_col1:
    if st.button("🚀 Run Full Autonomous Cycle", type="primary", use_container_width=True):
        with st.spinner("Executing Autonomous Pipeline..."):
            news_items = get_latest_market_news(limit=6)
            st.session_state.last_news = news_items
            selected_news = news_items[0] if news_items else None
            
            if selected_news:
                add_log(f"News selected: '{selected_news['headline'][:60]}...'")
                
                decision = analyze_news_with_groq(
                    headline=selected_news["headline"],
                    summary=selected_news["summary"],
                    source=selected_news.get("source", "Market Feed")
                )
                st.session_state.last_decision = decision
                
                sig = decision["signal"]
                opt = decision["option_type"]
                add_log(f"AI Options Decision: {sig} {opt} on {decision['symbol']} @ ${decision['strike_price']} (Confidence: {decision['confidence']:.2f})")
                
                positions = st.session_state.trader.get_positions()
                risk_res = st.session_state.risk_manager.evaluate_decision(
                    ai_decision=decision,
                    account_info=account_info,
                    current_positions=positions
                )
                st.session_state.last_risk_result = risk_res
                
                if risk_res.approved:
                    add_log(f"Risk Gate APPROVED trade for {risk_res.approved_qty} contracts of {risk_res.symbol}.")
                    
                    # Hardcoded expiry for hackathon simulation demo (Next 3rd Friday logic handled in JS, simulate here)
                    order = st.session_state.trader.submit_options_order(
                        underlying=risk_res.symbol,
                        option_type=decision["option_type"],
                        strike=decision["strike_price"],
                        expiry="261016", # Oct 16 2026 
                        contracts=risk_res.approved_qty,
                        side="buy", # Usually we buy options in this simple agent
                        premium_estimate=decision.get("max_premium", 5.0)
                    )
                    
                    st.session_state.risk_manager.increment_session_trades()
                    st.session_state.last_order_result = order
                    add_log(f"Alpaca Paper Options Order Submitted: {order.get('occ_symbol', order.get('symbol'))}")
                    st.success(f"✅ Options Order Executed: {order.get('occ_symbol', order.get('symbol'))}")
                else:
                    st.session_state.last_order_result = None
                    add_log(f"Risk Gate BLOCKED trade. Reason: {risk_res.rejection_reason}")
                    st.info(f"🛑 Risk Gate Notice: {risk_res.rejection_reason}")
            else:
                st.error("No market news could be retrieved.")

with btn_col2:
    if st.button("📰 Refresh Market News Feed", use_container_width=True):
        st.session_state.last_news = get_latest_market_news(limit=6)
        add_log("Market news headlines refreshed.")
        st.toast("News feed refreshed!")

with btn_col3:
    if st.button("🔄 Refresh Portfolio & Positions", use_container_width=True):
        add_log("Refreshed portfolio and open position balances.")
        st.rerun()

st.markdown("<br>", unsafe_allow_html=True)

# 2-Column Main Layout
main_left, main_right = st.columns([1.1, 0.9])

with main_left:
    st.subheader("📰 Latest Market News Feed")
    st.caption("Click 'Analyze This Story' to target a specific market catalyst with Groq AI.")
    
    for idx, item in enumerate(st.session_state.last_news):
        with st.expander(f"{'🏷️ ' + item['symbol'] if item.get('symbol') else '🌐'} {item['headline']}", expanded=(idx == 0)):
            st.write(item["summary"])
            st.caption(f"Source: {item['source']} | Published: {item['timestamp']}")
            
            if st.button(f"⚡ Analyze News #{idx+1}", key=f"btn_analyze_{idx}"):
                with st.spinner(f"Querying Groq AI for {item.get('symbol', 'Equity')}..."):
                    dec = analyze_news_with_groq(item["headline"], item["summary"], item["source"])
                    st.session_state.last_decision = dec
                    
                    pos = st.session_state.trader.get_positions()
                    r_res = st.session_state.risk_manager.evaluate_decision(
                        ai_decision=dec,
                        account_info=account_info,
                        current_positions=pos
                    )
                    st.session_state.last_risk_result = r_res
                    
                    if r_res.approved:
                        ord_res = st.session_state.trader.submit_options_order(
                            underlying=r_res.symbol,
                            option_type=dec["option_type"],
                            strike=dec["strike_price"],
                            expiry="261016",
                            contracts=r_res.approved_qty,
                            side="buy",
                            premium_estimate=dec.get("max_premium", 5.0)
                        )
                        st.session_state.risk_manager.increment_session_trades()
                        st.session_state.last_order_result = ord_res
                        add_log(f"Analyzed #{idx+1} -> Executed {ord_res.get('occ_symbol')}")
                    else:
                        st.session_state.last_order_result = None
                        add_log(f"Analyzed #{idx+1} -> Risk Hold: {r_res.rejection_reason}")
                    st.rerun()

    st.markdown("---")
    st.subheader("🤖 Latest AI Agent Options Decision")
    if st.session_state.last_decision:
        d = st.session_state.last_decision
        
        sig = d["signal"]
        badge_class = "badge-buy" if sig == "BUY" else ("badge-sell" if sig == "SELL" else "badge-hold")
        
        opt = d.get("option_type", "N/A")
        opt_badge = ""
        if opt == "CALL":
            opt_badge = f'<span class="badge-call">CALL</span>'
        elif opt == "PUT":
            opt_badge = f'<span class="badge-put">PUT</span>'
            
        strike = d.get('strike_price', 'N/A')
        strat = d.get('strategy_name', 'Hold')
        
        st.markdown(f"""
        <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.3rem; font-weight: bold; color: #f8fafc;">{d['symbol']}</span>
                    {opt_badge}
                    <span style="color: #cbd5e1; font-weight: bold;">Strike: ${strike}</span>
                </div>
                <span class="{badge_class}">{sig}</span>
            </div>
            <div style="display: flex; gap: 24px; margin-bottom: 12px;">
                <div><span style="color:#94a3b8">Strategy:</span> <strong>{strat}</strong></div>
                <div><span style="color:#94a3b8">Contracts:</span> <strong>{d.get('contracts', 0)}</strong></div>
                <div><span style="color:#94a3b8">Confidence:</span> <strong>{int(d['confidence']*100)}%</strong></div>
            </div>
            <div style="background: #1e293b; padding: 10px; border-radius: 6px; color: #e2e8f0; font-size: 0.95rem;">
                <strong>AI Reasoning:</strong> {d['reason']}
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        with st.expander("🔍 View Raw Structured JSON"):
            st.json(d)
            
        if sig == "HOLD":
            if st.button("⚡ Manual Override: BUY", type="secondary"):
                with st.spinner("Executing Discretionary Manual Buy..."):
                    # Create override decision payload
                    override_dec = d.copy()
                    override_dec["signal"] = "BUY"
                    override_dec["option_type"] = "CALL"
                    override_dec["confidence"] = 1.0
                    override_dec["reason"] = "[Manual Override]: User executed discretionary BUY order."
                    
                    pos = st.session_state.trader.get_positions()
                    r_res = st.session_state.risk_manager.evaluate_decision(
                        ai_decision=override_dec,
                        account_info=account_info,
                        current_positions=pos
                    )
                    st.session_state.last_risk_result = r_res
                    
                    if r_res.approved:
                        ord_res = st.session_state.trader.submit_options_order(
                            underlying=r_res.symbol,
                            option_type=override_dec["option_type"],
                            strike=override_dec["strike_price"] or 130,
                            expiry="261016",
                            contracts=r_res.approved_qty,
                            side="buy",
                            premium_estimate=override_dec.get("max_premium", 5.0)
                        )
                        st.session_state.risk_manager.increment_session_trades()
                        st.session_state.last_order_result = ord_res
                        add_log(f"[MANUAL OVERRIDE] Executed BUY {ord_res.get('occ_symbol')}")
                    else:
                        st.session_state.last_order_result = None
                        add_log(f"[MANUAL OVERRIDE] Risk Hold: {r_res.rejection_reason}")
                    
                    st.session_state.last_decision = override_dec
                    st.rerun()
    else:
        st.info("No AI decision generated yet.")

with main_right:
    st.subheader("🛡️ Risk Management & Options Blotter")
    
    if st.session_state.last_risk_result:
        r = st.session_state.last_risk_result
        if r.approved:
            st.success(f"✅ **Risk Assessment: APPROVED** ({r.approved_qty} contracts of {r.symbol} {r.option_type})")
        else:
            st.warning(f"🛑 **Risk Assessment: REJECTED / HOLD**")
            st.caption(f"Reason: {r.rejection_reason}")
            
        with st.expander("📋 Detailed Capital Safety Audit"):
            for p in r.passed_checks:
                st.markdown(f'<span class="audit-pass">✔ {p}</span>', unsafe_allow_html=True)
            for f in r.failed_checks:
                st.markdown(f'<span class="audit-fail">✖ {f}</span>', unsafe_allow_html=True)
    else:
        st.caption("Waiting for active cycle to run safety audit...")

    st.markdown("<br>", unsafe_allow_html=True)
    
    # Active Positions
    st.subheader("📊 Current Paper Positions")
    positions = st.session_state.trader.get_positions()
    if positions:
        pos_df = pd.DataFrame(positions)
        display_df = pos_df[["symbol", "qty", "avg_entry_price", "current_price", "market_value", "unrealized_pl"]].copy()
        display_df.columns = ["Symbol", "Shares/Contracts", "Avg Entry ($)", "Current ($)", "Market Value ($)", "Unrealized P&L ($)"]
        st.dataframe(display_df, use_container_width=True, hide_index=True)
    else:
        st.info("No open positions in paper portfolio.")

    st.markdown("---")
    
    # Recent Orders
    st.subheader("📑 Recent Alpaca Paper Orders")
    orders = st.session_state.trader.get_orders(limit=10)
    if orders:
        ord_df = pd.DataFrame(orders)
        show_cols = [c for c in ["id", "symbol", "qty", "side", "status", "submitted_at"] if c in ord_df.columns]
        st.dataframe(ord_df[show_cols], use_container_width=True, hide_index=True)
    else:
        st.caption("No recent orders recorded.")

st.markdown("---")

# Agent Activity Logs Section
st.subheader("🖥️ Autonomous Agent Activity Logs")
log_container = st.container(height=180)
with log_container:
    for log_line in st.session_state.logs:
        st.code(log_line, language="bash")

# Disclaimer Footer
st.markdown("---")
st.caption("⚠️ **Hackathon & Research Disclaimer**: This application is strictly an educational research and paper-trading demonstration for the Alpaca AI Trading Agents Hackathon. It connects exclusively to the Alpaca Paper Trading Sandbox. It does not provide financial or investment advice and does not guarantee investment returns.")
