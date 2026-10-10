import React, { useState } from 'react';
import {
  Boxes,
  Cpu,
  HardDrive,
  Download,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
  Filter,
  Calculator,
  Layers,
  Sparkles,
} from 'lucide-react';
import { GEMMA_MODELS } from '../../constants/gemmaModels';
import { GemmaModelInfo } from '../../types';

interface ModelHubViewProps {
  onSelectModelForTraining: (model: GemmaModelInfo) => void;
  onOpenHfTokenModal: () => void;
  hfTokenVerified: boolean;
}

export const ModelHubView: React.FC<ModelHubViewProps> = ({
  onSelectModelForTraining,
  onOpenHfTokenModal,
  hfTokenVerified,
}) => {
  const [selectedFamily, setSelectedFamily] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<GemmaModelInfo>(GEMMA_MODELS[5]); // Gemma 2 9B default
  const [vramPrecision, setVramPrecision] = useState<'bf16' | 'int8' | 'qlora_4bit'>('qlora_4bit');
  const [calcSeqLen, setCalcSeqLen] = useState<number>(4096);
  const [calcBatchSize, setCalcBatchSize] = useState<number>(4);

  const filteredModels = GEMMA_MODELS.filter((m) => {
    const matchesFamily = selectedFamily === 'All' || m.family === selectedFamily;
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFamily && matchesSearch;
  });

  // Calculate detailed VRAM requirements
  const calcVramBreakdown = () => {
    const paramsB = selectedModel.paramCountNum;
    let weightGB = 0;
    let optimGB = 0;
    let gradGB = 0;

    if (vramPrecision === 'bf16') {
      weightGB = paramsB * 2;
      optimGB = paramsB * 16; // AdamW FP32 states
      gradGB = paramsB * 2;
    } else if (vramPrecision === 'int8') {
      weightGB = paramsB * 1;
      optimGB = paramsB * 4; // 8-bit optimizer
      gradGB = paramsB * 2;
    } else {
      // QLoRA 4-bit
      weightGB = paramsB * 0.55; // 4-bit NF4
      optimGB = (paramsB * 0.05) * 4; // only LoRA adapter states in 8-bit
      gradGB = paramsB * 0.1;
    }

    // KV Cache estimation per batch
    const kvCacheGB = (calcBatchSize * calcSeqLen * selectedModel.hiddenDim * 2 * 2) / (1024 * 1024 * 1024);
    const activationsGB = (calcBatchSize * calcSeqLen * selectedModel.hiddenDim * 0.0000008);
    const totalGB = Math.max(weightGB + optimGB + gradGB + kvCacheGB + activationsGB, selectedModel.recommendedMinVramGB[vramPrecision]);

    return {
      weights: weightGB.toFixed(1),
      optimizer: optimGB.toFixed(1),
      kvCache: (kvCacheGB + activationsGB).toFixed(1),
      total: totalGB.toFixed(1),
    };
  };

  const vramEstimates = calcVramBreakdown();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/20 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
              Foundation Weights
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">Gemma 1, Gemma 2 & Gemma 3 Architecture Suite</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">
            Gemma Model Hub & Architectural Inspector
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Directly pull, verify, and cache official Google Gemma checkpoints. Inspect parameter geometries,
            sliding window attention receptive fields, and compute precise VRAM envelopes for distributed training.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenHfTokenModal}
            className={`text-xs px-3.5 py-2 rounded-lg border font-mono flex items-center gap-2 transition-all ${
              hfTokenVerified
                ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
                : 'border-amber-500/40 bg-amber-950/30 text-amber-300 hover:bg-amber-950/50'
            }`}
          >
            {hfTokenVerified ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400" />
            )}
            <span>{hfTokenVerified ? 'HF License Token Active' : 'Configure HF Token'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Model Selector & Deep Architecture Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Models List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Family Buttons */}
            <div className="flex items-center gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg">
              {['All', 'Gemma 3', 'Gemma 2', 'Gemma 1'].map((fam) => (
                <button
                  key={fam}
                  onClick={() => setSelectedFamily(fam)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    selectedFamily === fam
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {fam}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Gemma variants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-56 bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 font-mono"
              />
            </div>
          </div>

          {/* Model Cards List */}
          <div className="space-y-3">
            {filteredModels.map((model) => {
              const isSelected = selectedModel.id === model.id;
              return (
                <div
                  key={model.id}
                  onClick={() => setSelectedModel(model)}
                  className={`border rounded-xl p-4 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-500/50 bg-slate-900/90 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30'
                      : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-100">{model.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-300">
                          {model.family}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400">
                          {model.cachedLocally ? 'Cached on Cluster' : 'Cloud Remote'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{model.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-amber-400">{model.parameters}</span>
                      <div className="text-[10px] font-mono text-slate-500">{model.diskSizeGB} GB weights</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                    <div className="flex items-center gap-3">
                      <span>Ctx: <strong className="text-slate-200">{model.contextWindow.toLocaleString()}</strong></span>
                      {model.slidingWindow && (
                        <span>SWA: <strong className="text-slate-200">{model.slidingWindow}</strong></span>
                      )}
                      <span>Vocab: <strong className="text-slate-200">256K</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-amber-300">Min VRAM: {model.recommendedMinVramGB.qlora_4bit}GB (QLoRA)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep Inspector & VRAM Calculator (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                  Model Spec Sheet
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-0.5">{selectedModel.name}</h3>
                <span className="text-xs font-mono text-amber-400/90">{selectedModel.hfRepoId}</span>
              </div>
              <button
                onClick={() => onSelectModelForTraining(selectedModel)}
                className="text-xs font-mono font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 hover:from-amber-400 hover:to-orange-500 shadow-md shadow-amber-500/20 transition-all"
              >
                Tune This Model
              </button>
            </div>

            {/* Architecture Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
                <span className="text-slate-500 text-[10px] block">Hidden Dimension</span>
                <span className="font-semibold text-slate-200 text-sm">{selectedModel.hiddenDim}</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
                <span className="text-slate-500 text-[10px] block">Attention Heads</span>
                <span className="font-semibold text-slate-200 text-sm">
                  {selectedModel.numHeads} Q / {selectedModel.numKvHeads} KV (GQA)
                </span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
                <span className="text-slate-500 text-[10px] block">Context Limit</span>
                <span className="font-semibold text-slate-200 text-sm">{selectedModel.contextWindow.toLocaleString()} tokens</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
                <span className="text-slate-500 text-[10px] block">Vocabulary</span>
                <span className="font-semibold text-slate-200 text-sm">256,000 (SentencePiece)</span>
              </div>
            </div>

            {/* Interactive VRAM Estimator Box */}
            <div className="border border-amber-500/30 bg-amber-950/10 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <Calculator className="w-3.5 h-3.5 text-amber-400" />
                  <span>Interactive VRAM Calculator</span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400">
                  ~{vramEstimates.total} GB Required
                </span>
              </div>

              {/* Precision Picker */}
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">
                  Training Precision & Optimization
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'qlora_4bit', label: 'QLoRA 4-bit' },
                    { id: 'int8', label: 'LoRA 8-bit' },
                    { id: 'bf16', label: 'Full BF16 FSDP' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setVramPrecision(opt.id as any)}
                      className={`py-1 text-[11px] font-mono rounded border transition-colors ${
                        vramPrecision === opt.id
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders for Sequence Length and Batch Size */}
              <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Seq Length:</span>
                    <span className="text-slate-200 font-bold">{calcSeqLen}</span>
                  </div>
                  <input
                    type="range"
                    min="1024"
                    max={selectedModel.contextWindow > 32768 ? 32768 : selectedModel.contextWindow}
                    step="1024"
                    value={calcSeqLen}
                    onChange={(e) => setCalcSeqLen(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Batch Size:</span>
                    <span className="text-slate-200 font-bold">{calcBatchSize}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="16"
                    step="1"
                    value={calcBatchSize}
                    onChange={(e) => setCalcBatchSize(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Memory Envelope Breakdown */}
              <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono space-y-1 text-slate-400">
                <div className="flex justify-between">
                  <span>Model Weights ({vramPrecision}):</span>
                  <span className="text-slate-200">{vramEstimates.weights} GB</span>
                </div>
                <div className="flex justify-between">
                  <span>Optimizer States & Gradients:</span>
                  <span className="text-slate-200">{vramEstimates.optimizer} GB</span>
                </div>
                <div className="flex justify-between">
                  <span>KV Cache & Activations ({calcSeqLen} tok):</span>
                  <span className="text-slate-200">{vramEstimates.kvCache} GB</span>
                </div>
              </div>
            </div>

            {/* Hugging Face Links */}
            <div className="pt-2 text-xs flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-mono">Gated License: Gemma Terms</span>
              <a
                href={`https://huggingface.co/${selectedModel.hfRepoId}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-mono text-[11px]"
              >
                <span>Hugging Face Repo</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
