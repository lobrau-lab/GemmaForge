import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ModelHubView } from './components/views/ModelHubView';
import { DataForgeView } from './components/views/DataForgeView';
import { TrainingGroundView } from './components/views/TrainingGroundView';
import { AutoTuningView } from './components/views/AutoTuningView';
import { EvaluationSuiteView } from './components/views/EvaluationSuiteView';
import { ModelRegistryView } from './components/views/ModelRegistryView';
import { DeploymentServingView } from './components/views/DeploymentServingView';
import { PlaygroundView } from './components/views/PlaygroundView';
import { ArchitectureCliView } from './components/views/ArchitectureCliView';

import { NewTrainingModal } from './components/modals/NewTrainingModal';
import { SyntheticDataModal } from './components/modals/SyntheticDataModal';
import { ExportModelModal } from './components/modals/ExportModelModal';
import { HfTokenModal } from './components/modals/HfTokenModal';
import { AlertsHistoryModal } from './components/modals/AlertsHistoryModal';
import { ToastContainer } from './components/ToastContainer';

import { playAlertSound } from './utils/audioAlert';
import { ToastAlert, AlertThresholdSettings } from './types/toast';

import {
  INITIAL_DATASETS,
  INITIAL_TRAINING_RUNS,
  INITIAL_AUTOTUNE_TRIALS,
  INITIAL_BENCHMARKS,
  INITIAL_CHECKPOINTS,
  INITIAL_DEPLOYMENTS,
} from './constants/mockData';

import {
  NavigationTab,
  DatasetItem,
  TrainingRun,
  ModelCheckpoint,
  GemmaModelInfo,
} from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('hub');

  // Core State
  const [datasets, setDatasets] = useState<DatasetItem[]>(INITIAL_DATASETS);
  const [runs, setRuns] = useState<TrainingRun[]>(INITIAL_TRAINING_RUNS);
  const [trials, setTrials] = useState(INITIAL_AUTOTUNE_TRIALS);
  const [benchmarks, setBenchmarks] = useState(INITIAL_BENCHMARKS);
  const [checkpoints, setCheckpoints] = useState<ModelCheckpoint[]>(INITIAL_CHECKPOINTS);
  const [deployments, setDeployments] = useState(INITIAL_DEPLOYMENTS);
  const [hfTokenVerified, setHfTokenVerified] = useState<boolean>(true);

  // Toast Notification System & Resource Health Watchdog State
  const [activeToasts, setActiveToasts] = useState<ToastAlert[]>([]);
  const [alertsHistory, setAlertsHistory] = useState<ToastAlert[]>([
    {
      id: 'init-alert-01',
      type: 'vram_exceeded',
      severity: 'warning',
      title: 'VRAM Allocation Watchdog Warning',
      message: 'Run Gemma-2-9B-QLoRA-GSM8K-v2 VRAM reached 88.4%, approaching threshold.',
      runId: 'run-gemma-2-9b-qlora-math',
      runName: 'Gemma-2-9B-QLoRA-GSM8K-v2',
      metricValue: '88.4% VRAM',
      baselineThreshold: 'Max 85% Warning SLA',
      timestamp: '10:14:22 AM',
      actionLabel: 'Check Activation Memory',
      actionType: 'enable_gradient_checkpointing',
      dismissible: true,
    },
  ]);

  const [thresholds, setThresholds] = useState<AlertThresholdSettings>({
    vramWarningPercent: 85,
    vramCriticalPercent: 92,
    throughputBaselineTokPerSec: 1000,
    autoNotifyEnabled: true,
    audioAlertsEnabled: true,
  });

  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState<boolean>(false);

  // Modals
  const [isNewRunModalOpen, setIsNewRunModalOpen] = useState<boolean>(false);
  const [selectedModelForRun, setSelectedModelForRun] = useState<string>('google/gemma-2-9b-it');
  const [isSyntheticModalOpen, setIsSyntheticModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportTargetCheckpoint, setExportTargetCheckpoint] = useState<ModelCheckpoint | null>(checkpoints[0]);
  const [isHfModalOpen, setIsHfModalOpen] = useState<boolean>(false);

  // Toast Dispatcher
  const addToastAlert = useCallback(
    (alert: ToastAlert) => {
      setActiveToasts((prev) => [alert, ...prev.slice(0, 4)]);
      setAlertsHistory((prev) => [alert, ...prev]);

      if (thresholds.audioAlertsEnabled) {
        playAlertSound(alert.severity);
      }

      // Auto dismiss after 7 seconds if not critical
      if (alert.severity !== 'critical') {
        setTimeout(() => {
          setActiveToasts((prev) => prev.filter((t) => t.id !== alert.id));
        }, 7000);
      }
    },
    [thresholds.audioAlertsEnabled]
  );

  const dismissToast = useCallback((id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleToastAction = useCallback((toast: ToastAlert) => {
    if (toast.actionType === 'enable_gradient_checkpointing') {
      // Apply remediation: lower VRAM back to healthy levels
      setRuns((prev) =>
        prev.map((r) =>
          r.id === toast.runId
            ? {
                ...r,
                gpuMemoryUsagePercent: 74.5,
                logs: [
                  ...r.logs,
                  '[GemmaForge Watchdog] Remediation applied: Activation offload enabled. VRAM reduced to 74.5%.',
                ],
              }
            : r
        )
      );

      dismissToast(toast.id);
      addToastAlert({
        id: `remedy-${Date.now()}`,
        type: 'success',
        severity: 'success',
        title: 'VRAM Remediation Applied Successfully',
        message: 'Activation re-computation enabled. Memory pressure normalized to 74.5% VRAM.',
        runId: toast.runId,
        runName: toast.runName,
        metricValue: '74.5% VRAM',
        baselineThreshold: 'Healthy (<92%)',
        timestamp: new Date().toLocaleTimeString(),
        dismissible: true,
      });
    } else if (toast.actionType === 'reduce_batch_size') {
      // Remedy throughput drop
      setRuns((prev) =>
        prev.map((r) =>
          r.id === toast.runId
            ? {
                ...r,
                throughputTokensPerSec: 1440,
                logs: [
                  ...r.logs,
                  '[GemmaForge Watchdog] Batch pre-fetch optimized: Throughput restored to 1,440 tok/s.',
                ],
              }
            : r
        )
      );
      dismissToast(toast.id);
      addToastAlert({
        id: `remedy-tp-${Date.now()}`,
        type: 'success',
        severity: 'success',
        title: 'Throughput Bottleneck Cleared',
        message: 'Host-to-device IO pipeline optimized. Throughput recovered to 1,440 tok/s.',
        runId: toast.runId,
        runName: toast.runName,
        metricValue: '1,440 tok/s',
        baselineThreshold: 'Above 1,000 SLA',
        timestamp: new Date().toLocaleTimeString(),
        dismissible: true,
      });
    } else {
      dismissToast(toast.id);
      setCurrentTab('training');
    }
  }, [dismissToast, addToastAlert]);

  const handleSimulateAlert = (type: 'vram' | 'throughput') => {
    const runningRun = runs.find((r) => r.status === 'running') || runs[0];
    if (type === 'vram') {
      setRuns((prev) =>
        prev.map((r) =>
          r.id === runningRun.id ? { ...r, gpuMemoryUsagePercent: 96.4 } : r
        )
      );
      addToastAlert({
        id: `sim-vram-${Date.now()}`,
        type: 'vram_exceeded',
        severity: 'critical',
        title: 'GPU VRAM Limit Exceeded (96.4% OOM Risk)',
        message: `Training run '${runningRun.name}' exceeded critical memory ceiling of ${thresholds.vramCriticalPercent}%. CUDA Out-Of-Memory imminent!`,
        runId: runningRun.id,
        runName: runningRun.name,
        metricValue: '96.4% VRAM',
        baselineThreshold: `Max ${thresholds.vramCriticalPercent}% SLA`,
        timestamp: new Date().toLocaleTimeString(),
        actionLabel: 'Enable Activation Offload',
        actionType: 'enable_gradient_checkpointing',
        dismissible: true,
      });
    } else {
      setRuns((prev) =>
        prev.map((r) =>
          r.id === runningRun.id ? { ...r, throughputTokensPerSec: 640 } : r
        )
      );
      addToastAlert({
        id: `sim-tp-${Date.now()}`,
        type: 'throughput_drop',
        severity: 'warning',
        title: 'GPU Throughput Dropped Below SLA Baseline',
        message: `Throughput fell to 640 tok/s on '${runningRun.name}', dropping below minimum baseline of ${thresholds.throughputBaselineTokPerSec} tok/s.`,
        runId: runningRun.id,
        runName: runningRun.name,
        metricValue: '640 tok/s',
        baselineThreshold: `Min ${thresholds.throughputBaselineTokPerSec} tok/s`,
        timestamp: new Date().toLocaleTimeString(),
        actionLabel: 'Optimize Batch Pre-fetch',
        actionType: 'reduce_batch_size',
        dismissible: true,
      });
    }
  };

  // Actions
  const handleSelectModelForTraining = (model: GemmaModelInfo) => {
    setSelectedModelForRun(model.id);
    setIsNewRunModalOpen(true);
  };

  const handleLaunchRun = (newRun: TrainingRun) => {
    setRuns((prev) => [newRun, ...prev]);
    setCurrentTab('training');
    addToastAlert({
      id: `toast-launch-${Date.now()}`,
      type: 'info',
      severity: 'info',
      title: 'Training Run Initialized',
      message: `Started ${newRun.method} training pipeline for ${newRun.modelName} on cluster.`,
      runId: newRun.id,
      runName: newRun.name,
      timestamp: new Date().toLocaleTimeString(),
      dismissible: true,
    });
  };

  const handleDatasetCreated = (newDataset: DatasetItem) => {
    setDatasets((prev) => [newDataset, ...prev]);
    addToastAlert({
      id: `toast-data-${Date.now()}`,
      type: 'success',
      severity: 'success',
      title: 'Dataset Ingestion Complete',
      message: `Added ${newDataset.name} (${newDataset.samplesCount.toLocaleString()} samples) to Data Forge.`,
      timestamp: new Date().toLocaleTimeString(),
      dismissible: true,
    });
  };

  const handleOpenExportFromRun = (run: TrainingRun) => {
    const chk = checkpoints.find((c) => c.runId === run.id) || checkpoints[0];
    setExportTargetCheckpoint(chk);
    setIsExportModalOpen(true);
  };

  const handleOpenExportFromRegistry = (checkpoint: ModelCheckpoint) => {
    setExportTargetCheckpoint(checkpoint);
    setIsExportModalOpen(true);
  };

  const activeRunCount = runs.filter((r) => r.status === 'running').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Fixed Header */}
      <Header
        onNewRunClick={() => setIsNewRunModalOpen(true)}
        onHfTokenClick={() => setIsHfModalOpen(true)}
        onOpenAlertsClick={() => setIsAlertsModalOpen(true)}
        activeRunCount={activeRunCount}
        hfTokenVerified={hfTokenVerified}
        alertCount={alertsHistory.length}
      />

      {/* Main Container: Sidebar + Active View */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          activeRunCount={activeRunCount}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900/40">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'hub' && (
              <ModelHubView
                onSelectModelForTraining={handleSelectModelForTraining}
                onOpenHfTokenModal={() => setIsHfModalOpen(true)}
                hfTokenVerified={hfTokenVerified}
              />
            )}

            {currentTab === 'data' && (
              <DataForgeView
                datasets={datasets}
                onOpenSyntheticModal={() => setIsSyntheticModalOpen(true)}
                onOpenUploadModal={() => setIsSyntheticModalOpen(true)}
              />
            )}

            {currentTab === 'training' && (
              <TrainingGroundView
                runs={runs}
                onOpenNewRunModal={() => setIsNewRunModalOpen(true)}
                onSelectRunForExport={handleOpenExportFromRun}
                onTriggerAlert={addToastAlert}
                onOpenAlertsModal={() => setIsAlertsModalOpen(true)}
                thresholds={thresholds}
              />
            )}

            {currentTab === 'autotune' && (
              <AutoTuningView trials={trials} />
            )}

            {currentTab === 'evaluation' && (
              <EvaluationSuiteView benchmarks={benchmarks} />
            )}

            {currentTab === 'registry' && (
              <ModelRegistryView
                checkpoints={checkpoints}
                onOpenExportModal={handleOpenExportFromRegistry}
              />
            )}

            {currentTab === 'serving' && (
              <DeploymentServingView
                deployments={deployments}
                onNewDeploymentClick={() => setCurrentTab('registry')}
              />
            )}

            {currentTab === 'playground' && (
              <PlaygroundView />
            )}

            {currentTab === 'architecture' && (
              <ArchitectureCliView />
            )}
          </div>
        </main>
      </div>

      {/* Floating Toast Alerts Stack */}
      <ToastContainer
        toasts={activeToasts}
        onDismiss={dismissToast}
        onAction={handleToastAction}
      />

      {/* Modals */}
      <NewTrainingModal
        isOpen={isNewRunModalOpen}
        onClose={() => setIsNewRunModalOpen(false)}
        datasets={datasets}
        initialModelId={selectedModelForRun}
        onLaunchRun={handleLaunchRun}
      />

      <SyntheticDataModal
        isOpen={isSyntheticModalOpen}
        onClose={() => setIsSyntheticModalOpen(false)}
        onDatasetCreated={handleDatasetCreated}
      />

      <ExportModelModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        checkpoint={exportTargetCheckpoint}
      />

      <HfTokenModal
        isOpen={isHfModalOpen}
        onClose={() => setIsHfModalOpen(false)}
        onVerified={() => setHfTokenVerified(true)}
        isAlreadyVerified={hfTokenVerified}
      />

      <AlertsHistoryModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        alertsHistory={alertsHistory}
        onClearHistory={() => setAlertsHistory([])}
        thresholds={thresholds}
        onUpdateThresholds={setThresholds}
        onSimulateAlert={handleSimulateAlert}
      />
    </div>
  );
}
