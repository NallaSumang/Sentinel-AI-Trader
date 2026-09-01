import React, { useState } from "react";
import { Layers, FileText, ArrowUpRight, ArrowDownRight, CheckCircle2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Position, OrderRecord } from "../types";

interface PositionsAndOrdersProps {
  positions: Position[];
  orders: OrderRecord[];
  onManualClosePosition?: (symbol: string, qty: number) => void;
}

export const PositionsAndOrders: React.FC<PositionsAndOrdersProps> = ({
  positions,
  orders,
  onManualClosePosition,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"positions" | "orders" | "manual">("positions");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel premium-card-hover rounded-2xl p-5 flex flex-col h-full transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Layers className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Paper Blotter</h3>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 shadow-inner">
          <button
            id="blotter-positions-tab-btn"
            onClick={() => setActiveSubTab("positions")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === "positions"
                ? "bg-white text-indigo-700 shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Positions ({positions.length})
          </button>
          <button
            id="blotter-orders-tab-btn"
            onClick={() => setActiveSubTab("orders")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === "orders"
                ? "bg-white text-indigo-700 shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Orders ({orders.length})
          </button>
          <button
            id="blotter-manual-tab-btn"
            onClick={() => setActiveSubTab("manual")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === "manual"
                ? "bg-white text-indigo-700 shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Manual Trade
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === "positions" ? (
          <motion.div 
            key="positions"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="overflow-x-auto flex-1 bg-white/60 rounded-xl border border-slate-200 shadow-sm"
          >
            {positions.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-200 font-extrabold">
                  <tr>
                    <th className="px-4 py-3">Symbol</th>
                    <th className="px-4 py-3">Shares</th>
                    <th className="px-4 py-3">Entry ($)</th>
                    <th className="px-4 py-3">Current ($)</th>
                    <th className="px-4 py-3">Value ($)</th>
                    <th className="px-4 py-3 text-right">P&amp;L ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {positions.map((pos) => {
                    const isProfit = (pos.unrealized_pl || 0) >= 0;
                    return (
                      <tr key={pos.symbol} className="hover:bg-indigo-50/50 transition-colors">
                        <td className="px-4 py-3 font-black text-slate-900">
                          {pos.symbol}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-600">{pos.qty}</td>
                        <td className="px-4 py-3 text-slate-500">${pos.avg_entry_price.toFixed(2)}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">${pos.current_price.toFixed(2)}</td>
                        <td className="px-4 py-3 text-slate-900 font-black">${pos.market_value.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        <td className={`px-4 py-3 text-right font-black ${isProfit ? "text-emerald-600" : "text-red-600"}`}>
                          {isProfit ? "+" : ""}${pos.unrealized_pl.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 h-full">
                <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3 shadow-inner border border-slate-200">
                  <Layers className="h-5 w-5 text-slate-300" />
                </div>
                <p className="text-xs font-medium">No active open positions in portfolio.</p>
              </div>
            )}
          </motion.div>
        ) : activeSubTab === "orders" ? (
          <motion.div 
            key="orders"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="overflow-x-auto flex-1 bg-white/60 rounded-xl border border-slate-200 shadow-sm"
          >
            {orders.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-200 font-extrabold">
                  <tr>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Side</th>
                    <th className="px-4 py-3">Symbol</th>
                    <th className="px-4 py-3">Shares</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-indigo-50/50 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-[10px] font-medium">{ord.id.substring(0, 8)}...</td>
                      <td className="px-4 py-3 font-black">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-widest border shadow-sm ${ord.side === "buy" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                          {ord.side}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-black text-slate-900">{ord.symbol}</td>
                      <td className="px-4 py-3 font-medium text-slate-600">{ord.qty}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center space-x-1.5 text-emerald-600 font-bold text-[11px]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span className="capitalize tracking-wider">{ord.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 text-[10px] font-semibold tracking-wider">
                        {ord.submitted_at.split(" ")[1] || ord.submitted_at}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 h-full">
                <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3 shadow-inner border border-slate-200">
                  <FileText className="h-5 w-5 text-slate-300" />
                </div>
                <p className="text-xs font-medium">No recent orders submitted yet.</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="manual"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex-1 bg-white/60 rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col"
          >
            <h4 className="text-[13px] font-black text-slate-900 mb-4 border-b border-slate-200 pb-2">Normal Manual Execution</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Ticker</label>
                  <input id="manual-sym" type="text" placeholder="NVDA" className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Shares</label>
                  <input id="manual-qty" type="number" defaultValue={5} className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-4">
                <button
                  disabled={isSubmitting}
                  onClick={() => {
                    setIsSubmitting(true);
                    const sym = (document.getElementById("manual-sym") as HTMLInputElement).value || "SPY";
                    const qty = Number((document.getElementById("manual-qty") as HTMLInputElement).value) || 5;
                    window.dispatchEvent(new CustomEvent("submit-manual-trade", { detail: { symbol: sym, qty, side: "buy" } }));
                    setTimeout(() => setIsSubmitting(false), 800);
                  }}
                  className={`flex-1 ${isSubmitting ? "bg-slate-400" : "bg-emerald-500 hover:bg-emerald-600"} text-white font-black py-2 rounded-lg text-sm tracking-wide shadow-md transition-all active:scale-95`}
                >
                  {isSubmitting ? "ROUTING..." : "MARKET BUY"}
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={() => {
                    setIsSubmitting(true);
                    const sym = (document.getElementById("manual-sym") as HTMLInputElement).value || "SPY";
                    const qty = Number((document.getElementById("manual-qty") as HTMLInputElement).value) || 5;
                    window.dispatchEvent(new CustomEvent("submit-manual-trade", { detail: { symbol: sym, qty, side: "sell" } }));
                    setTimeout(() => setIsSubmitting(false), 800);
                  }}
                  className={`flex-1 ${isSubmitting ? "bg-slate-400" : "bg-red-500 hover:bg-red-600"} text-white font-black py-2 rounded-lg text-sm tracking-wide shadow-md transition-all active:scale-95`}
                >
                  {isSubmitting ? "ROUTING..." : "MARKET SELL"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
