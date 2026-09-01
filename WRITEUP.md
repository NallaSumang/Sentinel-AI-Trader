# 🏆 Alpaca AI Sentinel - Hackathon Writeup

**Alpaca AI Trading Agents Hackathon 2026**

## 1. Vision & Inspiration
In the high-frequency trading world, institutional firms employ armies of quants to build sophisticated autonomous pipelines. Our vision with **Alpaca AI Sentinel** was to explore a simplified version of this architecture. We built an experimental autonomous agent that ingests raw market catalysts (news), employs the Groq Llama 3.3 70B model to synthesize structured JSON signals, routes them through a basic capital preservation risk gate, and finally executes them natively as Options contracts (or equities) on the Alpaca Paper API.

This is an experimental dual-stack application, featuring a dynamic React frontend and a Python backend parity layer. 

## 2. The 5-Stage Autonomous Pipeline

The core pipeline architecture consists of:

1.  **News Ingestion (The Catalyst)**: Scrapes the latest market headlines to identify actionable events.
2.  **Groq AI Analysis (The Brain)**: We integrated Groq’s Llama 3.3 70B via a unified OpenAI-compatible REST pattern. We enforce strict JSON schemas requiring the AI to output a BUY/SELL signal and basic Options parameters (CALL/PUT, Strike Price, Strategy, Max Premium).
3.  **Signal Structuring (The Nerve Center)**: The AI's JSON output is parsed into a strictly typed data model, ready for validation.
4.  **Basic Risk Gate (The Shield)**: Before any order touches Alpaca, it must pass a hard-coded safety audit:
    *   Minimum AI Confidence thresholds.
    *   Maximum Session Trade limits to prevent rogue loops.
    *   Maximum Options Contract limits.
    *   Portfolio Concentration and Premium vs. Cash constraints.
    *   *Crucially: Strict mapping validation (rejecting conflicting signals like "BUY + N/A Option").*
5.  **Alpaca Execution (The Muscle)**: If (and only if) all risk checks pass, the order is routed to Alpaca. For options, we built a custom OCC Symbol Generator to format contracts perfectly (`AAPL261016C00230000`) before dispatching them via the Alpaca REST API.

## 3. Meeting the Mandatory Requirements

- **Alpaca Trading API**: The core execution engine uses Alpaca for both fetching account states, positions, order history, and executing market orders.
- **Agent/LLM Requirement**: Powered autonomously by Groq (Llama-3.3-70b-versatile).
- **CLI/MCP Requirement**: We built a dedicated, fully interactive **Alpaca CLI Terminal Component** directly into the React dashboard. This translates standard `alpaca` commands into real-time API requests, giving users the power of a terminal directly within the web UI.

## 4. Dual-Stack Parity Architecture

To demonstrate flexibility, we built the architecture with dual-stack parity:

-   **Frontend & Web Server (Node.js/React)**: A React dashboard built with Vite and Tailwind CSS. It features pipeline visualizers, risk audit readouts, options badging, and the embedded CLI terminal.
-   **Data Science Backend (Python/Streamlit)**: A parity backend written in Python, featuring `agent.py` (Groq LLM logic), `risk_manager.py` (Options capital checks), and `trader.py` (Alpaca API requests).

## 5. Architectural Truths & Limitations

Building an options-trading AI taught us that LLMs are incredible at basic sentiment analysis but lack quantitative capabilities. For any use beyond this hackathon, the following limitations must be addressed:
1. **LLMs Cannot Do Math**: The AI cannot calculate Black-Scholes pricing, the Greeks (Delta, Gamma, Theta, Vega), or Implied Volatility crush.
2. **Slippage**: We submit Market/Limit orders without considering Order Book depth or bid-ask spread, which is catastrophic in live options markets.
3. **Execution Latency**: The pipeline is highly delayed compared to HFT algorithms.
4. **No Exit Strategy**: The agent has logic to buy options, but zero logic to sell them (Take-Profit/Stop-Loss). Options will decay to zero if not manually managed.
5. **Basic Risk**: The risk manager lacks Portfolio Delta and Value at Risk (VaR) calculations.

**Next Steps for Real-World Usage:**
- Build a quantitative execution engine to handle order slippage.
- Implement automated exit strategies (Trailing Stops, Profit Targets).
- Introduce multi-agent debate (Agent A proposes a trade, Agent B acts as a quantitative risk adversary).
