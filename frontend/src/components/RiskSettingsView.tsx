import React from "react";
import { Shield, Key, Sliders, RefreshCw, CheckCircle2, AlertTriangle, ExternalLink, Lock, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RiskSettings, ConfigStatus } from "../types";

interface RiskSettingsViewProps {
  riskSettings: RiskSettings;
  setRiskSettings: React.Dispatch<React.SetStateAction<RiskSettings>>;
  configStatus: ConfigStatus | null;
  onResetSessionTrades: () => void;
}

export const RiskSettingsView: React.FC<RiskSettingsViewProps> = ({
  riskSettings,
  setRiskSettings,
  configStatus,
  onResetSessionTrades,
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Top Banner */}
      <div className="glass-panel premium-card-hover rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shadow-sm">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Institutional Risk Management &amp; Sandbox Credentials
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1.5 ml-[42px]">
            Conservative capital preservation controls applied before any paper order reaches Alpaca.
          </p>
        </div>

        <button
          onClick={onResetSessionTrades}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-sm transition-all shrink-0 active:scale-95"
        >
          <RefreshCw className="h-4 w-4 text-indigo-600" />
          <span>Reset Session Counter</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Risk Constraints Sliders */}
        <div className="glass-panel premium-card-hover rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-200/80">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Sliders className="h-4 w-4" />
            </div>
            <h4 className="text-base font-extrabold text-slate-900">Risk Parameters</h4>
          </div>

          {/* Min Confidence Slider */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500">
                AI Confidence Threshold
              </label>
              <span className="text-sm font-mono font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                {Math.round(riskSettings.minConfidence * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={0.95}
              step={0.05}
              value={riskSettings.minConfidence}
              onChange={(e) =>
                setRiskSettings((prev) => ({ ...prev, minConfidence: parseFloat(e.target.value) }))
              }
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <p className="text-[11px] text-slate-400 font-medium mt-2.5">
              Signals with confidence below this threshold will be automatically rejected.
            </p>
          </div>

          {/* Max Position Concentration Slider */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500">
                Max Position Concentration
              </label>
              <span className="text-sm font-mono font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                {Math.round(riskSettings.maxPositionPct * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.05}
              max={0.3}
              step={0.05}
              value={riskSettings.maxPositionPct}
              onChange={(e) =>
                setRiskSettings((prev) => ({ ...prev, maxPositionPct: parseFloat(e.target.value) }))
              }
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <p className="text-[11px] text-slate-400 font-medium mt-2.5">
              Limits total capital exposure to a single stock symbol.
            </p>
          </div>

          {/* Max Order Quantity & Max Session Trades */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 block mb-2">
                Max Order Qty (Shares)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={riskSettings.maxOrderQty}
                onChange={(e) =>
                  setRiskSettings((prev) => ({ ...prev, maxOrderQty: parseInt(e.target.value) || 1 }))
                }
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-mono font-black text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
              />
            </div>

            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 block mb-2">
                Max Trades / Session
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={riskSettings.maxTradesPerSession}
                onChange={(e) =>
                  setRiskSettings((prev) => ({
                    ...prev,
                    maxTradesPerSession: parseInt(e.target.value) || 1,
                  }))
                }
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-mono font-black text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* API Credentials & Safeguard Status */}
        <div className="glass-panel premium-card-hover rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-200/80">
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Key className="h-4 w-4" />
            </div>
            <h4 className="text-base font-extrabold text-slate-900">API Connection &amp; Safeguards</h4>
          </div>

          <div className="space-y-4">
            {/* Groq API Status */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100">
                  <Cpu className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <div className="text-[13px] font-extrabold text-slate-900 tracking-tight">Groq AI API</div>
                  <div className="text-[11px] font-medium text-slate-500 mt-0.5">Model: Llama 3.3 70B</div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-lg text-[11px] font-bold border shadow-sm ${configStatus?.hasGroqKey ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                {configStatus?.hasGroqKey ? "Live AI Active" : "Simulated / Fallback"}
              </span>
            </div>

            {/* Alpaca API Status */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">
                  <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xs shadow-md">A</div>
                </div>
                <div>
                  <div className="text-[13px] font-extrabold text-slate-900 tracking-tight">Alpaca Paper Trading API</div>
                  <div className="text-[10px] font-medium text-slate-500 font-mono mt-0.5 truncate max-w-[150px] sm:max-w-xs">https://paper-api.alpaca.markets</div>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-lg text-[11px] font-bold border shadow-sm ${
                  configStatus?.hasAlpacaKey
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {configStatus?.hasAlpacaKey ? "Live Paper Connected" : "API Keys Required"}
              </span>
            </div>

            {/* Alpaca Configuration Instructions if not configured */}
            <AnimatePresence>
              {!configStatus?.hasAlpacaKey && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-3 overflow-hidden shadow-inner"
                >
                  <div className="flex items-center space-x-2 font-extrabold text-amber-950">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Configure Alpaca Paper Trading Credentials</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800 font-medium">
                    To connect directly to your Alpaca Paper Trading account, configure the following environment variables in your workspace Settings:
                  </p>
                  <div className="bg-white p-3 rounded-lg border border-amber-200/60 font-mono text-[11px] space-y-1.5 text-slate-800 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="font-bold">ALPACA_API_KEY</span>
                      <span className="text-[10px] text-amber-700 font-sans font-semibold bg-amber-100/50 px-2 py-0.5 rounded">Your Paper Key ID</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="font-bold">ALPACA_SECRET_KEY</span>
                      <span className="text-[10px] text-amber-700 font-sans font-semibold bg-amber-100/50 px-2 py-0.5 rounded">Your Paper Secret Key</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 pt-1 text-[11px] text-amber-800 font-bold">
                    <a
                      href="https://app.alpaca.markets/paper/dashboard/overview"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 text-indigo-700 hover:text-indigo-900 underline transition-colors"
                    >
                      <span>Get free Alpaca Paper Keys</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <span className="text-amber-300">•</span>
                    <span>Strictly Paper Sandbox Only</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Security Guarantee notice */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2 shadow-inner mt-2">
              <div className="flex items-center space-x-2 text-slate-900 font-extrabold">
                <div className="p-1 rounded bg-slate-200 text-slate-600">
                  <Lock className="h-3 w-3" />
                </div>
                <span>Zero Real Brokerage Credential Rule</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500 font-medium ml-7">
                All live trading endpoints are hardcoded out. All Alpaca API requests run strictly server-side on <code className="text-indigo-700 font-mono font-bold bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100 mx-0.5">https://paper-api.alpaca.markets</code>. Credentials are read from environment variables and never exposed to the client.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
