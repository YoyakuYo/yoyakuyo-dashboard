// apps/dashboard/app/components/BarChart.tsx
// Simple bar chart component using SVG

"use client";
import React from 'react';

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarData[];
  height?: number;
  showValues?: boolean;
}

export default function BarChart({
  data,
  height = 200,
  showValues = true,
}: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-gray-500"
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  const padding = 40;
  const barWidth = Math.max(20, (600 - padding * 2) / data.length - 10);
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 600 ${height}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Bars */}
        {data.map((d, i) => {
          const barHeight = (d.value / maxValue) * (height - padding * 2);
          const x = padding + i * (barWidth + 10);
          const y = height - padding - barHeight;
          const color = d.color || '#3B82F6';

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx="4"
              />
              {showValues && d.value > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  className="text-xs fill-gray-700 font-medium"
                >
                  {d.value}
                </text>
              )}
              <text
                x={x + barWidth / 2}
                y={height - 10}
                textAnchor="middle"
                className="text-xs fill-gray-600"
                transform={`rotate(-45, ${x + barWidth / 2}, ${height - 10})`}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

