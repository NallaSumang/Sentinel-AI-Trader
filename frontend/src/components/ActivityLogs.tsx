import React from "react";
import { Terminal, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ActivityLogsProps {
  logs: string[];
  onClearLogs: () => void;
}

export const ActivityLogs: React.FC<ActivityLogsProps> = ({
  logs,
  onClearLogs,
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel premium-card-hover rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Terminal className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Agent Execution &amp; Audit Trail</h3>
          <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-600 font-mono font-black tracking-widest shadow-sm ml-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>LIVE</span>
          </span>
        </div>
        <button
          id="clear-logs-btn"
          onClick={onClearLogs}
          className="flex items-center space-x-1.5 text-slate-500 hover:text-red-600 text-xs px-3 py-1.5 rounded-lg bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-all font-bold shadow-sm"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Clear Logs</span>
        </button>
      </div>

      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 font-mono text-[11px] text-slate-300 max-h-48 overflow-y-auto space-y-2 custom-scrollbar shadow-inner">
        <AnimatePresence>
          {logs.length > 0 ? (
            logs.map((log, idx) => {
              const isError = log.toLowerCase().includes("fail") || log.toLowerCase().includes("error") || log.toLowerCase().includes("blocked");
              const isApproved = log.toLowerCase().includes("approved") || log.toLowerCase().includes("executed") || log.toLowerCase().includes("success");
              const isAi = log.toLowerCase().includes("ai") || log.toLowerCase().includes("decision");

              return (
                <motion.div
                  key={`log-${idx}`}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`leading-relaxed ${
                    isError
                      ? "text-red-400 font-bold"
                      : isApproved
                      ? "text-emerald-400 font-bold"
                      : isAi
                      ? "text-amber-300 font-semibold"
                      : "text-slate-300"
                  }`}
                >
                  {log}
                </motion.div>
              );
            })
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-slate-500 italic flex items-center justify-center h-full">
              No activity logs recorded.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
