import React from 'react';
import {
  X,
  Bell,
  Sliders,
  Flame,
  ZapOff,
  Trash2,
  Volume2,
  VolumeX,
  ShieldAlert,
  Play,
  RotateCcw,
} from 'lucide-react';
import { ToastAlert, AlertThresholdSettings } from '../../types/toast';

interface AlertsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  alertsHistory: ToastAlert[];
  onClearHistory: () => void;
  thresholds: AlertThresholdSettings;
  onUpdateThresholds: (settings: AlertThresholdSettings) => void;
  onSimulateAlert: (type: 'vram' | 'throughput') => void;
}

export const AlertsHistoryModal: React.FC<AlertsHistoryModalProps> = ({
  isOpen,
  onClose,
  alertsHistory,
  onClearHistory,
  thresholds,
  onUpdateThresholds,
  onSimulateAlert,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Resource Health & Alert Notification Center
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Thresholds Config Card */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Monitoring Thresholds & Baseline SLA</span>
              </span>
              <button
                type="button"
                onClick={() =>
                  onUpdateThresholds({
                    ...thresholds,
                    audioAlertsEnabled: !thresholds.audioAlertsEnabled,
                  })
                }
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
              >
                {thresholds.audioAlertsEnabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Audio: On</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                    <span>Audio: Muted</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px]">
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>VRAM Critical OOM Limit:</span>
                  <span className="text-red-400 font-bold">{thresholds.vramCriticalPercent}%</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="98"
                  value={thresholds.vramCriticalPercent}
                  onChange={(e) =>
                    onUpdateThresholds({
                      ...thresholds,
                      vramCriticalPercent: Number(e.target.value),
                    })
                  }
                  className="w-full accent-red-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Throughput SLA Baseline:</span>
                  <span className="text-amber-400 font-bold">{thresholds.throughputBaselineTokPerSec} tok/s</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="2000"
                  step="50"
                  value={thresholds.throughputBaselineTokPerSec}
                  onChange={(e) =>
                    onUpdateThresholds({
                      ...thresholds,
                      throughputBaselineTokPerSec: Number(e.target.value),
                    })
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Simulation test triggers */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] text-slate-500">Diagnostic Simulation Tools:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSimulateAlert('vram')}
                  className="px-2.5 py-1 rounded bg-red-500/10 border border-red-500/40 text-red-300 hover:bg-red-500/20 text-[10px] flex items-center gap-1 transition-colors"
                >
                  <Flame className="w-3 h-3 text-red-400" />
                  <span>Simulate VRAM Spike (&gt;95%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSimulateAlert('throughput')}
                  className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/40 text-amber-300 hover:bg-amber-500/20 text-[10px] flex items-center gap-1 transition-colors"
                >
                  <ZapOff className="w-3 h-3 text-amber-400" />
                  <span>Simulate Throughput Drop (&lt;800 tok/s)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Past Alerts Log */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold uppercase text-[10px]">
                Incident Log History ({alertsHistory.length})
              </span>
              {alertsHistory.length > 0 && (
                <button
                  onClick={onClearHistory}
                  className="text-slate-500 hover:text-red-400 text-[10px] flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear Log</span>
                </button>
              )}
            </div>

            {alertsHistory.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-950/40 border border-slate-800/80 text-center text-slate-500 text-xs">
                All cluster GPU nodes operating within healthy memory and throughput SLAs. Zero alert incidents.
              </div>
            ) : (
              <div className="space-y-2">
                {alertsHistory.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start justify-between gap-3 text-[11px]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            alert.severity === 'critical' ? 'bg-red-400' : 'bg-amber-400'
                          }`}
                        ></span>
                        <strong className="text-slate-200">{alert.title}</strong>
                        <span className="text-[10px] text-slate-500">{alert.runName}</span>
                      </div>
                      <p className="text-slate-400 mt-1 font-sans text-xs">{alert.message}</p>
                      {alert.metricValue && (
                        <div className="mt-1 text-[10px] text-slate-500">
                          Observed: <strong className="text-slate-300">{alert.metricValue}</strong> vs SLA:{' '}
                          <strong className="text-slate-300">{alert.baselineThreshold}</strong>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0">{alert.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
