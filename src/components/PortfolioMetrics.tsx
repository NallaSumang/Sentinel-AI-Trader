import React from "react";
import { DollarSign, Wallet, Zap, TrendingUp, ShieldAlert, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { PaperAccount, Position, RiskSettings } from "../types";

interface PortfolioMetricsProps {
  account: PaperAccount | null;
  positions: Position[];
  riskSettings: RiskSettings;
}

export const PortfolioMetrics: React.FC<PortfolioMetricsProps> = ({
  account,
  positions,
  riskSettings,
}) => {
  const portfolioVal = account ? account.portfolio_value : 100000.0;
  const cashVal = account ? account.cash : 82540.0;
  const buyingPower = account ? account.buying_power : 165080.0;
  const sessionCount = account ? account.session_trades_count : 0;

  // Calculate total unrealized P&L
  const totalUnrealizedPl = positions.reduce((acc, p) => acc + (p.unrealized_pl || 0), 0);
  const totalPlPct = portfolioVal > 0 ? (totalUnrealizedPl / (portfolioVal - totalUnrealizedPl)) * 100 : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {/* Portfolio Value */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider">Portfolio Value</span>
          <Wallet className="h-4 w-4 text-slate-400" />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
            ${portfolioVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 mt-1">
            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Paper USD
            </span>
            <span>Live Equity</span>
          </div>
        </div>
      </div>

      {/* Available Cash */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider">Available Cash</span>
          <DollarSign className="h-4 w-4 text-emerald-600" />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
            ${cashVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Liquid for BUY orders
          </div>
        </div>
      </div>

      {/* Buying Power */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider">Buying Power</span>
          <Zap className="h-4 w-4 text-indigo-500" />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
            ${buyingPower.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            2.0x Paper Margin Available
          </div>
        </div>
      </div>

      {/* Unrealized P&L */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider">Unrealized P&amp;L</span>
          <TrendingUp className={`h-4 w-4 ${totalUnrealizedPl >= 0 ? "text-emerald-600" : "text-red-500"}`} />
        </div>
        <div>
          <div className={`text-2xl font-bold font-mono tracking-tight flex items-center space-x-1 ${totalUnrealizedPl >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            <span>{totalUnrealizedPl >= 0 ? "+" : ""}${totalUnrealizedPl.toFixed(2)}</span>
            {totalUnrealizedPl >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span className={totalPlPct >= 0 ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
              {totalPlPct >= 0 ? "+" : ""}{totalPlPct.toFixed(2)}%
            </span> open position yield
          </div>
        </div>
      </div>

      {/* Session Trades */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider">Session Trades</span>
          <ShieldAlert className="h-4 w-4 text-indigo-500" />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
            {sessionCount} <span className="text-sm font-normal text-slate-400">/ {riskSettings.maxTradesPerSession}</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden border border-slate-200">
            <div
              className={`h-full transition-all ${
                sessionCount >= riskSettings.maxTradesPerSession
                  ? "bg-red-500"
                  : sessionCount > riskSettings.maxTradesPerSession * 0.7
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, (sessionCount / riskSettings.maxTradesPerSession) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
