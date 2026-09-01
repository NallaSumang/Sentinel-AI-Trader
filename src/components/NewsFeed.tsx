import React from "react";
import { Newspaper, Sparkles, ExternalLink, Clock, Tag, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { NewsItem } from "../types";

interface NewsFeedProps {
  news: NewsItem[];
  selectedNewsId: string | null;
  onSelectAndAnalyze: (newsItem: NewsItem) => void;
  isAnalyzing: boolean;
  onOpenCustomModal: () => void;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({
  news,
  selectedNewsId,
  onSelectAndAnalyze,
  isAnalyzing,
  onOpenCustomModal,
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel premium-card-hover rounded-2xl p-5 flex flex-col h-full transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Newspaper className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Live Financial Catalysts</h3>
        </div>
        <button
          id="custom-catalyst-trigger-btn"
          onClick={onOpenCustomModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-colors shadow-sm"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Custom Catalyst</span>
        </button>
      </div>

      <p className="text-xs text-slate-500 mb-4 font-medium">
        Select any news headline to trigger Groq AI sentiment evaluation and autonomous order flow.
      </p>

      <div className="space-y-3 overflow-y-auto max-h-[480px] pr-1 custom-scrollbar">
        <AnimatePresence>
          {news.map((item, idx) => {
            const isSelected = selectedNewsId === item.id;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-4 rounded-xl border backdrop-blur-sm transition-all shadow-sm ${
                  isSelected
                    ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20"
                    : "bg-white/60 border-slate-200 hover:bg-white/90 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    {item.symbol ? (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-mono font-black tracking-widest shadow-sm">
                        ${item.symbol}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-mono font-black tracking-widest shadow-sm">
                        MACRO
                      </span>
                    )}
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center space-x-1">
                      <span>{item.source}</span>
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono font-bold flex items-center space-x-1 shrink-0 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                    <Clock className="h-2.5 w-2.5" />
                    <span>{item.timestamp.split(" ")[1] || item.timestamp}</span>
                  </span>
                </div>

                <h4 className="text-[13px] font-black text-slate-900 leading-snug mb-1.5 tracking-tight">
                  {item.headline}
                </h4>
                <p className="text-[11px] font-medium text-slate-600 leading-relaxed mb-3 line-clamp-2">
                  {item.summary}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200/80">
                  <span className="text-[10px] text-slate-500 font-mono font-bold">
                    {item.estimated_price ? `Est. Price: $${item.estimated_price.toFixed(2)}` : "Live Price Tracked"}
                  </span>
                  <button
                    id={`analyze-news-btn-${item.id}`}
                    onClick={() => onSelectAndAnalyze(item)}
                    disabled={isAnalyzing}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-black tracking-wide transition-all shadow-sm ${
                      isSelected
                        ? "bg-indigo-600 text-white"
                        : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300"
                    } disabled:opacity-50`}
                  >
                    <Sparkles className={`h-3.5 w-3.5 ${isSelected ? "text-indigo-200" : "text-indigo-600"}`} />
                    <span>{isSelected && isAnalyzing ? "Evaluating..." : "Analyze with AI"}</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
