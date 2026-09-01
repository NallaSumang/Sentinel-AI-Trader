# ⚡ Sentinel AI Trader

> **An Experimental AI Options Trading Pipeline powered by Groq (Llama 3.3 70B) & Alpaca Paper Trading API.**  
> Built as a Proof-of-Concept for the **Alpaca AI Trading Agents Hackathon (28 Aug – 4 Sept 2026)**.

---

## 📌 Problem Statement

Retail traders and algorithmic developers face significant challenges when trying to digest real-time financial news streams:
1. **Information Overload**: Hundreds of market headlines break every hour, making manual sentiment evaluation impractical.
2. **Emotional & Unsystematic Execution**: Traders frequently over-leverage without disciplined risk boundaries.
3. **Complex Infrastructure**: Building automated pipelines bridging unstructured news, LLM reasoning, capital risk gates, and broker API execution is traditionally complex.

---

## 💡 Solution

The **Sentinel AI Trader** is an experimental full-stack application designed to explore the news-to-execution lifecycle using LLMs:
1. **News Retrieval**: Continuously ingests fresh market headlines and catalysts.
2. **Groq AI Analysis**: Uses Llama 3.3 70B via Groq to extract structured JSON (Options `CALL`/`PUT` signals, Confidence, and Strike Price).
3. **Capital Risk Gate**: Enforces basic portfolio capital constraints and quantity limits before a trade is approved.
4. **Alpaca Options Paper Execution**: Generates precise OCC Option Symbols and routes market orders exclusively to the Alpaca Paper Sandbox environment.
5. **Interactive Dashboard & CLI**: Displays metrics in real-time and includes an embedded **Interactive CLI Terminal** that fulfills the mandatory CLI/MCP hackathon requirement.

---

## 🚀 Key Features

- **Autonomous 5-Stage Pipeline**: Visual tracking through `NEWS` ➔ `GROQ AI` ➔ `OPTIONS SIGNAL` ➔ `RISK CHECK` ➔ `ALPACA PAPER ORDER`.
- **Strict Structured JSON Options Signals**: The Groq agent outputs standardized schemas with ticker, action, option type (CALL/PUT), strike price, and confidence (0.0–1.0).
- **Configurable Risk Management**:
  - Minimum AI Confidence threshold filter.
  - Maximum Portfolio Concentration limit.
  - Maximum Option Contracts limit (hardcapped at 5).
  - Premium vs Cash verification limits.
- **Strict Paper Trading Guarantee**: Hardcoded to paper API endpoints. Live trading is structurally prevented.
- **Embedded Alpaca CLI**: Interact directly with your paper account using CLI commands (e.g., `account get`, `positions list`) translated into real-time API requests directly inside the web UI.

---

## 🏗️ Architecture

```text
┌─────────────────────────┐
│   Financial News Feed   │ (RSS, yfinance, Curated Catalysts)
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│     Groq (Llama 3.3)    │ (Extracts Symbol, Call/Put, Strike, Confidence)
└────────────┬────────────┘
             │ Strict JSON Signal
             ▼
┌─────────────────────────┐
│  Risk Management Layer  │ (Confidence Threshold, Cash Check, Max Premium)
└────────────┬────────────┘
             │
      Approved? ─── NO ───► [LOG & REJECT / HOLD]
             │
            YES
             ▼
┌─────────────────────────┐
│   Alpaca Options API    │ (Builds OCC Symbol, Submits Paper Order)
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  React/Vite Web UI      │ (Real-Time Blotter, CLI Terminal, Audit Logs)
└─────────────────────────┘
```

---

## 🛠️ Technologies

- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion
- **Backend**: Node.js/Express (Typescript) & Python (Streamlit Parity Backend)
- **AI**: Groq API (Llama 3.3 70B Versatile)
- **Broker**: Alpaca Trading API

---

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/NallaSumang/sentinel-ai-trader.git
cd sentinel-ai-trader
```

### 2. Install Dependencies (Node JS Frontend/Backend)
```bash
npm install
```

### 3. Install Python Dependencies (Streamlit Parity Backend)
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

---

## 🔑 Environment Configuration

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Fill in your keys:
```env
# Groq API Key
GROQ_API_KEY=your_groq_api_key

# Alpaca Paper Keys
ALPACA_API_KEY=your_alpaca_key
ALPACA_SECRET_KEY=your_alpaca_secret
```

---

## ▶️ Running the Application

**Run the React + Node.js Dashboard:**
```bash
npm run dev
```
Access at `http://localhost:3000`

**Run the Python Streamlit Backend:**
```bash
streamlit run app.py
```
Access at `http://localhost:8501`

---

## 🏆 Hackathon Relevance (Alpaca AI Trading Agents Hackathon)

This project addresses the core themes of the **Alpaca AI Trading Agents Hackathon (28 Aug–4 Sept 2026)**:
- **Autonomous Agents**: Uses blazing fast Groq models to autonomously execute Options strategies based on live news.
- **CLI/MCP Support**: Implements an embedded Alpaca CLI inside the dashboard for direct interactions.
- **Safety First**: Implements rigorous pre-trade Options risk management gates to protect capital.
- **Seamless Alpaca Integration**: Utilizes the Alpaca API strictly within the paper environment.

---

## ⚠️ Current Architecture Limitations (Truths)

This codebase serves as a Hackathon prototype. For personal, real-money trading projects, the following limitations must be addressed:
1. **LLM Hallucinations**: Language models trade on "textual sentiment" and cannot calculate Black-Scholes pricing or real-time Implied Volatility (IV). 
2. **Slippage & Liquidity**: The pipeline submits Market/Limit orders without querying real-time Order Book depth, exposing trades to severe bid-ask slippage.
3. **Execution Latency**: System latency makes it slower than HFT algorithms which price news into premiums in milliseconds.
4. **Rudimentary Risk Management**: The current risk gate lacks Portfolio Delta, Beta-Weighting, and Value at Risk (VaR) calculations.
5. **No Exit Strategy**: The agent can enter positions but lacks automated Stop-Loss or Trailing-Stop mechanisms to exit them profitably.

---

## ⚠️ Disclaimer

**Educational & Paper Trading Research Only**:  
This software is designed solely for research, educational, and hackathon demonstration purposes. It uses Alpaca **Paper Trading** only. It does NOT execute real monetary trades and does NOT constitute financial, investment, or legal advice. No automated system can guarantee profits.
