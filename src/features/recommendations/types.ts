import type { MovieSummary } from "@/features/movies/types";

export type RecommendationMovie = Pick<
  MovieSummary,
  | "id"
  | "title"
  | "posterPath"
  | "backdropPath"
  | "releaseDate"
  | "voteAverage"
  | "overview"
>;

export type CreateRecommendationInput = Pick<
  RecommendationMovie,
  | "id"
  | "title"
  | "posterPath"
  | "backdropPath"
  | "releaseDate"
  | "voteAverage"
  | "overview"
> & {
  reason: string | null;
};

export type RecommendationEntry = {
  id: number;
  movieId: number;
  reason: string | null;
  recommendedAt: string;
};

export type RecommendationItem = RecommendationMovie &
  Pick<RecommendationEntry, "id" | "movieId" | "reason" | "recommendedAt">;

export type RecommendationGroup = {
  movie: RecommendationMovie;
  reasons: RecommendationEntry[];
  recommendedCount: number;
  lastRecommendedAt: string;
};
