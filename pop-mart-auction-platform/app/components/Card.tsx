"use client";

import { ReactNode, forwardRef } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  onClick?: () => void;
}

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { children, className = "", padding = "md", hover = false, onClick },
    ref
  ) => {
    const baseStyles =
      "bg-white rounded-md border border-zinc-200/80 shadow-sm";
    const hoverStyles = hover
      ? "cursor-pointer transition-all duration-200 hover:shadow-md hover:border-zinc-300 hover:-translate-y-0.5"
      : "";

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={`${baseStyles} ${paddingStyles[padding]} ${hoverStyles} ${className}`}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({
  title,
  subtitle,
  action,
  className = "",
}: CardHeaderProps) {
  return (
    <div
      className={`flex items-start justify-between gap-4 mb-4 ${className}`}
    >
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-zinc-900 truncate">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1 text-sm text-zinc-500 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className = "" }: CardContentProps) {
  return <div className={className}>{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className = "" }: CardFooterProps) {
  return (
    <div className={`mt-4 pt-4 border-t border-zinc-100 ${className}`}>
      {children}
    </div>
  );
}
