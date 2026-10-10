import React, { useState } from 'react';
import {
  Terminal,
  FolderTree,
  FileCode,
  Copy,
  CheckCircle2,
  ExternalLink,
  Layers,
  Cpu,
  Server,
  Database,
  Flame,
} from 'lucide-react';
import { CODE_TEMPLATES } from '../../constants/codeTemplates';

export const ArchitectureCliView: React.FC = () => {
  const [activeCodeTab, setActiveCodeTab] = useState<string>('train_sft');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [cliInput, setCliInput] = useState<string>('gemmaforge train --model google/gemma-2-9b-it --method qlora --epochs 3');
  const [cliOutput, setCliOutput] = useState<string>(
    `[GemmaForge CLI v1.4.0]
✔ Hugging Face Token verified: access granted to google/gemma-2-9b-it
✔ Initializing 4-bit NF4 BitsAndBytes configuration
✔ Setting up PEFT LoRA adapter: r=64, alpha=128, target_modules=['q_proj','v_proj',...]
🚀 Distributed worker spawned on 2x H100 GPUs (Process Group 0x88f2).
Loss tracking initialized on MLflow & GemmaForge Web UI at http://0.0.0.0:3000.`
  );

  const codeFiles: Record<string, { label: string; code: string; lang: string }> = {
    train_sft: { label: 'train_sft_qlora.py', code: CODE_TEMPLATES.TRAIN_SFT_QLORA, lang: 'python' },
    train_dpo: { label: 'train_dpo.py', code: CODE_TEMPLATES.TRAIN_DPO, lang: 'python' },
    autotune: { label: 'autotune_optuna.py', code: CODE_TEMPLATES.AUTOTUNE_OPTUNA, lang: 'python' },
    export_gguf: { label: 'export_and_quantize.py', code: CODE_TEMPLATES.EXPORT_GGUF, lang: 'python' },
    serve_vllm: { label: 'serve_vllm.sh', code: CODE_TEMPLATES.SERVE_VLLM, lang: 'bash' },
    cli_tool: { label: 'gemmaforge_cli.py', code: CODE_TEMPLATES.CLI_TOOL, lang: 'python' },
    docker_compose: { label: 'docker-compose.yml', code: CODE_TEMPLATES.DOCKER_COMPOSE, lang: 'yaml' },
  };

  const handleCopyCode = (key: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRunCli = (e: React.FormEvent) => {
    e.preventDefault();
    if (cliInput.includes('train')) {
      setCliOutput(
        `[GemmaForge CLI] Commencing distributed fine-tuning job...\n` +
        `Allocated: 2x H100 GPUs with PyTorch FSDP + FlashAttention-2.\n` +
        `Checkpoint directory: ./outputs/gemma-forge-checkpoint\n` +
        `Follow progress in the Training Ground UI or with: gemmaforge status`
      );
    } else if (cliInput.includes('tune')) {
      setCliOutput(
        `[GemmaForge CLI] Starting Optuna study 'gemmaforge-hyperband-sweep'...\n` +
        `Parallel trials: 4 | Pruner: ASHA | Sampler: TPE\n` +
        `Tracking live metrics on GemmaForge Auto-Tuning dashboard.`
      );
    } else if (cliInput.includes('eval')) {
      setCliOutput(
        `[GemmaForge CLI] Running lm-evaluation-harness benchmarks on ./outputs/final...\n` +
        `Tasks: GSM8K (8-shot CoT), MMLU (5-shot), HumanEval (pass@1)\n` +
        `All metrics logged to MLflow.`
      );
    } else if (cliInput.includes('export')) {
      setCliOutput(
        `[GemmaForge CLI] Merging LoRA adapter and exporting to GGUF Q4_K_M...\n` +
        `Output: ./exports/gemma-2-9b-Q4_K_M.gguf (5.4 GB)\n` +
        `Ready for llama.cpp / Ollama deployment.`
      );
    } else {
      setCliOutput(`[GemmaForge CLI] Executed: ${cliInput}\nCommand completed successfully with returncode 0.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/20 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
              Architecture & Source Code
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">Production-Grade Microservices & CLI Reference</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">
            GemmaForge Platform Blueprint & Codebase
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Examine the cloud-native architecture diagram, full directory tree, reproducible Docker Compose
            recipes, and copy production Python scripts directly into your cluster environment.
          </p>
        </div>
      </div>

      {/* High Level Architecture Visual Diagram */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-mono text-xs">
          <span className="font-bold text-slate-200">High-Level MLOps System Topology</span>
          <span className="text-slate-500 text-[11px]">Microservices · GPU Scheduling · Storage</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono text-xs">
          {/* Layer 1: Ingestion & Control */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs pb-1 border-b border-slate-900">
              <Terminal className="w-4 h-4" />
              <span>1. Clients & Control</span>
            </div>
            <ul className="text-[11px] text-slate-400 space-y-1">
              <li>• GemmaForge Web UI (React/Vite)</li>
              <li>• CLI Tool (<code className="text-slate-300">gemmaforge</code>)</li>
              <li>• FastAPI Gateway (OpenAPI)</li>
              <li>• RBAC & API Key Auth</li>
            </ul>
          </div>

          {/* Layer 2: Pipeline Orchestration */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs pb-1 border-b border-slate-900">
              <Layers className="w-4 h-4" />
              <span>2. Orchestration</span>
            </div>
            <ul className="text-[11px] text-slate-400 space-y-1">
              <li>• Celery Distributed Workers</li>
              <li>• Redis Job Queue & Broker</li>
              <li>• Ray Cluster / Slurm Autoscaler</li>
              <li>• Optuna Bayesian TPESampler</li>
            </ul>
          </div>

          {/* Layer 3: GPU Training Ground */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs pb-1 border-b border-slate-900">
              <Flame className="w-4 h-4" />
              <span>3. Training Ground</span>
            </div>
            <ul className="text-[11px] text-slate-400 space-y-1">
              <li>• PyTorch 2.4 + FSDP ZeRO-3</li>
              <li>• TRL SFTTrainer & DPOTrainer</li>
              <li>• PEFT QLoRA / DoRA (NF4)</li>
              <li>• FlashAttention-2 + Gradient Ckpt</li>
            </ul>
          </div>

          {/* Layer 4: Registry & Inference */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs pb-1 border-b border-slate-900">
              <Server className="w-4 h-4" />
              <span>4. Serving & Storage</span>
            </div>
            <ul className="text-[11px] text-slate-400 space-y-1">
              <li>• vLLM PagedAttention Server</li>
              <li>• Ollama / llama.cpp GGUF Export</li>
              <li>• Hugging Face Hub / S3 Sync</li>
              <li>• Prometheus / Loki Telemetry</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Directory Structure & Interactive Code Browser */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Directory Tree (4 cols) */}
        <div className="lg:col-span-4 border border-slate-800 bg-slate-900/60 rounded-xl p-4 font-mono text-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-slate-300 font-bold">
            <FolderTree className="w-4 h-4 text-amber-400" />
            <span>Repository Directory Structure</span>
          </div>

          <pre className="text-[11px] text-slate-400 overflow-x-auto leading-relaxed">
{`gemmaforge/
├── configs/
│   ├── fsdp_config.yaml
│   ├── deepspeed_zero3.json
│   └── optuna_search_space.yaml
├── gemmaforge/
│   ├── api/
│   │   ├── main.py (FastAPI)
│   │   └── routes/
│   ├── core/
│   │   ├── model_hub.py
│   │   ├── data_forge.py
│   │   ├── trainer_sft.py
│   │   ├── trainer_dpo.py
│   │   └── autotune.py
│   ├── evaluation/
│   │   ├── harness.py
│   │   └── llm_judge.py
│   └── serving/
│       ├── vllm_server.py
│       └── quantizer.py
├── scripts/
│   ├── train_sft_qlora.py
│   ├── train_dpo.py
│   ├── autotune_optuna.py
│   └── export_and_quantize.py
├── tests/
│   ├── test_models.py
│   └── test_cleaner.py
├── docker-compose.yml
├── Dockerfile
└── pyproject.toml`}
          </pre>
        </div>

        {/* Right: Code Viewer (8 cols) */}
        <div className="lg:col-span-8 border border-slate-800 bg-slate-900/60 rounded-xl overflow-hidden flex flex-col font-mono text-xs">
          {/* File Tabs */}
          <div className="bg-slate-950 p-2 border-b border-slate-800 flex items-center justify-between overflow-x-auto gap-2">
            <div className="flex items-center gap-1.5">
              {Object.entries(codeFiles).map(([key, item]) => (
                <button
                  key={key}
                  onClick={() => setActiveCodeTab(key)}
                  className={`px-2.5 py-1 text-[11px] rounded transition-colors truncate ${
                    activeCodeTab === key
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleCopyCode(activeCodeTab, codeFiles[activeCodeTab].code)}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 transition-colors shrink-0"
            >
              {copiedKey === activeCodeTab ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedKey === activeCodeTab ? 'Copied' : 'Copy File'}</span>
            </button>
          </div>

          {/* Code Viewer Body */}
          <pre className="p-4 bg-slate-950/80 text-slate-300 text-[11px] overflow-x-auto h-96 leading-relaxed">
            <code>{codeFiles[activeCodeTab].code}</code>
          </pre>
        </div>
      </div>

      {/* Interactive CLI Terminal Simulation */}
      <div className="border border-slate-800 bg-slate-950 rounded-xl p-4 font-mono text-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400 text-[11px]">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span className="text-slate-200 font-bold">Interactive gemmaforge CLI Shell</span>
          </div>
          <span>Python 3.11 / Typer & Rich Console</span>
        </div>

        <form onSubmit={handleRunCli} className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold">$</span>
          <input
            type="text"
            value={cliInput}
            onChange={(e) => setCliInput(e.target.value)}
            className="flex-1 bg-transparent text-slate-100 focus:outline-none text-xs"
          />
          <button
            type="submit"
            className="px-3 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-[11px]"
          >
            Run Command
          </button>
        </form>

        <pre className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">
          {cliOutput}
        </pre>
      </div>
    </div>
  );
};
