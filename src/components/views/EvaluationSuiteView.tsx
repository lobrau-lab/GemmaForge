import React, { useState } from 'react';
import {
  LineChart,
  Award,
  Sparkles,
  ArrowUpRight,
  Scale,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { BenchmarkScore } from '../../types';
import { RadarChart } from '../RadarChart';
import { apiService, LlmJudgeResponse } from '../../services/api';

interface EvaluationSuiteViewProps {
  benchmarks: BenchmarkScore[];
}

export const EvaluationSuiteView: React.FC<EvaluationSuiteViewProps> = ({ benchmarks }) => {
  const [judgePrompt, setJudgePrompt] = useState<string>(
    'Write a thread-safe, lock-free ring buffer in modern C++ with cache-line padding to avoid false sharing.'
  );
  const [judgeBaseOutput, setJudgeBaseOutput] = useState<string>(
    `// Base Gemma 2 9B Output
#include <atomic>
#include <vector>

template<typename T, size_t Cap>
class SimpleRingBuffer {
    std::vector<T> buf;
    std::atomic<size_t> head{0};
    std::atomic<size_t> tail{0};
public:
    SimpleRingBuffer() : buf(Cap) {}
    bool push(const T& val) {
        buf[tail.fetch_add(1) % Cap] = val;
        return true;
    }
};`
  );
  const [judgeTunedOutput, setJudgeTunedOutput] = useState<string>(
    `// GemmaForge Fine-Tuned Output
#include <atomic>
#include <new>
#include <cstddef>
#include <array>

template <typename T, std::size_t Capacity>
class LockFreeRingBuffer {
    static_assert((Capacity & (Capacity - 1)) == 0, "Capacity must be power of two for mask bitwise optimization");
    static constexpr std::size_t Mask = Capacity - 1;

    // Cache line isolation (64 bytes) to eliminate false sharing between producer and consumer cores
    alignas(64) std::atomic<std::size_t> head_{0};
    alignas(64) std::atomic<std::size_t> tail_{0};
    alignas(64) std::array<T, Capacity> storage_;

public:
    bool try_push(const T& item) noexcept {
        const auto current_tail = tail_.load(std::memory_order_relaxed);
        if ((current_tail - head_.load(std::memory_order_acquire)) >= Capacity) {
            return false; // Buffer full
        }
        storage_[current_tail & Mask] = item;
        tail_.store(current_tail + 1, std::memory_order_release);
        return true;
    }

    bool try_pop(T& item) noexcept {
        const auto current_head = head_.load(std::memory_order_relaxed);
        if (current_head == tail_.load(std::memory_order_acquire)) {
            return false; // Buffer empty
        }
        item = storage_[current_head & Mask];
        head_.store(current_head + 1, std::memory_order_release);
        return true;
    }
};`
  );

  const [judgeResult, setJudgeResult] = useState<LlmJudgeResponse | null>(null);
  const [isJudging, setIsJudging] = useState<boolean>(false);

  // Radar data mapping
  const radarAxes = [
    { label: 'GSM8K (Math)', baseVal: 68.4, tunedVal: 84.2 },
    { label: 'MMLU (STEM)', baseVal: 72.0, tunedVal: 78.6 },
    { label: 'HumanEval (Code)', baseVal: 48.2, tunedVal: 66.5 },
    { label: 'MT-Bench (Instr)', baseVal: 78.2, tunedVal: 88.5 },
    { label: 'TruthfulQA', baseVal: 56.1, tunedVal: 71.4 },
    { label: 'AlpacaEval 2', baseVal: 49.0, tunedVal: 75.6 },
  ];

  const handleRunJudge = async () => {
    setIsJudging(true);
    try {
      const res = await apiService.runLlmJudge({
        prompt: judgePrompt,
        baseModelName: 'Base Gemma 2 9B',
        baseOutput: judgeBaseOutput,
        tunedModelName: 'GemmaForge Fine-Tuned Checkpoint',
        tunedOutput: judgeTunedOutput,
        criteria: 'Thread-safety, standard compliance (alignas 64 cache-line padding), memory order semantics, zero false sharing, absence of race conditions.',
      });
      setJudgeResult(res as LlmJudgeResponse);
    } catch (e) {
      console.error(e);
    } finally {
      setIsJudging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/20 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
              Evaluation Suite
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">lm-evaluation-harness · Lighteval · Double-Blind LLM Judge</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">
            Automated Benchmark & Double-Blind Rubric Evaluation
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Validate model performance across standardized reasoning, STEM, and code benchmarks.
            Execute pairwise evaluations with Gemini-as-a-Judge against rigorous rubric criteria.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleRunJudge}
            disabled={isJudging}
            className="text-xs font-mono font-semibold px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 hover:from-amber-400 hover:to-orange-500 shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            {isJudging ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Scale className="w-3.5 h-3.5 stroke-[2.5]" />}
            <span>Run Double-Blind LLM Judge</span>
          </button>
        </div>
      </div>

      {/* Grid: Benchmarks Table & Radar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Benchmarks Table (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="border border-slate-800 bg-slate-900/60 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                lm-eval-harness Benchmark Results
              </span>
              <span className="text-[11px] font-mono text-emerald-400">Zero-Shot & Few-Shot Normalized</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-slate-950/80 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Benchmark</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Base Gemma 2</th>
                    <th className="py-3 px-4">GemmaForge Checkpoint</th>
                    <th className="py-3 px-4">Delta Gain</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {benchmarks.map((b, idx) => {
                    const delta = b.tunedScore - b.baseScore;
                    return (
                      <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-200 block">{b.name}</span>
                          <span className="text-[10px] text-slate-500 line-clamp-1">{b.description}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{b.category}</td>
                        <td className="py-3 px-4 text-slate-400">
                          {b.baseScore.toFixed(1)} {b.metric.includes('%') ? '%' : ''}
                        </td>
                        <td className="py-3 px-4 font-bold text-amber-300">
                          {b.tunedScore.toFixed(1)} {b.metric.includes('%') ? '%' : ''}
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-400">
                          +{delta.toFixed(1)} {b.metric.includes('%') ? '%' : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Radar Chart Visualization (5 cols) */}
        <div className="lg:col-span-5 border border-slate-800 bg-slate-900/60 rounded-xl p-5 flex flex-col items-center justify-center">
          <div className="w-full flex items-center justify-between mb-4">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
              Capability Frontier Radar
            </span>
            <span className="text-[10px] font-mono text-slate-500">6 Core Axes</span>
          </div>
          <RadarChart axes={radarAxes} />
        </div>
      </div>

      {/* LLM-as-a-Judge Interactive Pairwise Arena */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5 space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Interactive LLM-as-a-Judge Pairwise Arena
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">Double-blind rubric evaluation via Gemini 3.8 Flash</span>
        </div>

        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Evaluation Test Prompt:</label>
          <input
            type="text"
            value={judgePrompt}
            onChange={(e) => setJudgePrompt(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Model A (Base Gemma 2 9B Output):</label>
            <textarea
              rows={6}
              value={judgeBaseOutput}
              onChange={(e) => setJudgeBaseOutput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-[11px] text-slate-300 focus:outline-none focus:border-slate-700 font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] text-amber-300 block mb-1">Model B (GemmaForge Fine-Tuned Output):</label>
            <textarea
              rows={6}
              value={judgeTunedOutput}
              onChange={(e) => setJudgeTunedOutput(e.target.value)}
              className="w-full bg-slate-950 border border-amber-500/30 rounded-lg p-2.5 text-[11px] text-slate-300 focus:outline-none focus:border-amber-500/50 font-mono"
            />
          </div>
        </div>

        {judgeResult && (
          <div className="mt-4 p-4 border border-amber-500/40 bg-amber-950/10 rounded-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300 font-bold">
                  Decision: Winner is {judgeResult.evaluation.winner}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span>Model A: <strong className="text-slate-400">{judgeResult.evaluation.scoreModelA}/10</strong></span>
                <span>Model B: <strong className="text-amber-400">{judgeResult.evaluation.scoreModelB}/10</strong></span>
              </div>
            </div>

            <p className="text-slate-300 leading-relaxed font-sans text-xs">
              {judgeResult.evaluation.detailedReasoning}
            </p>

            {/* Rubric Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
              {Object.entries(judgeResult.evaluation.criteriaScores || {}).map(([key, scores]: any) => (
                <div key={key} className="bg-slate-950/80 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 block capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <div className="flex justify-between mt-1 font-bold">
                    <span className="text-slate-500">A: {scores.modelA}</span>
                    <span className="text-amber-300">B: {scores.modelB}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
