import React, { useState } from 'react';

interface LossPoint {
  step: number;
  trainLoss: number;
  evalLoss: number;
  lr?: number;
  gradNorm?: number;
}

interface LossChartProps {
  data: LossPoint[];
  title?: string;
  height?: number;
}

export const LossChart: React.FC<LossChartProps> = ({
  data,
  title = 'Training & Evaluation Loss Curve',
  height = 220,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        className="w-full border border-slate-800 rounded-lg bg-slate-900/30 flex items-center justify-center text-xs text-slate-500 font-mono"
        style={{ height }}
      >
        No training telemetry data recorded yet.
      </div>
    );
  }

  const padding = { top: 20, right: 30, bottom: 30, left: 45 };
  const width = 680;

  const minLoss = Math.min(...data.map((d) => Math.min(d.trainLoss, d.evalLoss))) * 0.9;
  const maxLoss = Math.max(...data.map((d) => Math.max(d.trainLoss, d.evalLoss))) * 1.05;
  const minStep = data[0].step;
  const maxStep = data[data.length - 1].step;

  const scaleX = (step: number) => {
    if (maxStep === minStep) return padding.left;
    return padding.left + ((step - minStep) / (maxStep - minStep)) * (width - padding.left - padding.right);
  };

  const scaleY = (val: number) => {
    if (maxLoss === minLoss) return height / 2;
    return height - padding.bottom - ((val - minLoss) / (maxLoss - minLoss)) * (height - padding.top - padding.bottom);
  };

  const len = data.length;
  const trainPointsArr = new Array(len);
  const evalPointsArr = new Array(len);
  for (let i = 0; i < len; i++) {
    const d = data[i];
    const x = scaleX(d.step);
    trainPointsArr[i] = `${x},${scaleY(d.trainLoss)}`;
    evalPointsArr[i] = `${x},${scaleY(d.evalLoss)}`;
  }
  const trainPoints = trainPointsArr.join(' ');
  const evalPoints = evalPointsArr.join(' ');

  const activePoint = hoverIndex !== null ? data[hoverIndex] : data[data.length - 1];

  return (
    <div className="w-full bg-slate-900/40 border border-slate-800 rounded-lg p-4 font-mono">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-slate-200">{title}</div>
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-slate-400">Train Loss:</span>
            <span className="text-amber-300 font-bold">{activePoint?.trainLoss.toFixed(3)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
            <span className="text-slate-400">Eval Loss:</span>
            <span className="text-blue-300 font-bold">{activePoint?.evalLoss.toFixed(3)}</span>
          </div>
          {activePoint?.lr && (
            <div className="text-slate-400">
              LR: <span className="text-slate-300">{activePoint.lr.toExponential(2)}</span>
            </div>
          )}
          <div className="text-slate-400">
            Step: <span className="text-emerald-400 font-semibold">{activePoint?.step}</span>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair overflow-visible"
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = padding.top + pct * (height - padding.top - padding.bottom);
            const val = maxLoss - pct * (maxLoss - minLoss);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                />
                <text x={padding.left - 8} y={y + 3} textAnchor="end" fill="#64748b" fontSize="9">
                  {val.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Area fill for train loss */}
          <polygon
            points={`${scaleX(data[0].step)},${height - padding.bottom} ${trainPoints} ${scaleX(data[data.length - 1].step)},${height - padding.bottom}`}
            fill="rgba(245, 158, 11, 0.08)"
          />

          {/* Train loss line */}
          <polyline
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={trainPoints}
          />

          {/* Eval loss line */}
          <polyline
            fill="none"
            stroke="#60a5fa"
            strokeWidth="2.2"
            strokeDasharray="4 2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={evalPoints}
          />

          {/* Data Points */}
          {data.map((d, idx) => {
            const cx = scaleX(d.step);
            const cy = scaleY(d.trainLoss);
            return (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r={hoverIndex === idx ? 5 : 2.5}
                className="fill-amber-400 stroke-slate-950 transition-all"
                strokeWidth="1.5"
                onMouseEnter={() => setHoverIndex(idx)}
              />
            );
          })}

          {/* Hover crosshair line */}
          {hoverIndex !== null && (
            <line
              x1={scaleX(data[hoverIndex].step)}
              y1={padding.top}
              x2={scaleX(data[hoverIndex].step)}
              y2={height - padding.bottom}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          )}

          {/* X Axis Labels */}
          {data.map((d, idx) => {
            if (idx === 0 || idx === data.length - 1 || idx % Math.ceil(data.length / 5) === 0) {
              return (
                <text
                  key={idx}
                  x={scaleX(d.step)}
                  y={height - 10}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="9"
                >
                  step {d.step}
                </text>
              );
            }
            return null;
          })}
        </svg>
      </div>
    </div>
  );
};
