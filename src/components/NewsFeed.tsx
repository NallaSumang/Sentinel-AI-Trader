import React from "react";
import { Newspaper, Sparkles, ExternalLink, Clock, Tag, PlusCircle } from "lucide-react";
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
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Newspaper className="h-4 w-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Live Financial Catalysts</h3>
        </div>
        <button
          id="custom-catalyst-trigger-btn"
          onClick={onOpenCustomModal}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors"
        >
          <PlusCircle className="h-3.5 w-3.5 text-indigo-600" />
          <span>Custom Catalyst</span>
        </button>
      </div>

      <p className="text-xs text-slate-500 mb-3">
        Select any news headline to trigger Gemini AI sentiment evaluation and autonomous order flow.
      </p>

      <div className="space-y-2.5 overflow-y-auto max-h-[480px] pr-1">
        {news.map((item) => {
          const isSelected = selectedNewsId === item.id;
          return (
            <div
              key={item.id}
              className={`p-3 rounded-lg border transition-all ${
                isSelected
                  ? "bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-500/20"
                  : "bg-slate-50/70 border-slate-200 hover:bg-slate-100/90 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  {item.symbol ? (
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-mono font-bold">
                      ${item.symbol}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-xs font-mono">
                      MACRO
                    </span>
                  )}
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center space-x-1">
                    <span>{item.source}</span>
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1 shrink-0">
                  <Clock className="h-2.5 w-2.5" />
                  <span>{item.timestamp.split(" ")[1] || item.timestamp}</span>
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-900 leading-snug mb-1">
                {item.headline}
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed mb-3 line-clamp-2">
                {item.summary}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                <span className="text-[11px] text-slate-500 font-mono">
                  {item.estimated_price ? `Est. Price: $${item.estimated_price.toFixed(2)}` : "Live Price Tracked"}
                </span>
                <button
                  id={`analyze-news-btn-${item.id}`}
                  onClick={() => onSelectAndAnalyze(item)}
                  disabled={isAnalyzing}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300"
                  } disabled:opacity-50`}
                >
                  <Sparkles className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-indigo-600"}`} />
                  <span>{isSelected && isAnalyzing ? "Evaluating..." : "Analyze with AI"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
