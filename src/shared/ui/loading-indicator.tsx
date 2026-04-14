export function LoadingIndicator({ label = "載入中..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-3 text-sm text-[var(--text-muted)]">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-[var(--primary)]" />
      <span>{label}</span>
    </div>
  );
}

export function MovieGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          className="glass-surface animate-pulse rounded-[var(--radius-md)] p-2"
          key={`movie-skeleton-${idx}`}
        >
          <div className="aspect-[var(--poster-ratio)] rounded-[var(--radius-sm)] bg-white/10" />
          <div className="mt-3 h-3 rounded bg-white/12" />
          <div className="mt-2 h-3 w-2/3 rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}
