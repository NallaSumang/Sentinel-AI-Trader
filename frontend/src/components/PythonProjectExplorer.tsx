import React, { useState, useEffect } from "react";
import { Code2, Copy, Check, FileCode, BookOpen, Terminal, Download, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const PythonProjectExplorer: React.FC = () => {
  const [files, setFiles] = useState<Record<string, string>>({});
  const [activeFileName, setActiveFileName] = useState<string>("app.py");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/python-files")
      .then((res) => res.json())
      .then((data) => {
        if (data.files) {
          setFiles(data.files);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load python files:", err);
        setLoading(false);
      });
  }, []);

  const fileList = [
    { name: "app.py", desc: "Streamlit UI & visualizer", icon: FileCode },
    { name: "agent.py", desc: "Groq AI signal reasoner", icon: Sparkles },
    { name: "news.py", desc: "Financial news fetcher", icon: FileCode },
    { name: "trader.py", desc: "Alpaca Paper client (alpaca-py)", icon: FileCode },
    { name: "risk_manager.py", desc: "Institutional safety gate", icon: FileCode },
    { name: "config.py", desc: "Env config & risk defaults", icon: FileCode },
    { name: "requirements.txt", desc: "Python dependencies", icon: FileCode },
    { name: ".env.example", desc: "Keys template", icon: FileCode },
    { name: ".gitignore", desc: "Git secrets protection", icon: FileCode },
    { name: "README.md", desc: "Hackathon project guide", icon: BookOpen },
  ];

  const handleCopy = () => {
    const content = files[activeFileName] || "";
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = () => {
    // Generate text download for active file or simple export
    const content = files[activeFileName] || "";
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = activeFileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel premium-card-hover rounded-2xl p-6 shadow-sm space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shadow-sm">
              <Code2 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Python Hackathon Source Repository
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1.5 ml-[42px]">
            Complete, runnable Python codebase matching the Alpaca Hackathon structure.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            id="copy-current-file-btn"
            onClick={handleCopy}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-sm transition-all"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-slate-400" />}
            <span>{copied ? "Copied!" : `Copy ${activeFileName}`}</span>
          </button>

          <button
            id="download-current-file-btn"
            onClick={handleDownloadZip}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-500/20 transition-all"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Quick Run Commands Helper Box */}
      <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100/50 space-y-2.5 shadow-inner">
        <div className="flex items-center space-x-2 text-indigo-700 font-extrabold text-xs tracking-wide">
          <Terminal className="h-4 w-4" />
          <span>QUICK RUN IN VS CODE / TERMINAL:</span>
        </div>
        <div className="font-mono text-[13px] text-emerald-400 font-bold bg-slate-900 p-3 rounded-lg border border-slate-800 overflow-x-auto shadow-inner">
          <code>pip install -r requirements.txt &amp;&amp; streamlit run app.py</code>
        </div>
      </div>

      {/* 2-Column Explorer: Left file list; Right source editor view */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* File Navigator List */}
        <div className="lg:col-span-1 space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 block px-2 mb-3">
            Project Files (10)
          </span>
          <div className="space-y-1.5">
            {fileList.map((f) => {
              const Icon = f.icon;
              const isActive = activeFileName === f.name;
              return (
                <button
                  key={f.name}
                  onClick={() => setActiveFileName(f.name)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start space-x-3 ${
                    isActive
                      ? "bg-white border-indigo-200 text-indigo-900 shadow-sm ring-1 ring-indigo-500/20 font-bold"
                      : "bg-transparent border-transparent text-slate-600 hover:bg-white/60 hover:border-slate-200 hover:text-slate-900 hover:shadow-sm"
                  }`}
                >
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 transition-colors ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                  <div className="overflow-hidden">
                    <div className="font-mono font-bold truncate">{f.name}</div>
                    <div className={`text-[10px] truncate mt-0.5 ${isActive ? "text-indigo-500/70" : "text-slate-400"}`}>{f.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Code Content Viewer */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between px-5 py-3 bg-slate-900 rounded-t-xl border-t border-x border-slate-800 text-xs text-slate-400 font-mono">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="font-bold text-slate-100 ml-3 tracking-wide">{activeFileName}</span>
            </div>
            <span className="font-semibold">{files[activeFileName]?.split("\n").length || 0} lines</span>
          </div>

          <div className="p-5 bg-slate-950 rounded-b-xl border border-slate-800 font-mono text-[13px] text-slate-300 max-h-[560px] overflow-y-auto overflow-x-auto custom-scrollbar shadow-inner leading-relaxed">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-slate-500 italic h-32 flex items-center justify-center">
                  Loading file contents...
                </motion.div>
              ) : files[activeFileName] ? (
                <motion.pre key={activeFileName} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="whitespace-pre">
                  {files[activeFileName]}
                </motion.pre>
              ) : (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-slate-500 italic h-32 flex items-center justify-center">
                  File content unavailable.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
