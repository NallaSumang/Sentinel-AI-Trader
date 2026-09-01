import React, { useState } from "react";
import { BrainCircuit, Activity, Shield, Code, CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AiDecision } from "../types";

interface AiDecisionCardProps {
  decision: AiDecision | null;
  isAnalyzing: boolean;
  onManualOverrideBuy?: () => void;
}

export const AiDecisionCard: React.FC<AiDecisionCardProps> = ({
  decision,
  isAnalyzing,
  onManualOverrideBuy,
}) => {
  const [showJson, setShowJson] = useState(false);

  if (isAnalyzing) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px] text-center"
      >
        <div className="relative mb-4">
          <div className="h-16 w-16 rounded-full border-[3px] border-indigo-100 border-t-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-spin"></div>
          <BrainCircuit className="h-7 w-7 text-indigo-500 absolute inset-0 m-auto" />
        </div>
        <h4 className="text-base font-extrabold text-slate-900 mb-2 tracking-tight">Groq AI Reasoning Engine Active</h4>
        <p className="text-xs text-slate-500 max-w-xs font-medium">
          Synthesizing news sentiment, calculating confidence metrics, and structuring output schema...
        </p>
      </motion.div>
    );
  }

  if (!decision) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px] text-center"
      >
        <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 shadow-inner border border-slate-200">
          <BrainCircuit className="h-7 w-7 text-slate-400" />
        </div>
        <h4 className="text-sm font-bold text-slate-700 mb-2">Awaiting AI Catalyst</h4>
        <p className="text-xs text-slate-500 max-w-xs">
          Select a headline from the live feed or click &quot;Run AI Cycle&quot; to execute autonomous Groq reasoning.
        </p>
      </motion.div>
    );
  }

  const signalColors = {
    BUY: {
      badge: "bg-gradient-to-r from-emerald-500 to-emerald-400 text-white border-emerald-500 shadow-md shadow-emerald-500/30",
      bgHero: "bg-emerald-50/70 border-emerald-200",
      accent: "text-emerald-600",
      optionBadge: "bg-emerald-600 text-white border-emerald-700 shadow-emerald-600/30",
    },
    SELL: {
      badge: "bg-gradient-to-r from-red-500 to-red-400 text-white border-red-500 shadow-md shadow-red-500/30",
      bgHero: "bg-red-50/70 border-red-200",
      accent: "text-red-600",
      optionBadge: "bg-red-600 text-white border-red-700 shadow-red-600/30",
    },
    HOLD: {
      badge: "bg-gradient-to-r from-amber-400 to-amber-300 text-slate-900 border-amber-400 shadow-md shadow-amber-400/30",
      bgHero: "bg-amber-50/70 border-amber-200",
      accent: "text-amber-600",
      optionBadge: "bg-slate-700 text-white border-slate-800",
    },
  };

  const currentTheme = signalColors[decision.signal] || signalColors.HOLD;
  const confidencePct = Math.round(decision.confidence * 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-panel premium-card-hover rounded-2xl p-5 transition-all`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <BrainCircuit className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Structured AI Decision</h3>
        </div>
        <div className="flex items-center space-x-2">
          {decision?.signal === "HOLD" && onManualOverrideBuy && (
            <button
              onClick={onManualOverrideBuy}
              className="px-3 py-1.5 rounded-lg text-[11px] font-black text-white bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 shadow-md shadow-emerald-500/30 transition-all active:scale-95 border border-emerald-400"
            >
              Manual Override: BUY
            </button>
          )}
          <button
            id="toggle-raw-json-btn"
            onClick={() => setShowJson(!showJson)}
            className="flex items-center space-x-1.5 text-xs text-slate-500 hover:text-indigo-600 px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-all font-bold shadow-sm"
          >
            <Code className="h-3.5 w-3.5" />
            <span>{showJson ? "Hide JSON" : "Raw JSON"}</span>
          </button>
        </div>
      </div>

      {/* Decision Summary Hero */}
      <div className={`flex items-center justify-between p-4 rounded-xl border ${currentTheme.bgHero} mb-4 shadow-sm backdrop-blur-sm`}>
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1 block">Target Ticker</span>
          <div className={`text-3xl font-black font-mono tracking-tighter ${currentTheme.accent}`}>
            ${decision.symbol}
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block mb-1.5">Action Signal</span>
          <button 
            onClick={onManualOverrideBuy}
            className={`inline-block px-4 py-1.5 rounded-lg text-xs font-black tracking-widest border ${currentTheme.badge} ${onManualOverrideBuy ? "hover:scale-105 active:scale-95 cursor-pointer" : "cursor-default"} transition-all`}
            title="Click to force manual execution of this signal"
          >
            {decision.signal} {onManualOverrideBuy && "⚡"}
          </button>
        </div>
      </div>

      {/* Options Strategy & Strike Price Field */}
      {decision.optionType && decision.optionType !== "N/A" ? (
        <div className="p-3.5 rounded-xl bg-white/60 border border-slate-200 flex items-center justify-between mb-4 shadow-sm">
          <div className="flex items-center space-x-2.5">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
              Contract
            </span>
            <span className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-black tracking-widest border shadow-sm ${currentTheme.optionBadge}`}>
              {decision.optionType}
            </span>
          </div>
          <div className="flex items-center space-x-2 font-mono">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Strike</span>
            <span className="text-sm font-black text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">
              ${decision.strikePrice ? decision.strikePrice.toFixed(2) : "ATM"}
            </span>
          </div>
        </div>
      ) : decision.signal !== "HOLD" ? (
        <div className="p-3.5 rounded-xl bg-white/60 border border-slate-200 flex items-center justify-between mb-4 shadow-sm">
          <div className="flex items-center space-x-2.5">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
              Contract
            </span>
            <span className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-black tracking-widest border shadow-sm ${currentTheme.optionBadge}`}>
              {decision.signal === "BUY" ? "CALL" : "PUT"}
            </span>
          </div>
          <div className="flex items-center space-x-2 font-mono">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Strike</span>
            <span className="text-sm font-black text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">
              ${decision.strikePrice ? decision.strikePrice.toFixed(2) : "ATM"}
            </span>
          </div>
        </div>
      ) : null}

      {/* Confidence & Risk Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3.5 rounded-xl bg-white/60 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">AI Conviction</span>
            <span className="text-sm font-mono font-black text-slate-900">{confidencePct}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200 shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${confidencePct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full shadow-[0_0_8px_rgba(0,0,0,0.1)] ${confidencePct >= 70 ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : "bg-gradient-to-r from-amber-500 to-amber-400"}`}
            />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/60 border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block mb-1">Assessed Risk</span>
              <span className={`text-sm font-black ${decision.risk === "LOW" ? "text-emerald-600" : decision.risk === "MEDIUM" ? "text-amber-500" : "text-red-500"}`}>{decision.risk}</span>
            </div>
            <div className={`p-2 rounded-lg ${decision.risk === "LOW" ? "bg-emerald-50 text-emerald-600" : decision.risk === "MEDIUM" ? "bg-amber-50 text-amber-500" : "bg-red-50 text-red-500"}`}>
              <Shield className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Reasoning text */}
      <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-200 mb-2">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block mb-2 flex items-center space-x-1.5">
          <Activity className="h-3 w-3" />
          <span>Catalyst Rationale</span>
        </span>
        <p className="text-[13px] text-slate-700 leading-relaxed font-medium italic border-l-2 border-indigo-200 pl-3">
          &quot;{decision.reason}&quot;
        </p>
      </div>

      {/* Raw JSON viewer */}
      <AnimatePresence>
        {showJson && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto shadow-inner"
          >
            <pre>{JSON.stringify(decision, null, 2)}</pre>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
