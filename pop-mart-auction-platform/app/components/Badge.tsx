"use client";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "purple";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    "bg-violet-100 text-violet-700 border-violet-200",
  success:
    "bg-emerald-100 text-emerald-700 border-emerald-200",
  warning:
    "bg-amber-100 text-amber-700 border-amber-200",
  danger:
    "bg-rose-100 text-rose-700 border-rose-200",
  info:
    "bg-sky-100 text-sky-700 border-sky-200",
  neutral:
    "bg-zinc-100 text-zinc-700 border-zinc-200",
  purple:
    "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-violet-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-sky-500",
  neutral: "bg-zinc-500",
  purple: "bg-fuchsia-500",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
};

export function Badge({
  children,
  variant = "default",
  size = "md",
  className = "",
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-semibold uppercase tracking-wider ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`}
        />
      )}
      {children}
    </span>
  );
}
