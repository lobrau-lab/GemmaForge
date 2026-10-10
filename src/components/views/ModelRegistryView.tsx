import React, { useState } from 'react';
import {
  Layers,
  Download,
  Share2,
  HardDrive,
  CheckCircle2,
  Cpu,
  FileCode,
  ExternalLink,
  Sparkles,
  RefreshCw,
  GitMerge,
  Package,
} from 'lucide-react';
import { ModelCheckpoint } from '../../types';

interface ModelRegistryViewProps {
  checkpoints: ModelCheckpoint[];
  onOpenExportModal: (checkpoint: ModelCheckpoint) => void;
}

export const ModelRegistryView: React.FC<ModelRegistryViewProps> = ({
  checkpoints,
  onOpenExportModal,
}) => {
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<ModelCheckpoint>(checkpoints[0]);
  const [isMerging, setIsMerging] = useState<boolean>(false);
  const [mergeStatus, setMergeStatus] = useState<string | null>(null);

  const handleSimulateMerge = () => {
    setIsMerging(true);
    setMergeStatus('Loading base Gemma backbone & LoRA weights...');
    setTimeout(() => {
      setMergeStatus('Executing peft.merge_and_unload() vector summation in BF16...');
      setTimeout(() => {
        setMergeStatus('Merged weights serialized to safetensors (18.5 GB).');
        setIsMerging(false);
      }, 1500);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/20 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
              Model Registry & Artifacts
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">MLflow Artifact Store · GGUF Quantizer · HF Hub</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">
            Checkpoint Lineage, LoRA Merging & Edge Quantization
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Manage training runs, checkpoints, and adapter lineage. Merge LoRA weights into pristine BF16
            safetensors, quantize to GGUF Q4_K_M or AWQ, and push model cards directly to Hugging Face Hub.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onOpenExportModal(selectedCheckpoint)}
            className="text-xs font-mono font-semibold px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 hover:from-amber-400 hover:to-orange-500 shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Package className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Export & Quantize Wizard</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Checkpoints Table (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Model Checkpoints & Artifacts ({checkpoints.length})
            </span>
          </div>

          <div className="space-y-2.5">
            {checkpoints.map((chk) => {
              const isSelected = selectedCheckpoint.id === chk.id;
              return (
                <div
                  key={chk.id}
                  onClick={() => setSelectedCheckpoint(chk)}
                  className={`border rounded-xl p-4 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-500/50 bg-slate-900/90 shadow-md shadow-amber-500/5 ring-1 ring-amber-500/30'
                      : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-100">{chk.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-300">
                          {chk.adapterFormat}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 mt-1 block">
                        Base: {chk.baseModel} · {chk.fileSizeGB} GB
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-amber-400">
                        GSM8K: {chk.gsm8k}%
                      </span>
                      <div className="text-[10px] font-mono text-slate-500">MMLU: {chk.evalMmlu}%</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/70 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">Quantized:</span>
                      {chk.quantizedVariants.map((v, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                          {v}
                        </span>
                      ))}
                    </div>

                    {chk.hfExported && (
                      <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Synced to HF</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Checkpoint Inspector & Merge Tool (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase text-slate-500">Selected Artifact</span>
                <h3 className="text-sm font-bold text-slate-100 mt-0.5">{selectedCheckpoint.name}</h3>
              </div>
              <span className="text-amber-400 text-xs font-bold">{selectedCheckpoint.fileSizeGB} GB</span>
            </div>

            {/* Merge Adapter Tool */}
            <div className="border border-slate-800 bg-slate-950/60 rounded-lg p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <GitMerge className="w-4 h-4 text-amber-400" />
                  <span>LoRA Adapter Unload & Merge</span>
                </span>
                <span className="text-[10px] text-emerald-400">
                  {selectedCheckpoint.merged ? 'Already Merged' : 'Adapter Only'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Fuses low-rank matrix deltas $\Delta W = B \cdot A$ directly into the Gemma base weights.
                Produces self-contained standalone weights suitable for vLLM or GGUF quantization.
              </p>

              <button
                onClick={handleSimulateMerge}
                disabled={isMerging || selectedCheckpoint.merged}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 font-semibold transition-all disabled:opacity-50"
              >
                {isMerging ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <GitMerge className="w-3.5 h-3.5" />}
                <span>{selectedCheckpoint.merged ? 'Model Weights Merged' : 'Execute peft.merge_and_unload()'}</span>
              </button>

              {mergeStatus && (
                <div className="text-[10px] p-2 bg-slate-900 rounded border border-slate-800 text-slate-300">
                  {mergeStatus}
                </div>
              )}
            </div>

            {/* Quantization Targets */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase text-slate-400 block font-bold">
                Supported Quantization Targets
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-slate-950/80 rounded border border-slate-800">
                  <span className="text-amber-400 font-bold block">GGUF Q4_K_M</span>
                  <span className="text-[10px] text-slate-400">5.4 GB · Ollama / llama.cpp</span>
                </div>
                <div className="p-2.5 bg-slate-950/80 rounded border border-slate-800">
                  <span className="text-amber-400 font-bold block">AutoAWQ 4-bit</span>
                  <span className="text-[10px] text-slate-400">5.8 GB · vLLM / TGI GEMM</span>
                </div>
                <div className="p-2.5 bg-slate-950/80 rounded border border-slate-800">
                  <span className="text-amber-400 font-bold block">GGUF Q8_0</span>
                  <span className="text-[10px] text-slate-400">9.8 GB · Lossless edge</span>
                </div>
                <div className="p-2.5 bg-slate-950/80 rounded border border-slate-800">
                  <span className="text-amber-400 font-bold block">ONNX Runtime</span>
                  <span className="text-[10px] text-slate-400">DirectML / TensorRT</span>
                </div>
              </div>
            </div>

            {/* Hugging Face Hub link */}
            {selectedCheckpoint.hfRepoUrl && (
              <a
                href={selectedCheckpoint.hfRepoUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 transition-all text-xs"
              >
                <span>View on Hugging Face Hub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
