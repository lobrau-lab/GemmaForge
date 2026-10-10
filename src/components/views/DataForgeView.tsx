import React, { useState } from 'react';
import {
  Database,
  Plus,
  ShieldCheck,
  Sparkles,
  FileText,
  FileCode,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { DatasetItem } from '../../types';
import { apiService, CleanDataResponse } from '../../services/api';

interface DataForgeViewProps {
  datasets: DatasetItem[];
  onOpenSyntheticModal: () => void;
  onOpenUploadModal: () => void;
}

export const DataForgeView: React.FC<DataForgeViewProps> = ({
  datasets,
  onOpenSyntheticModal,
  onOpenUploadModal,
}) => {
  const [selectedDataset, setSelectedDataset] = useState<DatasetItem>(datasets[0]);
  const [activeTab, setActiveTab] = useState<'preview' | 'pii' | 'tokenization'>('preview');

  // PII Redactor Interactive State
  const [piiInputText, setPiiInputText] = useState<string>(
    `Hello, please contact user john.doe@cybercorp.io or call (555) 234-5678 regarding SSN 000-12-3456.
Our primary production API key is sk-live98748923487239482394823 and database is located at 192.168.1.105.`
  );
  const [piiResult, setPiiResult] = useState<CleanDataResponse | null>(null);
  const [isCleaning, setIsCleaning] = useState<boolean>(false);

  // Gemma Tokenizer formatting preview
  const formatSampleForGemma = (sample: any) => {
    if (sample.instruction && sample.output) {
      return `<start_of_turn>user\n${sample.instruction}${sample.input ? `\n\nInput: ${sample.input}` : ''}<end_of_turn>\n<start_of_turn>model\n${sample.output}<end_of_turn>`;
    }
    if (sample.prompt && sample.chosen) {
      return `[DPO Chosen Candidate]\n<start_of_turn>user\n${sample.prompt}<end_of_turn>\n<start_of_turn>model\n${sample.chosen}<end_of_turn>\n\n[DPO Rejected Candidate]\n<start_of_turn>model\n${sample.rejected}<end_of_turn>`;
    }
    return JSON.stringify(sample, null, 2);
  };

  const handleRunPiiSanitizer = async () => {
    setIsCleaning(true);
    try {
      const res = await apiService.cleanData(piiInputText, {
        redactEmails: true,
        redactPhones: true,
        redactApiKeys: true,
        redactSSN: true,
        redactIPs: true,
      });
      setPiiResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/20 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
              Data Forge & Pipeline
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">LakeFS / DVC Dataset Lineage</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">
            Dataset Ingestion, PII Redaction & Distillation Ground
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Ingest structured JSONL, CSV, Parquet, or Hugging Face datasets. Automatically sanitize PII,
            pack sequences up to 64K tokens, and synthesize high-grade instruction pairs using Gemini teacher models.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenSyntheticModal}
            className="text-xs font-mono font-semibold px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 hover:from-amber-400 hover:to-orange-500 shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Teacher Model Distill</span>
          </button>
          <button
            onClick={onOpenUploadModal}
            className="text-xs font-mono px-3.5 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ingest Dataset</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Datasets List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Active Datasets ({datasets.length})
            </span>
            <span className="text-[11px] font-mono text-emerald-400">All Tokenized & Validated</span>
          </div>

          <div className="space-y-2.5">
            {datasets.map((ds) => {
              const isSelected = selectedDataset.id === ds.id;
              return (
                <div
                  key={ds.id}
                  onClick={() => setSelectedDataset(ds)}
                  className={`border rounded-xl p-4 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-500/50 bg-slate-900/90 shadow-md shadow-amber-500/5 ring-1 ring-amber-500/30'
                      : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-100">{ds.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-300">
                          {ds.format}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{ds.description}</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300">
                      {ds.taskType}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/70 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <div>
                      <strong className="text-slate-200">{ds.samplesCount.toLocaleString()}</strong> samples
                      <span className="mx-1.5 text-slate-700">·</span>
                      <strong className="text-slate-200">{(ds.tokenCount / 1000000).toFixed(1)}M</strong> tokens
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span className="text-[10px]">HIPAA/PII Clean</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Dataset Inspector / Tools (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5 space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-100">{selectedDataset.name}</h3>
                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>Format: {selectedDataset.format}</span>
                  <span>·</span>
                  <span>Size: {selectedDataset.sizeMB} MB</span>
                  <span>·</span>
                  <span>Packing: {selectedDataset.packed ? 'Enabled (4096 tok)' : 'Disabled'}</span>
                </div>
              </div>

              {/* Segmented Controls for Sub-views */}
              <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
                {[
                  { id: 'preview', label: 'Sample Preview' },
                  { id: 'pii', label: 'PII Redactor' },
                  { id: 'tokenization', label: 'Gemma Tokens' },
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
            </div>

            {/* TAB 1: Preview Samples */}
            {activeTab === 'preview' && (
              <div className="space-y-3 font-mono text-xs">
                <span className="text-slate-400 text-[11px]">
                  Sample entries from dataset (Showing first {selectedDataset.previewSamples.length} rows):
                </span>
                {selectedDataset.previewSamples.map((sample, idx) => (
                  <div key={idx} className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-slate-500 text-[10px]">
                      <span>Row ID: {sample.id}</span>
                      <span>~{sample.tokens || 180} Gemma Tokens</span>
                    </div>
                    {sample.instruction && (
                      <div>
                        <span className="text-amber-400 font-semibold text-[11px] block">Instruction:</span>
                        <p className="text-slate-200 whitespace-pre-wrap">{sample.instruction}</p>
                      </div>
                    )}
                    {sample.output && (
                      <div className="pt-1.5 border-t border-slate-900">
                        <span className="text-emerald-400 font-semibold text-[11px] block">Expected Output:</span>
                        <div className="text-slate-300 bg-slate-900/50 p-2 rounded text-[11px] overflow-x-auto whitespace-pre-wrap">
                          {sample.output}
                        </div>
                      </div>
                    )}
                    {sample.prompt && (
                      <div>
                        <span className="text-amber-400 font-semibold text-[11px] block">Prompt:</span>
                        <p className="text-slate-200">{sample.prompt}</p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                          <div className="bg-emerald-950/30 border border-emerald-500/30 p-2 rounded text-emerald-200">
                            <strong>Chosen:</strong> {sample.chosen}
                          </div>
                          <div className="bg-red-950/20 border border-red-500/30 p-2 rounded text-red-200">
                            <strong>Rejected:</strong> {sample.rejected}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* TAB 2: PII Redactor Interactive Tool */}
            {activeTab === 'pii' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-400">
                  Automated HIPAA / GDPR PII scanner. Redacts email addresses, phone numbers, SSNs, IP addresses,
                  and leaked API credentials before passing data to GPU memory.
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Raw Dataset Sample (Editable):</label>
                  <textarea
                    rows={4}
                    value={piiInputText}
                    onChange={(e) => setPiiInputText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={handleRunPiiSanitizer}
                    disabled={isCleaning}
                    className="flex items-center gap-2 text-xs font-mono font-semibold px-4 py-2 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all disabled:opacity-50"
                  >
                    {isCleaning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>Run PII Sanitizer & Redaction</span>
                  </button>

                  {piiResult && (
                    <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        Redacted: {piiResult.stats.emails} emails, {piiResult.stats.phones} phones, {piiResult.stats.apiKeys} API keys
                      </span>
                    </div>
                  )}
                </div>

                {piiResult && (
                  <div className="mt-3 bg-slate-950 border border-emerald-500/30 rounded-lg p-3 font-mono text-xs text-slate-200 space-y-1">
                    <span className="text-[10px] uppercase text-emerald-400 font-bold block">Sanitized Output:</span>
                    <p className="whitespace-pre-wrap">{piiResult.cleanedText}</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Gemma Tokenization Inspector */}
            {activeTab === 'tokenization' && (
              <div className="space-y-3 font-mono text-xs">
                <div className="text-slate-400 text-xs">
                  Gemma models require strict turn delimiters: <code className="text-amber-300">&lt;start_of_turn&gt;user\n...&lt;end_of_turn&gt;\n&lt;start_of_turn&gt;model\n...&lt;end_of_turn&gt;</code>.
                  Below is the exact encoded prompt representation fed to the model forward pass:
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed text-[11px]">
                  {formatSampleForGemma(selectedDataset.previewSamples[0] || {})}
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-center justify-between text-[11px] text-slate-400">
                  <span>Vocabulary Size: <strong className="text-slate-200">256,000</strong></span>
                  <span>BOS Token: <strong className="text-amber-400">&lt;bos&gt; (ID 2)</strong></span>
                  <span>EOS Token: <strong className="text-amber-400">&lt;end_of_turn&gt; (ID 107)</strong></span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
