import type { MovieDetail, MovieSummary } from "@/features/movies/types";

const MOVIE_CACHE_STORAGE_KEY = "movies-to-watch.movie-cache.v1";
const MAX_CACHED_MOVIES = 120;

type StoredMovieCache = {
  updatedAt: string;
  movies: MovieSummary[];
};

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage;
}

function isMovieSummary(value: unknown): value is MovieSummary {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "number" &&
    typeof record.title === "string" &&
    (typeof record.posterPath === "string" || record.posterPath === null) &&
    (typeof record.backdropPath === "string" || record.backdropPath === null) &&
    (typeof record.releaseDate === "string" || record.releaseDate === null) &&
    (typeof record.voteAverage === "number" ||
      record.voteAverage === null ||
      record.voteAverage === undefined) &&
    typeof record.overview === "string"
  );
}

export function readMovieCache(): MovieSummary[] {
  const storage = getStorage();
  if (!storage) {
    return [];
  }

  try {
    const raw = storage.getItem(MOVIE_CACHE_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as Partial<StoredMovieCache>;
    if (!Array.isArray(parsed.movies)) {
      return [];
    }

    return parsed.movies.filter((movie): movie is MovieSummary => isMovieSummary(movie));
  } catch {
    return [];
  }
}

export function writeMovieCache(movies: MovieSummary[]) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  const deduped = new Map<number, MovieSummary>();
  for (const movie of movies) {
    deduped.set(movie.id, movie);
  }

  const payload: StoredMovieCache = {
    updatedAt: new Date().toISOString(),
    movies: Array.from(deduped.values()).slice(0, MAX_CACHED_MOVIES),
  };

  storage.setItem(MOVIE_CACHE_STORAGE_KEY, JSON.stringify(payload));
}

export function rememberMovies(movies: MovieSummary[]) {
  if (movies.length === 0) {
    return;
  }

  const existing = readMovieCache();
  writeMovieCache([...movies, ...existing]);
}

export function getCachedMovieDetail(movieId: number): MovieDetail | null {
  const summary = readMovieCache().find((movie) => movie.id === movieId);
  if (!summary) {
    return null;
  }

  return {
    ...summary,
    genres: [],
    runtime: null,
    tagline: null,
    cast: [],
    director: null,
    trailers: [],
    reviews: [],
  };
}
