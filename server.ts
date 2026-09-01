import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "MY_GEMINI_API_KEY" || apiKey.startsWith("your_")) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}

// Alpaca Paper Trading Configuration (Fixed to Paper Trading Endpoint)
const ALPACA_PAPER_BASE_URL = "https://paper-api.alpaca.markets";

function getAlpacaHeaders(): { "APCA-API-KEY-ID": string; "APCA-API-SECRET-KEY": string } | null {
  const apiKey = process.env.ALPACA_API_KEY?.trim();
  const secretKey = process.env.ALPACA_SECRET_KEY?.trim();
  if (
    !apiKey ||
    !secretKey ||
    apiKey === "" ||
    secretKey === "" ||
    apiKey.startsWith("your_") ||
    secretKey.startsWith("your_") ||
    apiKey === "MY_ALPACA_API_KEY"
  ) {
    return null;
  }
  return {
    "APCA-API-KEY-ID": apiKey,
    "APCA-API-SECRET-KEY": secretKey,
  };
}

async function fetchAlpacaAccount() {
  const headers = getAlpacaHeaders();
  if (!headers) return null;

  const response = await fetch(`${ALPACA_PAPER_BASE_URL}/v2/account`, {
    method: "GET",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Alpaca Paper Account API error (${response.status}): ${errorText}`);
  }

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
    method: "GET",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Alpaca Paper Positions API error (${response.status}): ${errorText}`);
  }

  const data: any[] = await response.json();
  return data.map((p) => ({
    symbol: p.symbol,
    qty: parseFloat(p.qty),
    avg_entry_price: parseFloat(p.avg_entry_price),
    current_price: parseFloat(p.current_price),
    market_value: parseFloat(p.market_value),
    unrealized_pl: parseFloat(p.unrealized_pl),
    unrealized_plpc: parseFloat(p.unrealized_plpc),
  }));
}

async function fetchAlpacaOrders(): Promise<OrderRecord[] | null> {
  const headers = getAlpacaHeaders();
  if (!headers) return null;

  const response = await fetch(`${ALPACA_PAPER_BASE_URL}/v2/orders?status=all&limit=25`, {
    method: "GET",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Alpaca Paper Orders API error (${response.status}): ${errorText}`);
  }

  const data: any[] = await response.json();
  return data.map((o) => ({
    id: o.id,
    symbol: o.symbol,
    qty: parseFloat(o.qty),
    side: (o.side.toLowerCase() === "buy" ? "buy" : "sell") as "buy" | "sell",
    status: (o.status === "filled" ? "filled" : o.status === "rejected" || o.status === "canceled" ? "rejected" : "pending") as "filled" | "pending" | "rejected",
    submitted_at: o.submitted_at ? o.submitted_at.replace("T", " ").substring(0, 19) : new Date().toISOString().replace("T", " ").substring(0, 19),
    filled_at: o.filled_at ? o.filled_at.replace("T", " ").substring(0, 19) : undefined,
    filled_avg_price: o.filled_avg_price ? parseFloat(o.filled_avg_price) : undefined,
    reason: o.failed_reason || o.status,
  }));
}

async function submitAlpacaOrder(symbol: string, qty: number, side: "buy" | "sell"): Promise<OrderRecord | null> {
  const headers = getAlpacaHeaders();
  if (!headers) return null;

  const response = await fetch(`${ALPACA_PAPER_BASE_URL}/v2/orders`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      symbol: symbol.toUpperCase(),
      qty: Math.max(1, Math.round(qty)),
      side: side.toLowerCase(),
      type: "market",
      time_in_force: "day",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Alpaca Paper Order submission failed (${response.status}): ${errorText}`);
  }

  const order: any = await response.json();
  return {
    id: order.id,
    symbol: order.symbol,
    qty: parseFloat(order.qty),
    side: (order.side.toLowerCase() === "buy" ? "buy" : "sell") as "buy" | "sell",
    status: (order.status === "filled" ? "filled" : order.status === "rejected" || order.status === "canceled" ? "rejected" : "pending") as "filled" | "pending" | "rejected",
    submitted_at: order.submitted_at ? order.submitted_at.replace("T", " ").substring(0, 19) : new Date().toISOString().replace("T", " ").substring(0, 19),
    filled_at: order.filled_at ? order.filled_at.replace("T", " ").substring(0, 19) : new Date().toISOString().replace("T", " ").substring(0, 19),
    filled_avg_price: order.filled_avg_price ? parseFloat(order.filled_avg_price) : undefined,
  };
}

// In-memory Paper Trading Simulator State for Fallback / Preview
interface Position {
  symbol: string;
  qty: number;
  avg_entry_price: number;
  current_price: number;
  market_value: number;
  unrealized_pl: number;
  unrealized_plpc: number;
}

interface OrderRecord {
  id: string;
  symbol: string;
  qty: number;
  side: "buy" | "sell";
  status: "filled" | "pending" | "rejected";
  submitted_at: string;
  filled_at?: string;
  filled_avg_price?: number;
  reason?: string;
}


let simulatedAccount = {
  portfolio_value: 100000.0,
  cash: 82540.0,
  buying_power: 165080.0,
  equity: 100000.0,
  status: "ACTIVE (PAPER SANDBOX)",
  currency: "USD",
  session_trades_count: 0
};

let simulatedPositions: Position[] = [
  {
    symbol: "AAPL",
    qty: 45,
    avg_entry_price: 224.5,
    current_price: 231.8,
    market_value: 10431.0,
    unrealized_pl: 328.5,
    unrealized_plpc: 0.0325
  },
  {
    symbol: "MSFT",
    qty: 18,
    avg_entry_price: 435.2,
    current_price: 448.6,
    market_value: 8074.8,
    unrealized_pl: 241.2,
    unrealized_plpc: 0.0308
  }
];

let simulatedOrders: OrderRecord[] = [
  {
    id: "ord-paper-849201",
    symbol: "AAPL",
    qty: 20,
    side: "buy",
    status: "filled",
    submitted_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString().replace("T", " ").substring(0, 19),
    filled_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString().replace("T", " ").substring(0, 19),
    filled_avg_price: 224.5
  }
];

const mockNewsDatabase = [
  {
    id: "news-101",
    headline: "NVIDIA Unveils Next-Gen Blackwell Ultra Architecture with Record Cloud AI Orders",
    summary: "NVIDIA announced that tier-1 cloud hyperscalers have ramped multi-billion dollar pre-orders for its newest energy-efficient AI supercomputing clusters, exceeding Wall Street supply estimates.",
    source: "Bloomberg Markets",
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
    symbol: "NVDA",
    estimated_price: 128.50
  },
  {
    id: "news-102",
    headline: "Apple Services Revenue Accelerates 16% YoY Driven by App Store and AI Subscription Growth",
    summary: "Apple posted quarterly services revenue above analyst consensus alongside expanded enterprise adoption for Apple Intelligence enabled hardware lines.",
    source: "Reuters Financial",
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString().replace("T", " ").substring(0, 19),
    symbol: "AAPL",
    estimated_price: 231.80
  },
  {
    id: "news-103",
    headline: "Tesla Faces Supply Chain Delays in European Battery Cell Expansion",
    summary: "Regulatory permitting questions and localized logistics bottlenecks in Berlin have prompted management to moderate near-term delivery guidance for Q3.",
    source: "Wall Street Journal",
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString().replace("T", " ").substring(0, 19),
    symbol: "TSLA",
    estimated_price: 215.40
  },
  {
    id: "news-104",
    headline: "Microsoft Cloud Azure Wins Multi-Year US Federal Infrastructure Modernization Contract",
    summary: "The Department of Defense announced a $4.8B modernization procurement focusing on multi-cloud security resiliency, granting Microsoft key enterprise workloads.",
    source: "CNBC Tech",
    timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString().replace("T", " ").substring(0, 19),
    symbol: "MSFT",
    estimated_price: 448.60
  },
  {
    id: "news-105",
    headline: "Amazon Web Services Accelerates Custom Silicon Deployments to Slash Inference Costs",
    summary: "AWS announced broad deployment of Trainium and Inferentia chips across enterprise customers, reducing AI compute expenses by 35% compared to legacy architectures.",
    source: "MarketWatch",
    timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString().replace("T", " ").substring(0, 19),
    symbol: "AMZN",
    estimated_price: 186.20
  },
  {
    id: "news-106",
    headline: "Federal Reserve Holds Benchmark Interest Rates Steady Amid Mixed Inflation Readings",
    summary: "FOMC officials signaled a data-dependent neutral posture, noting resilient consumer demand balanced by slowing commercial real estate credit formation.",
    source: "Financial Times",
    timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString().replace("T", " ").substring(0, 19),
    symbol: "SPY",
    estimated_price: 560.10
  }
];

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Config Status (Safe: never outputs secret keys)
  app.get("/api/config-status", (req, res) => {
    const hasGemini = Boolean(
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY.trim() !== "" &&
      process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" &&
      !process.env.GEMINI_API_KEY.startsWith("your_")
    );
    const alpacaHeaders = getAlpacaHeaders();
    const hasAlpaca = Boolean(alpacaHeaders);

    res.json({
      hasGeminiKey: hasGemini,
      hasAlpacaKey: hasAlpaca,
      isPaperTrading: true,
      alpacaBaseUrl: ALPACA_PAPER_BASE_URL,
      geminiModel: "gemini-3.7-flash",
      demoMode: !hasAlpaca,
      missingCredentialsMessage: !hasAlpaca
        ? "Alpaca Paper Trading credentials (ALPACA_API_KEY and ALPACA_SECRET_KEY) are not configured. Please configure them in environment variables to connect directly to Alpaca Paper Trading."
        : null,
    });
  });

  // News Feed API
  app.get("/api/news", (req, res) => {
    res.json({ news: mockNewsDatabase });
  });

  // Gemini AI Analysis Endpoint
  app.post("/api/gemini/analyze", async (req, res) => {
    try {
      const { headline, summary, source } = req.body;
      if (!headline) {
        return res.status(400).json({ error: "Headline is required" });
      }

      const client = getGeminiClient();

      if (client) {
        const systemInstruction = `You are an institutional financial analyst and quantitative options trading AI agent.
Evaluate market news and output STRICT raw JSON with this exact schema:
{
  "symbol": "TICKER",
  "signal": "BUY" | "SELL" | "HOLD",
  "option_type": "CALL" | "PUT" | "N/A",
  "strike_price": <number, realistic options strike near current market price>,
  "confidence": <float 0.0 to 1.0>,
  "risk": "LOW" | "MEDIUM" | "HIGH",
  "reason": "<One concise, data-backed rationale>"
}
Rules:
- For bullish / BUY signal: set option_type to "CALL", strike_price to ATM/OTM strike (e.g., NVDA $130-$135, AAPL $230-$235, TSLA $215-$220, MSFT $425-$430, AMD $155-$160, SPY $570-$575).
- For bearish / SELL signal: set option_type to "PUT", strike_price to ATM/OTM strike (e.g., NVDA $125, TSLA $210, AAPL $225, MSFT $415, SPY $565).
- For neutral / HOLD signal: set option_type to "N/A" (or hedge strike).
- Only valid US equity symbols (AAPL, NVDA, TSLA, MSFT, AMZN, GOOGL, AMD, META, SPY).
- Never invent ticker symbols. If ambiguous or macro, output symbol: SPY and signal: HOLD.
- Confidence must be between 0.0 and 1.0.`;

        const userPrompt = `Source: ${source || "Market News"}\nHeadline: ${headline}\nSummary: ${summary || headline}`;

        const candidateModels = ["gemini-2.5-flash", "gemini-3.7-flash", "gemini-flash-latest"];
        let aiSuccess = false;
        let parsedResult: any = null;
        let lastErrorMsg = "";

        for (const modelName of candidateModels) {
          try {
            const aiResponse = await client.models.generateContent({
              model: modelName,
              contents: userPrompt,
              config: {
                systemInstruction,
                temperature: 0.1,
                responseMimeType: "application/json"
              }
            });

            const text = aiResponse.text || "{}";
            const cleanJson = text.replace(/```json/gi, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(cleanJson);

            if (parsed && (parsed.symbol || parsed.signal)) {
              const sig = ["BUY", "SELL", "HOLD"].includes(String(parsed.signal).toUpperCase()) ? String(parsed.signal).toUpperCase() : "HOLD";
              const sym = String(parsed.symbol || "SPY").toUpperCase();
              
              // Determine sensible option type and strike
              const optType = parsed.option_type || (sig === "BUY" ? "CALL" : sig === "SELL" ? "PUT" : "N/A");
              let strike = Number(parsed.strike_price);
              if (!strike || isNaN(strike)) {
                const baseP = sym === "NVDA" ? 130 : sym === "AAPL" ? 230 : sym === "TSLA" ? 215 : sym === "MSFT" ? 425 : sym === "AMD" ? 155 : sym === "AMZN" ? 190 : sym === "META" ? 580 : 570;
                strike = sig === "BUY" ? Math.round(baseP * 1.02) : sig === "SELL" ? Math.round(baseP * 0.98) : baseP;
              }

              parsedResult = {
                symbol: sym,
                signal: sig,
                optionType: optType,
                strikePrice: strike,
                confidence: Number(parsed.confidence) || 0.75,
                risk: ["LOW", "MEDIUM", "HIGH"].includes(String(parsed.risk).toUpperCase()) ? String(parsed.risk).toUpperCase() : "MEDIUM",
                reason: String(parsed.reason || "Analyzed catalyst against fundamentals."),
                isLiveAi: true,
                modelUsed: modelName
              };
              aiSuccess = true;
              break;
            }
          } catch (modelErr: any) {
            lastErrorMsg = modelErr.message || String(modelErr);
            console.warn(`Model ${modelName} encountered error, trying next fallback:`, lastErrorMsg);
            // Brief pause before trying next candidate model if 503/429
            await new Promise(r => setTimeout(r, 200));
          }
        }

        if (aiSuccess && parsedResult) {
          return res.json(parsedResult);
        }
        
        console.warn("All live Gemini models temporarily unavailable (503/demand spike). Seamlessly falling back to rule engine:", lastErrorMsg);
      }

      // Rule-based fallback simulation if Gemini key is not configured or all live models are temporarily busy (503)
      const combined = `${headline} ${summary || ""}`.toLowerCase();
      let symbol = "SPY";
      if (combined.includes("nvidia") || combined.includes("nvda") || combined.includes("blackwell")) symbol = "NVDA";
      else if (combined.includes("apple") || combined.includes("aapl") || combined.includes("iphone")) symbol = "AAPL";
      else if (combined.includes("tesla") || combined.includes("tsla")) symbol = "TSLA";
      else if (combined.includes("microsoft") || combined.includes("msft") || combined.includes("azure")) symbol = "MSFT";
      else if (combined.includes("amazon") || combined.includes("amzn") || combined.includes("aws")) symbol = "AMZN";
      else if (combined.includes("amd")) symbol = "AMD";

      const bullWords = ["record", "accelerate", "growth", "expansion", "beat", "wins", "upgrade", "outperform", "orders", "surge"];
      const bearWords = ["delays", "regulatory", "bottleneck", "downgrade", "decline", "slowdown", "investigation", "plunge"];

      const bullCount = bullWords.filter(w => combined.includes(w)).length;
      const bearCount = bearWords.filter(w => combined.includes(w)).length;

      let signal = "HOLD";
      let confidence = 0.55;
      let risk = "MEDIUM";
      let reason = `Catalyst parameters for ${symbol} are neutral; waiting for confirmation.`;

      if (bullCount > bearCount) {
        signal = "BUY";
        confidence = Math.min(0.94, 0.78 + bullCount * 0.05);
        risk = confidence > 0.85 ? "LOW" : "MEDIUM";
        reason = `Bullish catalyst identified for ${symbol} driven by expanding enterprise demand and order pipeline.`;
      } else if (bearCount > bullCount) {
        signal = "SELL";
        confidence = Math.min(0.90, 0.75 + bearCount * 0.05);
        risk = "HIGH";
        reason = `Operational headwinds and supply/regulatory friction indicate downward risk for ${symbol}.`;
      }

      const baseP = symbol === "NVDA" ? 130 : symbol === "AAPL" ? 230 : symbol === "TSLA" ? 215 : symbol === "MSFT" ? 425 : symbol === "AMD" ? 155 : symbol === "AMZN" ? 190 : symbol === "META" ? 580 : 570;
      const optionType = signal === "BUY" ? "CALL" : signal === "SELL" ? "PUT" : "N/A";
      const strikePrice = signal === "BUY" ? Math.round(baseP * 1.02) : signal === "SELL" ? Math.round(baseP * 0.98) : baseP;

      return res.json({
        symbol,
        signal,
        optionType,
        strikePrice,
        confidence: Number(confidence.toFixed(2)),
        risk,
        reason,
        isLiveAi: false
      });
    } catch (err: any) {
      console.error("AI Analysis error (fallback engaged):", err);
      // Failsafe return so the pipeline never breaks
      return res.json({
        symbol: "SPY",
        signal: "HOLD",
        optionType: "N/A",
        strikePrice: 570,
        confidence: 0.60,
        risk: "MEDIUM",
        reason: `Catalyst parsed with failsafe reasoning engine: ${err.message?.substring(0, 80) || "Processed market context"}`,
        isLiveAi: false
      });
    }
  });

  // Risk Evaluation Endpoint
  app.post("/api/risk/evaluate", (req, res) => {
    const {
      decision,
      minConfidence = 0.70,
      maxPositionPct = 0.10,
      maxOrderQty = 25,
      maxTradesPerSession = 10,
      requestedQty = 5,
      estimatedPrice = 200.0
    } = req.body;

    if (!decision) {
      return res.status(400).json({ error: "Decision object is required" });
    }

    const symbol = String(decision.symbol || "SPY").toUpperCase();
    const signal = String(decision.signal || "HOLD").toUpperCase();
    const confidence = Number(decision.confidence) || 0.0;
    const passed: string[] = [];
    const failed: string[] = [];

    if (signal === "HOLD") {
      return res.json({
        approved: false,
        symbol,
        signal,
        requestedQty,
        approvedQty: 0,
        passedChecks: ["Signal is valid"],
        failedChecks: ["Signal is HOLD (no order execution required)"],
        rejectionReason: "Signal is HOLD. No order triggered."
      });
    }

    if (!["BUY", "SELL"].includes(signal)) {
      return res.json({
        approved: false,
        symbol,
        signal,
        requestedQty,
        approvedQty: 0,
        failedChecks: [`Invalid signal: ${signal}`],
        rejectionReason: `Invalid signal type ${signal}`
      });
    }
    passed.push(`Signal validation passed: ${signal}`);

    // Confidence threshold
    if (confidence < minConfidence) {
      failed.push(`AI Confidence (${confidence.toFixed(2)}) is below minimum threshold (${minConfidence.toFixed(2)})`);
    } else {
      passed.push(`Confidence check passed: ${confidence.toFixed(2)} >= ${minConfidence.toFixed(2)}`);
    }

    // Session trade limit
    if (simulatedAccount.session_trades_count >= maxTradesPerSession) {
      failed.push(`Session trade limit reached (${simulatedAccount.session_trades_count}/${maxTradesPerSession})`);
    } else {
      passed.push(`Session trade headroom available (${simulatedAccount.session_trades_count}/${maxTradesPerSession})`);
    }

    // Max order quantity
    let finalQty = Math.min(requestedQty, maxOrderQty);
    if (requestedQty > maxOrderQty) {
      passed.push(`Order quantity capped from ${requestedQty} to max ${maxOrderQty}`);
    } else {
      passed.push(`Order quantity (${requestedQty}) is within safety limit (${maxOrderQty})`);
    }

    // Position & Cash Checks
    const existingPos = simulatedPositions.find(p => p.symbol === symbol);
    const existingQty = existingPos ? existingPos.qty : 0;
    const existingMarketVal = existingPos ? existingPos.market_value : 0;

    if (signal === "BUY") {
      const orderCost = finalQty * estimatedPrice;
      if (orderCost > simulatedAccount.cash) {
        failed.push(`Insufficient cash: Required $${orderCost.toFixed(2)}, Available $${simulatedAccount.cash.toFixed(2)}`);
      } else {
        passed.push(`Cash liquidity verified (Cost $${orderCost.toFixed(2)} <= Cash $${simulatedAccount.cash.toFixed(2)})`);
      }

      const maxPositionVal = simulatedAccount.portfolio_value * maxPositionPct;
      const postTradeVal = existingMarketVal + orderCost;
      if (postTradeVal > maxPositionVal) {
        failed.push(`Position concentration limit exceeded: Projected $${postTradeVal.toFixed(2)} > max allowed $${maxPositionVal.toFixed(2)} (${Math.round(maxPositionPct * 100)}%)`);
      } else {
        passed.push(`Portfolio concentration within ${Math.round(maxPositionPct * 100)}% safety cap`);
      }
    }

    if (signal === "SELL") {
      if (existingQty <= 0) {
        failed.push(`Cannot SELL ${symbol}: No existing long position in account.`);
      } else if (existingQty < finalQty) {
        finalQty = existingQty;
        passed.push(`Sell quantity adjusted to match available inventory (${existingQty} shares)`);
      } else {
        passed.push(`Position inventory verified (${existingQty} shares held)`);
      }
    }

    const approved = failed.length === 0;
    res.json({
      approved,
      symbol,
      signal,
      requestedQty,
      approvedQty: approved ? finalQty : 0,
      passedChecks: passed,
      failedChecks: failed,
      rejectionReason: failed.length > 0 ? failed.join(" | ") : null
    });
  });

  // Trader Account Endpoint
  app.get("/api/trader/account", async (req, res) => {
    try {
      const liveAccount = await fetchAlpacaAccount();
      if (liveAccount) {
        return res.json({ account: liveAccount, isLivePaper: true });
      }
    } catch (err: any) {
      console.warn("Alpaca live account fetch notice:", err.message);
      return res.json({
        account: simulatedAccount,
        isLivePaper: false,
        error: err.message,
        message: "Alpaca Paper Trading API encountered an error. Using local sandbox simulation.",
      });
    }

    // Recalculate total portfolio value from positions + cash
    let totalPositionValue = simulatedPositions.reduce((acc, p) => acc + p.market_value, 0);
    simulatedAccount.portfolio_value = Number((simulatedAccount.cash + totalPositionValue).toFixed(2));
    simulatedAccount.equity = simulatedAccount.portfolio_value;
    simulatedAccount.buying_power = Number((simulatedAccount.cash * 2.0).toFixed(2));

    res.json({
      account: simulatedAccount,
      isLivePaper: false,
      needsConfig: true,
      message: "Alpaca Paper Trading credentials (ALPACA_API_KEY and ALPACA_SECRET_KEY) are not configured. Showing simulated sandbox.",
    });
  });

  // Trader Positions Endpoint
  app.get("/api/trader/positions", async (req, res) => {
    try {
      const livePositions = await fetchAlpacaPositions();
      if (livePositions) {
        return res.json({ positions: livePositions, isLivePaper: true });
      }
    } catch (err: any) {
      console.warn("Alpaca live positions fetch notice:", err.message);
    }
    res.json({ positions: simulatedPositions, isLivePaper: false });
  });

  // Trader Orders Endpoint
  app.get("/api/trader/orders", async (req, res) => {
    try {
      const liveOrders = await fetchAlpacaOrders();
      if (liveOrders) {
        return res.json({ orders: liveOrders, isLivePaper: true });
      }
    } catch (err: any) {
      console.warn("Alpaca live orders fetch notice:", err.message);
    }
    res.json({ orders: simulatedOrders, isLivePaper: false });
  });

  // Submit Paper Order Endpoint (Keeps all Alpaca API calls strictly server-side)
  app.post("/api/trader/order", async (req, res) => {
    const { symbol, qty, side, price = 200.0 } = req.body;
    if (!symbol || !qty || !side) {
      return res.status(400).json({ error: "Missing required order parameters" });
    }

    const sym = String(symbol).toUpperCase();
    const orderQty = Number(qty);
    const orderPrice = Number(price);
    const orderSide = side.toLowerCase() as "buy" | "sell";

    const alpacaHeaders = getAlpacaHeaders();
    if (alpacaHeaders) {
      try {
        const liveOrder = await submitAlpacaOrder(sym, orderQty, orderSide);
        let updatedAccount: any = null;
        try {
          updatedAccount = await fetchAlpacaAccount();
        } catch {
          // Ignore secondary account fetch error
        }
        return res.json({
          order: liveOrder,
          account: updatedAccount || simulatedAccount,
          isLiveAlpaca: true,
        });
      } catch (alpacaErr: any) {
        console.error("Live Alpaca order failed:", alpacaErr.message);
        return res.status(400).json({
          error: `Alpaca Paper API Error: ${alpacaErr.message}`,
          isLiveAlpaca: true,
        });
      }
    }

    // Fallback simulation when ALPACA_API_KEY is not configured
    if (orderSide === "buy") {
      const cost = orderQty * orderPrice;
      simulatedAccount.cash = Math.max(0, simulatedAccount.cash - cost);

      const existing = simulatedPositions.find((p) => p.symbol === sym);
      if (existing) {
        const totalQty = existing.qty + orderQty;
        existing.avg_entry_price = Number(
          (((existing.qty * existing.avg_entry_price) + (orderQty * orderPrice)) / totalQty).toFixed(2)
        );
        existing.qty = totalQty;
        existing.current_price = orderPrice;
        existing.market_value = Number((totalQty * orderPrice).toFixed(2));
      } else {
        simulatedPositions.push({
          symbol: sym,
          qty: orderQty,
          avg_entry_price: orderPrice,
          current_price: orderPrice,
          market_value: Number((orderQty * orderPrice).toFixed(2)),
          unrealized_pl: 0.0,
          unrealized_plpc: 0.0,
        });
      }
    } else if (orderSide === "sell") {
      const proceeds = orderQty * orderPrice;
      simulatedAccount.cash += proceeds;
      const existing = simulatedPositions.find((p) => p.symbol === sym);
      if (existing) {
        existing.qty = Math.max(0, existing.qty - orderQty);
        existing.market_value = Number((existing.qty * orderPrice).toFixed(2));
        if (existing.qty === 0) {
          simulatedPositions = simulatedPositions.filter((p) => p.symbol !== sym);
        }
      }
    }

    simulatedAccount.session_trades_count += 1;

    const newOrder: OrderRecord = {
      id: `ord-paper-${Math.floor(100000 + Math.random() * 900000)}`,
      symbol: sym,
      qty: orderQty,
      side: orderSide,
      status: "filled",
      submitted_at: new Date().toISOString().replace("T", " ").substring(0, 19),
      filled_at: new Date().toISOString().replace("T", " ").substring(0, 19),
      filled_avg_price: orderPrice,
    };

    simulatedOrders.unshift(newOrder);
    res.json({
      order: newOrder,
      account: simulatedAccount,
      isLiveAlpaca: false,
      needsConfig: true,
      notice:
        "Order executed in fallback simulation because ALPACA_API_KEY and ALPACA_SECRET_KEY are not configured in environment variables.",
    });
  });

  // Reset Session Endpoint
  app.post("/api/trader/reset-session", (req, res) => {
    simulatedAccount.session_trades_count = 0;
    res.json({ status: "ok", session_trades_count: 0 });
  });

  // Project Files API (Returns source code of all Python project files)
  app.get("/api/python-files", (req, res) => {
    const filesToRead = [
      "app.py",
      "agent.py",
      "news.py",
      "trader.py",
      "risk_manager.py",
      "config.py",
      "requirements.txt",
      ".env.example",
      ".gitignore",
      "README.md"
    ];

    const result: Record<string, string> = {};
    for (const filename of filesToRead) {
      const filePath = path.join(process.cwd(), filename);
      if (fs.existsSync(filePath)) {
        result[filename] = fs.readFileSync(filePath, "utf-8");
      }
    }
    res.json({ files: result });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Alpaca AI Trading Agent server running on port ${PORT}`);
  });
}

startServer();
