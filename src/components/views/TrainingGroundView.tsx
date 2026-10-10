import React, { useState, useEffect } from 'react';
import {
  Flame,
  Play,
  Square,
  RefreshCw,
  Terminal,
  Activity,
  Layers,
  Cpu,
  Clock,
  Zap,
  CheckCircle2,
  AlertCircle,
  Plus,
  Share2,
  AlertTriangle,
  ZapOff,
  ShieldAlert,
  Sliders,
} from 'lucide-react';
import { TrainingRun } from '../../types';
import { ToastAlert, AlertThresholdSettings } from '../../types/toast';
import { LossChart } from '../LossChart';

interface TrainingGroundViewProps {
  runs: TrainingRun[];
  onOpenNewRunModal: () => void;
  onSelectRunForExport: (run: TrainingRun) => void;
  onTriggerAlert: (alert: ToastAlert) => void;
  onOpenAlertsModal: () => void;
  thresholds: AlertThresholdSettings;
}

export const TrainingGroundView: React.FC<TrainingGroundViewProps> = ({
  runs,
  onOpenNewRunModal,
  onSelectRunForExport,
  onTriggerAlert,
  onOpenAlertsModal,
  thresholds,
}) => {
  const [selectedRun, setSelectedRun] = useState<TrainingRun>(runs[0]);
  const [activeTab, setActiveTab] = useState<'metrics' | 'hyperparameters' | 'logs'>('metrics');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  const handleSimulateVramSpike = () => {
    setSelectedRun((prev) => ({
      ...prev,
      gpuMemoryUsagePercent: 96.8,
    }));
    onTriggerAlert({
      id: `vram-alert-${Date.now()}`,
      type: 'vram_exceeded',
      severity: 'critical',
      title: 'GPU VRAM Limit Exceeded (OOM Risk)',
      message: `Training run '${selectedRun.name}' GPU memory reached 96.8%, exceeding critical threshold of ${thresholds.vramCriticalPercent}%. Immediate action recommended to avoid CUDA Out-Of-Memory failure.`,
      runId: selectedRun.id,
      runName: selectedRun.name,
      metricValue: '96.8% VRAM',
      baselineThreshold: `Max ${thresholds.vramCriticalPercent}% SLA`,
      timestamp: new Date().toLocaleTimeString(),
      actionLabel: 'Enable Activation Offload',
      actionType: 'enable_gradient_checkpointing',
      dismissible: true,
    });
  };

  const handleSimulateThroughputDrop = () => {
    setSelectedRun((prev) => ({
      ...prev,
      throughputTokensPerSec: 680,
    }));
    onTriggerAlert({
      id: `tp-alert-${Date.now()}`,
      type: 'throughput_drop',
      severity: 'warning',
      title: 'GPU Throughput Dropped Below Baseline SLA',
      message: `Throughput dropped to 680 tok/s on '${selectedRun.name}', falling below baseline of ${thresholds.throughputBaselineTokPerSec} tok/s. Host-to-device IO bottleneck or InfiniBand congestion detected.`,
      runId: selectedRun.id,
      runName: selectedRun.name,
      metricValue: '680 tok/s',
      baselineThreshold: `Min ${thresholds.throughputBaselineTokPerSec} tok/s`,
      timestamp: new Date().toLocaleTimeString(),
      actionLabel: 'Optimize Batch Pre-fetch',
      actionType: 'reduce_batch_size',
      dismissible: true,
    });
  };

  // Auto-simulate step progression if the selected run is currently "running"
  useEffect(() => {
    if (selectedRun.status !== 'running' || !isSimulating) return;

    const interval = setInterval(() => {
      setSelectedRun((prev) => {
        if (prev.currentStep >= prev.totalSteps) return prev;
        const nextStep = prev.currentStep + 10;
        const stepPct = nextStep / prev.totalSteps;
        const newTrainLoss = Math.max(0.48, +(prev.trainLoss * (1 - 0.003 * Math.random())).toFixed(3));
        const newEvalLoss = Math.max(0.52, +(prev.evalLoss * (1 - 0.002 * Math.random())).toFixed(3));
        const newHistory = [
          ...prev.lossHistory,
          {
            step: nextStep,
            trainLoss: newTrainLoss,
            evalLoss: newEvalLoss,
            lr: +(prev.learningRate * 0.998).toFixed(6),
            gradNorm: +(0.4 + Math.random() * 0.2).toFixed(2),
          },
        ];

        const logMsg = `[Step ${nextStep}/${prev.totalSteps}] Train Loss: ${newTrainLoss} | Eval Loss: ${newEvalLoss} | Speed: 1420 tok/s | VRAM: 78.4%`;
        return {
          ...prev,
          currentStep: nextStep,
          trainLoss: newTrainLoss,
          evalLoss: newEvalLoss,
          lossHistory: newHistory.slice(-25),
          logs: [...prev.logs, logMsg].slice(-100),
        };
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedRun.status, isSimulating]);

  const stepProgress = Math.round((selectedRun.currentStep / selectedRun.totalSteps) * 100);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/20 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
              Training Ground
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">TRL SFTTrainer · PEFT QLoRA / DoRA · FSDP · DPO</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">
            Distributed Gemma Fine-Tuning Execution Engine
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Real-time loss tracking, PyTorch FSDP multi-GPU sharding, FlashAttention-2 acceleration,
            and gradient checkpointing for 1B, 4B, 9B, 12B, and 27B Gemma models.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenNewRunModal}
            className="text-xs font-mono font-semibold px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 hover:from-amber-400 hover:to-orange-500 shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Launch Training Run</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Runs List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Training Pipeline Runs ({runs.length})
            </span>
          </div>

          <div className="space-y-2.5">
            {runs.map((r) => {
              const isSelected = selectedRun.id === r.id;
              const isRunning = r.status === 'running';
              const isCompleted = r.status === 'completed';
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRun(r)}
                  className={`border rounded-xl p-3.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-500/50 bg-slate-900/90 shadow-md shadow-amber-500/5 ring-1 ring-amber-500/30'
                      : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-100">{r.name}</span>
                      </div>
                      <span className="text-[11px] font-mono text-amber-400/90">{r.modelName}</span>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        isRunning
                          ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300 animate-pulse'
                          : isCompleted
                          ? 'border-blue-500/40 bg-blue-950/30 text-blue-300'
                          : 'border-slate-700 bg-slate-800 text-slate-400'
                      }`}
                    >
                      {r.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2.5 space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>{r.method}</span>
                      <span>
                        {r.currentStep} / {r.totalSteps} steps ({Math.round((r.currentStep / r.totalSteps) * 100)}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isRunning ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${(r.currentStep / r.totalSteps) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-2 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                    <span>Loss: {r.trainLoss || '—'}</span>
                    <span>{r.createdAt}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Run Telemetry & Controls (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5 space-y-5">
            {/* Top Run Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-100">{selectedRun.name}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300">
                    {selectedRun.method}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2 mt-1">
                  <span>Hardware: {selectedRun.hardware}</span>
                  <span>·</span>
                  <span>Dataset: {selectedRun.datasetName}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onSelectRunForExport(selectedRun)}
                  className="text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 transition-all flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Export Checkpoint</span>
                </button>
              </div>
            </div>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
                <span className="text-slate-500 text-[10px] block">Current Train Loss</span>
                <span className="text-amber-400 font-bold text-base mt-0.5 block">
                  {selectedRun.trainLoss.toFixed(3)}
                </span>
                <span className="text-[10px] text-emerald-400">Eval: {selectedRun.evalLoss.toFixed(3)}</span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
                <span className="text-slate-500 text-[10px] block">Throughput Speed</span>
                <span className="text-slate-200 font-bold text-base mt-0.5 block">
                  {selectedRun.throughputTokensPerSec.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400">tokens / second</span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
                <span className="text-slate-500 text-[10px] block">GPU VRAM Utilization</span>
                <span className="text-emerald-400 font-bold text-base mt-0.5 block">
                  {selectedRun.gpuMemoryUsagePercent}%
                </span>
                <span className="text-[10px] text-slate-400">FlashAttention-2</span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
                <span className="text-slate-500 text-[10px] block">Epoch & Step</span>
                <span className="text-blue-400 font-bold text-base mt-0.5 block">
                  Ep {selectedRun.currentEpoch} / {selectedRun.totalEpochs}
                </span>
                <span className="text-[10px] text-slate-400">Step {selectedRun.currentStep} of {selectedRun.totalSteps}</span>
              </div>
            </div>

            {/* Resource Health Watchdog & Toast Simulation Bar */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
              <div className="flex items-center gap-3">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    selectedRun.gpuMemoryUsagePercent > thresholds.vramCriticalPercent
                      ? 'bg-red-400 animate-ping'
                      : selectedRun.throughputTokensPerSec < thresholds.throughputBaselineTokPerSec
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-emerald-400'
                  }`}
                ></div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200 text-[11px]">GPU Resource Health SLA Monitor</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${
                        selectedRun.gpuMemoryUsagePercent > thresholds.vramCriticalPercent
                          ? 'bg-red-950/60 border-red-500/40 text-red-300'
                          : selectedRun.throughputTokensPerSec < thresholds.throughputBaselineTokPerSec
                          ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                          : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                      }`}
                    >
                      {selectedRun.gpuMemoryUsagePercent > thresholds.vramCriticalPercent
                        ? 'CRITICAL MEMORY BREACH'
                        : selectedRun.throughputTokensPerSec < thresholds.throughputBaselineTokPerSec
                        ? 'THROUGHPUT DEGRADED'
                        : 'HEALTHY'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>
                      VRAM: <strong className={selectedRun.gpuMemoryUsagePercent > thresholds.vramCriticalPercent ? 'text-red-400' : 'text-slate-200'}>{selectedRun.gpuMemoryUsagePercent}%</strong> (Limit: {thresholds.vramCriticalPercent}%)
                    </span>
                    <span>·</span>
                    <span>
                      Throughput: <strong className={selectedRun.throughputTokensPerSec < thresholds.throughputBaselineTokPerSec ? 'text-amber-400' : 'text-slate-200'}>{selectedRun.throughputTokensPerSec} tok/s</strong> (Min: {thresholds.throughputBaselineTokPerSec} tok/s)
                    </span>
                  </div>
                </div>
              </div>

              {/* Toast Alert Simulation & SLA Config Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSimulateVramSpike}
                  className="px-2.5 py-1 rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 text-[10px] flex items-center gap-1 transition-all active:scale-95"
                  title="Simulate high memory allocation triggering critical OOM toast notification"
                >
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                  <span>Test VRAM Alert</span>
                </button>
                <button
                  type="button"
                  onClick={handleSimulateThroughputDrop}
                  className="px-2.5 py-1 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-[10px] flex items-center gap-1 transition-all active:scale-95"
                  title="Simulate sudden speed degradation triggering throughput toast notification"
                >
                  <ZapOff className="w-3 h-3 text-amber-400" />
                  <span>Test Throughput Alert</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenAlertsModal}
                  className="p-1 rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Configure alert thresholds and history"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Segmented Controls for Sub-views */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg w-fit">
              {[
                { id: 'metrics', label: 'Loss & Telemetry Curve' },
                { id: 'hyperparameters', label: 'Hyperparameters' },
                { id: 'logs', label: 'Live Console Logs' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-3 py-1 text-xs font-mono font-medium rounded-md transition-colors ${
                    activeTab === t.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* TAB 1: Loss & Telemetry Chart */}
            {activeTab === 'metrics' && (
              <LossChart data={selectedRun.lossHistory} title={`${selectedRun.name} — Real-time Loss`} />
            )}

            {/* TAB 2: Hyperparameters */}
            {activeTab === 'hyperparameters' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-xs">
                {Object.entries(selectedRun.hyperparameters).map(([key, val]) => (
                  <div key={key} className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2.5">
                    <span className="text-slate-500 text-[10px] block">{key}</span>
                    <span className="text-slate-200 font-semibold mt-0.5 block">
                      {typeof val === 'boolean' ? (val ? 'True' : 'False') : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: Live Logs */}
            {activeTab === 'logs' && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 font-mono text-xs text-slate-300 h-64 overflow-y-auto space-y-1">
                <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-900 text-slate-500 text-[11px]">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  <span>stdout / stderr (Process Group ID: 0x88f2)</span>
                </div>
                {selectedRun.logs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed hover:bg-slate-900/40 px-1 rounded">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
