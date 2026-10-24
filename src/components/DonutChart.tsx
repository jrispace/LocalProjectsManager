import React from "react";

interface DonutChartProps {
  pct: number;
  size?: number;
}

export default function DonutChart({ pct, size = 120 }: DonutChartProps) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const filled = (pct / 100) * c;

  return (
    <div className="donut-container" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 120 120">
        <defs>
          <linearGradient id="donut-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <circle
          cx="60" cy="60" r={r}
          fill="none"
          stroke="var(--border-primary)"
          strokeWidth="12"
        />
        <circle
          cx="60" cy="60" r={r}
          fill="none"
          stroke="url(#donut-grad)"
          strokeWidth="12"
          strokeDasharray={`${filled} ${c}`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
      </svg>
      <div className="donut-center">
        <span className="donut-percent">{pct}%</span>
        <span className="donut-label">Complete</span>
      </div>
    </div>
  );
}
