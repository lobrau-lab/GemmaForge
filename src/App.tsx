import React, { useState } from 'react';
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

  // Modals
  const [isNewRunModalOpen, setIsNewRunModalOpen] = useState<boolean>(false);
  const [selectedModelForRun, setSelectedModelForRun] = useState<string>('google/gemma-2-9b-it');
  const [isSyntheticModalOpen, setIsSyntheticModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportTargetCheckpoint, setExportTargetCheckpoint] = useState<ModelCheckpoint | null>(checkpoints[0]);
  const [isHfModalOpen, setIsHfModalOpen] = useState<boolean>(false);

  // Actions
  const handleSelectModelForTraining = (model: GemmaModelInfo) => {
    setSelectedModelForRun(model.id);
    setIsNewRunModalOpen(true);
  };

  const handleLaunchRun = (newRun: TrainingRun) => {
    setRuns((prev) => [newRun, ...prev]);
    setCurrentTab('training');
  };

  const handleDatasetCreated = (newDataset: DatasetItem) => {
    setDatasets((prev) => [newDataset, ...prev]);
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
        activeRunCount={activeRunCount}
        hfTokenVerified={hfTokenVerified}
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
    </div>
  );
}
