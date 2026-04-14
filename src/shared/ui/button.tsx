"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[#ffd67f] active:bg-[#e6a82f]",
  secondary:
    "bg-white/10 text-[var(--text)] hover:bg-white/16 active:bg-white/20 border border-white/15",
  ghost:
    "bg-transparent text-[var(--text)] hover:bg-white/10 active:bg-white/16 border border-transparent",
  danger:
    "bg-[var(--danger)] text-white hover:bg-[#ff7b7b] active:bg-[#dd4f4f]",
};

export function Button({
  className,
  variant = "primary",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center whitespace-nowrap rounded-[var(--radius-sm)] px-4 text-sm font-semibold transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        "disabled:cursor-not-allowed disabled:opacity-45",
        VARIANT_STYLES[variant],
        className,
      )}
      disabled={disabled}
      {...props}
    />
  );
}
