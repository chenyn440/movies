import type { MovieSummary } from "@/features/movies/types";

export type WatchlistItem = Pick<
  MovieSummary,
  | "id"
  | "title"
  | "posterPath"
  | "backdropPath"
  | "releaseDate"
  | "voteAverage"
  | "overview"
> & {
  addedAt: string;
};

export type WatchlistSort = "added_desc" | "added_asc";

export type LotteryStatus = "idle" | "spinning" | "done";
export type LotteryResult = WatchlistItem | null;
