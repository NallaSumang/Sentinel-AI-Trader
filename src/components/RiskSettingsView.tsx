import React from "react";
import { Shield, Key, Sliders, RefreshCw, CheckCircle2, AlertTriangle, ExternalLink, Lock } from "lucide-react";
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
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Institutional Risk Management &amp; Sandbox Credentials
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Conservative capital preservation controls applied before any paper order reaches Alpaca.
          </p>
        </div>

        <button
          onClick={onResetSessionTrades}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition-colors shrink-0"
        >
          <RefreshCw className="h-3.5 w-3.5 text-indigo-600" />
          <span>Reset Session Counter</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risk Constraints Sliders */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-200">
            <Sliders className="h-4 w-4 text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-900">Risk Parameters</h4>
          </div>

          {/* Min Confidence Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Minimum AI Confidence Threshold
              </label>
              <span className="text-xs font-mono font-bold text-indigo-600">
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
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Signals with confidence below this threshold will be automatically rejected.
            </p>
          </div>

          {/* Max Position Concentration Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Max Position Concentration (% of Portfolio)
              </label>
              <span className="text-xs font-mono font-bold text-indigo-600">
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
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Limits total capital exposure to a single stock symbol.
            </p>
          </div>

          {/* Max Order Quantity */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Max Order Quantity (Shares per Trade)
              </label>
              <span className="text-xs font-mono font-bold text-indigo-600">
                {riskSettings.maxOrderQty} shares
              </span>
            </div>
            <input
              type="number"
              min={1}
              max={100}
              value={riskSettings.maxOrderQty}
              onChange={(e) =>
                setRiskSettings((prev) => ({ ...prev, maxOrderQty: parseInt(e.target.value) || 1 }))
              }
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Max Session Trades */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Max Trades Allowed per Session
              </label>
              <span className="text-xs font-mono font-bold text-indigo-600">
                {riskSettings.maxTradesPerSession} trades
              </span>
            </div>
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
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Safety circuit breaker preventing automated runaway trade loops.
            </p>
          </div>
        </div>

        {/* API Credentials & Safeguard Status */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-200">
            <Key className="h-4 w-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-900">API Connection &amp; Safeguards</h4>
          </div>

          <div className="space-y-3">
            {/* Gemini API Status */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">Google Gemini API</div>
                <div className="text-[11px] text-slate-500">Model: gemini-2.5-flash / gemini-2.5-pro</div>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border ${configStatus?.hasGeminiKey ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                {configStatus?.hasGeminiKey ? "Live AI Active" : "Simulated / Fallback"}
              </span>
            </div>

            {/* Alpaca API Status */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">Alpaca Paper Trading API</div>
                <div className="text-[11px] text-slate-500 font-mono">https://paper-api.alpaca.markets</div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
                  configStatus?.hasAlpacaKey
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {configStatus?.hasAlpacaKey ? "Live Paper Connected" : "API Keys Required"}
              </span>
            </div>

            {/* Alpaca Configuration Instructions if not configured */}
            {!configStatus?.hasAlpacaKey && (
              <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-2">
                <div className="flex items-center space-x-1.5 font-bold text-amber-950">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Configure Alpaca Paper Trading Credentials</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  To connect directly to your Alpaca Paper Trading account, configure the following environment variables in your workspace Settings:
                </p>
                <div className="bg-white/80 p-2 rounded border border-amber-200 font-mono text-[11px] space-y-1 text-slate-800">
                  <div className="flex items-center justify-between">
                    <span>ALPACA_API_KEY</span>
                    <span className="text-[10px] text-amber-700 font-sans font-semibold">Your Paper Key ID</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>ALPACA_SECRET_KEY</span>
                    <span className="text-[10px] text-amber-700 font-sans font-semibold">Your Paper Secret Key</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-1 text-[11px] text-amber-800">
                  <a
                    href="https://app.alpaca.markets/paper/dashboard/overview"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 font-semibold text-indigo-700 hover:text-indigo-900 underline"
                  >
                    <span>Get free Alpaca Paper Keys</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <span>•</span>
                  <span>Strictly Paper Sandbox Only</span>
                </div>
              </div>
            )}

            {/* Security Guarantee notice */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-slate-900 font-semibold">
                <Lock className="h-3.5 w-3.5 text-indigo-600" />
                <span>Zero Real Brokerage Credential Rule</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                All live trading endpoints are hardcoded out. All Alpaca API requests run strictly server-side on <code className="text-indigo-600 font-mono bg-indigo-50 px-1 py-0.5 rounded border border-indigo-100">https://paper-api.alpaca.markets</code>. Credentials are read from environment variables and never exposed to the client.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
