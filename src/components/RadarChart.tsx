import React from 'react';

interface RadarAxis {
  label: string;
  baseVal: number; // 0 to 100
  tunedVal: number; // 0 to 100
}

interface RadarChartProps {
  axes: RadarAxis[];
  baseName?: string;
  tunedName?: string;
  size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  axes,
  baseName = 'Base Gemma 2 9B',
  tunedName = 'GemmaForge Fine-Tuned',
  size = 280,
}) => {
  const center = size / 2;
  const radius = (size / 2) - 42;
  const total = axes.length;

  const getCoordinates = (value: number, index: number) => {
    const angle = (Math.PI * 2 / total) * index - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const basePoints = axes
    .map((ax, idx) => {
      const { x, y } = getCoordinates(ax.baseVal, idx);
      return `${x},${y}`;
    })
    .join(' ');

  const tunedPoints = axes
    .map((ax, idx) => {
      const { x, y } = getCoordinates(ax.tunedVal, idx);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible font-mono">
        {/* Concentric polygons */}
        {[0.25, 0.5, 0.75, 1].map((pct, idx) => {
          const r = radius * pct;
          const polygonPoints = Array.from({ length: total })
            .map((_, i) => {
              const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
              return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
            })
            .join(' ');

          return (
            <polygon
              key={idx}
              points={polygonPoints}
              fill="none"
              stroke="#334155"
              strokeWidth="0.8"
              strokeDasharray="2 2"
            />
          );
        })}

        {/* Axes lines and labels */}
        {axes.map((ax, idx) => {
          const angle = (Math.PI * 2 / total) * idx - Math.PI / 2;
          const xEnd = center + radius * Math.cos(angle);
          const yEnd = center + radius * Math.sin(angle);
          const labelDist = radius + 22;
          const xLabel = center + labelDist * Math.cos(angle);
          const yLabel = center + labelDist * Math.sin(angle);

          return (
            <g key={idx}>
              <line
                x1={center}
                y1={center}
                x2={xEnd}
                y2={yEnd}
                stroke="#1e293b"
                strokeWidth="1.2"
              />
              <text
                x={xLabel}
                y={yLabel + 3}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="9.5"
                className="font-medium"
              >
                {ax.label}
              </text>
            </g>
          );
        })}

        {/* Base model shape */}
        <polygon
          points={basePoints}
          fill="rgba(100, 116, 139, 0.2)"
          stroke="#64748b"
          strokeWidth="1.8"
        />

        {/* Fine-tuned model shape */}
        <polygon
          points={tunedPoints}
          fill="rgba(245, 158, 11, 0.3)"
          stroke="#f59e0b"
          strokeWidth="2.2"
        />

        {/* Fine-tuned points */}
        {axes.map((ax, idx) => {
          const { x, y } = getCoordinates(ax.tunedVal, idx);
          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r="3"
              className="fill-amber-400 stroke-slate-950"
              strokeWidth="1.5"
            />
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] font-mono mt-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
          <span className="text-slate-400">{baseName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <span className="text-amber-300 font-semibold">{tunedName}</span>
        </div>
      </div>
    </div>
  );
};
