import React, { useState } from 'react';
import {
  Server,
  Zap,
  Activity,
  Cpu,
  Terminal,
  Copy,
  CheckCircle2,
  ExternalLink,
  Plus,
  Play,
  RotateCw,
} from 'lucide-react';
import { ServingDeployment } from '../../types';

interface DeploymentServingViewProps {
  deployments: ServingDeployment[];
  onNewDeploymentClick: () => void;
}

export const DeploymentServingView: React.FC<DeploymentServingViewProps> = ({
  deployments,
  onNewDeploymentClick,
}) => {
  const [selectedDeployment, setSelectedDeployment] = useState<ServingDeployment>(deployments[0]);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [selectedSnippetTab, setSelectedSnippetTab] = useState<'curl' | 'python' | 'node'>('curl');

  const curlSnippet = `curl http://serving.cluster.local:8000/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer gemmaforge-secret-key-prod" \\
  -d '{
    "model": "${selectedDeployment.name}",
    "messages": [
      {"role": "user", "content": "Calculate the eigenvalue decomposition of a 2x2 symmetric matrix."}
    ],
    "temperature": 0.2,
    "max_tokens": 512
  }'`;

  const pythonSnippet = `from openai import OpenAI

client = OpenAI(
    base_url="http://serving.cluster.local:8000/v1",
    api_key="gemmaforge-secret-key-prod",
)

response = client.chat.completions.create(
    model="${selectedDeployment.name}",
    messages=[
        {"role": "user", "content": "Explain sliding-window attention in Gemma 2."}
    ],
    temperature=0.3,
    max_tokens=512,
)

print(response.choices[0].message.content)`;

  const nodeSnippet = `import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "http://serving.cluster.local:8000/v1",
  apiKey: "gemmaforge-secret-key-prod",
});

const completion = await openai.chat.completions.create({
  model: "${selectedDeployment.name}",
  messages: [{ role: "user", content: "Explain KV cache optimization." }],
});

console.log(completion.choices[0].message.content);`;

  const activeSnippet =
    selectedSnippetTab === 'curl'
      ? curlSnippet
      : selectedSnippetTab === 'python'
      ? pythonSnippet
      : nodeSnippet;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/20 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
              Serving & Deployment Ground
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">vLLM PagedAttention · TGI · Ollama · OpenAI-Compatible API</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">
            High-Throughput Production Inference Endpoints
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Serve fine-tuned Gemma models with continuous batching, chunked prefill, and tensor parallelism.
            Monitor KV-cache occupancy, token generation throughput, and P99 latency SLA in real time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onNewDeploymentClick}
            className="text-xs font-mono font-semibold px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 hover:from-amber-400 hover:to-orange-500 shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Deploy Endpoint</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Serving Pods (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Active Serving Instances ({deployments.length})
            </span>
          </div>

          <div className="space-y-2.5">
            {deployments.map((dep) => {
              const isSelected = selectedDeployment.id === dep.id;
              return (
                <div
                  key={dep.id}
                  onClick={() => setSelectedDeployment(dep)}
                  className={`border rounded-xl p-4 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-500/50 bg-slate-900/90 shadow-md shadow-amber-500/5 ring-1 ring-amber-500/30'
                      : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-100">{dep.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-300">
                          {dep.engine}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-amber-400/90 mt-1 block">
                        {dep.modelName}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>{dep.status}</span>
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/70 grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-400">
                    <div>
                      <span className="text-slate-500 block">P99 Latency</span>
                      <span className="text-slate-200 font-bold">{dep.p99LatencyMs} ms</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Throughput</span>
                      <span className="text-amber-300 font-bold">{dep.tokensPerSecond} tok/s</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">KV Cache</span>
                      <span className="text-emerald-400 font-bold">{dep.kvCacheUsagePercent}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Endpoint Telemetry & API Consumer Snippets (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5 space-y-5 font-mono text-xs">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-100">{selectedDeployment.name}</h3>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Endpoint: <code className="text-amber-300">{selectedDeployment.endpointUrl}</code>
                </span>
              </div>
              <div className="text-right text-[11px] text-slate-400">
                <span>{selectedDeployment.gpuCount}x {selectedDeployment.gpuType}</span>
              </div>
            </div>

            {/* Realtime Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Throughput</span>
                <span className="text-base font-bold text-amber-400 mt-0.5 block">
                  {selectedDeployment.tokensPerSecond}
                </span>
                <span className="text-[10px] text-slate-400">tokens / sec</span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">P50 / P99 Latency</span>
                <span className="text-base font-bold text-slate-100 mt-0.5 block">
                  {selectedDeployment.p50LatencyMs} / {selectedDeployment.p99LatencyMs}
                </span>
                <span className="text-[10px] text-slate-400">milliseconds</span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">KV-Cache Usage</span>
                <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                  {selectedDeployment.kvCacheUsagePercent}%
                </span>
                <span className="text-[10px] text-slate-400">PagedAttention</span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Active In-Flight</span>
                <span className="text-base font-bold text-blue-400 mt-0.5 block">
                  {selectedDeployment.activeRequests} req
                </span>
                <span className="text-[10px] text-slate-400">Continuous batching</span>
              </div>
            </div>

            {/* Code Snippets for Developers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold text-slate-300">OpenAI-Compatible Client Snippet</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 p-0.5 bg-slate-950 border border-slate-800 rounded">
                    {(['curl', 'python', 'node'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setSelectedSnippetTab(tab)}
                        className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                          selectedSnippetTab === tab
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tab.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
                <code>{activeSnippet}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
