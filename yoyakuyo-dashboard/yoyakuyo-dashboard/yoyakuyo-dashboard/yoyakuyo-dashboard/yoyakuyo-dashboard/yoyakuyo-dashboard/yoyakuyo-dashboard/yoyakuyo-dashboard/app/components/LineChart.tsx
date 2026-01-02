// apps/dashboard/app/components/LineChart.tsx
// Simple line chart component using SVG

"use client";
import React from 'react';

interface DataPoint {
  x: string | number;
  y: number;
}

interface LineChartProps {
  data: DataPoint[];
  xLabel?: string;
  yLabel?: string;
  height?: number;
  color?: string;
}

export default function LineChart({
  data,
  xLabel,
  yLabel,
  height = 200,
  color = '#3B82F6',
}: LineChartProps) {
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
  const chartWidth = 600;
  const chartHeight = height - padding * 2;

  const maxY = Math.max(...data.map((d) => d.y), 1);
  const minY = Math.min(...data.map((d) => d.y), 0);

  const xScale = (index: number) =>
    (index / (data.length - 1 || 1)) * (chartWidth - padding * 2) + padding;
  const yScale = (value: number) =>
    chartHeight -
    ((value - minY) / (maxY - minY || 1)) * (chartHeight - padding) +
    padding;

  const points = data
    .map((d, i) => `${xScale(i)},${yScale(d.y)}`)
    .join(' ');

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${chartWidth} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding + ratio * (chartHeight - padding);
          return (
            <line
              key={ratio}
              x1={padding}
              y1={y}
              x2={chartWidth - padding}
              y2={y}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          );
        })}

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
        />

        {/* Data points */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={xScale(i)}
            cy={yScale(d.y)}
            r="4"
            fill={color}
          />
        ))}

        {/* Labels */}
        {xLabel && (
          <text
            x={chartWidth / 2}
            y={height - 10}
            textAnchor="middle"
            className="text-xs fill-gray-600"
          >
            {xLabel}
          </text>
        )}
        {yLabel && (
          <text
            x={15}
            y={height / 2}
            textAnchor="middle"
            className="text-xs fill-gray-600"
            transform={`rotate(-90, 15, ${height / 2})`}
          >
            {yLabel}
          </text>
        )}
      </svg>
    </div>
  );
}

