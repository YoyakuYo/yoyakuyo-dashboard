// Admin stats card component
"use client";

import React from "react";

interface AdminStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: {
    value: number;
    label: string;
  };
}

export default function AdminStatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
}: AdminStatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      {subtitle && <p className="text-sm text-gray-500 mt-2">{subtitle}</p>}
      {trend && (
        <p className="text-xs text-gray-500 mt-1">
          {trend.label}: {trend.value}
        </p>
      )}
    </div>
  );
}

