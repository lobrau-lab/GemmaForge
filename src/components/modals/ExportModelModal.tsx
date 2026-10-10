import React, { useState } from 'react';
import {
  X,
  Package,
  Layers,
  Share2,
  HardDrive,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { ModelCheckpoint } from '../../types';

interface ExportModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkpoint: ModelCheckpoint | null;
}

export const ExportModelModal: React.FC<ExportModelModalProps> = ({
  isOpen,
  onClose,
  checkpoint,
}) => {
  const [format, setFormat] = useState<string>('GGUF Q4_K_M');
  const [targetDestination, setTargetDestination] = useState<'hf' | 's3' | 'local'>('hf');
  const [hfRepoName, setHfRepoName] = useState<string>('gemma-2-9b-math-forge');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportComplete, setExportComplete] = useState<boolean>(false);

  if (!isOpen || !checkpoint) return null;

  const handleExport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsExporting(true);
    setExportComplete(false);

    setTimeout(() => {
      setIsExporting(false);
      setExportComplete(true);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">Export & Quantize Model Checkpoint</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleExport} className="p-5 space-y-4">
          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-500 text-[10px] block">Selected Checkpoint:</span>
            <div className="font-bold text-slate-200 text-sm">{checkpoint.name}</div>
            <div className="text-[11px] text-slate-400">
              Base: {checkpoint.baseModel} · GSM8K: {checkpoint.gsm8k}% · MMLU: {checkpoint.evalMmlu}%
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Target Quantization Format:</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500/50"
            >
              <option value="GGUF Q4_K_M">GGUF Q4_K_M (Ollama & llama.cpp Recommended - 5.4 GB)</option>
              <option value="GGUF Q8_0">GGUF Q8_0 (Near-lossless 8-bit Quantization - 9.8 GB)</option>
              <option value="AutoAWQ 4-bit">AutoAWQ 4-bit GEMM (vLLM High-Throughput - 5.8 GB)</option>
              <option value="Merged BF16">Merged Full Precision BF16 (Safetensors - 18.5 GB)</option>
              <option value="AutoGPTQ 4-bit">AutoGPTQ 4-bit (ExLlamaV2 compatible - 5.6 GB)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Export Destination:</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'hf', label: 'Hugging Face Hub' },
                { id: 's3', label: 'MinIO / S3 Bucket' },
                { id: 'local', label: 'Local Volume' },
              ].map((dest) => (
                <button
                  key={dest.id}
                  type="button"
                  onClick={() => setTargetDestination(dest.id as any)}
                  className={`py-2 rounded border text-center transition-colors ${
                    targetDestination === dest.id
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {dest.label}
                </button>
              ))}
            </div>
          </div>

          {targetDestination === 'hf' && (
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Hugging Face Repository Name:</label>
              <input
                type="text"
                value={hfRepoName}
                onChange={(e) => setHfRepoName(e.target.value)}
                placeholder="your-org/gemma-tuned-model"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500/50"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                Auto-generates standardized YAML Model Card with MMLU and GSM8K benchmark badges.
              </span>
            </div>
          )}

          {exportComplete ? (
            <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-lg text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Successfully exported to {format}!</span>
              </span>
              <a
                href={`https://huggingface.co/GemmaForge/${hfRepoName}`}
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                <span>View on HF</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <button
              type="submit"
              disabled={isExporting}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-bold hover:from-amber-400 hover:to-orange-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
              <span>{isExporting ? 'Quantizing & Exporting Checkpoint...' : 'Execute Export Pipeline'}</span>
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
