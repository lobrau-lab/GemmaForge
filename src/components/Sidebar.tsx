import React from 'react';
import {
  Boxes,
  Database,
  Flame,
  Gauge,
  LineChart,
  Layers,
  Server,
  MessageSquareCode,
  Terminal,
  FolderGit2,
} from 'lucide-react';
import { NavigationTab } from '../types';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  activeRunCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeRunCount,
}) => {
  const navItems = [
    {
      id: 'hub' as NavigationTab,
      label: 'Model Hub',
      icon: Boxes,
      badge: '9 Models',
    },
    {
      id: 'data' as NavigationTab,
      label: 'Data Forge',
      icon: Database,
      badge: '4 Sets',
    },
    {
      id: 'training' as NavigationTab,
      label: 'Training Ground',
      icon: Flame,
      badge: activeRunCount > 0 ? `${activeRunCount} Active` : undefined,
      badgeColor: activeRunCount > 0 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : undefined,
    },
    {
      id: 'autotune' as NavigationTab,
      label: 'Auto-Tuning',
      icon: Gauge,
      badge: 'ASHA / Optuna',
    },
    {
      id: 'evaluation' as NavigationTab,
      label: 'Evaluation Suite',
      icon: LineChart,
      badge: 'Benchmarks',
    },
    {
      id: 'registry' as NavigationTab,
      label: 'Registry & Export',
      icon: Layers,
      badge: 'GGUF / AWQ',
    },
    {
      id: 'serving' as NavigationTab,
      label: 'Serving & vLLM',
      icon: Server,
      badge: '2 Online',
    },
    {
      id: 'playground' as NavigationTab,
      label: 'Chat Playground',
      icon: MessageSquareCode,
      badge: 'Side-by-Side',
    },
    {
      id: 'architecture' as NavigationTab,
      label: 'Architecture & CLI',
      icon: Terminal,
      badge: 'Docs & Code',
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/70 p-4 flex flex-col justify-between shrink-0">
      <div>
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 px-3 mb-2 font-medium">
          MLOps Pipeline
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-amber-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      item.badgeColor ||
                      'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Box */}
      <div className="border border-slate-800/80 rounded-lg p-3 bg-slate-900/40 text-[11px] text-slate-400 space-y-1.5">
        <div className="flex items-center justify-between font-mono text-slate-300">
          <span className="flex items-center gap-1.5">
            <FolderGit2 className="w-3.5 h-3.5 text-amber-400" />
            <span>gemmaforge</span>
          </span>
          <span className="text-[10px] text-emerald-400">main · py311</span>
        </div>
        <p className="text-[10px] leading-relaxed text-slate-400">
          Google DeepMind Gemma 1/2/3 native tuning stack with TRL, PEFT & vLLM.
        </p>
      </div>
    </aside>
  );
};
