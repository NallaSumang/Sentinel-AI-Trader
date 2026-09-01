import React, { useState } from "react";
import { X, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-panel rounded-2xl max-w-lg w-full p-6 shadow-2xl relative z-10"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shadow-sm">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Test Custom News Catalyst</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors border border-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5">
                  Headline *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., AMD Unveils Breakthrough AI Chip Beating Next-Gen Benchmarks"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-slate-300 text-[13px] font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5">
                  Summary / Detailed Context
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g., Architecture delivers 40% inference speed improvements and signs strategic volume deal with major hyperscalers."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-slate-300 text-[13px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5">
                    Ticker (Opt)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., AMD"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-slate-300 text-[13px] text-slate-900 uppercase font-mono font-black focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5">
                    Est. Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="150.00"
                    value={estimatedPrice}
                    onChange={(e) => setEstimatedPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-slate-300 text-[13px] text-slate-900 font-mono font-black focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5">
                    Source
                  </label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-slate-300 text-[13px] font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200/80 mt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-[13px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-black tracking-wide transition-colors shadow-md shadow-indigo-500/20"
                >
                  Inject &amp; Analyze
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
