import React from "react";
import { Bot, Shield, Terminal, Code2, RefreshCw, Zap, Cpu, AlertCircle } from "lucide-react";
import { ConfigStatus } from "../types";

interface NavbarProps {
  activeTab: "dashboard" | "pipeline" | "code" | "settings";
  setActiveTab: (tab: "dashboard" | "pipeline" | "code" | "settings") => void;
  configStatus: ConfigStatus | null;
  onRefreshAll: () => void;
  isRefreshing: boolean;
  onRunAutonomousCycle: () => void;
  isRunningCycle: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  configStatus,
  onRefreshAll,
  isRefreshing,
  onRunAutonomousCycle,
  isRunningCycle,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#0F172A] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 bg-emerald-500 rounded-lg flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">
                  ALPACA AI SENTINEL
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono font-medium">
                  v1.0.4 • Hackathon
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gemini AI Autonomous Reasoning &amp; Alpaca Paper Sandbox
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
            <button
              id="tab-dashboard-btn"
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === "dashboard"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Live Dashboard</span>
            </button>
            <button
              id="tab-pipeline-btn"
              onClick={() => setActiveTab("pipeline")}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === "pipeline"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
              }`}
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>5-Stage Pipeline</span>
            </button>
            <button
              id="tab-code-btn"
              onClick={() => setActiveTab("code")}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === "code"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Python Source &amp; README</span>
            </button>
            <button
              id="tab-settings-btn"
              onClick={() => setActiveTab("settings")}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === "settings"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Risk &amp; Keys</span>
            </button>
          </nav>

          {/* Action Area */}
          <div className="flex items-center space-x-3">
            {/* Status pill */}
            {configStatus?.hasAlpacaKey ? (
              <div className="hidden sm:flex items-center space-x-2 bg-emerald-500/10 px-3 py-1.5 rounded border border-emerald-500/30">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                  Alpaca Paper Connected
                </span>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab("settings")}
                className="hidden sm:flex items-center space-x-2 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded border border-amber-500/30 transition-colors text-left"
                title="Click to view instructions and configure ALPACA_API_KEY"
              >
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping"></span>
                <span className="text-amber-300 text-xs font-semibold uppercase tracking-wider">
                  Alpaca Keys Needed
                </span>
              </button>
            )}

            {/* Refresh button */}
            <button
              id="refresh-all-btn"
              onClick={onRefreshAll}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="Refresh Portfolio and News Feed"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
            </button>

            {/* Run Autonomous Cycle CTA */}
            <button
              id="run-autonomous-cycle-nav-btn"
              onClick={onRunAutonomousCycle}
              disabled={isRunningCycle}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              <Zap className={`h-4 w-4 fill-current ${isRunningCycle ? "animate-bounce" : ""}`} />
              <span>{isRunningCycle ? "Executing..." : "Run AI Cycle"}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
