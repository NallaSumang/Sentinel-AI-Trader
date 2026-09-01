import React from "react";
import { DollarSign, Wallet, Zap, TrendingUp, ShieldAlert, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "motion/react";
import { PaperAccount, Position, RiskSettings } from "../types";

interface PortfolioMetricsProps {
  account: PaperAccount | null;
  positions: Position[];
  riskSettings: RiskSettings;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

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
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4"
    >
      {/* Portfolio Value */}
      <motion.div variants={itemVariants} className="p-5 rounded-2xl glass-panel premium-card-hover flex flex-col justify-between group">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors">Portfolio Value</span>
          <div className="p-1.5 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 transition-colors">
            <Wallet className="h-4 w-4 text-indigo-500" />
          </div>
        </div>
        <div>
          <div className="text-3xl font-black text-slate-900 tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-600">
            ${portfolioVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm">
              Paper USD
            </span>
            <span className="font-medium">Live Equity</span>
          </div>
        </div>
      </motion.div>

      {/* Available Cash */}
      <motion.div variants={itemVariants} className="p-5 rounded-2xl glass-panel premium-card-hover flex flex-col justify-between group">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 group-hover:text-emerald-500 transition-colors">Available Cash</span>
          <div className="p-1.5 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
        </div>
        <div>
          <div className="text-3xl font-black text-slate-900 tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-600">
            ${cashVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 font-medium">
            Liquid for BUY orders
          </div>
        </div>
      </motion.div>

      {/* Buying Power */}
      <motion.div variants={itemVariants} className="p-5 rounded-2xl glass-panel premium-card-hover flex flex-col justify-between group">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors">Buying Power</span>
          <div className="p-1.5 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 transition-colors">
            <Zap className="h-4 w-4 text-indigo-500" />
          </div>
        </div>
        <div>
          <div className="text-3xl font-black text-slate-900 tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-600">
            ${buyingPower.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 font-medium flex items-center space-x-1">
            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">2.0x</span>
            <span>Margin Available</span>
          </div>
        </div>
      </motion.div>

      {/* Unrealized P&L */}
      <motion.div variants={itemVariants} className="p-5 rounded-2xl glass-panel premium-card-hover flex flex-col justify-between group">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 group-hover:text-emerald-500 transition-colors">Unrealized P&amp;L</span>
          <div className={`p-1.5 rounded-lg transition-colors ${totalUnrealizedPl >= 0 ? 'bg-emerald-50 group-hover:bg-emerald-100' : 'bg-red-50 group-hover:bg-red-100'}`}>
            <TrendingUp className={`h-4 w-4 ${totalUnrealizedPl >= 0 ? "text-emerald-600" : "text-red-600"}`} />
          </div>
        </div>
        <div>
          <div className={`text-3xl font-black tracking-tighter flex items-center space-x-1 ${totalUnrealizedPl >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            <span>{totalUnrealizedPl >= 0 ? "+" : ""}${totalUnrealizedPl.toFixed(2)}</span>
            {totalUnrealizedPl >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center space-x-1">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${totalPlPct >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              {totalPlPct >= 0 ? "+" : ""}{totalPlPct.toFixed(2)}%
            </span>
            <span className="font-medium">open yield</span>
          </div>
        </div>
      </motion.div>

      {/* Session Trades */}
      <motion.div variants={itemVariants} className="p-5 rounded-2xl glass-panel premium-card-hover flex flex-col justify-between col-span-2 sm:col-span-1 group">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 group-hover:text-amber-500 transition-colors">Session Velocity</span>
          <div className="p-1.5 rounded-lg bg-amber-50 group-hover:bg-amber-100 transition-colors">
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </div>
        </div>
        <div>
          <div className="text-3xl font-black text-slate-900 tracking-tighter">
            {sessionCount} <span className="text-lg font-bold text-slate-300">/ {riskSettings.maxTradesPerSession}</span>
          </div>
          <div className="w-full bg-slate-100/80 h-2.5 rounded-full mt-3 overflow-hidden border border-slate-200 shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (sessionCount / riskSettings.maxTradesPerSession) * 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)] ${
                sessionCount >= riskSettings.maxTradesPerSession
                  ? "bg-gradient-to-r from-red-500 to-red-400"
                  : sessionCount > riskSettings.maxTradesPerSession * 0.7
                  ? "bg-gradient-to-r from-amber-500 to-amber-400"
                  : "bg-gradient-to-r from-emerald-500 to-emerald-400"
              }`}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
