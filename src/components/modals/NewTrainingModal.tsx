import React, { useState } from 'react';
import {
  X,
  Flame,
  Cpu,
  Layers,
  Database,
  Sliders,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { GEMMA_MODELS } from '../../constants/gemmaModels';
import { DatasetItem, TrainingRun } from '../../types';

interface NewTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasets: DatasetItem[];
  initialModelId?: string;
  onLaunchRun: (newRun: TrainingRun) => void;
}

export const NewTrainingModal: React.FC<NewTrainingModalProps> = ({
  isOpen,
  onClose,
  datasets,
  initialModelId = 'google/gemma-2-9b-it',
  onLaunchRun,
}) => {
  const [modelId, setModelId] = useState<string>(initialModelId);
  const [datasetId, setDatasetId] = useState<string>(datasets[0]?.id || 'ds-01');
  const [method, setMethod] = useState<'QLoRA' | 'LoRA' | 'DoRA' | 'Full Fine-Tuning (FSDP)' | 'DPO'>('QLoRA');
  const [hardware, setHardware] = useState<string>('2x NVIDIA H100 80GB SXM5 (FSDP)');
  const [epochs, setEpochs] = useState<number>(3);
  const [learningRate, setLearningRate] = useState<string>('2e-4');
  const [batchSize, setBatchSize] = useState<number>(4);
  const [gradAccum, setGradAccum] = useState<number>(4);
  const [loraRank, setLoraRank] = useState<number>(64);
  const [loraAlpha, setLoraAlpha] = useState<number>(128);
  const [precision, setPrecision] = useState<string>('int4_nf4');

  if (!isOpen) return null;

  const selectedModel = GEMMA_MODELS.find((m) => m.id === modelId) || GEMMA_MODELS[0];
  const selectedDataset = datasets.find((d) => d.id === datasetId) || datasets[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newRun: TrainingRun = {
      id: `run-gemma-${Date.now()}`,
      name: `${selectedModel.name.replace(/\s+/g, '-')}-${method}-v1`,
      modelId: selectedModel.id,
      modelName: selectedModel.name,
      datasetId: selectedDataset.id,
      datasetName: selectedDataset.name,
      method: method as any,
      status: 'running',
      currentEpoch: 1,
      totalEpochs: epochs,
      currentStep: 1,
      totalSteps: Math.max(200, Math.round((selectedDataset.samplesCount / (batchSize * gradAccum)) * epochs)),
      trainLoss: 2.15,
      evalLoss: 2.05,
      learningRate: parseFloat(learningRate) || 0.0002,
      throughputTokensPerSec: 1380,
      gpuMemoryUsagePercent: method === 'QLoRA' ? 74.2 : 88.5,
      durationMinutes: 1,
      hardware,
      createdAt: 'Just now',
      lossHistory: [
        { step: 1, trainLoss: 2.15, evalLoss: 2.05, lr: parseFloat(learningRate) || 0.0002, gradNorm: 1.8 },
      ],
      hyperparameters: {
        learningRate: parseFloat(learningRate) || 0.0002,
        batchSize,
        gradientAccumulation: gradAccum,
        loraRank,
        loraAlpha,
        loraDropout: 0.05,
        optimizer: 'paged_adamw_8bit',
        scheduler: 'cosine',
        warmupRatio: 0.03,
        weightDecay: 0.01,
        precision,
        flashAttention2: true,
        gradientCheckpointing: true,
      },
      logs: [
        `[GemmaForge] Launched ${method} run for ${selectedModel.id} on ${hardware}`,
        `[GemmaForge] Initialized PEFT adapter: r=${loraRank}, alpha=${loraAlpha}`,
        `[GemmaForge] Step 1: Loss 2.150, Speed: 1380 tok/s`,
      ],
    };

    onLaunchRun(newRun);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">Launch New Gemma Training Run</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Model & Dataset Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Target Foundation Model:</label>
              <select
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500/50"
              >
                {GEMMA_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.parameters})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Fine-Tuning Dataset:</label>
              <select
                value={datasetId}
                onChange={(e) => setDatasetId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500/50"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.samplesCount.toLocaleString()} samples)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Training Method & Precision */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Tuning Paradigm:</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500/50"
              >
                <option value="QLoRA">QLoRA (4-bit NF4 + BitsAndBytes)</option>
                <option value="LoRA">Standard LoRA (16-bit adapters)</option>
                <option value="DoRA">DoRA (Weight-Decomposed Adaptation)</option>
                <option value="Full Fine-Tuning (FSDP)">Full Fine-Tuning (PyTorch FSDP)</option>
                <option value="DPO">DPO (Direct Preference Optimization)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Cluster Hardware Partition:</label>
              <select
                value={hardware}
                onChange={(e) => setHardware(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500/50"
              >
                <option value="2x NVIDIA H100 80GB SXM5 (FSDP)">2x NVIDIA H100 80GB SXM5 (FSDP)</option>
                <option value="4x NVIDIA A100 80GB (FSDP ZeRO-2)">4x NVIDIA A100 80GB (FSDP ZeRO-2)</option>
                <option value="8x NVIDIA H100 80GB (DeepSpeed ZeRO-3)">8x NVIDIA H100 80GB (DeepSpeed ZeRO-3)</option>
                <option value="1x NVIDIA RTX 4090 24GB (Single-GPU QLoRA)">1x NVIDIA RTX 4090 24GB (Single-GPU QLoRA)</option>
              </select>
            </div>
          </div>

          {/* Hyperparameters Grid */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-3">
            <span className="text-[10px] uppercase text-amber-400 font-bold block">
              Hyperparameter Specification
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Epochs:</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={epochs}
                  onChange={(e) => setEpochs(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Learning Rate:</label>
                <input
                  type="text"
                  value={learningRate}
                  onChange={(e) => setLearningRate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Batch Size:</label>
                <input
                  type="number"
                  min="1"
                  max="32"
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Grad Accum:</label>
                <input
                  type="number"
                  min="1"
                  max="64"
                  value={gradAccum}
                  onChange={(e) => setGradAccum(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">LoRA Rank (r):</label>
                <input
                  type="number"
                  min="8"
                  max="256"
                  value={loraRank}
                  onChange={(e) => setLoraRank(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">LoRA Alpha (α):</label>
                <input
                  type="number"
                  min="16"
                  max="512"
                  value={loraAlpha}
                  onChange={(e) => setLoraAlpha(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">FlashAttention:</label>
                <div className="p-1.5 text-emerald-400 font-bold bg-slate-900 border border-slate-800 rounded text-center">
                  v2 Active
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Grad Checkpoint:</label>
                <div className="p-1.5 text-emerald-400 font-bold bg-slate-900 border border-slate-800 rounded text-center">
                  Enabled
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-bold hover:from-amber-400 hover:to-orange-500 transition-all shadow-md shadow-amber-500/20"
            >
              Start Training on GPU Cluster
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
