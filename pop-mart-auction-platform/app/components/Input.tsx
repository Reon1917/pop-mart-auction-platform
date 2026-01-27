"use client";

import { forwardRef, InputHTMLAttributes, ReactNode, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      fullWidth = true,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    const baseStyles =
      "w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-all duration-200 outline-none";
    const stateStyles = error
      ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
      : "border-zinc-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 hover:border-zinc-300";
    const iconPadding = leftIcon ? "pl-10" : "";
    const widthClass = fullWidth ? "w-full" : "";

    return (
      <div className={`${widthClass} ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`${baseStyles} ${stateStyles} ${iconPadding}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
              {rightIcon}
            </div>
          )}
        </div>
        {helperText && !error && (
          <p className="mt-1.5 text-xs text-zinc-500">{helperText}</p>
        )}
        {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, helperText, error, fullWidth = true, className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    const baseStyles =
      "w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-all duration-200 outline-none resize-none";
    const stateStyles = error
      ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
      : "border-zinc-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 hover:border-zinc-300";
    const widthClass = fullWidth ? "w-full" : "";

    return (
      <div className={`${widthClass} ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`${baseStyles} ${stateStyles}`}
          {...props}
        />
        {helperText && !error && (
          <p className="mt-1.5 text-xs text-zinc-500">{helperText}</p>
        )}
        {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";
