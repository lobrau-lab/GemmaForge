import React from 'react';
import {
  Flame,
  Cpu,
  KeyRound,
  Plus,
  Radio,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Bell,
} from 'lucide-react';

interface HeaderProps {
  onNewRunClick: () => void;
  onHfTokenClick: () => void;
  onOpenAlertsClick: () => void;
  activeRunCount: number;
  hfTokenVerified: boolean;
  alertCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onNewRunClick,
  onHfTokenClick,
  onOpenAlertsClick,
  activeRunCount,
  hfTokenVerified,
  alertCount,
}) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between z-30 sticky top-0">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20 ring-1 ring-amber-400/40">
          <Flame className="w-5 h-5 text-slate-950 font-bold" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-lg text-slate-100 flex items-center gap-1.5">
              Gemma<span className="text-amber-400 font-extrabold">Forge</span>
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded bg-slate-900/60">
              v1.4 MLOps
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-none">
            LLM Training Ground & Model Forge for Google Gemma
          </p>
        </div>
      </div>

      {/* Center Cluster Status Metrics */}
      <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-slate-300 bg-slate-900/80 border border-slate-800/80 px-3.5 py-1.5 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-400">Cluster:</span>
          <span className="font-semibold text-slate-200">4x H100 SXM5 Nodes</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">GPUs:</span>
          <span className="text-emerald-400 font-semibold">18 / 32 Active</span>
        </div>
        <span className="text-slate-700">|</span>
        <div>
          <span className="text-slate-400">VRAM:</span>{' '}
          <span className="text-amber-300 font-medium">1,140 / 2,560 GB</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-400">InfiniBand:</span>{' '}
          <span className="text-blue-300 font-medium">3.2 Tbps</span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Resource Alert Center Bell */}
        <button
          onClick={onOpenAlertsClick}
          className="relative p-2 rounded-lg border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-100 hover:border-slate-700 transition-all"
          title="Resource Health & Toast Alerts Center"
        >
          <Bell className="w-4 h-4 text-slate-300" />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-slate-950 font-mono text-[9px] font-extrabold flex items-center justify-center animate-pulse">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>

        {/* HF Gated Token Button */}
        <button
          onClick={onHfTokenClick}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
            hfTokenVerified
              ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-950/40'
              : 'border-amber-500/40 bg-amber-950/20 text-amber-300 hover:bg-amber-950/40'
          }`}
          title="Manage Hugging Face Access Token for Gated Gemma Models"
        >
          {hfTokenVerified ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span>{hfTokenVerified ? 'HF Access: Verified' : 'Verify HF Token'}</span>
        </button>

        {/* Launch Training Button */}
        <button
          onClick={onNewRunClick}
          className="flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 hover:from-amber-400 hover:to-orange-500 shadow-md shadow-amber-500/20 transition-all font-mono active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Training Run</span>
        </button>
      </div>
    </header>
  );
};
