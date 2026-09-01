import React from "react";
import { Newspaper, BrainCircuit, Activity, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { AiDecision, RiskCheckResult, OrderRecord, NewsItem } from "../types";

interface PipelineVisualizerProps {
  currentStage: number; // 0=idle, 1=news, 2=ai, 3=signal, 4=risk, 5=order
  selectedNews: NewsItem | null;
  decision: AiDecision | null;
  riskResult: RiskCheckResult | null;
  orderResult: OrderRecord | null;
}

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({
  currentStage,
  selectedNews,
  decision,
  riskResult,
  orderResult,
}) => {
  const steps = [
    {
      id: 1,
      title: "1. News Ingestion",
      subtitle: selectedNews ? selectedNews.source : "Real-time Catalysts",
      icon: Newspaper,
      status: selectedNews ? (selectedNews.symbol ? `Tag: ${selectedNews.symbol}` : "Market Feed") : "Ready",
      activeColor: "border-sky-300 bg-sky-50/90 text-sky-900 shadow-[0_0_15px_rgba(14,165,233,0.15)]",
      pillColor: "bg-white text-sky-700 border-sky-200 shadow-sm",
    },
    {
      id: 2,
      title: "2. Groq AI Reasoning",
      subtitle: "Structured LLM",
      icon: BrainCircuit,
      status: decision ? `${decision.risk} Risk` : "Standby",
      activeColor: "border-indigo-300 bg-indigo-50/90 text-indigo-900 shadow-[0_0_15px_rgba(99,102,241,0.15)]",
      pillColor: "bg-white text-indigo-700 border-indigo-200 shadow-sm",
    },
    {
      id: 3,
      title: "3. Decision Signal",
      subtitle: decision
        ? decision.optionType && decision.optionType !== "N/A"
          ? `${decision.optionType} $${decision.strikePrice} Strike`
          : `${Math.round(decision.confidence * 100)}% Conviction`
        : "Strict JSON Schema",
      icon: Activity,
      status: decision
        ? decision.optionType && decision.optionType !== "N/A"
          ? `${decision.signal} • ${decision.optionType} $${decision.strikePrice}`
          : `${decision.signal} (${decision.symbol})`
        : "Pending",
      activeColor: "border-purple-300 bg-purple-50/90 text-purple-900 shadow-[0_0_15px_rgba(168,85,247,0.15)]",
      pillColor: decision?.signal === "BUY" ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm font-bold" : decision?.signal === "SELL" ? "bg-red-50 text-red-700 border-red-300 shadow-sm font-bold" : "bg-amber-50 text-amber-700 border-amber-300 shadow-sm font-bold",
    },
    {
      id: 4,
      title: "4. Risk Gate",
      subtitle: "Capital Preservation",
      icon: ShieldCheck,
      status: riskResult ? (riskResult.approved ? "APPROVED" : "BLOCKED") : "Gate Active",
      activeColor: "border-teal-300 bg-teal-50/90 text-teal-900 shadow-[0_0_15px_rgba(20,184,166,0.15)]",
      pillColor: riskResult?.approved ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm font-bold" : "bg-amber-50 text-amber-700 border-amber-300 shadow-sm font-bold",
    },
    {
      id: 5,
      title: "5. Alpaca Order",
      subtitle: "Paper Sandbox Only",
      icon: CheckCircle2,
      status: orderResult ? `${orderResult.side.toUpperCase()} ${orderResult.qty}x OPT` : "Awaiting Trigger",
      activeColor: "border-emerald-400 bg-emerald-50/90 text-emerald-900 shadow-[0_0_15px_rgba(16,185,129,0.15)]",
      pillColor: "bg-white text-emerald-700 border-emerald-300 shadow-sm font-bold",
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full glass-panel premium-card-hover rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
          </span>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">
            Autonomous Pipeline Flow
          </h3>
        </div>
        <span className="text-[10px] text-slate-500 font-mono font-extrabold uppercase tracking-widest px-2 py-1 bg-slate-100 rounded-md border border-slate-200">
          Sandbox Mode
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCurrent = currentStage === step.id;
          const isPassed = currentStage > step.id;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0.8 }}
              animate={{ 
                opacity: isCurrent ? 1 : 0.85,
                y: isCurrent ? -4 : 0
              }}
              transition={{ duration: 0.3 }}
              className={`relative flex flex-col justify-between p-4 rounded-xl border backdrop-blur-sm transition-all ${
                isCurrent
                  ? `${step.activeColor} ring-4 ring-white/50 z-10`
                  : isPassed
                  ? "border-emerald-200/60 bg-emerald-50/40 text-slate-800"
                  : "border-slate-200 bg-white/40 text-slate-600"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-black tracking-widest uppercase ${isCurrent ? "text-indigo-600" : "text-slate-400"}`}>
                    STAGE {step.id}
                  </span>
                  <div className={`p-1.5 rounded-lg shadow-sm ${isCurrent ? "bg-white text-indigo-600 border border-indigo-100" : isPassed ? "bg-emerald-100 text-emerald-600 border border-emerald-200" : "bg-slate-100 text-slate-400 border border-slate-200"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <h4 className="text-[13px] font-black text-slate-900 mb-1 leading-tight tracking-tight">
                  {step.title}
                </h4>
                <p className="text-[11px] font-medium text-slate-500 line-clamp-1 mb-3">
                  {step.subtitle}
                </p>
              </div>

              <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between">
                <span className={`text-[10px] font-mono font-black px-2.5 py-1 rounded-md border ${step.pillColor}`}>
                  {step.status}
                </span>
                {idx < steps.length - 1 && (
                  <ArrowRight className="hidden lg:block h-4 w-4 text-slate-300 absolute -right-3 top-1/2 -translate-y-1/2 z-20" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
