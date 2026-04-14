import { cn } from "@/shared/lib/cn";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
};

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full border border-white/18 bg-black/25 px-3 text-xs text-[var(--text-muted)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
