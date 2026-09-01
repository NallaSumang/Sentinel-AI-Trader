# 🏆 Alpaca AI Sentinel - Hackathon Writeup

**Alpaca AI Trading Agents Hackathon 2026**

## 1. Vision & Inspiration
In the high-frequency trading world, institutional firms employ armies of quants to build sophisticated autonomous pipelines. Our vision with **Alpaca AI Sentinel** was to democratize this architecture. We built a true "zero-to-one" autonomous agent that ingests raw market catalysts (news), employs the blazing-fast Groq Llama 3.3 70B model to synthesize structured JSON signals, routes them through a strict institutional capital preservation risk gate, and finally executes them natively as Options contracts (or equities) on the Alpaca Paper API.

This isn't a simple script; it's a dual-stack powerhouse designed for maximum resilience, featuring a dynamic React frontend and a full Python backend parity layer. 

## 2. The 5-Stage Autonomous Pipeline

The core innovation is our unbreakable 5-stage pipeline:

1.  **News Ingestion (The Catalyst)**: Scrapes the latest market headlines, filtering out noise to identify actionable events.
2.  **Groq AI Analysis (The Brain)**: We bypassed slower LLMs and directly integrated Groq’s Llama 3.3 70B via a unified OpenAI-compatible REST pattern. We enforce strict JSON schemas requiring the AI to output not just a BUY/SELL signal, but detailed Options parameters (CALL/PUT, Strike Price, Strategy, Max Premium).
3.  **Signal Structuring (The Nerve Center)**: The AI's JSON output is parsed into a strictly typed data model, ready for validation.
4.  **Institutional Risk Gate (The Shield)**: Before any order touches Alpaca, it must pass a rigorous, hard-coded safety audit:
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

## 4. Dual-Stack Parity & "Powerhouse" Architecture

To prove the robustness of our architecture, we didn't just build it once—we built it twice.

-   **Frontend & Web Server (Node.js/React)**: A stunning, Institutional-grade dashboard built with Vite, React, and Tailwind CSS. It features live pipeline visualizers, risk audit readouts, options badging, and the embedded CLI terminal.
-   **Data Science Backend (Python/Streamlit)**: A complete parity backend written in Python, featuring `agent.py` (Groq LLM logic), `risk_manager.py` (Options capital checks), and `trader.py` (Alpaca API requests). This satisfies both web developers and quantitative analysts.

## 5. What We Learned & Future Roadmap

Building an options-trading AI taught us that LLMs are incredible at sentiment analysis but terrible at strict rule-following without guardrails. Building the **Risk Gate** was the most critical step—ensuring that even if the AI hallucinated an absurd trade, the hard-coded capital logic would block it.

**Next Steps:**
- Migrate from Paper Sandbox to Live Trading via Alpaca Broker API.
- Implement advanced multi-leg options strategies (Iron Condors, Straddles).
- Introduce multi-agent debate (Agent A proposes a trade, Agent B acts as a risk adversary).
