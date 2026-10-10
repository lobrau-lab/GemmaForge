import React, { useEffect } from 'react';
import {
  AlertTriangle,
  ZapOff,
  Flame,
  X,
  ArrowRight,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { ToastAlert } from '../types/toast';

interface ToastContainerProps {
  toasts: ToastAlert[];
  onDismiss: (id: string) => void;
  onAction?: (toast: ToastAlert) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  onAction,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        const isCritical = toast.severity === 'critical';
        const isWarning = toast.severity === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-xl border p-4 shadow-2xl backdrop-blur-md font-mono text-xs transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in ${
              isCritical
                ? 'bg-slate-950/95 border-red-500/60 shadow-red-950/40 text-slate-100 ring-1 ring-red-500/30'
                : isWarning
                ? 'bg-slate-950/95 border-amber-500/60 shadow-amber-950/30 text-slate-100 ring-1 ring-amber-500/30'
                : 'bg-slate-950/95 border-slate-800 shadow-slate-950/40 text-slate-100'
            }`}
          >
            {/* Top Row: Icon + Title + Close */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isCritical
                      ? 'bg-red-500/20 text-red-400'
                      : isWarning
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {toast.type === 'vram_exceeded' || toast.type === 'oom_warning' ? (
                    <Flame className="w-4 h-4" />
                  ) : toast.type === 'throughput_drop' ? (
                    <ZapOff className="w-4 h-4" />
                  ) : (
                    <Info className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-xs">{toast.title}</span>
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.2 rounded border font-semibold ${
                        isCritical
                          ? 'bg-red-950/60 border-red-500/40 text-red-300'
                          : isWarning
                          ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {toast.severity}
                    </span>
                  </div>
                  {toast.runName && (
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Target: <strong className="text-slate-300">{toast.runName}</strong>
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => onDismiss(toast.id)}
                className="text-slate-500 hover:text-slate-200 p-1 transition-colors rounded hover:bg-slate-900"
                title="Dismiss alert"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Message Body */}
            <p className="mt-2.5 text-[11px] text-slate-300 font-sans leading-relaxed">
              {toast.message}
            </p>

            {/* Metric Comparison Badge */}
            {(toast.metricValue || toast.baselineThreshold) && (
              <div className="mt-2.5 p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">
                  Observed: <strong className={isCritical ? 'text-red-400' : 'text-amber-400'}>{toast.metricValue}</strong>
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400">
                  Baseline SLA: <strong className="text-slate-200">{toast.baselineThreshold}</strong>
                </span>
              </div>
            )}

            {/* Action Button & Timestamp */}
            <div className="mt-3 pt-2.5 border-t border-slate-800/70 flex items-center justify-between text-[10px]">
              <span className="text-slate-500">{toast.timestamp}</span>

              {toast.actionLabel && (
                <button
                  onClick={() => onAction && onAction(toast)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-semibold transition-all ${
                    isCritical
                      ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/40'
                      : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
                  }`}
                >
                  <span>{toast.actionLabel}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
