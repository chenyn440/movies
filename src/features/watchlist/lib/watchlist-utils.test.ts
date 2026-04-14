import { describe, expect, it } from "vitest";
import type { MovieSummary } from "@/features/movies/types";
import {
  addToWatchlist,
  isWatchlisted,
  parseWatchlist,
  removeFromWatchlist,
  sortWatchlist,
} from "./watchlist-utils";

const movieA: MovieSummary = {
  id: 1,
  title: "A",
  posterPath: null,
  backdropPath: null,
  releaseDate: "2020-01-01",
  voteAverage: 8.2,
  overview: "A movie",
};

const movieB: MovieSummary = {
  id: 2,
  title: "B",
  posterPath: null,
  backdropPath: null,
  releaseDate: "2021-01-01",
  voteAverage: 7.9,
  overview: "B movie",
};

describe("watchlist-utils", () => {
  it("adds movie once and prevents duplicates", () => {
    const once = addToWatchlist([], movieA);
    const twice = addToWatchlist(once, movieA);
    expect(once).toHaveLength(1);
    expect(twice).toHaveLength(1);
  });

  it("removes movie and checks membership", () => {
    const list = addToWatchlist(addToWatchlist([], movieA), movieB);
    expect(isWatchlisted(list, 2)).toBe(true);
    expect(removeFromWatchlist(list, 2)).toHaveLength(1);
  });

  it("sorts by added time", () => {
    const list = [
      { ...movieA, addedAt: "2023-01-01T00:00:00.000Z" },
      { ...movieB, addedAt: "2024-01-01T00:00:00.000Z" },
    ];
    expect(sortWatchlist(list, "added_desc")[0]?.id).toBe(2);
    expect(sortWatchlist(list, "added_asc")[0]?.id).toBe(1);
  });

  it("parses malformed list safely", () => {
    expect(parseWatchlist([{ id: "x" }, null, "bad"])).toEqual([]);
  });
});
