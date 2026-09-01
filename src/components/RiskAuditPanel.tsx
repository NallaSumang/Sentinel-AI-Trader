import React from "react";
import { ShieldCheck, ShieldAlert, Check, X, AlertTriangle, Scale } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RiskCheckResult, RiskSettings } from "../types";

interface RiskAuditPanelProps {
  riskResult: RiskCheckResult | null;
  riskSettings: RiskSettings;
}

export const RiskAuditPanel: React.FC<RiskAuditPanelProps> = ({
  riskResult,
  riskSettings,
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel premium-card-hover rounded-2xl p-5 flex flex-col h-full transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Scale className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Institutional Risk Gate</h3>
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">
          Pre-Trade Filter
        </span>
      </div>

      <AnimatePresence mode="wait">
        {riskResult ? (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col justify-between"
          >
            <div>
              {/* Status Hero */}
              <div
                className={`p-4 rounded-xl border mb-4 flex items-center justify-between shadow-sm backdrop-blur-sm ${
                  riskResult.approved
                    ? "bg-emerald-50/70 border-emerald-200"
                    : "bg-amber-50/70 border-amber-200"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg shadow-sm ${riskResult.approved ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                    {riskResult.approved ? (
                      <ShieldCheck className="h-6 w-6" />
                    ) : (
                      <ShieldAlert className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <div className={`text-xs font-black uppercase tracking-widest mb-1 ${riskResult.approved ? "text-emerald-700" : "text-amber-700"}`}>
                      {riskResult.approved ? "Order Approved" : "Order Blocked"}
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium">
                      {riskResult.approved
                        ? `Cleared for ${riskResult.approvedQty} shares of ${riskResult.symbol}`
                        : riskResult.rejectionReason || "Safeguard triggered"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Checklist Results */}
              <div className="space-y-2 mb-4 p-4 rounded-xl bg-white/60 border border-slate-200 shadow-sm">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-2 border-b border-slate-200 pb-2">
                  Audit Checklist Verification
                </span>

                {riskResult.passedChecks.map((item, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={`pass-${idx}`} 
                    className="flex items-start space-x-2.5 text-xs text-slate-700 font-medium"
                  >
                    <div className="mt-0.5 h-4 w-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="leading-snug">{item}</span>
                  </motion.div>
                ))}

                {riskResult.failedChecks.map((item, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (riskResult.passedChecks.length + idx) * 0.1 }}
                    key={`fail-${idx}`} 
                    className="flex items-start space-x-2.5 text-xs text-red-600 font-bold"
                  >
                    <div className="mt-0.5 h-4 w-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-sm">
                      <X className="h-3 w-3" />
                    </div>
                    <span className="leading-snug">{item}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Active Constraints summary */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-500 grid grid-cols-2 gap-3 shadow-inner">
              <div className="flex flex-col">
                <span className="uppercase tracking-widest font-extrabold mb-1">Min Confidence</span>
                <span className="text-slate-900 font-mono font-black text-xs">{Math.round(riskSettings.minConfidence * 100)}%</span>
              </div>
              <div className="flex flex-col">
                <span className="uppercase tracking-widest font-extrabold mb-1">Max Position</span>
                <span className="text-slate-900 font-mono font-black text-xs">{Math.round(riskSettings.maxPositionPct * 100)}%</span>
              </div>
              <div className="flex flex-col">
                <span className="uppercase tracking-widest font-extrabold mb-1">Max Order Qty</span>
                <span className="text-slate-900 font-mono font-black text-xs">{riskSettings.maxOrderQty} sh</span>
              </div>
              <div className="flex flex-col">
                <span className="uppercase tracking-widest font-extrabold mb-1">Session Limit</span>
                <span className="text-slate-900 font-mono font-black text-xs">{riskSettings.maxTradesPerSession}</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 bg-white/40 rounded-xl border border-dashed border-slate-200"
          >
            <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 shadow-inner border border-slate-200">
              <ShieldCheck className="h-7 w-7 text-slate-300" />
            </div>
            <p className="text-xs font-medium max-w-[200px]">Waiting for active AI signal to run pre-trade capital safety verification.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
