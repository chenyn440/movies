#!/usr/bin/env node
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DEFAULT_TMDB_BEARER_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmY2FmMjU3MTJiNmZiNTJjOGM5NDk1MmY1ZjEyZGI4NiIsIm5iZiI6MTc3NjE1MDEyNy4zNjgsInN1YiI6IjY5ZGRlNjZmZDU3MDZkZThhNzcwYjRkZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.2mH7ZhRf2A5VITXWQ6q8jHRhoHhJpJX7-HZsQF3yUX0";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_LANGUAGE = "zh-CN";
const TMDB_FALLBACK_LANGUAGE = "en-US";
const PAGE = 1;

function resolveDbPath() {
  const envPath = process.env.APP_DB_PATH?.trim();
  if (envPath) {
    return path.isAbsolute(envPath) ? envPath : path.join(process.cwd(), envPath);
  }
  return path.join(process.cwd(), "data", "app.sqlite");
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function extractApiKeyFromBearerToken(token) {
  const parts = token.trim().split(".");
  if (!parts[1]) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    return typeof payload.aud === "string" ? payload.aud : null;
  } catch {
    return null;
  }
}

function createDb() {
  const dbPath = resolveDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS movie_cache_items (
      movie_id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      poster_path TEXT,
      backdrop_path TEXT,
      release_date TEXT,
      vote_average REAL,
      overview TEXT NOT NULL,
      runtime INTEGER,
      tagline TEXT,
      director TEXT,
      genres_json TEXT NOT NULL,
      cast_json TEXT NOT NULL,
      trailers_json TEXT NOT NULL,
      reviews_json TEXT NOT NULL,
      fetched_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS movie_cache_popular (
      page INTEGER NOT NULL,
      movie_id INTEGER NOT NULL,
      sort_order INTEGER NOT NULL,
      cached_at TEXT NOT NULL,
      PRIMARY KEY (page, movie_id)
    );
  `);
  return db;
}

function buildUrl(pathname, query = {}) {
  const url = new URL(`${TMDB_BASE_URL}${pathname}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

async function requestTmdb(pathname, apiKey, query = {}) {
  const url = buildUrl(pathname, { ...query, api_key: apiKey });
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`TMDB request failed: ${response.status} ${text}`);
  }
  return response.json();
}

function pickLocalized(primary, fallback) {
  if (typeof primary === "string" && primary.trim()) {
    return primary.trim();
  }
  if (typeof fallback === "string" && fallback.trim()) {
    return fallback.trim();
  }
  return null;
}

async function fetchMovieDetail(apiKey, movieId) {
  const [zhDetail, enDetail, enCredits] = await Promise.all([
    requestTmdb(`/movie/${movieId}`, apiKey, {
      append_to_response: "credits,videos,reviews",
      language: TMDB_LANGUAGE,
    }),
    requestTmdb(`/movie/${movieId}`, apiKey, {
      language: TMDB_FALLBACK_LANGUAGE,
    }).catch(() => null),
    requestTmdb(`/movie/${movieId}/credits`, apiKey, {
      language: TMDB_FALLBACK_LANGUAGE,
    }).catch(() => null),
  ]);

  const englishCastById = new Map();
  if (Array.isArray(enCredits?.cast)) {
    for (const item of enCredits.cast) {
      if (typeof item?.id === "number") {
        englishCastById.set(item.id, item);
      }
    }
  }

  const director =
    zhDetail?.credits?.crew?.find?.((item) => item?.job?.toLowerCase?.() === "director") ??
    enCredits?.crew?.find?.((item) => item?.job?.toLowerCase?.() === "director") ??
    null;

  return {
    id: Number(zhDetail.id),
    title:
      pickLocalized(zhDetail.title, enDetail?.title) ??
      pickLocalized(zhDetail.original_title, enDetail?.original_title) ??
      "Untitled",
    posterPath: typeof zhDetail.poster_path === "string" ? zhDetail.poster_path : null,
    backdropPath: typeof zhDetail.backdrop_path === "string" ? zhDetail.backdrop_path : null,
    releaseDate:
      typeof zhDetail.release_date === "string" ? zhDetail.release_date : null,
    voteAverage:
      typeof zhDetail.vote_average === "number" ? zhDetail.vote_average : null,
    overview:
      pickLocalized(zhDetail.overview, enDetail?.overview) ?? "暂无简介",
    runtime: typeof zhDetail.runtime === "number" ? zhDetail.runtime : null,
    tagline: pickLocalized(zhDetail.tagline, enDetail?.tagline),
    director: pickLocalized(director?.name, director?.original_name),
    genres: Array.isArray(zhDetail.genres)
      ? zhDetail.genres
          .map((item) => (typeof item?.name === "string" ? item.name : null))
          .filter(Boolean)
      : [],
    cast: Array.isArray(zhDetail?.credits?.cast)
      ? zhDetail.credits.cast.slice(0, 12).map((item) => {
          const english = englishCastById.get(item?.id);
          return {
            id: Number(item?.id ?? 0),
            name: pickLocalized(item?.name, english?.name) ?? "未知演员",
            character: pickLocalized(item?.character, english?.character),
            job: null,
            profilePath:
              typeof item?.profile_path === "string" ? item.profile_path : null,
          };
        })
      : [],
    trailers: Array.isArray(zhDetail?.videos?.results)
      ? zhDetail.videos.results
          .filter((item) => item?.site?.toLowerCase?.() === "youtube")
          .slice(0, 4)
          .map((item) => ({
            id: String(item.id ?? ""),
            key: String(item.key ?? ""),
            name: typeof item.name === "string" ? item.name : "未命名预告",
            site: typeof item.site === "string" ? item.site : "YouTube",
            type: typeof item.type === "string" ? item.type : "Trailer",
            official: Boolean(item.official),
          }))
          .filter((item) => item.id && item.key)
      : [],
    reviews: Array.isArray(zhDetail?.reviews?.results)
      ? zhDetail.reviews.results.slice(0, 6).map((item) => ({
          id: String(item.id ?? ""),
          author: typeof item.author === "string" ? item.author : "匿名",
          content: typeof item.content === "string" ? item.content : "",
          url: typeof item.url === "string" ? item.url : null,
          createdAt:
            typeof item.created_at === "string" ? item.created_at : null,
        }))
      : [],
  };
}

async function main() {
  const bearer =
    process.env.NEXT_PUBLIC_TMDB_BEARER_TOKEN?.trim() || DEFAULT_TMDB_BEARER_TOKEN;
  const apiKey =
    process.env.NEXT_PUBLIC_TMDB_API_KEY?.trim() || extractApiKeyFromBearerToken(bearer);

  if (!apiKey) {
    throw new Error("TMDB api key is missing");
  }

  const db = createDb();
  const cachedAt = new Date().toISOString();
  const popular = await requestTmdb("/movie/popular", apiKey, {
    page: PAGE,
    language: TMDB_LANGUAGE,
  });

  const ids = Array.isArray(popular.results)
    ? popular.results
        .map((item) => Number(item?.id))
        .filter((id) => Number.isFinite(id) && id > 0)
    : [];
  const details = [];
  for (const id of ids) {
    const detail = await fetchMovieDetail(apiKey, id);
    details.push(detail);
  }

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
      VALUES (?, ?, ?, ?)`,
  );

  const tx = db.transaction(() => {
    for (const movie of details) {
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

    deletePopular.run(PAGE);
    details.forEach((movie, index) => {
      insertPopular.run(PAGE, movie.id, index, cachedAt);
    });
  });

  tx();
  console.log(`Warmed ${details.length} popular movies into ${resolveDbPath()}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
