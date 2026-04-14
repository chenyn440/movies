import type { WatchlistItem } from "@/features/watchlist/types";

export function pickRandomMovie(
  list: WatchlistItem[],
  rng: () => number = Math.random,
): WatchlistItem | null {
  if (list.length === 0) {
    return null;
  }

  const raw = rng();
  const normalized = Number.isFinite(raw) ? raw : 0;
  const clamped = Math.max(0, Math.min(0.999999, normalized));
  const index = Math.floor(clamped * list.length);
  return list[index] ?? null;
}

export function buildSlotTrack(list: WatchlistItem[], minCycles: number) {
  if (list.length === 0) {
    return [];
  }

  const cycles = Math.max(1, Math.floor(minCycles));
  const track: WatchlistItem[] = [];
  for (let i = 0; i < cycles; i += 1) {
    track.push(...list);
  }
  return track;
}
