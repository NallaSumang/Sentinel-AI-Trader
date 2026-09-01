# ⚡ Alpaca AI Trading Agent

> **An Autonomous Quantitative AI Trading Agent powered by Google Gemini AI & Alpaca Paper Trading API.**  
> Built for the **Alpaca AI Trading Agents Hackathon (28 Aug – 4 Sept 2026)**.

---

## 📌 Problem Statement

Retail traders and algorithmic developers face significant challenges when trying to digest real-time financial news streams:
1. **Information Overload**: Hundreds of market headlines, earnings reports, and regulatory filings break every hour, making manual sentiment and catalyst evaluation impractical.
2. **Emotional & Unsystematic Execution**: Traders frequently over-leverage or execute impulsive trades without disciplined risk boundaries.
3. **Complex Infrastructure**: Building institutional-style pipelines that bridge unstructured news processing, LLM reasoning, capital risk gates, and broker API execution is traditionally complex and error-prone.

---

## 💡 Solution

The **Alpaca AI Trading Agent** is a full-stack, autonomous trading agent designed to automate the complete news-to-execution lifecycle:
1. **News Retrieval**: Continuously ingests fresh market headlines and catalysts.
2. **Gemini AI Analysis**: Extracts affected equity tickers and evaluates catalytic significance into strict, structured JSON (`BUY`, `SELL`, `HOLD` with confidence and risk scoring).
3. **Institutional Risk Management Gate**: Enforces capital preservation (confidence thresholds, position sizing caps, available cash validation, and session trade limits) before any trade is approved.
4. **Alpaca Paper Trading**: Submits paper orders exclusively to the Alpaca Paper Sandbox environment—guaranteeing zero real-capital exposure.
5. **Interactive Dashboard**: Displays metrics, pipeline state, raw AI decisions, risk audits, and execution logs in real-time.

---

## 🚀 Key Features

- **Autonomous 5-Stage Pipeline**: Visual tracking through `NEWS` ➔ `AI ANALYSIS` ➔ `SIGNAL` ➔ `RISK CHECK` ➔ `ALPACA PAPER ORDER`.
- **Strict Structured JSON Signals**: The Gemini agent outputs standardized schemas with ticker, action, confidence (0.0–1.0), risk, and reasoning.
- **Configurable Risk Management**:
  - Minimum AI Confidence threshold filter (default `0.70`).
  - Maximum Portfolio Concentration limit (default `10%` per asset).
  - Maximum Order Quantity cap (default `25` shares).
  - Maximum Session Trades ceiling to prevent runaway turnover.
  - Inventory check preventing invalid short sales on non-held assets.
- **Strict Paper Trading Guarantee**: Hardcoded to `https://paper-api.alpaca.markets` using `alpaca-py`. Live trading is completely prevented.
- **Zero-Config Safe Demo Mode**: Runs full simulated trading cycles out of the box when API keys are not yet configured.
- **Live Activity Logs**: Streaming terminal logs of each pipeline event and risk decision.

---

## 🏗️ Architecture

```text
┌─────────────────────────┐
│   Financial News Feed   │ (RSS, yfinance, Curated Catalysts)
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│     Google Gemini AI    │ (Extracts Symbol, Sentiment, Confidence, Risk)
└────────────┬────────────┘
             │ Strict JSON Signal
             ▼
┌─────────────────────────┐
│  Risk Management Layer  │ (Confidence Threshold, Cash Check, Max Position %, Max Qty)
└────────────┬────────────┘
             │
      Approved? ─── NO ───► [LOG & REJECT / HOLD]
             │
            YES
             ▼
┌─────────────────────────┐
│   Alpaca Paper API      │ (Submits Paper Buy/Sell Order via alpaca-py)
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Streamlit / Web UI     │ (Real-Time Portfolio, Blotter, Logs & Audit)
└─────────────────────────┘
```

---

## 🛠️ Technologies

- **Python 3.10+**
- **Google Gemini API** (`@google/genai` / `google-genai` / `gemini-2.5-flash`)
- **Alpaca Trading API** (`alpaca-py`)
- **Streamlit** (Interactive Dashboard)
- **yfinance & RSS** (Financial news ingestion)
- **pandas** (Portfolio and blotter tabular data)
- **python-dotenv** (Secure environment configuration)

---

## 📂 Project Structure

```text
AI-Trading-Agent/
│
├── app.py              # Streamlit dashboard and pipeline visualizer
├── agent.py            # Gemini AI agent & structured signal parser
├── news.py             # Financial news retrieval & catalyst feed
├── trader.py           # Alpaca Paper Trading client (alpaca-py)
├── risk_manager.py     # Capital preservation and risk gate rules
├── config.py           # Environment variables & default configurations
├── requirements.txt    # Python package dependencies
├── .env.example        # Environment variable template
├── .gitignore          # Git ignore rules for secrets and caches
└── README.md           # Project documentation and hackathon guide
```

---

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/alpaca-ai-trading-agent.git
cd alpaca-ai-trading-agent
```

### 2. Create and Activate a Virtual Environment
```bash
python -m venv venv

# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

---

## 🔑 Environment Variables Configuration

Create a `.env` file in the project root by copying `.env.example`:

```bash
cp .env.example .env
```

Open `.env` and fill in your keys:

```env
# Google Gemini API Key (Get free at https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=your_gemini_api_key_here

# Alpaca Paper Trading Credentials (Get free at https://app.alpaca.markets/paper/dashboard/overview)
ALPACA_API_KEY=your_alpaca_paper_api_key_here
ALPACA_SECRET_KEY=your_alpaca_paper_secret_key_here

# Alpaca Paper Trading Endpoint (Fixed for safety)
ALPACA_BASE_URL=https://paper-api.alpaca.markets

# Optional Risk Parameters
RISK_MIN_CONFIDENCE=0.70
RISK_MAX_POSITION_PCT=0.10
RISK_MAX_ORDER_QTY=25
RISK_MAX_TRADES_PER_SESSION=10
```

> ⚠️ **IMPORTANT**: Never commit your `.env` file to version control. It is protected in `.gitignore`.

---

## ▶️ Running the Application

Launch the Streamlit dashboard with:

```bash
streamlit run app.py
```

The application will open automatically in your browser at `http://localhost:8501`.

---

## 🧪 Testing with Safe Demo Mode

If you run the application without API keys or during market off-hours:
1. The app detects missing credentials and automatically engages **Demo Simulation Mode**.
2. Click **"Run Full Autonomous Cycle"** to test:
   - News catalyst extraction
   - AI sentiment classification
   - Risk gate validation
   - Simulated paper trade execution and portfolio updates
3. When you add your API keys to `.env`, the app seamlessly activates live Alpaca Paper Trading and real Gemini API calls!

---

## 🏆 Hackathon Relevance (Alpaca AI Trading Agents Hackathon)

This project addresses the core themes of the **Alpaca AI Trading Agents Hackathon (28 Aug–4 Sept 2026)**:
- **Autonomous Reasoning**: Uses frontier Gemini models to transform unstructured text into deterministic trading decisions.
- **Safety First**: Implements rigorous pre-trade risk management gates that prevent overtrading and excessive concentration.
- **Seamless Alpaca Integration**: Utilizes the modern `alpaca-py` SDK strictly within the paper environment.
- **Beginner Friendly**: Clear, modular codebase runnable with a single command.

---

## 🔮 Future Improvements

- **Multi-Modal News Processing**: Incorporating SEC 10-Q filing charts and earnings call audio transcripts via Gemini multimodal capabilities.
- **Dynamic Kelly Sizing**: Automated position sizing based on rolling historical win rates and volatility.
- **Trailing Stop-Loss Orders**: Automated bracket order submission directly through Alpaca.
- **Backtesting Harness**: Historical news backtester evaluating alpha decay over time.

---

## ⚠️ Disclaimer

**Educational & Paper Trading Research Only**:  
This software is designed solely for research, educational, and hackathon demonstration purposes. It uses Alpaca **Paper Trading** only. It does NOT execute real monetary trades and does NOT constitute financial, investment, or legal advice. No automated system can guarantee profits.
