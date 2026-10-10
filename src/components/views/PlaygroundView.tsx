import React, { useState } from 'react';
import {
  MessageSquareCode,
  Send,
  Sparkles,
  Sliders,
  RefreshCw,
  Cpu,
  Zap,
  Trash2,
  Copy,
  CheckCircle2,
  Split,
} from 'lucide-react';
import { apiService } from '../../services/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tokensPerSec?: string;
  latencyMs?: number;
}

export const PlaygroundView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init-1',
      role: 'user',
      content: 'Derive the time complexity of top-k sampling with KV-cache eviction in Google Gemma 2.',
    },
    {
      id: 'msg-init-2',
      role: 'assistant',
      content: `In Google Gemma 2, inference execution combines sliding-window attention (4096 tokens) with global attention every alternate layer.

1. **KV-Cache Eviction:**
   With circular ring-buffer indexing over the 4096-token sliding window, allocating and shifting the KV tensor takes $O(1)$ amortized memory operations per generated token per layer.

2. **Top-k Logits Filtering:**
   Given Gemma 2's vocabulary size $V = 256,000$:
   - Quickselect or Min-Heap selection on GPU SMs selects the top $k$ candidates in $O(V + k \\log k)$.
   - With optimized Triton / FlashAttention kernels, this completes in under 0.8 ms per step.

3. **Logit Soft-Capping:**
   Gemma 2 computes $\\text{soft\\_cap} = C \\cdot \\tanh(\\text{logits} / C)$ where $C = 30.0$ for attention and $50.0$ for the final LM head, operating in element-wise $O(V)$.`,
      tokensPerSec: '138.4',
      latencyMs: 42,
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [modelVariant, setModelVariant] = useState<string>('Gemma-2-9B-GSM8K-Forge');
  const [temperature, setTemperature] = useState<number>(0.3);
  const [topP, setTopP] = useState<number>(0.9);
  const [systemInstruction, setSystemInstruction] = useState<string>(
    'You are a specialized fine-tuned Google Gemma model with high-precision chain-of-thought mathematical and algorithmic reasoning.'
  );

  const presetPrompts = [
    'Math: Natalia sold clips to 48 friends...',
    'Code: Implement lock-free queue in C++',
    'System: Explain sliding-window attention SWA',
    'Safety: Discuss risks of plaintext API keys',
  ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim() || isGenerating) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputPrompt('');
    setIsGenerating(true);

    try {
      const res = await apiService.sendPlaygroundChat({
        messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
        systemInstruction,
        temperature,
        modelVariant,
      });

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        tokensPerSec: res.metrics?.tokensPerSecond || '120.0',
        latencyMs: res.metrics?.firstTokenLatencyMs || 35,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/20 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
              Interactive Chat Playground
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">Live Inference & Persona Evaluation</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">
            Gemma Model Prompt & Reasoning Sandbox
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Test and converse with your fine-tuned Gemma checkpoints. Adjust sampling hyperparameters,
            stream tokens with low-latency KV-cache execution, and verify instruction adherence.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setMessages([])}
            className="text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Chat</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar Controls & Chat Thread */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Model & Hyperparameters Controls (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-4 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Inference Controls</span>
              </span>
              <span className="text-[10px] text-emerald-400">vLLM Engine</span>
            </div>

            {/* Model Target Picker */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Target Checkpoint:</label>
              <select
                value={modelVariant}
                onChange={(e) => setModelVariant(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
              >
                <option value="Gemma-2-9B-GSM8K-Forge">Gemma-2-9B-GSM8K-Forge (Tuned)</option>
                <option value="Gemma-3-4B-DPO-Safety">Gemma-3-4B-DPO-Safety (Tuned)</option>
                <option value="google/gemma-2-9b-it">google/gemma-2-9b-it (Base)</option>
                <option value="google/gemma-3-1b-it">google/gemma-3-1b-it (Base)</option>
              </select>
            </div>

            {/* Temperature Slider */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Temperature:</span>
                <span className="text-amber-400 font-bold">{temperature.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.5"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Top-P Slider */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Top-P (Nucleus):</span>
                <span className="text-amber-400 font-bold">{topP.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={topP}
                onChange={(e) => setTopP(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* System Instruction */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">System Instruction / Persona:</label>
              <textarea
                rows={3}
                value={systemInstruction}
                onChange={(e) => setSystemInstruction(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[11px] text-slate-300 focus:outline-none focus:border-amber-500/50 font-mono"
              />
            </div>

            {/* Quick Presets */}
            <div>
              <span className="text-[10px] text-slate-400 block mb-1.5">Quick Evaluation Prompts:</span>
              <div className="space-y-1">
                {presetPrompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInputPrompt(p.split(': ')[1] || p);
                    }}
                    className="w-full text-left p-1.5 rounded bg-slate-950/80 hover:bg-slate-900 border border-slate-800/80 text-[10px] text-slate-300 truncate transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Chat Thread & Input (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-[600px] border border-slate-800 bg-slate-900/60 rounded-xl overflow-hidden">
          {/* Thread Header */}
          <div className="p-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-slate-200 font-bold">{modelVariant}</span>
            </div>
            <span className="text-slate-500 text-[11px]">PagedAttention · Chunked Prefill</span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs font-mono space-y-2">
                <MessageSquareCode className="w-8 h-8 text-slate-600" />
                <p>Chat thread is empty. Select a quick prompt or type below.</p>
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div className="text-[10px] font-mono text-slate-500 mb-1 px-1 flex items-center gap-2">
                      <span>{isUser ? 'You' : modelVariant}</span>
                      {m.tokensPerSec && (
                        <span className="text-amber-400/90">
                          {m.tokensPerSec} tok/s · {m.latencyMs}ms TTFT
                        </span>
                      )}
                    </div>

                    <div
                      className={`max-w-[85%] rounded-xl p-3.5 text-xs font-mono leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-amber-500/10 text-amber-200 border border-amber-500/30'
                          : 'bg-slate-950/80 text-slate-200 border border-slate-800 shadow-sm'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })
            )}

            {isGenerating && (
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400/80 p-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>GemmaForge vLLM generating tokens...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/70">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask Gemma anything or test instruction adherence..."
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                disabled={isGenerating}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 font-mono"
              />
              <button
                type="submit"
                disabled={!inputPrompt.trim() || isGenerating}
                className="flex items-center gap-1.5 text-xs font-mono font-semibold px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 hover:from-amber-400 hover:to-orange-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
