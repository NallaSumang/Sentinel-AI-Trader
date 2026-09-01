import React from "react";
import { ShieldCheck, ShieldAlert, Check, X, AlertTriangle, Scale } from "lucide-react";
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
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Scale className="h-4 w-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Institutional Risk Gate</h3>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          Pre-Trade Safety Filter
        </span>
      </div>

      {riskResult ? (
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* Status Hero */}
            <div
              className={`p-3 rounded-lg border mb-3 flex items-center justify-between ${
                riskResult.approved
                  ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                  : "bg-amber-50 border-amber-300 text-amber-900"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                {riskResult.approved ? (
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                ) : (
                  <ShieldAlert className="h-5 w-5 text-amber-600" />
                )}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide">
                    {riskResult.approved ? "Order Approved by Risk Gate" : "Order Blocked / Held by Gate"}
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
            <div className="space-y-1.5 mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Audit Checklist Verification:
              </span>

              {riskResult.passedChecks.map((item, idx) => (
                <div key={`pass-${idx}`} className="flex items-start space-x-2 text-xs text-slate-700">
                  <div className="mt-0.5 h-3.5 w-3.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5" />
                  </div>
                  <span className="leading-snug">{item}</span>
                </div>
              ))}

              {riskResult.failedChecks.map((item, idx) => (
                <div key={`fail-${idx}`} className="flex items-start space-x-2 text-xs text-red-700 font-medium">
                  <div className="mt-0.5 h-3.5 w-3.5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <X className="h-2.5 w-2.5" />
                  </div>
                  <span className="leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Constraints summary */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 grid grid-cols-2 gap-2">
            <div>Min Confidence: <span className="text-slate-900 font-mono font-semibold">{Math.round(riskSettings.minConfidence * 100)}%</span></div>
            <div>Max Position Size: <span className="text-slate-900 font-mono font-semibold">{Math.round(riskSettings.maxPositionPct * 100)}%</span></div>
            <div>Max Order Qty: <span className="text-slate-900 font-mono font-semibold">{riskSettings.maxOrderQty} sh</span></div>
            <div>Session Limit: <span className="text-slate-900 font-mono font-semibold">{riskSettings.maxTradesPerSession} trades</span></div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
          <ShieldCheck className="h-8 w-8 mb-2 text-slate-300" />
          <p className="text-xs">Waiting for active AI signal to run pre-trade capital safety verification.</p>
        </div>
      )}
    </div>
  );
};
