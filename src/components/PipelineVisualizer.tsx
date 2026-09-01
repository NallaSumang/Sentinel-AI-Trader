import React from "react";
import { Newspaper, BrainCircuit, Activity, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";
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
      activeColor: "border-sky-500 bg-sky-50/80 text-sky-900 shadow-sm",
      pillColor: "bg-sky-50 text-sky-700 border-sky-200",
    },
    {
      id: 2,
      title: "2. Gemini AI Reasoning",
      subtitle: "Structured LLM Evaluator",
      icon: BrainCircuit,
      status: decision ? `${decision.risk} Risk` : "Standby",
      activeColor: "border-purple-500 bg-purple-50/80 text-purple-900 shadow-sm",
      pillColor: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      id: 3,
      title: "3. Decision Signal",
      subtitle: decision
        ? decision.optionType && decision.optionType !== "N/A"
          ? `${decision.optionType} $${decision.strikePrice} Strike`
          : `${Math.round(decision.confidence * 100)}% Conviction`
        : "Strict JSON Format",
      icon: Activity,
      status: decision
        ? decision.optionType && decision.optionType !== "N/A"
          ? `${decision.signal} • ${decision.optionType} $${decision.strikePrice}`
          : `${decision.signal} (${decision.symbol})`
        : "Pending",
      activeColor: "border-indigo-500 bg-indigo-50/80 text-indigo-900 shadow-sm",
      pillColor: decision?.signal === "BUY" ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold" : decision?.signal === "SELL" ? "bg-red-50 text-red-700 border-red-300 font-bold" : "bg-amber-50 text-amber-700 border-amber-300 font-bold",
    },
    {
      id: 4,
      title: "4. Risk Gate",
      subtitle: "Capital Preservation Guard",
      icon: ShieldCheck,
      status: riskResult ? (riskResult.approved ? "APPROVED" : "BLOCKED / HELD") : "Gate Active",
      activeColor: "border-emerald-500 bg-emerald-50/80 text-emerald-900 shadow-sm",
      pillColor: riskResult?.approved ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold" : "bg-amber-50 text-amber-700 border-amber-300 font-bold",
    },
    {
      id: 5,
      title: "5. Alpaca Paper Options Order",
      subtitle: "Paper Sandbox Only",
      icon: CheckCircle2,
      status: orderResult ? `${orderResult.side.toUpperCase()} ${orderResult.qty}x ${orderResult.symbol} OPT` : "Awaiting Trigger",
      activeColor: "border-emerald-600 bg-emerald-50/80 text-emerald-900 shadow-sm",
      pillColor: "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold",
    },
  ];

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Autonomous Pipeline Flow
          </h3>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          Alpaca Sandbox ➔ Guaranteed Zero Real Capital Exposure
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCurrent = currentStage === step.id;
          const isPassed = currentStage > step.id;

          return (
            <div
              key={step.id}
              className={`relative flex flex-col justify-between p-3.5 rounded-lg border transition-all ${
                isCurrent
                  ? `${step.activeColor} ring-2 ring-indigo-500/20 scale-[1.01]`
                  : isPassed
                  ? "border-emerald-200 bg-emerald-50/30 text-slate-800"
                  : "border-slate-200 bg-slate-50/60 text-slate-600"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400">
                    STAGE {step.id}
                  </span>
                  <div className={`p-1.5 rounded-md ${isCurrent ? "bg-indigo-600 text-white shadow-sm" : isPassed ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-0.5">
                  {step.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-1 mb-2.5">
                  {step.subtitle}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${step.pillColor}`}>
                  {step.status}
                </span>
                {idx < steps.length - 1 && (
                  <ArrowRight className="hidden lg:block h-3 w-3 text-slate-400 absolute -right-2 top-1/2 -translate-y-1/2 z-10" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
