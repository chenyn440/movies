"use client";

import { useEffect, useState } from "react";

type Metrics = {
  fcp: number | null;
  lcp: number | null;
};

export function PerformanceMeter() {
  const [metrics, setMetrics] = useState<Metrics>({ fcp: null, lcp: null });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const paintObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          setMetrics((current) => ({ ...current, fcp: entry.startTime }));
        }
      }
    });

    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const latest = entries[entries.length - 1];
      if (latest) {
        setMetrics((current) => ({ ...current, lcp: latest.startTime }));
      }
    });

    paintObserver.observe({ type: "paint", buffered: true });
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });

    return () => {
      paintObserver.disconnect();
      lcpObserver.disconnect();
    };
  }, []);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <>
      <button
        aria-label={open ? "隱藏性能面板" : "顯示性能面板"}
        className="fixed bottom-3 right-3 z-40 h-7 w-7 rounded-full border border-white/16 bg-black/50 text-[10px] text-[var(--text-soft)] backdrop-blur transition-colors hover:bg-black/70"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        •
      </button>

      {open ? (
        <aside className="fixed bottom-12 right-3 z-40 rounded-[var(--radius-sm)] border border-white/15 bg-black/55 px-3 py-2 text-[11px] text-[var(--text-muted)] backdrop-blur">
          <p>FCP: {metrics.fcp ? `${metrics.fcp.toFixed(0)}ms` : "-"}</p>
          <p>LCP: {metrics.lcp ? `${metrics.lcp.toFixed(0)}ms` : "-"}</p>
        </aside>
      ) : null}
    </>
  );
}
