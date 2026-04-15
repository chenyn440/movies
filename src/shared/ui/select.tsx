import type { SelectHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "h-11 rounded-[var(--radius-sm)] border border-white/12 bg-black/30 px-3 text-base text-[var(--text)] md:text-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
