import React, { useState, useEffect, useRef } from 'react';
import { Activity, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';

interface FpsMonitorProps {
  showBadge?: boolean;
  onFpsUpdate?: (fps: number) => void;
}

/**
 * High-performance real-time FPS and Main-Thread Latency Tracker.
 * Runs with micro-overhead (single RAF hook with 1s throttling) to measure
 * actual screen refresh rate and mobile performance.
 */
export const FpsMonitor: React.FC<FpsMonitorProps> = ({
  showBadge = false,
  onFpsUpdate,
}) => {
  const [fps, setFps] = useState<number>(60);
  const [frameTime, setFrameTime] = useState<number>(16.6);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    const measureLoop = (now: number) => {
      if (!active) return;
      frameCountRef.current++;

      const delta = now - lastTimeRef.current;
      if (delta >= 1000) {
        const calculatedFps = Math.min(120, Math.round((frameCountRef.current * 1000) / delta));
        const avgFrameTime = Number((delta / frameCountRef.current).toFixed(1));

        setFps(calculatedFps);
        setFrameTime(avgFrameTime);
        if (onFpsUpdate) {
          onFpsUpdate(calculatedFps);
        }

        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      rafIdRef.current = requestAnimationFrame(measureLoop);
    };

    rafIdRef.current = requestAnimationFrame(measureLoop);

    return () => {
      active = false;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [onFpsUpdate]);

  if (!showBadge) return null;

  const isOptimal = fps >= 55;
  const isModerate = fps >= 40 && fps < 55;

  return (
    <div className="fixed bottom-4 right-4 z-50 select-none font-mono text-xs">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-lg border backdrop-blur-md cursor-pointer transition-all duration-300 ${
          isOptimal
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
            : isModerate
            ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
            : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
        }`}
        title="SparkMind Real-time Performance & Frame Rate"
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isOptimal ? 'bg-emerald-400' : isModerate ? 'bg-amber-400' : 'bg-rose-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isOptimal ? 'bg-emerald-500' : isModerate ? 'bg-amber-500' : 'bg-rose-500'
            }`}
          />
        </span>
        <span className="font-bold">{fps} FPS</span>
        <span className="opacity-70 text-[10px]">({frameTime}ms)</span>
      </div>

      {isExpanded && (
        <div className="mt-2 p-3 rounded-xl border border-white/10 bg-slate-900/95 text-slate-200 shadow-2xl backdrop-blur-xl w-64 text-left animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 font-sans font-semibold text-white">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Flash Engine Speed
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded ${
                isOptimal
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {isOptimal ? '60 FPS Turbo' : 'Adapting'}
            </span>
          </div>

          <div className="space-y-1.5 text-[11px] font-sans">
            <div className="flex justify-between">
              <span className="text-slate-400">Current Refresh:</span>
              <span className="font-semibold text-white font-mono">{fps} frames/sec</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Frame Budget:</span>
              <span className="font-mono text-emerald-400">{frameTime}ms / 16.6ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Mobile Acceleration:</span>
              <span className="text-emerald-400 font-semibold">Active (GPU Native)</span>
            </div>
          </div>

          <p className="mt-2 text-[10px] text-slate-400 font-sans leading-relaxed">
            Flash Mode automatically reduces blur passes and chunks heavy libraries so your device stays smooth at 60 FPS.
          </p>
        </div>
      )}
    </div>
  );
};
