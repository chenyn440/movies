import { getAppDb } from "@/server/app-db";
import type { MovieDetail, MovieSummary, PagedResult } from "@/features/movies/types";

type CachedPopularMeta = {
  cachedAt: string;
  stale: boolean;
  source: "cache" | "stale-cache";
};

type CachedPopularResult = {
  data: PagedResult<MovieSummary>;
  meta: CachedPopularMeta;
};

type CachedMovieRow = {
  movie_id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  vote_average: number | null;
  overview: string;
  runtime: number | null;
  tagline: string | null;
  director: string | null;
  genres_json: string;
  cast_json: string;
  trailers_json: string;
  reviews_json: string;
  fetched_at: string;
};

const POPULAR_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const POPULAR_CACHE_PAGE_SIZE = 20;

function parseJsonArray<T>(value: string): T[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function mapMovieSummary(row: CachedMovieRow): MovieSummary {
  return {
    id: row.movie_id,
    title: row.title,
    posterPath: row.poster_path,
    backdropPath: row.backdrop_path,
    releaseDate: row.release_date,
    voteAverage: row.vote_average,
    overview: row.overview,
  };
}

function mapMovieDetail(row: CachedMovieRow): MovieDetail {
  return {
    ...mapMovieSummary(row),
    runtime: row.runtime,
    tagline: row.tagline,
    director: row.director,
    genres: parseJsonArray<string>(row.genres_json),
    cast: parseJsonArray<MovieDetail["cast"][number]>(row.cast_json),
    trailers: parseJsonArray<MovieDetail["trailers"][number]>(row.trailers_json),
    reviews: parseJsonArray<MovieDetail["reviews"][number]>(row.reviews_json),
  };
}

function isStale(cachedAt: string) {
  const time = new Date(cachedAt).getTime();
  if (Number.isNaN(time)) {
    return true;
  }
  return Date.now() - time > POPULAR_CACHE_TTL_MS;
}

export function getPopularCache(page = 1): CachedPopularResult | null {
  const db = getAppDb();
  const totalCountRow = db
    .prepare(`SELECT COUNT(*) AS count FROM movie_cache_popular`)
    .get() as { count: number } | undefined;
  const totalResults = totalCountRow?.count ?? 0;
  const rows = db
    .prepare(
      `SELECT
        items.movie_id,
        items.title,
        items.poster_path,
        items.backdrop_path,
        items.release_date,
        items.vote_average,
        items.overview,
        items.runtime,
        items.tagline,
        items.director,
        items.genres_json,
        items.cast_json,
        items.trailers_json,
        items.reviews_json,
        items.fetched_at,
        popular.cached_at
      FROM movie_cache_popular AS popular
      INNER JOIN movie_cache_items AS items
        ON items.movie_id = popular.movie_id
      WHERE popular.page = ?
      ORDER BY popular.sort_order ASC`,
    )
    .all(page) as Array<CachedMovieRow & { cached_at: string }>;

  if (rows.length === 0) {
    return null;
  }

  const cachedAt = rows[0]?.cached_at ?? rows[0]?.fetched_at ?? new Date().toISOString();
  const stale = isStale(cachedAt);

  return {
    data: {
      page,
      totalPages: Math.max(1, Math.ceil(totalResults / POPULAR_CACHE_PAGE_SIZE)),
      totalResults,
      results: rows.map((row) => mapMovieSummary(row)),
    },
    meta: {
      cachedAt,
      stale,
      source: stale ? "stale-cache" : "cache",
    },
  };
}

export function getMovieDetailCache(movieId: number): MovieDetail | null {
  const db = getAppDb();
  const row = db
    .prepare(
      `SELECT
        movie_id,
        title,
        poster_path,
        backdrop_path,
        release_date,
        vote_average,
        overview,
        runtime,
        tagline,
        director,
        genres_json,
        cast_json,
        trailers_json,
        reviews_json,
        fetched_at
      FROM movie_cache_items
      WHERE movie_id = ?`,
    )
    .get(movieId) as CachedMovieRow | undefined;

  return row ? mapMovieDetail(row) : null;
}

export function replacePopularCache(page: number, movies: MovieDetail[], cachedAt: string) {
  const db = getAppDb();
  const insertMovie = db.prepare(
    `INSERT INTO movie_cache_items (
      movie_id, title, poster_path, backdrop_path, release_date, vote_average,
      overview, runtime, tagline, director, genres_json, cast_json,
      trailers_json, reviews_json, fetched_at
    ) VALUES (
      @movie_id, @title, @poster_path, @backdrop_path, @release_date, @vote_average,
      @overview, @runtime, @tagline, @director, @genres_json, @cast_json,
      @trailers_json, @reviews_json, @fetched_at
    )
    ON CONFLICT(movie_id) DO UPDATE SET
      title = excluded.title,
      poster_path = excluded.poster_path,
      backdrop_path = excluded.backdrop_path,
      release_date = excluded.release_date,
      vote_average = excluded.vote_average,
      overview = excluded.overview,
      runtime = excluded.runtime,
      tagline = excluded.tagline,
      director = excluded.director,
      genres_json = excluded.genres_json,
      cast_json = excluded.cast_json,
      trailers_json = excluded.trailers_json,
      reviews_json = excluded.reviews_json,
      fetched_at = excluded.fetched_at`,
  );
  const deletePopular = db.prepare(`DELETE FROM movie_cache_popular WHERE page = ?`);
  const insertPopular = db.prepare(
    `INSERT INTO movie_cache_popular (page, movie_id, sort_order, cached_at)
     VALUES (@page, @movie_id, @sort_order, @cached_at)`,
  );

  const tx = db.transaction(() => {
    for (const movie of movies) {
      insertMovie.run({
        movie_id: movie.id,
        title: movie.title,
        poster_path: movie.posterPath,
        backdrop_path: movie.backdropPath,
        release_date: movie.releaseDate,
        vote_average: movie.voteAverage,
        overview: movie.overview,
        runtime: movie.runtime,
        tagline: movie.tagline,
        director: movie.director,
        genres_json: JSON.stringify(movie.genres),
        cast_json: JSON.stringify(movie.cast),
        trailers_json: JSON.stringify(movie.trailers),
        reviews_json: JSON.stringify(movie.reviews),
        fetched_at: cachedAt,
      });
    }

    deletePopular.run(page);
    movies.forEach((movie, index) => {
      insertPopular.run({
        page,
        movie_id: movie.id,
        sort_order: index,
        cached_at: cachedAt,
      });
    });
  });

  tx();
}

export function getPopularCacheTtlMs() {
  return POPULAR_CACHE_TTL_MS;
}

export function getPopularCachePageSize() {
  return POPULAR_CACHE_PAGE_SIZE;
}
