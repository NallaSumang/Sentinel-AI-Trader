import React, { useState } from "react";
import { Layers, FileText, ArrowUpRight, ArrowDownRight, CheckCircle2, Clock } from "lucide-react";
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
  const [activeSubTab, setActiveSubTab] = useState<"positions" | "orders">("positions");

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Layers className="h-4 w-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Paper Blotter</h3>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            id="blotter-positions-tab-btn"
            onClick={() => setActiveSubTab("positions")}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              activeSubTab === "positions"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Positions ({positions.length})
          </button>
          <button
            id="blotter-orders-tab-btn"
            onClick={() => setActiveSubTab("orders")}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              activeSubTab === "orders"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Orders ({orders.length})
          </button>
        </div>
      </div>

      {activeSubTab === "positions" ? (
        <div className="overflow-x-auto flex-1">
          {positions.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200 font-bold">
                <tr>
                  <th className="px-3 py-2">Symbol</th>
                  <th className="px-3 py-2">Shares</th>
                  <th className="px-3 py-2">Entry ($)</th>
                  <th className="px-3 py-2">Current ($)</th>
                  <th className="px-3 py-2">Value ($)</th>
                  <th className="px-3 py-2 text-right">P&amp;L ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {positions.map((pos) => {
                  const isProfit = (pos.unrealized_pl || 0) >= 0;
                  return (
                    <tr key={pos.symbol} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-2.5 font-bold text-slate-900">
                        {pos.symbol}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">{pos.qty}</td>
                      <td className="px-3 py-2.5 text-slate-500">${pos.avg_entry_price.toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-slate-700">${pos.current_price.toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-slate-900 font-semibold">${pos.market_value.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                      <td className={`px-3 py-2.5 text-right font-bold ${isProfit ? "text-emerald-600" : "text-red-600"}`}>
                        {isProfit ? "+" : ""}${pos.unrealized_pl.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Layers className="h-6 w-6 mb-2 text-slate-300" />
              <p className="text-xs">No active open positions in paper portfolio.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto flex-1">
          {orders.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200 font-bold">
                <tr>
                  <th className="px-3 py-2">Order ID</th>
                  <th className="px-3 py-2">Side</th>
                  <th className="px-3 py-2">Symbol</th>
                  <th className="px-3 py-2">Shares</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3 py-2 text-slate-500 text-[11px]">{ord.id}</td>
                    <td className="px-3 py-2 font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${ord.side === "buy" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                        {ord.side}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-bold text-slate-900">{ord.symbol}</td>
                    <td className="px-3 py-2 text-slate-700">{ord.qty}</td>
                    <td className="px-3 py-2">
                      <span className="flex items-center space-x-1 text-emerald-700 font-medium text-[11px]">
                        <CheckCircle2 className="h-3 w-3" />
                        <span className="capitalize">{ord.status}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-slate-500 text-[11px]">
                      {ord.submitted_at.split(" ")[1] || ord.submitted_at}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <FileText className="h-6 w-6 mb-2 text-slate-300" />
              <p className="text-xs">No recent orders submitted yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
