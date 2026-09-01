import React, { useState, useEffect } from "react";
import { Code2, Copy, Check, FileCode, BookOpen, Terminal, Download, Sparkles } from "lucide-react";

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
    { name: "agent.py", desc: "Gemini AI signal reasoner", icon: Sparkles },
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
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <Code2 className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Python Hackathon Source Repository
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete, runnable Python codebase matching the Alpaca Hackathon structure.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="copy-current-file-btn"
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
            <span>{copied ? "Copied to Clipboard!" : `Copy ${activeFileName}`}</span>
          </button>

          <button
            id="download-current-file-btn"
            onClick={handleDownloadZip}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download {activeFileName}</span>
          </button>
        </div>
      </div>

      {/* Quick Run Commands Helper Box */}
      <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
        <div className="flex items-center space-x-1.5 text-indigo-600 font-bold">
          <Terminal className="h-3.5 w-3.5" />
          <span>Quick Run in VS Code / Terminal:</span>
        </div>
        <div className="font-mono text-emerald-400 bg-slate-900 p-2.5 rounded border border-slate-800 overflow-x-auto shadow-inner">
          <code>pip install -r requirements.txt &amp;&amp; streamlit run app.py</code>
        </div>
      </div>

      {/* 2-Column Explorer: Left file list; Right source editor view */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* File Navigator List */}
        <div className="md:col-span-1 space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block px-1 mb-2">
            Project Files (10)
          </span>
          {fileList.map((f) => {
            const Icon = f.icon;
            const isActive = activeFileName === f.name;
            return (
              <button
                key={f.name}
                onClick={() => setActiveFileName(f.name)}
                className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-start space-x-2.5 ${
                  isActive
                    ? "bg-indigo-50 border-indigo-300 text-indigo-900 ring-2 ring-indigo-500/20 font-medium"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                <div className="overflow-hidden">
                  <div className="font-mono font-bold truncate">{f.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{f.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Code Content Viewer */}
        <div className="md:col-span-3">
          <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900 rounded-t-lg border-t border-x border-slate-800 text-xs text-slate-400 font-mono">
            <span className="font-bold text-slate-100">{activeFileName}</span>
            <span>{files[activeFileName]?.split("\n").length || 0} lines</span>
          </div>

          <div className="p-4 bg-[#0F172A] rounded-b-lg border border-slate-800 font-mono text-xs text-slate-200 max-h-[560px] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800 shadow-inner">
            {loading ? (
              <div className="text-slate-500 italic">Loading file contents...</div>
            ) : files[activeFileName] ? (
              <pre className="leading-relaxed whitespace-pre font-mono">
                {files[activeFileName]}
              </pre>
            ) : (
              <div className="text-slate-500 italic">File content unavailable.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
