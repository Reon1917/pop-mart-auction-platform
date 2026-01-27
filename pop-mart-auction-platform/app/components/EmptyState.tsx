"use client";

import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-10 px-4 ${className}`}
    >
      {icon && (
        <div className="mb-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-400">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-zinc-500 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
