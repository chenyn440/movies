import { describe, expect, it } from "vitest";
import type { WatchlistItem } from "@/features/watchlist/types";
import { buildSlotTrack, pickRandomMovie } from "./watch-lottery";

const watchlist: WatchlistItem[] = [
  {
    id: 1,
    title: "Movie A",
    posterPath: null,
    backdropPath: null,
    releaseDate: "2024-01-01",
    voteAverage: 7.1,
    overview: "A",
    addedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: 2,
    title: "Movie B",
    posterPath: null,
    backdropPath: null,
    releaseDate: "2024-02-01",
    voteAverage: 8.2,
    overview: "B",
    addedAt: "2024-01-02T00:00:00.000Z",
  },
  {
    id: 3,
    title: "Movie C",
    posterPath: null,
    backdropPath: null,
    releaseDate: "2024-03-01",
    voteAverage: 6.9,
    overview: "C",
    addedAt: "2024-01-03T00:00:00.000Z",
  },
];

describe("watch-lottery", () => {
  it("returns null for empty watchlist", () => {
    expect(pickRandomMovie([])).toBeNull();
  });

  it("picks deterministic movie when rng is injected", () => {
    expect(pickRandomMovie(watchlist, () => 0)?.id).toBe(1);
    expect(pickRandomMovie(watchlist, () => 0.4)?.id).toBe(2);
    expect(pickRandomMovie(watchlist, () => 0.9999)?.id).toBe(3);
  });

  it("builds repeated slot track with minimum cycles", () => {
    const track = buildSlotTrack(watchlist, 4);
    expect(track).toHaveLength(12);
    expect(track[0]?.id).toBe(1);
    expect(track[3]?.id).toBe(1);
    expect(track[11]?.id).toBe(3);
  });
});
