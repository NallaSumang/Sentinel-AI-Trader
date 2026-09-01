import React from "react";
import { Terminal, Trash2 } from "lucide-react";

interface ActivityLogsProps {
  logs: string[];
  onClearLogs: () => void;
}

export const ActivityLogs: React.FC<ActivityLogsProps> = ({
  logs,
  onClearLogs,
}) => {
  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center space-x-2">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Agent Execution &amp; Audit Trail</h3>
          <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>STREAM LIVE</span>
          </span>
        </div>
        <button
          id="clear-logs-btn"
          onClick={onClearLogs}
          className="flex items-center space-x-1 text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors font-medium"
        >
          <Trash2 className="h-3 w-3" />
          <span>Clear Logs</span>
        </button>
      </div>

      <div className="bg-slate-950/90 rounded-lg p-3.5 border border-slate-800/80 font-mono text-xs text-slate-300 max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
        {logs.length > 0 ? (
          logs.map((log, idx) => {
            const isError = log.toLowerCase().includes("fail") || log.toLowerCase().includes("error") || log.toLowerCase().includes("blocked");
            const isApproved = log.toLowerCase().includes("approved") || log.toLowerCase().includes("executed") || log.toLowerCase().includes("success");
            const isAi = log.toLowerCase().includes("ai") || log.toLowerCase().includes("decision");

            return (
              <div
                key={`log-${idx}`}
                className={`leading-relaxed ${
                  isError
                    ? "text-red-400"
                    : isApproved
                    ? "text-emerald-400"
                    : isAi
                    ? "text-amber-300"
                    : "text-slate-300"
                }`}
              >
                {log}
              </div>
            );
          })
        ) : (
          <div className="text-slate-500 italic">No activity logs recorded.</div>
        )}
      </div>
    </div>
  );
};
