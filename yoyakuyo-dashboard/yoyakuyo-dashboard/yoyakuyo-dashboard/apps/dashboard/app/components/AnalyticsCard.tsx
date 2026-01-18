// apps/dashboard/app/components/AnalyticsCard.tsx
// Reusable card component for displaying analytics metrics

"use client";
import React from 'react';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  subtitle?: string;
}

export default function AnalyticsCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  subtitle,
}: AnalyticsCardProps) {
  const changeColor =
    change !== undefined
      ? change >= 0
        ? 'text-green-600'
        : 'text-red-600'
      : 'text-gray-600';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {change !== undefined && (
          <span className={`text-sm font-medium ${changeColor}`}>
            {change >= 0 ? '+' : ''}
            {change}%
          </span>
        )}
      </div>
      {changeLabel && (
        <p className="text-xs text-gray-500 mt-1">{changeLabel}</p>
      )}
      {subtitle && <p className="text-sm text-gray-500 mt-2">{subtitle}</p>}
    </div>
  );
}

