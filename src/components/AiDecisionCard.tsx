import React, { useState } from "react";
import { BrainCircuit, Activity, Shield, Code, CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { AiDecision } from "../types";

interface AiDecisionCardProps {
  decision: AiDecision | null;
  isAnalyzing: boolean;
}

export const AiDecisionCard: React.FC<AiDecisionCardProps> = ({
  decision,
  isAnalyzing,
}) => {
  const [showJson, setShowJson] = useState(false);

  if (isAnalyzing) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col items-center justify-center min-h-[260px] text-center">
        <div className="relative mb-3">
          <div className="h-12 w-12 rounded-full border-2 border-indigo-100 border-t-indigo-600 animate-spin"></div>
          <BrainCircuit className="h-6 w-6 text-indigo-600 absolute inset-0 m-auto" />
        </div>
        <h4 className="text-sm font-bold text-slate-900 mb-1">Gemini AI Evaluating Catalyst...</h4>
        <p className="text-xs text-slate-500 max-w-xs">
          Synthesizing news sentiment, calculating confidence metrics, and structuring output schema.
        </p>
      </div>
    );
  }

  if (!decision) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col items-center justify-center min-h-[260px] text-center">
        <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
          <BrainCircuit className="h-6 w-6 text-slate-400" />
        </div>
        <h4 className="text-sm font-bold text-slate-700 mb-1">No AI Decision Generated Yet</h4>
        <p className="text-xs text-slate-500 max-w-xs">
          Select a headline from the live feed or click &quot;Run AI Cycle&quot; to execute autonomous Gemini reasoning.
        </p>
      </div>
    );
  }

  const signalColors = {
    BUY: {
      badge: "bg-emerald-50 text-emerald-700 border-emerald-300 font-extrabold",
      pill: "bg-emerald-500 text-white",
      text: "text-emerald-700",
      border: "border-emerald-200",
      bgHero: "bg-emerald-50/50",
    },
    SELL: {
      badge: "bg-red-50 text-red-700 border-red-300 font-extrabold",
      pill: "bg-red-500 text-white",
      text: "text-red-700",
      border: "border-red-200",
      bgHero: "bg-red-50/50",
    },
    HOLD: {
      badge: "bg-amber-50 text-amber-700 border-amber-300 font-extrabold",
      pill: "bg-amber-500 text-slate-900",
      text: "text-amber-700",
      border: "border-amber-200",
      bgHero: "bg-amber-50/50",
    },
  };

  const currentTheme = signalColors[decision.signal] || signalColors.HOLD;
  const confidencePct = Math.round(decision.confidence * 100);

  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <BrainCircuit className="h-4 w-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Structured AI Decision</h3>
        </div>
        <button
          id="toggle-raw-json-btn"
          onClick={() => setShowJson(!showJson)}
          className="flex items-center space-x-1 text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors font-medium"
        >
          <Code className="h-3 w-3" />
          <span>{showJson ? "Hide JSON" : "Raw JSON"}</span>
        </button>
      </div>

      {/* Decision Summary Hero */}
      <div className={`flex items-center justify-between p-3.5 rounded-lg border ${currentTheme.border} ${currentTheme.bgHero} mb-2.5`}>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Target Ticker</span>
          <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            ${decision.symbol}
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Signal Output</span>
          <span className={`inline-block px-3.5 py-1 rounded-md text-xs tracking-wider border shadow-sm ${currentTheme.badge}`}>
            {decision.signal}
          </span>
        </div>
      </div>

      {/* Options Strategy & Strike Price Field */}
      {decision.optionType && decision.optionType !== "N/A" ? (
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Option Contract:
            </span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-mono font-black tracking-wide border shadow-xs ${
                decision.optionType === "CALL"
                  ? "bg-emerald-600 text-white border-emerald-700"
                  : "bg-red-600 text-white border-red-700"
              }`}
            >
              {decision.optionType}
            </span>
          </div>
          <div className="flex items-center space-x-1 font-mono">
            <span className="text-[11px] font-semibold text-slate-500">Strike Price:</span>
            <span className="text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">
              ${decision.strikePrice ? decision.strikePrice.toFixed(2) : "ATM"}
            </span>
          </div>
        </div>
      ) : decision.signal !== "HOLD" ? (
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Option Contract:
            </span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-mono font-black tracking-wide border shadow-xs ${
                decision.signal === "BUY"
                  ? "bg-emerald-600 text-white border-emerald-700"
                  : "bg-red-600 text-white border-red-700"
              }`}
            >
              {decision.signal === "BUY" ? "CALL" : "PUT"}
            </span>
          </div>
          <div className="flex items-center space-x-1 font-mono">
            <span className="text-[11px] font-semibold text-slate-500">Strike Price:</span>
            <span className="text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">
              ${decision.strikePrice ? decision.strikePrice.toFixed(2) : "ATM"}
            </span>
          </div>
        </div>
      ) : null}

      {/* Confidence & Risk Grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-500">AI Confidence</span>
            <span className="text-xs font-mono font-bold text-slate-900">{confidencePct}%</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${confidencePct >= 70 ? "bg-emerald-500" : "bg-amber-500"}`}
              style={{ width: `${confidencePct}%` }}
            ></div>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Assessed Risk</span>
            <span className="text-xs font-bold text-slate-900">{decision.risk}</span>
          </div>
          <Shield className={`h-4 w-4 ${decision.risk === "LOW" ? "text-emerald-600" : decision.risk === "MEDIUM" ? "text-amber-500" : "text-red-500"}`} />
        </div>
      </div>

      {/* Reasoning text */}
      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Catalyst Rationale:</span>
        <p className="text-xs text-slate-700 leading-relaxed italic">
          &quot;{decision.reason}&quot;
        </p>
      </div>

      {/* Raw JSON viewer */}
      {showJson && (
        <div className="mt-3 p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto shadow-inner">
          <pre>{JSON.stringify(decision, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
