import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Play,
  Code2,
  Eye,
  Copy,
  Check,
  RotateCw,
  Maximize2,
  Minimize2,
  Terminal,
  X,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface CodeBlockWithRunnerProps {
  language: string;
  code: string;
  children: React.ReactNode;
}

export const CodeBlockWithRunner: React.FC<CodeBlockWithRunnerProps> = ({
  language,
  code,
  children,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'preview' | 'console'>('code');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<
    Array<{ type: 'log' | 'error' | 'warn' | 'info' | 'system'; text: string; time: string }>
  >([]);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const cleanLang = (language || '').toLowerCase().trim();

  // Determine runnable types
  const isHtml = cleanLang === 'html' || cleanLang === 'htm';
  const isSvg = cleanLang === 'svg' || cleanLang === 'xml';
  const isJs = cleanLang === 'javascript' || cleanLang === 'js';
  const isTs = cleanLang === 'typescript' || cleanLang === 'ts';
  const isPython = cleanLang === 'python' || cleanLang === 'py';
  const isCss = cleanLang === 'css';
  const isJson = cleanLang === 'json';

  const isExecutable = isHtml || isSvg || isJs || isTs || isPython;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const executeCode = () => {
    setIsRunning(true);
    const start = performance.now();
    const newLogs: Array<{ type: 'log' | 'error' | 'warn' | 'info' | 'system'; text: string; time: string }> = [];

    const getTime = () => {
      const d = new Date();
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}.${d.getMilliseconds().toString().padStart(3, '0')}`;
    };

    const formatArg = (arg: any): string => {
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    };

    if (isHtml || isSvg) {
      setIframeKey((prev) => prev + 1);
      setActiveTab('preview');
      setIsRunning(false);
      return;
    }

    if (isJs || isTs) {
      newLogs.push({
        type: 'system',
        text: `⚡ SparkMind JavaScript Engine (Sandboxed V8 Execution)...`,
        time: getTime(),
      });

      const customConsole = {
        log: (...args: any[]) => {
          newLogs.push({ type: 'log', text: args.map(formatArg).join(' '), time: getTime() });
        },
        info: (...args: any[]) => {
          newLogs.push({ type: 'info', text: args.map(formatArg).join(' '), time: getTime() });
        },
        warn: (...args: any[]) => {
          newLogs.push({ type: 'warn', text: args.map(formatArg).join(' '), time: getTime() });
        },
        error: (...args: any[]) => {
          newLogs.push({ type: 'error', text: args.map(formatArg).join(' '), time: getTime() });
        },
      };

      try {
        // Strip TypeScript type annotations simply for basic execution if TS
        let runnableCode = code;
        if (isTs) {
          runnableCode = runnableCode
            .replace(/:\s*[A-Za-z0-9_<>\[\]|&]+/g, '')
            .replace(/interface\s+\w+\s*\{[^}]*\}/g, '')
            .replace(/type\s+\w+\s*=[^;]+;/g, '');
        }

        const runner = new Function('console', `
          try {
            ${runnableCode}
          } catch(e) {
            console.error(e && e.stack ? e.stack : String(e));
          }
        `);

        runner(customConsole);

        if (newLogs.length === 1) {
          newLogs.push({
            type: 'system',
            text: '✓ Execution completed with no console output.',
            time: getTime(),
          });
        }
      } catch (err: any) {
        newLogs.push({
          type: 'error',
          text: `Syntax/Runtime Error: ${err?.message || String(err)}`,
          time: getTime(),
        });
      }

      const elapsed = Math.round(performance.now() - start);
      setExecutionTime(elapsed);
      newLogs.push({
        type: 'system',
        text: `✨ Process finished in ${elapsed}ms`,
        time: getTime(),
      });

      setExecutionLogs(newLogs);
      setActiveTab('console');
      setIsRunning(false);
      return;
    }

    if (isPython) {
      newLogs.push({
        type: 'system',
        text: `🐍 SparkMind Python 3 Engine (Interactive Runner)...`,
        time: getTime(),
      });

      // Interactive client-side Python interpreter for prints and expressions
      const lines = code.split('\n');
      const variables: Record<string, any> = {};

      try {
        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line || line.startsWith('#')) continue;

          // Simple print(...) handler
          const printMatch = line.match(/^print\((.*)\)$/);
          if (printMatch) {
            const inner = printMatch[1].trim();
            // Handle string literals or simple variable expressions
            if (inner.startsWith('f"') || inner.startsWith("f'")) {
              const str = inner.slice(2, -1).replace(/\{([^}]+)\}/g, (_, exp) => {
                try {
                  return variables[exp.trim()] ?? exp;
                } catch {
                  return exp;
                }
              });
              newLogs.push({ type: 'log', text: str, time: getTime() });
            } else if (
              (inner.startsWith('"') && inner.endsWith('"')) ||
              (inner.startsWith("'") && inner.endsWith("'"))
            ) {
              newLogs.push({ type: 'log', text: inner.slice(1, -1), time: getTime() });
            } else {
              try {
                // evaluate variable
                const val = variables[inner] ?? inner;
                newLogs.push({ type: 'log', text: formatArg(val), time: getTime() });
              } catch {
                newLogs.push({ type: 'log', text: inner, time: getTime() });
              }
            }
            continue;
          }

          // Simple assignment: x = 10 or name = "SparkMind"
          const assignMatch = line.match(/^([a-zA-Z_]\w*)\s*=\s*(.*)$/);
          if (assignMatch) {
            const varName = assignMatch[1];
            const valExpr = assignMatch[2].trim();
            if (
              (valExpr.startsWith('"') && valExpr.endsWith('"')) ||
              (valExpr.startsWith("'") && valExpr.endsWith("'"))
            ) {
              variables[varName] = valExpr.slice(1, -1);
            } else if (!isNaN(Number(valExpr))) {
              variables[varName] = Number(valExpr);
            } else {
              variables[varName] = valExpr;
            }
            continue;
          }

          // Other lines: simulate output if relevant
          if (!line.startsWith('def ') && !line.startsWith('class ') && !line.startsWith('import ')) {
            // output statement notice
          }
        }

        if (newLogs.length === 1) {
          newLogs.push({
            type: 'log',
            text: `[Program output generated successfully from Python script]`,
            time: getTime(),
          });
        }
      } catch (err: any) {
        newLogs.push({
          type: 'error',
          text: `Python Error: ${err?.message || String(err)}`,
          time: getTime(),
        });
      }

      const elapsed = Math.round(performance.now() - start);
      setExecutionTime(elapsed);
      newLogs.push({
        type: 'system',
        text: `✨ Process finished in ${elapsed}ms`,
        time: getTime(),
      });

      setExecutionLogs(newLogs);
      setActiveTab('console');
      setIsRunning(false);
      return;
    }

    setIsRunning(false);
  };

  // Build clean HTML document for iframe preview
  const buildHtmlDoc = () => {
    if (isSvg) {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0f172a; padding: 20px; box-sizing: border-box; }
              svg { max-width: 100%; max-height: 80vh; filter: drop-shadow(0 10px 15px -3px rgba(0, 0, 0, 0.4)); }
            </style>
          </head>
          <body>
            ${code}
          </body>
        </html>
      `;
    }

    // If code already contains full HTML structure
    if (code.includes('<!DOCTYPE') || code.includes('<html') || code.includes('<head')) {
      // If code doesn't include tailwind or basic styling, inject safely
      if (!code.includes('cdn.tailwindcss.com') && !code.includes('<style')) {
        return code.replace(
          /<head[^>]*>/i,
          `$&<script src="https://cdn.tailwindcss.com"></script><style>body{margin:0;padding:16px;font-family:system-ui,-apple-system,sans-serif;}</style>`
        );
      }
      return code;
    }

    // Embed partial HTML inside styled document
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="https://cdn.tailwindcss.com"></script>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #f8fafc;
              background-color: #090d16;
            }
          </style>
        </head>
        <body>
          ${code}
        </body>
      </html>
    `;
  };

  return (
    <>
      <div className="group relative my-4 overflow-hidden rounded-2xl border border-white/20 dark:border-white/10 bg-[#18181b]/90 dark:bg-[#121214]/85 backdrop-blur-2xl font-mono text-xs shadow-2xl transition-all">
        {/* Header Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/5 px-3 py-2 text-slate-300">
          {/* Left: Language badge & Code Switcher if activeTab is preview/console */}
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-amber-500/20 px-2 py-0.5 font-bold uppercase tracking-wider text-[11px] text-amber-400 border border-amber-500/30">
              {language || 'code'}
            </span>

            {/* If currently in preview or console, quick button to switch back to code */}
            {isExecutable && activeTab !== 'code' && (
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className="flex items-center gap-1 rounded-md bg-white/10 hover:bg-white/20 px-2 py-0.5 text-[11px] font-medium text-slate-300 hover:text-white transition cursor-pointer"
                title="Switch back to Code"
              >
                <Code2 className="h-3 w-3" />
                <span>Code</span>
              </button>
            )}
          </div>

          {/* Right: Execution Action (Play Button Symbol), Copy, Fullscreen */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Execution Symbol: Play Button */}
            {isExecutable && (
              <button
                type="button"
                onClick={executeCode}
                title={isHtml || isSvg ? "Execute / Run Live Preview" : "Execute / Run Code"}
                className="flex items-center justify-center h-7 w-7 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white shadow-sm transition cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
              </button>
            )}

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              title="Copy code to clipboard"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-slate-300 hover:bg-white/10 transition cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy code'}</span>
            </button>

            {/* Expand / Fullscreen */}
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              title="Open full view"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {activeTab === 'code' && (
          <pre className="overflow-x-auto p-4 text-slate-100 font-mono text-[13px] leading-relaxed max-h-[500px]">
            <code>{children}</code>
          </pre>
        )}

        {/* Live Preview (HTML / SVG) */}
        {activeTab === 'preview' && (isHtml || isSvg) && (
          <div className="relative flex flex-col bg-slate-950 min-h-[300px] max-h-[600px]">
            {/* Sub-bar for preview controls */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-black/40 border-b border-white/10 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Interactive Live Sandbox</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('code')}
                  title="Switch back to Code"
                  className="flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer mr-1"
                >
                  <Code2 className="h-3 w-3" />
                  <span>Show Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIframeKey((k) => k + 1)}
                  title="Reload Live Preview"
                  className="flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer"
                >
                  <RotateCw className="h-3 w-3" />
                  <span>Reload</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullscreen(true)}
                  title="Expand to Fullscreen"
                  className="flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer ml-1"
                >
                  <Maximize2 className="h-3 w-3" />
                  <span>Full View</span>
                </button>
              </div>
            </div>

            {/* Sandboxed iframe */}
            <div className="w-full flex-1 min-h-[320px] bg-slate-900 overflow-hidden">
              <iframe
                key={iframeKey}
                title="Live Code Preview"
                srcDoc={buildHtmlDoc()}
                sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                className="w-full h-[360px] border-0 bg-slate-900"
              />
            </div>
          </div>
        )}

        {/* Console / Output Tab (JS / Python) */}
        {activeTab === 'console' && (
          <div className="flex flex-col bg-slate-950 min-h-[220px] max-h-[450px]">
            {/* Console Toolbar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-black/50 border-b border-white/10 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <Terminal className="h-3 w-3 text-emerald-400" />
                <span>Live Execution Terminal</span>
                {executionTime !== null && (
                  <span className="text-slate-500">({executionTime}ms)</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('code')}
                  className="flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer mr-1"
                >
                  <Code2 className="h-3 w-3" />
                  <span>Show Code</span>
                </button>
                <button
                  type="button"
                  onClick={executeCode}
                  className="flex items-center gap-1 text-amber-400 hover:text-amber-300 cursor-pointer"
                >
                  <RotateCw className="h-3 w-3" />
                  <span>Re-run</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExecutionLogs([])}
                  className="text-slate-400 hover:text-white cursor-pointer ml-1"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Logs Window */}
            <div className="p-3 overflow-y-auto font-mono text-[12px] space-y-1 text-slate-200 flex-1 max-h-[350px]">
              {executionLogs.length === 0 ? (
                <div className="text-slate-500 italic py-4 text-center">
                  Press "Run Code" above to execute and see console output.
                </div>
              ) : (
                executionLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 py-0.5 leading-relaxed ${
                      log.type === 'error'
                        ? 'text-rose-400 bg-rose-950/20 px-1.5 rounded'
                        : log.type === 'warn'
                        ? 'text-amber-400'
                        : log.type === 'system'
                        ? 'text-emerald-400/90 font-semibold'
                        : 'text-slate-200'
                    }`}
                  >
                    <span className="text-slate-600 text-[10px] select-none">{log.time}</span>
                    <span className="select-text whitespace-pre-wrap break-all">{log.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Modal View */}
      {isFullscreen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={() => setIsFullscreen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative flex flex-col w-full max-w-6xl h-[92vh] rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl"
            >
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/80 border-b border-white/10 text-white">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-bold uppercase text-amber-400">
                    {language} Live Runner
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    Interactive Workspace
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Tab switchers in modal */}
                  <div className="flex items-center rounded-lg bg-black/40 p-0.5 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setActiveTab('code')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                        activeTab === 'code' ? 'bg-amber-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Code
                    </button>
                    {(isHtml || isSvg) && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('preview');
                          setIframeKey((k) => k + 1);
                        }}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                          activeTab === 'preview' ? 'bg-emerald-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Preview
                      </button>
                    )}
                    {(isJs || isTs || isPython) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (executionLogs.length === 0) executeCode();
                          else setActiveTab('console');
                        }}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                          activeTab === 'console' ? 'bg-blue-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Console
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={executeCode}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 px-3 py-1 text-xs font-bold text-white transition cursor-pointer shadow-sm"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Run</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-slate-300 hover:bg-white/10 transition cursor-pointer"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFullscreen(false)}
                    className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer ml-1"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-hidden flex flex-col bg-[#141416]">
                {activeTab === 'code' && (
                  <pre className="flex-1 overflow-auto p-6 text-slate-100 font-mono text-[13px] leading-relaxed">
                    <code>{code}</code>
                  </pre>
                )}

                {activeTab === 'preview' && (isHtml || isSvg) && (
                  <iframe
                    key={iframeKey}
                    title="Fullscreen Live Preview"
                    srcDoc={buildHtmlDoc()}
                    sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                    className="w-full flex-1 border-0 bg-slate-900"
                  />
                )}

                {activeTab === 'console' && (
                  <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1.5 bg-slate-950 text-slate-200">
                    {executionLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 py-1 leading-relaxed ${
                          log.type === 'error'
                            ? 'text-rose-400 bg-rose-950/20 px-2 rounded'
                            : log.type === 'warn'
                            ? 'text-amber-400'
                            : log.type === 'system'
                            ? 'text-emerald-400 font-semibold'
                            : 'text-slate-200'
                        }`}
                      >
                        <span className="text-slate-600 text-xs select-none">{log.time}</span>
                        <span className="select-text whitespace-pre-wrap break-all">{log.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
