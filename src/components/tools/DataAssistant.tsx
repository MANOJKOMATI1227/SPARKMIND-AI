import React, { useState } from 'react';
import { BarChart3, Upload, ArrowRight, X, Table } from 'lucide-react';

interface DataAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitToChat: (prompt: string) => void;
}

export const DataAssistant: React.FC<DataAssistantProps> = ({
  isOpen,
  onClose,
  onSubmitToChat,
}) => {
  const [dataInput, setDataInput] = useState('');
  const [question, setQuestion] = useState('');
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleParse = (text: string) => {
    setDataInput(text);
    try {
      const lines = text.trim().split('\n').filter(Boolean);
      if (lines.length > 0) {
        const head = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
        const rows = lines.slice(1, 6).map((l) =>
          l.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''))
        );
        setHeaders(head);
        setPreviewRows(rows);
      }
    } catch (e) {}
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleParse(content);
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataInput.trim()) return;

    const prompt = `Act as an expert data scientist and business intelligence analyst. Analyze the following dataset and provide high-impact analytical insights.

User's Specific Question / Objective:
${question || 'Provide a complete analytical summary and actionable insights.'}

Data Sample (CSV / JSON format):
\`\`\`
${dataInput.slice(0, 15000)}
\`\`\`

Please provide:
1. Dataset Overview: Columns, estimated row count, data types, and any apparent data cleanliness issues.
2. Statistical Highlights: Key averages, ranges, high/low outliers, and distribution notes.
3. Trend Analysis & Correlations: Notable patterns between variables.
4. Recommended Charts: Best chart types (e.g. Bar, Line, Scatter, Heatmap) to visualize this data effectively.
5. Executive Business Takeaways & Strategic Recommendations.`;

    onSubmitToChat(prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-white/60 dark:border-white/15 glass-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/30 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-xl p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/15 text-blue-500 font-bold">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                SparkMind Data & CSV Analyzer
              </h2>
              <p className="text-xs text-slate-500">
                Upload or paste CSV/JSON to discover trends, statistics, and charts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* File input button */}
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Dataset Content (CSV or JSON)
            </label>
            <label className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer">
              <Upload className="h-3 w-3" />
              <span>Import .csv / .json</span>
              <input type="file" accept=".csv,.json,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <textarea
            required
            rows={5}
            value={dataInput}
            onChange={(e) => handleParse(e.target.value)}
            placeholder="Paste raw CSV rows (e.g. date,product,revenue,units) or JSON records here..."
            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 font-mono placeholder-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />

          {/* Quick Table Preview */}
          {previewRows.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 text-[11px]">
                <Table className="h-3 w-3" /> Preview (First 5 Rows)
              </div>
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    {headers.map((h, i) => (
                      <th key={i} className="p-2 font-semibold text-slate-700 dark:text-slate-200">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/60 font-mono">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2 text-slate-600 dark:text-slate-400">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Question / Focus */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              What specific question do you want to answer?
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Which region is generating the highest margin? Are there seasonality dips?"
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 placeholder-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!dataInput.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50"
            >
              <span>Analyze Dataset</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
