"use client";

import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
  variant?: "default" | "highlight" | "purple" | "success";
}

const variantStyles = {
  default: {
    card: "bg-white border-zinc-200/80",
    label: "text-zinc-500",
    value: "text-zinc-900",
  },
  highlight: {
    card: "bg-gradient-to-br from-zinc-900 to-zinc-800 border-zinc-800",
    label: "text-zinc-400",
    value: "text-white",
  },
  purple: {
    card: "bg-gradient-to-br from-violet-600 to-fuchsia-600 border-violet-500",
    label: "text-violet-100",
    value: "text-white",
  },
  success: {
    card: "bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400",
    label: "text-emerald-100",
    value: "text-white",
  },
};

export function StatCard({
  label,
  value,
  icon,
  trend,
  className = "",
  variant = "default",
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm transition-all duration-200 hover:shadow-md ${styles.card} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-xs font-semibold uppercase tracking-[0.15em] ${styles.label}`}>
            {label}
          </p>
          <p className={`mt-1.5 text-2xl font-bold ${styles.value}`}>{value}</p>
          {trend && (
            <p
              className={`mt-1 text-xs font-medium ${
                trend.positive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={`flex-shrink-0 p-2 rounded-xl ${
              variant === "default"
                ? "bg-zinc-100 text-zinc-600"
                : "bg-white/10 text-white"
            }`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
