import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

// ═══════════════════════════════════════════════════════════════════════
// GROQ AI CLIENT (OpenAI-compatible REST API)
// ═══════════════════════════════════════════════════════════════════════
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

function getGroqApiKey(): string | null {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key || key === "" || key.startsWith("your_")) return null;
  return key;
}

function getGroqModel(): string {
  return process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";
}

async function callGroqAI(systemPrompt: string, userPrompt: string): Promise<any> {
  const apiKey = getGroqApiKey();
  if (!apiKey) return null;

  const models = [getGroqModel(), "openai/gpt-oss-120b", "llama-3.3-70b-versatile", "mixtral-8x7b-32768"];
  let lastError = "";

  for (const model of models) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.1,
          max_tokens: 1024,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        lastError = `Groq ${model} error (${response.status}): ${errText}`;
        console.warn(lastError);
        continue;
      }

      const data: any = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      const cleaned = content.replace(/```json/gi, "").replace(/```/g, "").trim();
      return { parsed: JSON.parse(cleaned), model };
    } catch (err: any) {
      lastError = err.message || String(err);
      console.warn(`Groq model ${model} failed:`, lastError);
      await new Promise(r => setTimeout(r, 150));
    }
  }

  console.warn("All Groq models failed:", lastError);
  return null;
}

// ═══════════════════════════════════════════════════════════════════════
// ALPACA PAPER TRADING
// ═══════════════════════════════════════════════════════════════════════
const ALPACA_PAPER_BASE_URL = "https://paper-api.alpaca.markets";

function getAlpacaHeaders(): { "APCA-API-KEY-ID": string; "APCA-API-SECRET-KEY": string } | null {
  const apiKey = process.env.ALPACA_API_KEY?.trim();
  const secretKey = process.env.ALPACA_SECRET_KEY?.trim();
  if (!apiKey || !secretKey || apiKey === "" || secretKey === "" || apiKey.startsWith("your_") || secretKey.startsWith("your_")) {
    return null;
  }
  return { "APCA-API-KEY-ID": apiKey, "APCA-API-SECRET-KEY": secretKey };
}

// ─── OCC Option Symbol Builder ───────────────────────────────────────
function buildOccSymbol(underlying: string, expiry: string, optionType: "CALL" | "PUT", strike: number): string {
  const sym = underlying.toUpperCase().padEnd(6, " ").substring(0, 6).trim();
  const cp = optionType === "CALL" ? "C" : "P";
  const strikeStr = Math.round(strike * 1000).toString().padStart(8, "0");
  return `${sym}${expiry}${cp}${strikeStr}`;
}

function getNextMonthlyExpiry(): string {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;
  if (month > 11) { month = 0; year++; }
  const firstDay = new Date(year, month, 1);
  let dayOfWeek = firstDay.getDay();
  let firstFriday = dayOfWeek <= 5 ? (5 - dayOfWeek + 1) : (5 + 7 - dayOfWeek + 1);
  const thirdFriday = firstFriday + 14;
  const expDate = new Date(year, month, thirdFriday);
  const yy = expDate.getFullYear().toString().slice(-2);
  const mm = (expDate.getMonth() + 1).toString().padStart(2, "0");
  const dd = expDate.getDate().toString().padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

function formatExpiryReadable(yymmdd: string): string {
  const year = 2000 + parseInt(yymmdd.substring(0, 2));
  const month = parseInt(yymmdd.substring(2, 4));
  const day = parseInt(yymmdd.substring(4, 6));
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[month - 1]} ${day}, ${year}`;
}

// ─── Alpaca API Functions ────────────────────────────────────────────
async function fetchAlpacaAccount() {
  const headers = getAlpacaHeaders();
  if (!headers) return null;
  const response = await fetch(`${ALPACA_PAPER_BASE_URL}/v2/account`, {
    method: "GET", headers: { ...headers, "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error(`Alpaca Account error (${response.status}): ${await response.text()}`);
  const data: any = await response.json();
  return {
    portfolio_value: parseFloat(data.portfolio_value || data.equity || "100000.0"),
    cash: parseFloat(data.cash || "100000.0"),
    buying_power: parseFloat(data.buying_power || "200000.0"),
    equity: parseFloat(data.equity || data.portfolio_value || "100000.0"),
    status: data.status ? `${data.status} (Alpaca Paper)` : "ACTIVE (Alpaca Paper)",
    currency: data.currency || "USD",
    session_trades_count: simulatedAccount.session_trades_count,
    isLivePaper: true,
    account_number: data.account_number,
  };
}

async function fetchAlpacaPositions(): Promise<Position[] | null> {
  const headers = getAlpacaHeaders();
  if (!headers) return null;
  const response = await fetch(`${ALPACA_PAPER_BASE_URL}/v2/positions`, {
    method: "GET", headers: { ...headers, "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error(`Alpaca Positions error (${response.status}): ${await response.text()}`);
  const data: any[] = await response.json();
  return data.map((p) => ({
    symbol: p.symbol, qty: parseFloat(p.qty), avg_entry_price: parseFloat(p.avg_entry_price),
    current_price: parseFloat(p.current_price), market_value: parseFloat(p.market_value),
    unrealized_pl: parseFloat(p.unrealized_pl), unrealized_plpc: parseFloat(p.unrealized_plpc),
    asset_class: p.asset_class || "us_equity",
  }));
}

async function fetchAlpacaOrders(): Promise<OrderRecord[] | null> {
  const headers = getAlpacaHeaders();
  if (!headers) return null;
  const response = await fetch(`${ALPACA_PAPER_BASE_URL}/v2/orders?status=all&limit=25`, {
    method: "GET", headers: { ...headers, "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error(`Alpaca Orders error (${response.status}): ${await response.text()}`);
  const data: any[] = await response.json();
  return data.map((o) => ({
    id: o.id, symbol: o.symbol, qty: parseFloat(o.qty || "0"),
    side: (o.side?.toLowerCase() === "buy" ? "buy" : "sell") as "buy" | "sell",
    status: (o.status === "filled" ? "filled" : o.status === "rejected" || o.status === "canceled" ? "rejected" : "pending") as "filled" | "pending" | "rejected",
    submitted_at: o.submitted_at ? o.submitted_at.replace("T", " ").substring(0, 19) : new Date().toISOString().replace("T", " ").substring(0, 19),
    filled_at: o.filled_at ? o.filled_at.replace("T", " ").substring(0, 19) : undefined,
    filled_avg_price: o.filled_avg_price ? parseFloat(o.filled_avg_price) : undefined,
    reason: o.failed_reason || o.status, order_class: o.order_class, asset_class: o.asset_class,
  }));
}

async function submitAlpacaStockOrder(symbol: string, qty: number, side: "buy" | "sell"): Promise<OrderRecord | null> {
  const headers = getAlpacaHeaders();
  if (!headers) return null;
  const response = await fetch(`${ALPACA_PAPER_BASE_URL}/v2/orders`, {
    method: "POST", headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ symbol: symbol.toUpperCase(), qty: Math.max(1, Math.round(qty)), side: side.toLowerCase(), type: "market", time_in_force: "day" }),
  });
  if (!response.ok) throw new Error(`Alpaca Order failed (${response.status}): ${await response.text()}`);
  const order: any = await response.json();
  return {
    id: order.id, symbol: order.symbol, qty: parseFloat(order.qty || "0"),
    side: (order.side?.toLowerCase() === "buy" ? "buy" : "sell") as "buy" | "sell",
    status: (order.status === "filled" ? "filled" : order.status === "rejected" || order.status === "canceled" ? "rejected" : "pending") as "filled" | "pending" | "rejected",
    submitted_at: order.submitted_at ? order.submitted_at.replace("T", " ").substring(0, 19) : new Date().toISOString().replace("T", " ").substring(0, 19),
    filled_at: order.filled_at ? order.filled_at.replace("T", " ").substring(0, 19) : new Date().toISOString().replace("T", " ").substring(0, 19),
    filled_avg_price: order.filled_avg_price ? parseFloat(order.filled_avg_price) : undefined,
  };
}

// ─── Options Trading ─────────────────────────────────────────────────
async function submitAlpacaOptionsOrder(occSymbol: string, qty: number, side: "buy" | "sell", limitPrice?: number): Promise<OrderRecord | null> {
  const headers = getAlpacaHeaders();
  if (!headers) return null;
  const orderBody: any = {
    symbol: occSymbol, qty: Math.max(1, Math.round(qty)), side: side.toLowerCase(),
    type: limitPrice ? "limit" : "market", time_in_force: "day",
  };
  if (limitPrice) orderBody.limit_price = limitPrice.toFixed(2);

  const response = await fetch(`${ALPACA_PAPER_BASE_URL}/v2/orders`, {
    method: "POST", headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(orderBody),
  });
  if (!response.ok) throw new Error(`Options order failed (${response.status}): ${await response.text()}`);
  const order: any = await response.json();
  return {
    id: order.id, symbol: order.symbol, qty: parseFloat(order.qty || "1"),
    side: (order.side?.toLowerCase() === "buy" ? "buy" : "sell") as "buy" | "sell",
    status: (order.status === "filled" ? "filled" : order.status === "rejected" || order.status === "canceled" ? "rejected" : "pending") as "filled" | "pending" | "rejected",
    submitted_at: order.submitted_at ? order.submitted_at.replace("T", " ").substring(0, 19) : new Date().toISOString().replace("T", " ").substring(0, 19),
    filled_at: order.filled_at ? order.filled_at.replace("T", " ").substring(0, 19) : undefined,
    filled_avg_price: order.filled_avg_price ? parseFloat(order.filled_avg_price) : undefined,
    order_class: "options", asset_class: "us_option",
  };
}

// ─── CLI Integration ─────────────────────────────────────────────────
interface CliLogEntry { id: string; timestamp: string; command: string; output: string; success: boolean; duration_ms: number; }
const cliHistory: CliLogEntry[] = [];

async function executeAlpacaCli(command: string): Promise<CliLogEntry> {
  const startTime = Date.now();
  const apiKey = process.env.ALPACA_API_KEY?.trim() || "";
  const secretKey = process.env.ALPACA_SECRET_KEY?.trim() || "";

  const entry: CliLogEntry = {
    id: `cli-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
    command: `alpaca ${command}`,
    output: "", success: false, duration_ms: 0,
  };

  try {
    let endpoint = ""; let method = "GET"; let body: any = undefined;

    if (command.startsWith("account") || command === "account get") endpoint = "/v2/account";
    else if (command.startsWith("positions")) endpoint = "/v2/positions";
    else if (command.startsWith("orders list") || command === "orders") endpoint = "/v2/orders?status=all&limit=10";
    else if (command.startsWith("orders create")) {
      endpoint = "/v2/orders"; method = "POST";
      const args = command.split(" ");
      const getArg = (flag: string) => { const idx = args.indexOf(flag); return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : undefined; };
      body = { symbol: getArg("--symbol") || "SPY", qty: parseInt(getArg("--qty") || "1"), side: getArg("--side") || "buy", type: getArg("--type") || "market", time_in_force: getArg("--time-in-force") || "day" };
    }
    else if (command.startsWith("clock")) endpoint = "/v2/clock";
    else if (command.startsWith("calendar")) endpoint = "/v2/calendar?start=" + new Date().toISOString().substring(0, 10);
    else { entry.output = `Unknown command: ${command}. Available: account, positions, orders list, orders create, clock, calendar`; entry.duration_ms = Date.now() - startTime; cliHistory.unshift(entry); return entry; }

    if (!apiKey || !secretKey) {
      entry.output = JSON.stringify({ status: "simulated", message: "CLI simulation — API keys not configured", command: `alpaca ${command}` }, null, 2);
      entry.success = true; entry.duration_ms = Date.now() - startTime; cliHistory.unshift(entry); return entry;
    }

    const fetchOptions: any = { method, headers: { "APCA-API-KEY-ID": apiKey, "APCA-API-SECRET-KEY": secretKey, "Content-Type": "application/json" } };
    if (body) fetchOptions.body = JSON.stringify(body);

    const response = await fetch(`${ALPACA_PAPER_BASE_URL}${endpoint}`, fetchOptions);
    const responseData = await response.json();
    entry.output = JSON.stringify(responseData, null, 2);
    entry.success = response.ok;
  } catch (err: any) {
    entry.output = `Error: ${err.message}`;
  }

  entry.duration_ms = Date.now() - startTime;
  cliHistory.unshift(entry);
  if (cliHistory.length > 50) cliHistory.pop();
  return entry;
}

// ─── Types ───────────────────────────────────────────────────────────
interface Position { symbol: string; qty: number; avg_entry_price: number; current_price: number; market_value: number; unrealized_pl: number; unrealized_plpc: number; asset_class?: string; }
interface OrderRecord { id: string; symbol: string; qty: number; side: "buy" | "sell"; status: "filled" | "pending" | "rejected"; submitted_at: string; filled_at?: string; filled_avg_price?: number; reason?: string; order_class?: string; asset_class?: string; }

// ─── In-Memory Simulation State ──────────────────────────────────────
let simulatedAccount = { portfolio_value: 100000.0, cash: 82540.0, buying_power: 165080.0, equity: 100000.0, status: "ACTIVE (PAPER SANDBOX)", currency: "USD", session_trades_count: 0 };

let simulatedPositions: Position[] = [
  { symbol: "AAPL", qty: 45, avg_entry_price: 224.5, current_price: 231.8, market_value: 10431.0, unrealized_pl: 328.5, unrealized_plpc: 0.0325 },
  { symbol: "MSFT", qty: 18, avg_entry_price: 435.2, current_price: 448.6, market_value: 8074.8, unrealized_pl: 241.2, unrealized_plpc: 0.0308 },
];

let simulatedOrders: OrderRecord[] = [
  { id: "ord-paper-849201", symbol: "AAPL", qty: 20, side: "buy", status: "filled",
    submitted_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString().replace("T", " ").substring(0, 19),
    filled_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString().replace("T", " ").substring(0, 19), filled_avg_price: 224.5 },
];

const mockNewsDatabase = [
  { id: "news-101",    headline: "NVIDIA Blows Past Earnings Estimates, Announces $50B Share Buyback and 5-for-1 Stock Split",
    summary: "NVIDIA completely crushed Wall Street expectations, reporting record-breaking revenue driven by explosive Blackwell AI cluster demand. Management announced a massive $50B stock buyback and a 5-for-1 split, sending after-hours futures soaring.", source: "Bloomberg Markets", timestamp: new Date().toISOString().replace("T", " ").substring(0, 19), symbol: "NVDA", estimated_price: 128.50 },
  { id: "news-102", headline: "Apple Services Revenue Accelerates 16% YoY Driven by App Store and AI Subscription Growth", summary: "Apple posted quarterly services revenue above analyst consensus alongside expanded enterprise adoption for Apple Intelligence enabled hardware lines.", source: "Reuters Financial", timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString().replace("T", " ").substring(0, 19), symbol: "AAPL", estimated_price: 231.80 },
  { id: "news-103", headline: "Tesla Faces Supply Chain Delays in European Battery Cell Expansion", summary: "Regulatory permitting questions and localized logistics bottlenecks in Berlin have prompted management to moderate near-term delivery guidance for Q3.", source: "Wall Street Journal", timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString().replace("T", " ").substring(0, 19), symbol: "TSLA", estimated_price: 215.40 },
  { id: "news-104", headline: "Microsoft Cloud Azure Wins Multi-Year US Federal Infrastructure Modernization Contract", summary: "The Department of Defense announced a $4.8B modernization procurement focusing on multi-cloud security resiliency, granting Microsoft key enterprise workloads.", source: "CNBC Tech", timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString().replace("T", " ").substring(0, 19), symbol: "MSFT", estimated_price: 448.60 },
  { id: "news-105", headline: "Amazon Web Services Accelerates Custom Silicon Deployments to Slash Inference Costs", summary: "AWS announced broad deployment of Trainium and Inferentia chips across enterprise customers, reducing AI compute expenses by 35% compared to legacy architectures.", source: "MarketWatch", timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString().replace("T", " ").substring(0, 19), symbol: "AMZN", estimated_price: 186.20 },
  { id: "news-106", headline: "Federal Reserve Holds Benchmark Interest Rates Steady Amid Mixed Inflation Readings", summary: "FOMC officials signaled a data-dependent neutral posture, noting resilient consumer demand balanced by slowing commercial real estate credit formation.", source: "Financial Times", timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString().replace("T", " ").substring(0, 19), symbol: "SPY", estimated_price: 560.10 },
];

// ═══════════════════════════════════════════════════════════════════════
// EXPRESS SERVER
// ═══════════════════════════════════════════════════════════════════════
async function startServer() {
  const app = express();
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString(), version: "2.0.0-hackathon" });
  });

  app.get("/api/config-status", (req, res) => {
    const hasGroq = Boolean(getGroqApiKey());
    const hasAlpaca = Boolean(getAlpacaHeaders());
    res.json({
      hasGroqKey: hasGroq,
      hasAlpacaKey: hasAlpaca,
      isPaperTrading: true,
      alpacaBaseUrl: ALPACA_PAPER_BASE_URL,
      aiModel: getGroqModel(),
      aiProvider: "Groq (Llama 3.3 70B)",
      demoMode: !hasAlpaca,
      hasCliIntegration: true,
      hasOptionsTrading: true,
      missingCredentialsMessage: !hasAlpaca ? "Alpaca Paper Trading credentials not configured." : null,
    });
  });

  app.get("/api/news", (req, res) => { res.json({ news: mockNewsDatabase }); });

  // ─── GROQ AI Analysis ──────────────────────────────────────────────
  app.post("/api/groq/analyze", async (req, res) => {
    try {
      const { headline, summary, source } = req.body;
      if (!headline) return res.status(400).json({ error: "Headline is required" });

      const expiry = getNextMonthlyExpiry();
      const expiryReadable = formatExpiryReadable(expiry);

  const systemPrompt = `You are an institutional-grade quantitative OPTIONS trading AI agent powered by Groq.
Your mandate is to analyze financial news catalysts and produce autonomous options trading decisions with a strict focus on profitability and asymmetric risk-reward setups.

You MUST respond with ONLY valid raw JSON using this exact schema:
{
  "symbol": "TICKER",
  "signal": "BUY" | "SELL" | "HOLD",
  "option_type": "CALL" | "PUT" | "N/A",
  "strike_price": <number - realistic options strike near current market price>,
  "expiry": "${expiry}",
  "contracts": <integer 1-5>,
  "confidence": <float 0.0 to 1.0>,
  "risk": "LOW" | "MEDIUM" | "HIGH",
  "max_premium": <number - max acceptable premium per contract in USD>,
  "strategy_name": "<e.g. Long Call, Long Put, Bull Call Spread>",
  "reason": "<One concise, data-backed rationale>"
}

OPTIONS RULES:
- BULLISH catalyst → signal: "BUY", option_type: "CALL", strike slightly OUT OF THE MONEY (OTM) for maximum leverage.
- BEARISH catalyst → signal: "BUY", option_type: "PUT", strike slightly OUT OF THE MONEY (OTM) for maximum leverage.
- NEUTRAL → signal: "HOLD", option_type: "N/A"
- Expiry: "${expiry}" (${expiryReadable})

PROFITABILITY & RISK MANDATE:
- Trade if the catalyst implies a strong risk-reward ratio.
- Keep max_premium under $5.00 to cap risk.
- Confidence MUST be > 0.70 to issue a BUY.

CURRENT APPROXIMATE PRICES: NVDA ~$130, AAPL ~$230, TSLA ~$215, MSFT ~$430, AMD ~$155, AMZN ~$190, META ~$580, GOOGL ~$175, SPY ~$570

Only valid US tickers. Never invent symbols. Ambiguous → SPY + HOLD. Confidence 0.0–1.0.`;

      const userPrompt = `Analyze for autonomous options trading:\nSource: ${source || "Market News"}\nHeadline: ${headline}\nSummary: ${summary || headline}`;

      const groqResult = await callGroqAI(systemPrompt, userPrompt);

      if (groqResult && groqResult.parsed) {
        const p = groqResult.parsed;
        const sig = ["BUY", "SELL", "HOLD"].includes(String(p.signal).toUpperCase()) ? String(p.signal).toUpperCase() : "HOLD";
        const sym = String(p.symbol || "SPY").toUpperCase();
        const optType = p.option_type || (sig === "BUY" ? "CALL" : sig === "SELL" ? "PUT" : "N/A");

        let strike = Number(p.strike_price);
        if (!strike || isNaN(strike)) {
          const baseP: Record<string, number> = { NVDA: 130, AAPL: 230, TSLA: 215, MSFT: 430, AMD: 155, AMZN: 190, META: 580, GOOGL: 175, SPY: 570 };
          const bp = baseP[sym] || 200;
          strike = optType === "CALL" ? Math.round(bp * 1.02) : optType === "PUT" ? Math.round(bp * 0.98) : bp;
        }

        return res.json({
          symbol: sym, signal: sig, optionType: optType, strikePrice: strike,
          expiry: p.expiry || expiry, expiryReadable: formatExpiryReadable(p.expiry || expiry),
          contracts: Math.min(5, Math.max(1, Number(p.contracts) || 1)),
          confidence: Math.max(0, Math.min(1, Number(p.confidence) || 0.75)),
          risk: ["LOW", "MEDIUM", "HIGH"].includes(String(p.risk).toUpperCase()) ? String(p.risk).toUpperCase() : "MEDIUM",
          maxPremium: Number(p.max_premium) || 5.00,
          strategyName: String(p.strategy_name || (optType === "CALL" ? "Long Call" : optType === "PUT" ? "Long Put" : "Hold")),
          reason: String(p.reason || "Analyzed catalyst."),
          isLiveAi: true, modelUsed: groqResult.model,
        });
      }

      // ─── Rule-Based Fallback ────────────────────────────────────────
      const combined = `${headline} ${summary || ""}`.toLowerCase();
      let symbol = "SPY";
      if (combined.includes("nvidia") || combined.includes("nvda") || combined.includes("blackwell")) symbol = "NVDA";
      else if (combined.includes("apple") || combined.includes("aapl")) symbol = "AAPL";
      else if (combined.includes("tesla") || combined.includes("tsla")) symbol = "TSLA";
      else if (combined.includes("microsoft") || combined.includes("msft") || combined.includes("azure")) symbol = "MSFT";
      else if (combined.includes("amazon") || combined.includes("amzn") || combined.includes("aws")) symbol = "AMZN";
      else if (combined.includes("amd")) symbol = "AMD";

      const bullWords = ["record", "accelerate", "growth", "expansion", "beat", "wins", "upgrade", "outperform", "orders", "surge"];
      const bearWords = ["delays", "regulatory", "bottleneck", "downgrade", "decline", "slowdown", "investigation", "plunge"];
      const bullCount = bullWords.filter(w => combined.includes(w)).length;
      const bearCount = bearWords.filter(w => combined.includes(w)).length;

      let signal = "HOLD", confidence = 0.55, risk = "MEDIUM", optionType = "N/A", strategyName = "Hold — No Trade";
      let reason = `Catalyst for ${symbol} is neutral; awaiting confirmation.`;
      const baseP: Record<string, number> = { NVDA: 130, AAPL: 230, TSLA: 215, MSFT: 430, AMD: 155, AMZN: 190, META: 580, SPY: 570 };
      const bp = baseP[symbol] || 200;

      if (bullCount > bearCount) {
        signal = "BUY"; confidence = Math.min(0.94, 0.78 + bullCount * 0.05);
        risk = confidence > 0.85 ? "LOW" : "MEDIUM"; optionType = "CALL"; strategyName = "Long Call";
        reason = `Bullish catalyst: expanding demand for ${symbol}. Deploying long call.`;
      } else if (bearCount > bullCount) {
        signal = "BUY"; confidence = Math.min(0.90, 0.75 + bearCount * 0.05);
        risk = "HIGH"; optionType = "PUT"; strategyName = "Long Put";
        reason = `Bearish headwinds for ${symbol}. Deploying protective put.`;
      }

      const strikePrice = optionType === "CALL" ? Math.round(bp * 1.02) : optionType === "PUT" ? Math.round(bp * 0.98) : bp;
      const contracts = confidence > 0.85 ? 3 : confidence > 0.75 ? 2 : 1;

      return res.json({
        symbol, signal, optionType, strikePrice, expiry, expiryReadable: formatExpiryReadable(expiry),
        contracts, confidence: Number(confidence.toFixed(2)), risk, maxPremium: 5.00, strategyName, reason, isLiveAi: false,
      });
    } catch (err: any) {
      console.error("AI Analysis error:", err);
      const expiry = getNextMonthlyExpiry();
      return res.json({
        symbol: "SPY", signal: "HOLD", optionType: "N/A", strikePrice: 570,
        expiry, expiryReadable: formatExpiryReadable(expiry), contracts: 0,
        confidence: 0.60, risk: "MEDIUM", maxPremium: 0, strategyName: "Hold — No Trade",
        reason: `Failsafe: ${err.message?.substring(0, 80) || "Processed"}`, isLiveAi: false,
      });
    }
  });

  // ─── Risk Evaluation ───────────────────────────────────────────────
  app.post("/api/risk/evaluate", (req, res) => {
    const { decision, minConfidence = 0.70, maxPositionPct = 0.10, maxOrderQty = 25, maxTradesPerSession = 10, requestedQty = 5, estimatedPrice = 200.0 } = req.body;
    if (!decision) return res.status(400).json({ error: "Decision object is required" });

    const symbol = String(decision.symbol || "SPY").toUpperCase();
    const signal = String(decision.signal || "HOLD").toUpperCase();
    const confidence = Number(decision.confidence) || 0.0;
    const optionType = decision.optionType || "N/A";
    const contracts = Number(decision.contracts) || 1;
    const maxPremium = Number(decision.maxPremium) || 5.0;
    const passed: string[] = [], failed: string[] = [];

    if (signal === "HOLD") {
      return res.json({ approved: false, symbol, signal, optionType, requestedQty: contracts, approvedQty: 0,
        passedChecks: ["Signal is valid"], failedChecks: ["Signal is HOLD — no execution"], rejectionReason: "HOLD signal. No options order." });
    }
    if (!["BUY", "SELL"].includes(signal)) {
      return res.json({ approved: false, symbol, signal, optionType, requestedQty: contracts, approvedQty: 0,
        failedChecks: [`Invalid signal: ${signal}`], rejectionReason: `Invalid signal ${signal}` });
    }
    if (!["CALL", "PUT"].includes(optionType)) {
      return res.json({ approved: false, symbol, signal, optionType, requestedQty: contracts, approvedQty: 0,
        failedChecks: [`Invalid option type: ${optionType}`], rejectionReason: `Invalid option type ${optionType}` });
    }

    passed.push(`✓ Signal: ${signal} ${optionType}`);

    if (confidence < minConfidence) failed.push(`✗ Confidence ${(confidence*100).toFixed(0)}% < ${(minConfidence*100).toFixed(0)}%`);
    else passed.push(`✓ Confidence ${(confidence*100).toFixed(0)}% ≥ ${(minConfidence*100).toFixed(0)}%`);

    if (simulatedAccount.session_trades_count >= maxTradesPerSession) failed.push(`✗ Session limit ${simulatedAccount.session_trades_count}/${maxTradesPerSession}`);
    else passed.push(`✓ Session ${simulatedAccount.session_trades_count}/${maxTradesPerSession}`);

    const totalPremiumCost = contracts * maxPremium * 100;
    if (totalPremiumCost > simulatedAccount.cash * 0.05) failed.push(`✗ Premium $${totalPremiumCost.toFixed(0)} > 5% cash $${(simulatedAccount.cash*0.05).toFixed(0)}`);
    else passed.push(`✓ Premium risk $${totalPremiumCost.toFixed(0)} within limit`);

    let finalContracts = Math.min(contracts, 5);
    passed.push(`✓ Contracts: ${finalContracts} (max 5)`);
    passed.push(`✓ Defined risk: max loss = premium $${totalPremiumCost.toFixed(0)}`);

    const approved = failed.length === 0;
    res.json({ approved, symbol, signal, optionType, contracts: finalContracts, requestedQty: contracts,
      approvedQty: approved ? finalContracts : 0, passedChecks: passed, failedChecks: failed,
      rejectionReason: failed.length > 0 ? failed.join(" | ") : null, maxPremium, totalPremiumCost: approved ? totalPremiumCost : 0 });
  });

  // ─── Options Order ─────────────────────────────────────────────────
  app.post("/api/trader/options-order", async (req, res) => {
    const { symbol, optionType, strikePrice, expiry, contracts = 1, side = "buy", limitPrice } = req.body;
    if (!symbol || !optionType || !strikePrice) return res.status(400).json({ error: "Missing options params" });

    const occSymbol = buildOccSymbol(symbol.toUpperCase(), expiry || getNextMonthlyExpiry(), optionType.toUpperCase() as "CALL" | "PUT", Number(strikePrice));
    const alpacaHeaders = getAlpacaHeaders();

    if (alpacaHeaders) {
      try {
        const liveOrder = await submitAlpacaOptionsOrder(occSymbol, contracts, side, limitPrice);
        simulatedAccount.session_trades_count++;
        let updatedAccount: any = null; try { updatedAccount = await fetchAlpacaAccount(); } catch {}
        return res.json({ order: liveOrder, account: updatedAccount || simulatedAccount, isLiveAlpaca: true, occSymbol,
          optionDetails: { underlying: symbol.toUpperCase(), optionType: optionType.toUpperCase(), strike: strikePrice,
            expiry: expiry || getNextMonthlyExpiry(), expiryReadable: formatExpiryReadable(expiry || getNextMonthlyExpiry()), contracts } });
      } catch (alpacaErr: any) {
        console.warn("Live options order failed, simulating:", alpacaErr.message);
      }
    }

    // Simulation fallback
    const premiumPerContract = limitPrice || 4.50;
    const totalCost = contracts * premiumPerContract * 100;
    simulatedAccount.cash = Math.max(0, simulatedAccount.cash - totalCost);
    simulatedAccount.session_trades_count++;

    const newOrder: OrderRecord = {
      id: `ord-opt-${Math.floor(100000 + Math.random() * 900000)}`, symbol: occSymbol, qty: contracts,
      side: side as "buy" | "sell", status: "filled",
      submitted_at: new Date().toISOString().replace("T", " ").substring(0, 19),
      filled_at: new Date().toISOString().replace("T", " ").substring(0, 19),
      filled_avg_price: premiumPerContract, order_class: "options", asset_class: "us_option",
    };
    simulatedOrders.unshift(newOrder);

    // FIX: Add the options contract to the simulated portfolio so net liquidity doesn't falsely drop
    const existingOpt = simulatedPositions.find(p => p.symbol === occSymbol);
    if (existingOpt) {
      const tq = existingOpt.qty + contracts;
      existingOpt.avg_entry_price = Number((((existingOpt.qty * existingOpt.avg_entry_price) + (contracts * premiumPerContract)) / tq).toFixed(2));
      existingOpt.qty = tq;
      existingOpt.current_price = premiumPerContract + 0.15; // slight immediate mock profit
      existingOpt.market_value = Number((tq * existingOpt.current_price * 100).toFixed(2));
      existingOpt.unrealized_pl = Number((existingOpt.market_value - (tq * existingOpt.avg_entry_price * 100)).toFixed(2));
    } else {
      const currentVal = premiumPerContract + 0.15; // mock positive slip
      simulatedPositions.push({
        symbol: occSymbol,
        qty: contracts,
        avg_entry_price: premiumPerContract,
        current_price: currentVal,
        market_value: Number((contracts * currentVal * 100).toFixed(2)),
        unrealized_pl: Number((contracts * 0.15 * 100).toFixed(2)),
        unrealized_plpc: 0.033,
        asset_class: "us_option",
      });
    }

    res.json({ order: newOrder, account: simulatedAccount, isLiveAlpaca: false, occSymbol,
      optionDetails: { underlying: symbol.toUpperCase(), optionType: optionType.toUpperCase(), strike: strikePrice,
        expiry: expiry || getNextMonthlyExpiry(), expiryReadable: formatExpiryReadable(expiry || getNextMonthlyExpiry()),
        contracts, premiumPerContract, totalCost } });
  });

  // ─── Stock Order (compat) ──────────────────────────────────────────
  app.post("/api/trader/order", async (req, res) => {
    const { symbol, qty, side, price = 200.0 } = req.body;
    if (!symbol || !qty || !side) return res.status(400).json({ error: "Missing order params" });
    const sym = String(symbol).toUpperCase(), orderQty = Number(qty), orderPrice = Number(price), orderSide = side.toLowerCase() as "buy" | "sell";

    const alpacaHeaders = getAlpacaHeaders();
    if (alpacaHeaders) {
      try {
        const liveOrder = await submitAlpacaStockOrder(sym, orderQty, orderSide);
        let updatedAccount: any = null; try { updatedAccount = await fetchAlpacaAccount(); } catch {}
        return res.json({ order: liveOrder, account: updatedAccount || simulatedAccount, isLiveAlpaca: true });
      } catch (e: any) { return res.status(400).json({ error: `Alpaca: ${e.message}`, isLiveAlpaca: true }); }
    }

    if (orderSide === "buy") {
      simulatedAccount.cash = Math.max(0, simulatedAccount.cash - orderQty * orderPrice);
      const existing = simulatedPositions.find(p => p.symbol === sym);
      if (existing) { const tq = existing.qty + orderQty; existing.avg_entry_price = Number((((existing.qty * existing.avg_entry_price) + (orderQty * orderPrice)) / tq).toFixed(2)); existing.qty = tq; existing.current_price = orderPrice; existing.market_value = Number((tq * orderPrice).toFixed(2)); }
      else simulatedPositions.push({ symbol: sym, qty: orderQty, avg_entry_price: orderPrice, current_price: orderPrice, market_value: Number((orderQty * orderPrice).toFixed(2)), unrealized_pl: 0, unrealized_plpc: 0 });
    } else {
      simulatedAccount.cash += orderQty * orderPrice;
      const existing = simulatedPositions.find(p => p.symbol === sym);
      if (existing) { existing.qty = Math.max(0, existing.qty - orderQty); existing.market_value = Number((existing.qty * orderPrice).toFixed(2)); if (existing.qty === 0) simulatedPositions = simulatedPositions.filter(p => p.symbol !== sym); }
    }
    simulatedAccount.session_trades_count++;

    const newOrder: OrderRecord = { id: `ord-paper-${Math.floor(100000 + Math.random() * 900000)}`, symbol: sym, qty: orderQty, side: orderSide, status: "filled",
      submitted_at: new Date().toISOString().replace("T", " ").substring(0, 19), filled_at: new Date().toISOString().replace("T", " ").substring(0, 19), filled_avg_price: orderPrice };
    simulatedOrders.unshift(newOrder);
    res.json({ order: newOrder, account: simulatedAccount, isLiveAlpaca: false });
  });

  // ─── Trader Endpoints ──────────────────────────────────────────────
  app.get("/api/trader/account", async (req, res) => {
    try { const live = await fetchAlpacaAccount(); if (live) return res.json({ account: live, isLivePaper: true }); } catch (e: any) { return res.json({ account: simulatedAccount, isLivePaper: false, error: e.message }); }
    let tv = simulatedPositions.reduce((a, p) => a + p.market_value, 0);
    simulatedAccount.portfolio_value = Number((simulatedAccount.cash + tv).toFixed(2));
    simulatedAccount.equity = simulatedAccount.portfolio_value;
    simulatedAccount.buying_power = Number((simulatedAccount.cash * 2).toFixed(2));
    res.json({ account: simulatedAccount, isLivePaper: false, needsConfig: true });
  });

  app.get("/api/trader/positions", async (req, res) => {
    try { const live = await fetchAlpacaPositions(); if (live) return res.json({ positions: live, isLivePaper: true }); } catch {}
    res.json({ positions: simulatedPositions, isLivePaper: false });
  });

  app.get("/api/trader/orders", async (req, res) => {
    try { const live = await fetchAlpacaOrders(); if (live) return res.json({ orders: live, isLivePaper: true }); } catch {}
    res.json({ orders: simulatedOrders, isLivePaper: false });
  });

  // ─── CLI Endpoints ─────────────────────────────────────────────────
  app.post("/api/cli/execute", async (req, res) => {
    const { command } = req.body;
    if (!command) return res.status(400).json({ error: "Command required" });
    const result = await executeAlpacaCli(command);
    res.json(result);
  });

  app.get("/api/cli/history", (req, res) => { res.json({ history: cliHistory, count: cliHistory.length }); });

  app.post("/api/trader/reset-session", (req, res) => { simulatedAccount.session_trades_count = 0; res.json({ status: "ok", session_trades_count: 0 }); });

  app.get("/api/python-files", (req, res) => {
    const files = ["app.py", "agent.py", "news.py", "trader.py", "risk_manager.py", "config.py", "requirements.txt", ".env.example", "README.md", "WRITEUP.md"];
    const result: Record<string, string> = {};
    for (const f of files) { const p = path.join(process.cwd(), f); if (fs.existsSync(p)) result[f] = fs.readFileSync(p, "utf-8"); }
    res.json({ files: result });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => { res.sendFile(path.join(distPath, "index.html")); });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n⚡ Alpaca AI Trading Agent v2.0.0`);
    console.log(`🌐 Dashboard: http://localhost:${PORT}`);
    console.log(`🤖 AI Engine: Groq (${getGroqModel()})`);
    console.log(`📊 Options Trading: ENABLED`);
    console.log(`⌨️  CLI Integration: ENABLED`);
    console.log(`🔒 Mode: PAPER TRADING ONLY\n`);
  });
}

startServer();
