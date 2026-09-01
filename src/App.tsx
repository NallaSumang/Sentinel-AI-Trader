import React, { useState, useEffect, useCallback } from "react";
import { AlertCircle, Key, ExternalLink, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Navbar } from "./components/Navbar";
import { PipelineVisualizer } from "./components/PipelineVisualizer";
import { PortfolioMetrics } from "./components/PortfolioMetrics";
import { NewsFeed } from "./components/NewsFeed";
import { AiDecisionCard } from "./components/AiDecisionCard";
import { RiskAuditPanel } from "./components/RiskAuditPanel";
import { PositionsAndOrders } from "./components/PositionsAndOrders";
import { ActivityLogs } from "./components/ActivityLogs";
import { CustomCatalystModal } from "./components/CustomCatalystModal";
import { RiskSettingsView } from "./components/RiskSettingsView";
import { CliTerminal } from "./components/CliTerminal";
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

// Helper for safe JSON fetching
const safeFetchJson = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return res.json();
};

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "pipeline" | "code" | "terminal" | "settings">("dashboard");
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
  const [isAutoMode, setIsAutoMode] = useState<boolean>(false);

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
  const [toast, setToast] = useState<{title: string, desc: string} | null>(null);

  const showToast = useCallback((title: string, desc: string) => {
    setToast({title, desc});
    setTimeout(() => setToast(null), 4000);
  }, []);

  const addLog = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 49)]);
  }, []);

  // Fetch initial data safely
  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [cfgRes, accRes, posRes, ordRes, newsRes] = await Promise.all([
        safeFetchJson("/api/config-status"),
        safeFetchJson("/api/trader/account"),
        safeFetchJson("/api/trader/positions"),
        safeFetchJson("/api/trader/orders"),
        safeFetchJson("/api/news"),
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
      addLog("Notice: Connected in offline fallback sandbox mode or backend disconnected.");
    } finally {
      setIsRefreshing(false);
    }
  }, [addLog, selectedNews]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Listen for purely discretionary manual trades from the Blotter
  useEffect(() => {
    const handleManualTrade = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const { symbol, qty, side } = customEvent.detail;
      
      addLog(`[MANUAL DISCRETIONARY] Submitting ${side.toUpperCase()} order for ${qty}x ${symbol}...`);
      
      try {
        const orderRes = await safeFetchJson("/api/trader/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol: symbol,
            qty: qty,
            side: side,
            price: 180.0, // using market price simulation default
          }),
        });

        setLastOrderResult(orderRes.order);
        setAccount(orderRes.account);
        addLog(
          `Alpaca Order EXECUTED: ${orderRes.order.id} (${orderRes.order.side.toUpperCase()} ${
            orderRes.order.qty
          }x ${orderRes.order.symbol} @ Market)`
        );
        showToast(
          "Market Order Executed",
          `Successfully routed ${orderRes.order.qty} shares of ${orderRes.order.symbol} at Market.`
        );
        fetchData();
      } catch (err: any) {
        addLog(`[MANUAL ERROR] Failed to submit order: ${err.message}`);
      }
    };

    window.addEventListener("submit-manual-trade", handleManualTrade);
    return () => {
      window.removeEventListener("submit-manual-trade", handleManualTrade);
    };
  }, [fetchData, addLog]);

  // Execute full autonomous pipeline on a specific news item
  const runPipelineForNews = async (targetNews: NewsItem) => {
    setIsAnalyzing(true);
    setSelectedNews(targetNews);
    setCurrentStage(1);
    addLog(`Ingested news catalyst: "${targetNews.headline.substring(0, 60)}..."`);

    try {
      // Stage 2: Groq AI Analysis
      setCurrentStage(2);
      await new Promise((r) => setTimeout(r, 450)); // smooth visual pacing
      const rawAiRes = await safeFetchJson("/api/groq/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: targetNews.headline,
          summary: targetNews.summary,
          source: targetNews.source,
        }),
      });

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
        `Groq AI Decision: ${aiRes.signal} • ${aiRes.optionType} $${aiRes.strikePrice || ""} on ${aiRes.symbol} (Confidence: ${Math.round(
          aiRes.confidence * 100
        )}%, Risk: ${aiRes.risk})`
      );

      // Stage 3: Signal Generation
      setCurrentStage(3);
      await new Promise((r) => setTimeout(r, 350));

      // Stage 4: Risk Gate Check
      setCurrentStage(4);
      const riskRes = await safeFetchJson("/api/risk/evaluate", {
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
      });

      setRiskResult(riskRes);

      if (riskRes.approved) {
        addLog(`Risk Gate APPROVED: ${riskRes.approvedQty} shares of ${riskRes.symbol}.`);
        
        // Stage 5: Paper Trade Execution
        setCurrentStage(5);
        const orderRes = await safeFetchJson("/api/trader/options-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol: riskRes.symbol,
            optionType: aiRes.optionType || (aiRes.signal === "BUY" ? "CALL" : "PUT"),
            strikePrice: aiRes.strikePrice || 130,
            contracts: riskRes.approvedQty,
            side: riskRes.signal.toLowerCase(),
            limitPrice: 4.50, // default mock premium if not provided
          }),
        });

        setLastOrderResult(orderRes.order);
        setAccount(orderRes.account);
        addLog(
          `Alpaca Paper Options Order SUBMITTED: ${orderRes.order.id} (${orderRes.order.side.toUpperCase()} ${
            orderRes.order.qty
          }x ${orderRes.order.symbol} ${aiRes.optionType || (aiRes.signal === "BUY" ? "CALL" : "PUT")} $${aiRes.strikePrice || 130} @ ${orderRes.order.filled_avg_price ? '$' + orderRes.order.filled_avg_price : 'Market/Pending'})`
        );
        showToast(
          "AI Trade Executed",
          `Routed ${orderRes.order.side.toUpperCase()} ${orderRes.order.qty}x ${orderRes.order.symbol} ${aiRes.optionType} at $${aiRes.strikePrice}`
        );

        // Refresh positions and orders blotter
        const [posData, ordData] = await Promise.all([
          safeFetchJson("/api/trader/positions"),
          safeFetchJson("/api/trader/orders"),
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

  const handleManualOverrideBuy = async () => {
    if (!selectedNews || !aiDecision) return;
    
    addLog(`[MANUAL OVERRIDE] User forced a BUY signal for ${aiDecision.symbol}`);
    
    const overrideDecision: AiDecision = {
      ...aiDecision,
      signal: "BUY",
      optionType: "CALL",
      confidence: 1.0,
      reason: "[Manual Override]: User executed discretionary BUY order.",
    };
    
    setAiDecision(overrideDecision);
    setCurrentStage(3);
    await new Promise((r) => setTimeout(r, 350));
    
    // Stage 4: Risk Gate Check
    setCurrentStage(4);
    try {
      const riskRes = await safeFetchJson("/api/risk/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: overrideDecision,
          minConfidence: riskSettings.minConfidence,
          maxPositionPct: riskSettings.maxPositionPct,
          maxOrderQty: riskSettings.maxOrderQty,
          maxTradesPerSession: riskSettings.maxTradesPerSession,
          requestedQty: 5,
          estimatedPrice: selectedNews.estimated_price || 180.0,
        }),
      });

      setRiskResult(riskRes);

      if (riskRes.approved) {
        addLog(`Risk Gate APPROVED: ${riskRes.approvedQty} shares of ${riskRes.symbol}.`);
        
        // Stage 5: Paper Trade Execution
        setCurrentStage(5);
        const orderRes = await safeFetchJson("/api/trader/options-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol: riskRes.symbol,
            optionType: overrideDecision.optionType || "CALL",
            strikePrice: overrideDecision.strikePrice || 130,
            contracts: riskRes.approvedQty,
            side: riskRes.signal.toLowerCase(),
            limitPrice: 4.50, // default mock premium if not provided
          }),
        });

        setLastOrderResult(orderRes.order);
        setAccount(orderRes.account);
        addLog(
          `Alpaca Paper Options Order SUBMITTED: ${orderRes.order.id} (${orderRes.order.side.toUpperCase()} ${
            orderRes.order.qty
          }x ${orderRes.order.symbol} ${overrideDecision.optionType} $${overrideDecision.strikePrice || 130} @ ${orderRes.order.filled_avg_price ? '$' + orderRes.order.filled_avg_price : 'Market/Pending'})`
        );
        showToast(
          "Manual AI Override Executed",
          `Routed ${orderRes.order.side.toUpperCase()} ${orderRes.order.qty}x ${orderRes.order.symbol} ${overrideDecision.optionType} at $${overrideDecision.strikePrice}`
        );

        const [posData, ordData] = await Promise.all([
          safeFetchJson("/api/trader/positions"),
          safeFetchJson("/api/trader/orders"),
        ]);
        setPositions(posData.positions || []);
        setOrders(ordData.orders || []);
      } else {
        setLastOrderResult(null);
        addLog(`Risk Gate BLOCKED/HELD order. Reason: ${riskRes.rejectionReason}`);
      }
    } catch (err: any) {
      console.error("Pipeline failure in Manual Override:", err);
      addLog(`Pipeline Error: ${err.message || "Failed to execute cycle"}`);
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

  // Auto-Pilot continuous execution loop
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isAutoMode && !isRunningCycle && news.length > 0) {
      intervalId = setInterval(() => {
        handleRunAutonomousCycle();
      }, 15000); // run every 15 seconds
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAutoMode, isRunningCycle, news]);

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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white font-sans transition-colors duration-500 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      {/* Global Toast Notification Overlay */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            className="fixed top-20 right-6 z-[100] glass-panel bg-white/95 p-4 rounded-xl shadow-2xl shadow-emerald-500/10 border border-emerald-500/20 max-w-sm min-w-[300px]"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-full bg-emerald-100 text-emerald-600 shadow-sm shrink-0">
                <Check className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900 leading-tight">{toast.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{toast.desc}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        configStatus={configStatus}
        onRefreshAll={fetchData}
        isRefreshing={isRefreshing}
        onRunAutonomousCycle={handleRunAutonomousCycle}
        isRunningCycle={isRunningCycle}
        isAutoMode={isAutoMode}
        toggleAutoMode={() => setIsAutoMode((prev) => !prev)}
      />

      {/* Main Container */}
      <motion.main 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 relative z-10"
      >
        {/* Alpaca Configuration Notice Banner if credentials missing */}
        <AnimatePresence>
          {configStatus && !configStatus.hasAlpacaKey && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              id="alpaca-credentials-notice-banner"
              className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-sm"
            >
              <div className="flex items-start sm:items-center space-x-4">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0 shadow-sm">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="text-[13px]">
                  <div className="font-extrabold text-amber-950 flex flex-wrap items-center gap-2">
                    <span>Alpaca Paper Trading Keys Required for Live Paper Sync</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-200/70 text-amber-900 text-[10px] uppercase font-black tracking-wider shadow-sm">
                      Running in Local Simulation
                    </span>
                  </div>
                  <p className="text-amber-800 font-medium mt-1">
                    Configure <code className="font-mono bg-white/80 px-1.5 py-0.5 rounded-md border border-amber-200 font-bold mx-0.5 shadow-sm text-xs">ALPACA_API_KEY</code> and <code className="font-mono bg-white/80 px-1.5 py-0.5 rounded-md border border-amber-200 font-bold mx-0.5 shadow-sm text-xs">ALPACA_SECRET_KEY</code> in environment variables or Settings to stream your live Alpaca Paper balances and submit real paper orders.
                  </p>
                </div>
              </div>
              <button
                id="banner-configure-keys-btn"
                onClick={() => setActiveTab("settings")}
                className="shrink-0 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-[13px] font-black tracking-wide transition-all shadow-md shadow-amber-500/20 flex items-center space-x-2"
              >
                <Key className="h-4 w-4" />
                <span>Configure Keys</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Always visible top metrics row */}
        <PortfolioMetrics
          account={account}
          positions={positions}
          riskSettings={riskSettings}
        />

        {/* Tab 1: Live Dashboard View */}
        {activeTab === "dashboard" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Visual 5-Stage Pipeline Indicator */}
            <PipelineVisualizer
              currentStage={currentStage}
              selectedNews={selectedNews}
              decision={aiDecision}
              riskResult={riskResult}
              orderResult={lastOrderResult}
            />

            {/* Main 2-Column Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: News Feed (5 cols) */}
              <div className="lg:col-span-5 min-h-[580px]">
                <NewsFeed
                  news={news}
                  selectedNewsId={selectedNews?.id || null}
                  onSelectAndAnalyze={runPipelineForNews}
                  isAnalyzing={isAnalyzing}
                  onOpenCustomModal={() => setIsCustomModalOpen(true)}
                />
              </div>

              {/* Middle & Right: AI Decision + Risk Gate + Blotter (7 cols) */}
              <div className="lg:col-span-7 space-y-6 flex flex-col min-h-[580px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
                  <AiDecisionCard
                    decision={aiDecision}
                    isAnalyzing={isAnalyzing}
                    onManualOverrideBuy={handleManualOverrideBuy}
                  />
                  <RiskAuditPanel
                    riskResult={riskResult}
                    riskSettings={riskSettings}
                  />
                </div>

                <div className="flex-1 min-h-[280px]">
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
          </motion.div>
        )}

        {/* Tab 2: 5-Stage Pipeline Deep-Dive View */}
        {activeTab === "pipeline" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <PipelineVisualizer
              currentStage={currentStage}
              selectedNews={selectedNews}
              decision={aiDecision}
              riskResult={riskResult}
              orderResult={lastOrderResult}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">
                  Step 1 &amp; 2: News &amp; AI Analysis
                </h4>
                <AiDecisionCard
                  decision={aiDecision}
                  isAnalyzing={isAnalyzing}
                  onManualOverrideBuy={handleManualOverrideBuy}
                />
              </div>

              <div className="lg:col-span-1 space-y-4">
                <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">
                  Step 3 &amp; 4: Capital Risk Gate
                </h4>
                <RiskAuditPanel
                  riskResult={riskResult}
                  riskSettings={riskSettings}
                />
              </div>

              <div className="lg:col-span-1 space-y-4">
                <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">
                  Step 5: Paper Order Blotter
                </h4>
                <div className="min-h-[280px] h-full">
                  <PositionsAndOrders
                    positions={positions}
                    orders={orders}
                  />
                </div>
              </div>
            </div>

            <ActivityLogs
              logs={logs}
              onClearLogs={() => setLogs([])}
            />
          </motion.div>
        )}


        {/* Tab 4: CLI Terminal */}
        {activeTab === "terminal" && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="glass-panel rounded-2xl p-6 shadow-sm border border-slate-200/80">
              <h3 className="font-extrabold text-xl text-slate-900 mb-2 tracking-tight">Alpaca CLI Terminal</h3>
              <p className="text-[13px] text-slate-500 font-medium max-w-3xl leading-relaxed">
                Interact directly with your Alpaca paper account using CLI commands. 
                This interface translates standard <code className="bg-indigo-50 font-bold px-1.5 py-0.5 rounded-md text-indigo-600 border border-indigo-100 mx-0.5 shadow-sm text-xs">alpaca</code> commands into real-time API requests, meeting the hackathon's terminal interaction requirements.
              </p>
            </div>
            <CliTerminal />
          </motion.div>
        )}

        {/* Tab 5: Risk Settings & API Credentials */}
        {activeTab === "settings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <RiskSettingsView
              riskSettings={riskSettings}
              setRiskSettings={setRiskSettings}
              configStatus={configStatus}
              onResetSessionTrades={handleResetSessionTrades}
            />
          </motion.div>
        )}
      </motion.main>

      {/* Custom Catalyst Modal */}
      <CustomCatalystModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSubmit={handleCustomCatalystSubmit}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-md py-6 text-center text-[11px] font-bold tracking-wide text-slate-400 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-slate-600">
            Alpaca AI Trading Agents Hackathon 2026 • Autonomous Pipeline in Paper Sandbox
          </span>
          <span className="uppercase text-[10px] tracking-widest bg-slate-100 px-3 py-1 rounded-full">
            Autonomous Demonstration System • Not Financial Advice
          </span>
        </div>
      </footer>
    </div>
  );
}
