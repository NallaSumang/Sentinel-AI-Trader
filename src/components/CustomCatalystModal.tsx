import React, { useState } from "react";
import { X, Sparkles, AlertCircle } from "lucide-react";
import { NewsItem } from "../types";

interface CustomCatalystModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newsItem: NewsItem) => void;
}

export const CustomCatalystModal: React.FC<CustomCatalystModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [source, setSource] = useState("Manual Analyst Entry");
  const [symbol, setSymbol] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState("150.00");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline.trim()) return;

    const newItem: NewsItem = {
      id: `custom-${Date.now()}`,
      headline: headline.trim(),
      summary: summary.trim() || headline.trim(),
      source: source.trim() || "Manual Analyst Entry",
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      symbol: symbol.trim().toUpperCase() || undefined,
      estimated_price: parseFloat(estimatedPrice) || 150.0,
    };

    onSubmit(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Test Custom News Catalyst</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Headline *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., AMD Unveils Breakthrough AI Chip Beating Next-Gen Benchmarks"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Summary / Detailed Context
            </label>
            <textarea
              rows={3}
              placeholder="e.g., Architecture delivers 40% inference speed improvements and signs strategic volume deal with major hyperscalers."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ticker (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., AMD"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 uppercase font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Est. Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="150.00"
                value={estimatedPrice}
                onChange={(e) => setEstimatedPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Source Name
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm"
            >
              Inject &amp; Analyze Catalyst
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
