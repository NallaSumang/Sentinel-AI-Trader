import React from "react";
import { Bot, Shield, Terminal, Code2, RefreshCw, Zap, Cpu, AlertCircle } from "lucide-react";
import { ConfigStatus } from "../types";

interface NavbarProps {
  activeTab: "dashboard" | "pipeline" | "terminal" | "settings";
  setActiveTab: (tab: "dashboard" | "pipeline" | "terminal" | "settings") => void;
  configStatus: ConfigStatus | null;
  onRefreshAll: () => void;
  isRefreshing: boolean;
  onRunAutonomousCycle: () => void;
  isRunningCycle: boolean;
  isAutoMode: boolean;
  toggleAutoMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  configStatus,
  onRefreshAll,
  isRefreshing,
  onRunAutonomousCycle,
  isRunningCycle,
  isAutoMode,
  toggleAutoMode,
}) => {
  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-white/50 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/20 premium-card-hover">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-800">
                  Alpaca Sentinel
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold uppercase tracking-wider shadow-sm">
                  v2.0 • Pro
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium tracking-tight">
                Groq Autonomous Reasoning &amp; Alpaca Execution
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100/50 p-1.5 rounded-xl border border-white/60 shadow-sm backdrop-blur-md">
            <button
              id="tab-dashboard-btn"
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all premium-card-hover ${
                activeTab === "dashboard"
                  ? "bg-white text-indigo-700 shadow-md shadow-slate-200/50 border border-white"
                  : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </button>
            <button
              id="tab-pipeline-btn"
              onClick={() => setActiveTab("pipeline")}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all premium-card-hover ${
                activeTab === "pipeline"
                  ? "bg-white text-indigo-700 shadow-md shadow-slate-200/50 border border-white"
                  : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>Pipeline</span>
            </button>

            <button
              id="tab-terminal-btn"
              onClick={() => setActiveTab("terminal")}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all premium-card-hover ${
                activeTab === "terminal"
                  ? "bg-white text-indigo-700 shadow-md shadow-slate-200/50 border border-white"
                  : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>CLI</span>
            </button>
            <button
              id="tab-settings-btn"
              onClick={() => setActiveTab("settings")}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all premium-card-hover ${
                activeTab === "settings"
                  ? "bg-white text-indigo-700 shadow-md shadow-slate-200/50 border border-white"
                  : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Action Area */}
          <div className="flex items-center space-x-3">
            {/* Status pill */}
            {configStatus?.hasAlpacaKey ? (
              <div className="hidden sm:flex items-center space-x-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
                <span className="text-emerald-700 text-xs font-bold uppercase tracking-wider">
                  Live
                </span>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab("settings")}
                className="hidden sm:flex items-center space-x-2 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors shadow-sm text-left"
                title="Click to view instructions and configure ALPACA_API_KEY"
              >
                <span className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse"></span>
                <span className="text-amber-700 text-xs font-bold uppercase tracking-wider">
                  Needs Keys
                </span>
              </button>
            )}

            {/* Refresh button */}
            <button
              id="refresh-all-btn"
              onClick={onRefreshAll}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm premium-card-hover"
              title="Refresh Portfolio and News Feed"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
            </button>

            {/* Auto-Pilot Toggle */}
            <button
              onClick={toggleAutoMode}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-bold text-xs shadow-sm transition-all premium-card-hover border ${
                isAutoMode 
                  ? "bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/30" 
                  : "bg-white text-slate-500 border-slate-200 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50"
              }`}
              title="Toggle continuous autonomous 24/7 trading mode"
            >
              <div className={`h-2 w-2 rounded-full ${isAutoMode ? "bg-white animate-pulse" : "bg-slate-300"}`}></div>
              <span>{isAutoMode ? "Auto-Pilot ON" : "Auto-Pilot OFF"}</span>
            </button>

            {/* Run Autonomous Cycle CTA */}
            <button
              id="run-autonomous-cycle-nav-btn"
              onClick={onRunAutonomousCycle}
              disabled={isRunningCycle || isAutoMode}
              className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 premium-card-hover active:scale-95"
            >
              <Bot className={`h-4 w-4 fill-current ${isRunningCycle ? "animate-bounce" : ""}`} />
              <span>{isRunningCycle ? "Executing..." : "Run AI Cycle"}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
