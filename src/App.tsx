import React, { useState, useEffect, useCallback } from "react";
import { AlertCircle, Key, ExternalLink } from "lucide-react";
import { Navbar } from "./components/Navbar";
import { PipelineVisualizer } from "./components/PipelineVisualizer";
import { PortfolioMetrics } from "./components/PortfolioMetrics";
import { NewsFeed } from "./components/NewsFeed";
import { AiDecisionCard } from "./components/AiDecisionCard";
import { RiskAuditPanel } from "./components/RiskAuditPanel";
import { PositionsAndOrders } from "./components/PositionsAndOrders";
import { ActivityLogs } from "./components/ActivityLogs";
import { PythonProjectExplorer } from "./components/PythonProjectExplorer";
import { CustomCatalystModal } from "./components/CustomCatalystModal";
import { RiskSettingsView } from "./components/RiskSettingsView";
import {
  NewsItem,
  AiDecision,
  RiskCheckResult,
  PaperAccount,
  Position,
  OrderRecord,
  RiskSettings,
  ConfigStatus,
} from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "pipeline" | "code" | "settings">("dashboard");
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);

  // Core Data States
  const [account, setAccount] = useState<PaperAccount | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  // Pipeline Execution States
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [aiDecision, setAiDecision] = useState<AiDecision | null>(null);
  const [riskResult, setRiskResult] = useState<RiskCheckResult | null>(null);
  const [lastOrderResult, setLastOrderResult] = useState<OrderRecord | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isRunningCycle, setIsRunningCycle] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Risk Controls State
  const [riskSettings, setRiskSettings] = useState<RiskSettings>({
    minConfidence: 0.7,
    maxPositionPct: 0.1,
    maxOrderQty: 25,
    maxTradesPerSession: 10,
  });

  // Terminal Activity Logs
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] Alpaca AI Trading Agent initialized in Paper Trading Sandbox.`,
    `[${new Date().toLocaleTimeString()}] Institutional Risk Gate active (Min Confidence: 70%, Max Position: 10%).`,
  ]);

  // Modal
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  const addLog = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 49)]);
  }, []);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [cfgRes, accRes, posRes, ordRes, newsRes] = await Promise.all([
        fetch("/api/config-status").then((r) => r.json()),
        fetch("/api/trader/account").then((r) => r.json()),
        fetch("/api/trader/positions").then((r) => r.json()),
        fetch("/api/trader/orders").then((r) => r.json()),
        fetch("/api/news").then((r) => r.json()),
      ]);

      setConfigStatus(cfgRes);
      setAccount(accRes.account);
      setPositions(posRes.positions || []);
      setOrders(ordRes.orders || []);
      if (newsRes.news && newsRes.news.length > 0) {
        setNews(newsRes.news);
        if (!selectedNews) {
          setSelectedNews(newsRes.news[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      addLog("Notice: Connected in offline fallback sandbox mode.");
    } finally {
      setIsRefreshing(false);
    }
  }, [addLog, selectedNews]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Execute full autonomous pipeline on a specific news item
  const runPipelineForNews = async (targetNews: NewsItem) => {
    setIsAnalyzing(true);
    setSelectedNews(targetNews);
    setCurrentStage(1);
    addLog(`Ingested news catalyst: "${targetNews.headline.substring(0, 60)}..."`);

    try {
      // Stage 2: Gemini AI Analysis
      setCurrentStage(2);
      await new Promise((r) => setTimeout(r, 450)); // smooth visual pacing
      const rawAiRes = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: targetNews.headline,
          summary: targetNews.summary,
          source: targetNews.source,
        }),
      }).then((r) => r.json());

      const aiRes = {
        symbol: String(rawAiRes.symbol || "SPY").toUpperCase(),
        signal: (["BUY", "SELL", "HOLD"].includes(String(rawAiRes.signal).toUpperCase())
          ? String(rawAiRes.signal).toUpperCase()
          : "HOLD") as "BUY" | "SELL" | "HOLD",
        optionType: rawAiRes.optionType || (rawAiRes.signal === "BUY" ? "CALL" : rawAiRes.signal === "SELL" ? "PUT" : "N/A"),
        strikePrice: typeof rawAiRes.strikePrice === "number" ? rawAiRes.strikePrice : undefined,
        confidence: typeof rawAiRes.confidence === "number" ? rawAiRes.confidence : 0.65,
        risk: (["LOW", "MEDIUM", "HIGH"].includes(String(rawAiRes.risk).toUpperCase())
          ? String(rawAiRes.risk).toUpperCase()
          : "MEDIUM") as "LOW" | "MEDIUM" | "HIGH",
        reason: String(rawAiRes.reason || "Analyzed market catalyst against trading criteria."),
        isLiveAi: Boolean(rawAiRes.isLiveAi),
      };

      setAiDecision(aiRes);
      addLog(
        `Gemini AI Decision: ${aiRes.signal} • ${aiRes.optionType} $${aiRes.strikePrice || ""} on ${aiRes.symbol} (Confidence: ${Math.round(
          aiRes.confidence * 100
        )}%, Risk: ${aiRes.risk})`
      );

      // Stage 3: Signal Generation
      setCurrentStage(3);
      await new Promise((r) => setTimeout(r, 350));

      // Stage 4: Risk Gate Check
      setCurrentStage(4);
      const riskRes = await fetch("/api/risk/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: aiRes,
          minConfidence: riskSettings.minConfidence,
          maxPositionPct: riskSettings.maxPositionPct,
          maxOrderQty: riskSettings.maxOrderQty,
          maxTradesPerSession: riskSettings.maxTradesPerSession,
          requestedQty: 5,
          estimatedPrice: targetNews.estimated_price || 180.0,
        }),
      }).then((r) => r.json());

      setRiskResult(riskRes);

      if (riskRes.approved) {
        addLog(`Risk Gate APPROVED: ${riskRes.approvedQty} shares of ${riskRes.symbol}.`);
        
        // Stage 5: Paper Trade Execution
        setCurrentStage(5);
        const orderRes = await fetch("/api/trader/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol: riskRes.symbol,
            qty: riskRes.approvedQty,
            side: riskRes.signal.toLowerCase(),
            price: targetNews.estimated_price || 180.0,
          }),
        }).then((r) => r.json());

        setLastOrderResult(orderRes.order);
        setAccount(orderRes.account);
        addLog(
          `Alpaca Paper Options Order FILLED: ${orderRes.order.id} (${orderRes.order.side.toUpperCase()} ${
            orderRes.order.qty
          }x ${orderRes.order.symbol} ${aiRes.optionType || (aiRes.signal === "BUY" ? "CALL" : "PUT")} $${aiRes.strikePrice || 130} @ $${orderRes.order.filled_avg_price})`
        );

        // Refresh positions and orders blotter
        const [posData, ordData] = await Promise.all([
          fetch("/api/trader/positions").then((r) => r.json()),
          fetch("/api/trader/orders").then((r) => r.json()),
        ]);
        setPositions(posData.positions || []);
        setOrders(ordData.orders || []);
      } else {
        setLastOrderResult(null);
        addLog(`Risk Gate BLOCKED/HELD order. Reason: ${riskRes.rejectionReason}`);
      }
    } catch (err: any) {
      console.error("Pipeline failure:", err);
      addLog(`Pipeline Error: ${err.message || "Failed to execute cycle"}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Full autonomous button handler (picks next news item or top news)
  const handleRunAutonomousCycle = async () => {
    if (isRunningCycle || news.length === 0) return;
    setIsRunningCycle(true);
    addLog("=== Starting Autonomous Trading Cycle ===");
    
    // Pick the top news item or randomly select a fresh catalyst
    const target = news[Math.floor(Math.random() * news.length)] || news[0];
    await runPipelineForNews(target);
    
    setIsRunningCycle(false);
  };

  const handleResetSessionTrades = async () => {
    try {
      await fetch("/api/trader/reset-session", { method: "POST" });
      addLog("Session trades counter reset to 0.");
      fetchData();
    } catch (err) {
      console.error("Failed to reset session:", err);
    }
  };

  const handleCustomCatalystSubmit = (newItem: NewsItem) => {
    setNews((prev) => [newItem, ...prev]);
    runPipelineForNews(newItem);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        configStatus={configStatus}
        onRefreshAll={fetchData}
        isRefreshing={isRefreshing}
        onRunAutonomousCycle={handleRunAutonomousCycle}
        isRunningCycle={isRunningCycle}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Alpaca Configuration Notice Banner if credentials missing */}
        {configStatus && !configStatus.hasAlpacaKey && (
          <div
            id="alpaca-credentials-notice-banner"
            className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          >
            <div className="flex items-start sm:items-center space-x-3">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-amber-950 flex items-center space-x-2">
                  <span>Alpaca Paper Trading Keys Required for Live Paper Sync</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-200/70 text-amber-800 text-[10px] uppercase font-semibold">
                    Running in Local Simulation
                  </span>
                </div>
                <p className="text-amber-800 mt-0.5">
                  Configure <code className="font-mono bg-white/80 px-1 py-0.5 rounded border border-amber-200 font-semibold">ALPACA_API_KEY</code> and <code className="font-mono bg-white/80 px-1 py-0.5 rounded border border-amber-200 font-semibold">ALPACA_SECRET_KEY</code> in environment variables or Settings to stream your live Alpaca Paper balances and submit real paper orders.
                </p>
              </div>
            </div>
            <button
              id="banner-configure-keys-btn"
              onClick={() => setActiveTab("settings")}
              className="shrink-0 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
            >
              <Key className="h-3.5 w-3.5" />
              <span>Configure Keys</span>
            </button>
          </div>
        )}

        {/* Always visible top metrics row */}
        <PortfolioMetrics
          account={account}
          positions={positions}
          riskSettings={riskSettings}
        />

        {/* Tab 1: Live Dashboard View */}
        {activeTab === "dashboard" && (
          <div className="space-y-5">
            {/* Visual 5-Stage Pipeline Indicator */}
            <PipelineVisualizer
              currentStage={currentStage}
              selectedNews={selectedNews}
              decision={aiDecision}
              riskResult={riskResult}
              orderResult={lastOrderResult}
            />

            {/* Main 2-Column Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: News Feed (5 cols) */}
              <div className="lg:col-span-5 h-[560px]">
                <NewsFeed
                  news={news}
                  selectedNewsId={selectedNews?.id || null}
                  onSelectAndAnalyze={runPipelineForNews}
                  isAnalyzing={isAnalyzing}
                  onOpenCustomModal={() => setIsCustomModalOpen(true)}
                />
              </div>

              {/* Middle & Right: AI Decision + Risk Gate + Blotter (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <AiDecisionCard
                    decision={aiDecision}
                    isAnalyzing={isAnalyzing}
                  />
                  <RiskAuditPanel
                    riskResult={riskResult}
                    riskSettings={riskSettings}
                  />
                </div>

                <div className="h-[280px]">
                  <PositionsAndOrders
                    positions={positions}
                    orders={orders}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Activity Logs */}
            <ActivityLogs
              logs={logs}
              onClearLogs={() => setLogs([])}
            />
          </div>
        )}

        {/* Tab 2: 5-Stage Pipeline Deep-Dive View */}
        {activeTab === "pipeline" && (
          <div className="space-y-5">
            <PipelineVisualizer
              currentStage={currentStage}
              selectedNews={selectedNews}
              decision={aiDecision}
              riskResult={riskResult}
              orderResult={lastOrderResult}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-1 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Step 1 &amp; 2: News &amp; AI Analysis
                </h4>
                <AiDecisionCard
                  decision={aiDecision}
                  isAnalyzing={isAnalyzing}
                />
              </div>

              <div className="md:col-span-1 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Step 3 &amp; 4: Capital Risk Gate
                </h4>
                <RiskAuditPanel
                  riskResult={riskResult}
                  riskSettings={riskSettings}
                />
              </div>

              <div className="md:col-span-1 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Step 5: Alpaca Paper Options Order Blotter
                </h4>
                <PositionsAndOrders
                  positions={positions}
                  orders={orders}
                />
              </div>
            </div>

            <ActivityLogs
              logs={logs}
              onClearLogs={() => setLogs([])}
            />
          </div>
        )}

        {/* Tab 3: Python Source Code & Hackathon Files Explorer */}
        {activeTab === "code" && <PythonProjectExplorer />}

        {/* Tab 4: Risk Settings & API Credentials */}
        {activeTab === "settings" && (
          <RiskSettingsView
            riskSettings={riskSettings}
            setRiskSettings={setRiskSettings}
            configStatus={configStatus}
            onResetSessionTrades={handleResetSessionTrades}
          />
        )}
      </main>

      {/* Custom Catalyst Modal */}
      <CustomCatalystModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSubmit={handleCustomCatalystSubmit}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 mt-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium text-slate-700">
            Alpaca AI Trading Agents Hackathon 2026 • Autonomous Pipeline in Paper Sandbox
          </span>
          <span className="text-[11px] text-slate-400">
            Autonomous Demonstration System • Paper Sandbox Only • Not Financial Advice
          </span>
        </div>
      </footer>
    </div>
  );
}
