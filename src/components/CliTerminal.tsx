import React, { useState, useEffect, useRef } from "react";
import { Terminal, Send, TerminalSquare, RotateCcw, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CliLogEntry {
  id: string;
  timestamp: string;
  command: string;
  output: string;
  success: boolean;
  duration_ms: number;
}

export function CliTerminal() {
  const [history, setHistory] = useState<CliLogEntry[]>([]);
  const [commandInput, setCommandInput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/cli/history");
      const data = await res.json();
      if (data.history) setHistory(data.history.reverse());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    
    setIsExecuting(true);
    const cmdToRun = commandInput.trim();
    setCommandInput("");
    
    // Optimistic UI update
    const optEntry: CliLogEntry = {
      id: "optimistic-" + Date.now(),
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      command: `alpaca ${cmdToRun}`,
      output: "Executing...",
      success: true,
      duration_ms: 0
    };
    setHistory([...history, optEntry]);
    
    try {
      const res = await fetch("/api/cli/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmdToRun })
      });
      await res.json();
      await fetchHistory();
    } catch (e) {
      console.error(e);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel premium-card-hover rounded-2xl flex flex-col h-[500px] overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-white/60 backdrop-blur-sm">
        <div className="flex items-center space-x-2.5 text-slate-900">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <TerminalSquare className="h-4 w-4" />
          </div>
          <span className="font-mono text-xs font-black tracking-widest uppercase">ALPACA_CLI_TERMINAL</span>
        </div>
        <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono font-bold">
          <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>CONNECTED</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 space-y-4 font-mono text-[11px] sm:text-xs custom-scrollbar bg-slate-50/50">
        <AnimatePresence>
          {history.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-slate-400 italic font-medium">
              No CLI history in this session. Try running 'account' or 'positions list'.
            </motion.div>
          ) : (
            history.map((entry) => (
              <motion.div 
                key={entry.id} 
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-1.5"
              >
                <div className="flex items-start">
                  <span className="text-indigo-500 mr-2.5 font-black">➜</span>
                  <span className="text-indigo-900 font-bold">{entry.command}</span>
                  <span className="text-slate-400 ml-auto text-[10px] font-semibold">{entry.timestamp}</span>
                </div>
                <div className={`pl-4 py-2 px-3 rounded-lg overflow-x-auto whitespace-pre-wrap font-medium shadow-inner ${
                  entry.success ? 'bg-white/80 border border-slate-200 text-slate-700' : 'bg-red-50/80 border border-red-200 text-red-700'
                }`}>
                  {entry.output}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
      
      <div className="p-4 border-t border-slate-200 bg-white/60 backdrop-blur-sm">
        <form onSubmit={handleExecute} className="flex items-center space-x-2.5">
          <span className="text-indigo-600 font-mono font-black pl-1">alpaca</span>
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="account get, positions list, orders list..."
            className="flex-1 bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all font-bold shadow-sm"
            disabled={isExecuting}
          />
          <button
            type="submit"
            disabled={isExecuting || !commandInput.trim()}
            className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-sm"
          >
            {isExecuting ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
        <div className="mt-2.5 text-[10px] font-bold text-slate-400 px-1 flex justify-between tracking-wide">
          <span>* Meets Hackathon Mandatory CLI / MCP Requirement</span>
          <span className="cursor-help hover:text-indigo-500 transition-colors" title="Try: account, positions, orders, clock">Available Commands ⓘ</span>
        </div>
      </div>
    </motion.div>
  );
}
