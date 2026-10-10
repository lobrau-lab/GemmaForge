import React, { useState } from 'react';
import {
  Gauge,
  Sparkles,
  Play,
  RotateCcw,
  Zap,
  CheckCircle2,
  TrendingDown,
  Layers,
  Sliders,
  Award,
  RefreshCw,
} from 'lucide-react';
import { AutoTuneTrial } from '../../types';
import { apiService, AdvisorResponse } from '../../services/api';

interface AutoTuningViewProps {
  trials: AutoTuneTrial[];
  onOpenAdvisorModal?: () => void;
}

export const AutoTuningView: React.FC<AutoTuningViewProps> = ({ trials }) => {
  const [selectedModelForAdvice, setSelectedModelForAdvice] = useState<string>('google/gemma-2-9b-it');
  const [hardwareTarget, setHardwareTarget] = useState<string>('2x NVIDIA H100 80GB SXM5');
  const [advisorResult, setAdvisorResult] = useState<AdvisorResponse | null>(null);
  const [isLoadingAdvisor, setIsLoadingAdvisor] = useState<boolean>(false);

  const bestTrial = trials.find((t) => t.trialId === 'trial-09') || trials[0];

  const handleFetchAdvisor = async () => {
    setIsLoadingAdvisor(true);
    try {
      const res = await apiService.getAdvisorRecipe({
        targetModel: selectedModelForAdvice,
        datasetSize: 14200,
        taskType: 'SFT + Math Reasoning',
        hardware: hardwareTarget,
        budgetHours: 3,
      });
      setAdvisorResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAdvisor(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/20 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
              Auto-Tuning Engine
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">Ray Tune & Optuna TPE · ASHA Pruner · Pareto Frontier</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">
            Bayesian Hyperparameter Search Ground
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Automatically search learning rate, LoRA rank $r$, $\alpha$, dropout, batch size, and scheduler.
            ASHA prunes underperforming trials early, saving up to 75% GPU hours while identifying the Pareto frontier.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleFetchAdvisor}
            disabled={isLoadingAdvisor}
            className="text-xs font-mono font-semibold px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 hover:from-amber-400 hover:to-orange-500 shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            {isLoadingAdvisor ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            <span>AI Hyperparameter Advisor</span>
          </button>
        </div>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <span className="text-slate-500 text-[10px] block">Best Trial</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-slate-100 font-bold text-sm">{bestTrial.trialId}</span>
          </div>
          <span className="text-[10px] text-emerald-400">Eval Loss: {bestTrial.evalLoss}</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <span className="text-slate-500 text-[10px] block">ASHA Prune Rate</span>
          <span className="text-amber-400 font-bold text-sm block mt-0.5">57.1%</span>
          <span className="text-[10px] text-slate-400">Saved 42 GPU hours</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <span className="text-slate-500 text-[10px] block">Optimal LoRA Params</span>
          <span className="text-slate-200 font-bold text-sm block mt-0.5">
            r={bestTrial.loraRank}, α={bestTrial.loraAlpha}
          </span>
          <span className="text-[10px] text-slate-400">LR: {bestTrial.learningRate.toExponential(1)}</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <span className="text-slate-500 text-[10px] block">Pareto Frontier</span>
          <span className="text-emerald-400 font-bold text-sm block mt-0.5">2 Optimal Trials</span>
          <span className="text-[10px] text-slate-400">Loss vs VRAM trade-off</span>
        </div>
      </div>

      {/* AI Advisor Panel (if opened or loaded) */}
      {advisorResult && (
        <div className="border border-amber-500/40 bg-gradient-to-r from-amber-950/20 via-slate-900/90 to-slate-900 rounded-xl p-5 font-mono text-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>DeepMind Gemma Recipe synthesized for {selectedModelForAdvice}</span>
            </div>
            <span className="text-[11px] text-slate-400">Engine: Gemini-3.8-Flash</span>
          </div>

          <p className="text-slate-300 text-xs leading-relaxed font-sans">
            {advisorResult.advisor.rationale}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
              <span className="text-slate-500 text-[10px] block">Recommended Method</span>
              <span className="text-amber-400 font-bold">{advisorResult.advisor.recommendedMethod}</span>
            </div>
            <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
              <span className="text-slate-500 text-[10px] block">Recommended LR</span>
              <span className="text-slate-200 font-bold">{advisorResult.advisor.recommendedParams.learningRate}</span>
            </div>
            <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
              <span className="text-slate-500 text-[10px] block">LoRA Rank & Alpha</span>
              <span className="text-slate-200 font-bold">
                r={advisorResult.advisor.recommendedParams.loraRank}, α={advisorResult.advisor.recommendedParams.loraAlpha}
              </span>
            </div>
            <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
              <span className="text-slate-500 text-[10px] block">Est. VRAM per GPU</span>
              <span className="text-emerald-400 font-bold">{advisorResult.advisor.estimatedVramPerGpuGB} GB</span>
            </div>
          </div>
        </div>
      )}

      {/* Trials Table */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
            Optuna Search Trials & ASHA Pruning Table
          </span>
          <span className="text-[11px] font-mono text-slate-500">Target Objective: Minimize Eval Loss</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-950/80 text-slate-400 text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Trial ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Learning Rate</th>
                <th className="py-3 px-4">LoRA (r / α)</th>
                <th className="py-3 px-4">Batch Size</th>
                <th className="py-3 px-4">Eval Loss</th>
                <th className="py-3 px-4">MMLU Score</th>
                <th className="py-3 px-4">Peak VRAM</th>
                <th className="py-3 px-4">Throughput</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {trials.map((t) => {
                const isBest = t.trialId === bestTrial.trialId;
                const isPruned = t.status.includes('Pruned');
                return (
                  <tr
                    key={t.trialId}
                    className={`hover:bg-slate-900/40 transition-colors ${
                      isBest ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-bold flex items-center gap-1.5">
                      {isBest && <Award className="w-3.5 h-3.5 text-amber-400" />}
                      <span className={isBest ? 'text-amber-300' : 'text-slate-200'}>{t.trialId}</span>
                      {t.isParetoOptimal && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-300">
                          Pareto
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border ${
                          t.status === 'Completed'
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                            : isPruned
                            ? 'bg-red-950/20 border-red-500/30 text-red-300'
                            : 'bg-blue-950/30 border-blue-500/40 text-blue-300 animate-pulse'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{t.learningRate.toExponential(2)}</td>
                    <td className="py-3 px-4 text-slate-300">
                      r={t.loraRank} / α={t.loraAlpha}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{t.batchSize}</td>
                    <td className="py-3 px-4 font-semibold text-amber-300">{t.evalLoss.toFixed(3)}</td>
                    <td className="py-3 px-4 text-slate-300">{t.mmluScore.toFixed(1)}%</td>
                    <td className="py-3 px-4 text-slate-400">{t.peakVramGB} GB</td>
                    <td className="py-3 px-4 text-slate-400">{t.throughput} tok/s</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
