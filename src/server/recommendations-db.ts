import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import type {
  CreateRecommendationInput,
  RecommendationEntry,
  RecommendationGroup,
  RecommendationItem,
  RecommendationMovie,
} from "@/features/recommendations/types";

type SqliteDb = InstanceType<typeof Database>;
type RecommendationRow = {
  id: number;
  movie_id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  vote_average: number | null;
  overview: string;
  reason: string | null;
  recommended_at: string;
};

const MAX_LIMIT = 100;

declare global {
  var __moviesToWatchRecommendationDb: SqliteDb | undefined;
}

function resolveDbPath() {
  const envPath = process.env.RECOMMENDATIONS_DB_PATH?.trim();
  if (envPath) {
    return path.isAbsolute(envPath)
      ? envPath
      : path.join(process.cwd(), envPath);
  }

  return path.join(process.cwd(), "data", "recommendations.sqlite");
}

function ensureSchema(db: SqliteDb) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      poster_path TEXT,
      backdrop_path TEXT,
      release_date TEXT,
      vote_average REAL,
      overview TEXT NOT NULL,
      reason TEXT,
      recommended_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_recommendations_movie_id
      ON recommendations (movie_id);
    CREATE INDEX IF NOT EXISTS idx_recommendations_recommended_at
      ON recommendations (recommended_at DESC);
  `);

  const tableSqlRow = db
    .prepare(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='recommendations'",
    )
    .get() as { sql?: string } | undefined;

  if (tableSqlRow?.sql?.includes("movie_id INTEGER NOT NULL UNIQUE")) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS recommendations_v2 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        movie_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        poster_path TEXT,
        backdrop_path TEXT,
        release_date TEXT,
        vote_average REAL,
        overview TEXT NOT NULL,
        reason TEXT,
        recommended_at TEXT NOT NULL
      );
      INSERT INTO recommendations_v2 (
        movie_id, title, poster_path, backdrop_path, release_date, vote_average, overview, reason, recommended_at
      )
      SELECT movie_id, title, poster_path, backdrop_path, release_date, vote_average, overview, reason, recommended_at
      FROM recommendations;
      DROP TABLE recommendations;
      ALTER TABLE recommendations_v2 RENAME TO recommendations;
      CREATE INDEX IF NOT EXISTS idx_recommendations_movie_id
        ON recommendations (movie_id);
      CREATE INDEX IF NOT EXISTS idx_recommendations_recommended_at
        ON recommendations (recommended_at DESC);
    `);
  }
}

function getDb() {
  if (global.__moviesToWatchRecommendationDb) {
    return global.__moviesToWatchRecommendationDb;
  }

  const dbPath = resolveDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  ensureSchema(db);

  global.__moviesToWatchRecommendationDb = db;
  return db;
}

function mapRow(row: RecommendationRow): RecommendationItem {
  return {
    id: row.id,
    movieId: row.movie_id,
    title: row.title,
    posterPath: row.poster_path,
    backdropPath: row.backdrop_path,
    releaseDate: row.release_date,
    voteAverage: row.vote_average,
    overview: row.overview,
    reason: row.reason,
    recommendedAt: row.recommended_at,
  };
}

export function listRecommendations(limit: number): RecommendationItem[] {
  const normalizedLimit = Number.isFinite(limit)
    ? Math.max(1, Math.min(MAX_LIMIT, Math.floor(limit)))
    : 24;

  const db = getDb();
  const statement = db.prepare(
    `SELECT id, movie_id, title, poster_path, backdrop_path, release_date, vote_average, overview, reason, recommended_at
     FROM recommendations
     ORDER BY datetime(recommended_at) DESC
     LIMIT ?`,
  );

  const rows = statement.all(normalizedLimit) as RecommendationRow[];
  return rows.map(mapRow);
}

function mapMovieFromRow(row: RecommendationRow): RecommendationMovie {
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

function mapEntryFromRow(row: RecommendationRow): RecommendationEntry {
  return {
    id: row.id,
    movieId: row.movie_id,
    reason: row.reason,
    recommendedAt: row.recommended_at,
  };
}

export function listRecommendationGroups(limit: number): RecommendationGroup[] {
  const normalizedLimit = Number.isFinite(limit)
    ? Math.max(1, Math.min(MAX_LIMIT, Math.floor(limit)))
    : 24;
  const db = getDb();

  const movieRows = db
    .prepare(
      `SELECT
        movie_id,
        MAX(id) AS id,
        title,
        poster_path,
        backdrop_path,
        release_date,
        vote_average,
        overview,
        COUNT(*) AS recommended_count,
        MAX(recommended_at) AS last_recommended_at
      FROM recommendations
      GROUP BY movie_id
      ORDER BY datetime(last_recommended_at) DESC
      LIMIT ?`,
    )
    .all(normalizedLimit) as Array<
    RecommendationRow & {
      recommended_count: number;
      last_recommended_at: string;
    }
  >;

  const reasonsStatement = db.prepare(
    `SELECT id, movie_id, title, poster_path, backdrop_path, release_date, vote_average, overview, reason, recommended_at
     FROM recommendations
     WHERE movie_id = ?
     ORDER BY datetime(recommended_at) DESC, id DESC`,
  );

  return movieRows.map((movieRow) => {
    const reasonsRows = reasonsStatement.all(movieRow.movie_id) as RecommendationRow[];
    const reasons = reasonsRows.map(mapEntryFromRow);

    return {
      movie: mapMovieFromRow(movieRow),
      reasons,
      recommendedCount: Number(movieRow.recommended_count) || reasons.length,
      lastRecommendedAt: movieRow.last_recommended_at || movieRow.recommended_at,
    } satisfies RecommendationGroup;
  });
}

export function createRecommendation(
  input: CreateRecommendationInput,
): RecommendationItem {
  const db = getDb();
  const now = new Date().toISOString();

  const statement = db.prepare(`
    INSERT INTO recommendations (
      movie_id, title, poster_path, backdrop_path, release_date, vote_average, overview, reason, recommended_at
    ) VALUES (
      @movie_id, @title, @poster_path, @backdrop_path, @release_date, @vote_average, @overview, @reason, @recommended_at
    )
  `);

  const result = statement.run({
    movie_id: input.id,
    title: input.title,
    poster_path: input.posterPath,
    backdrop_path: input.backdropPath,
    release_date: input.releaseDate,
    vote_average: input.voteAverage,
    overview: input.overview,
    reason: input.reason,
    recommended_at: now,
  });

  const fetchStatement = db.prepare(
    `SELECT id, movie_id, title, poster_path, backdrop_path, release_date, vote_average, overview, reason, recommended_at
     FROM recommendations
     WHERE id = ?`,
  );
  const row = fetchStatement.get(result.lastInsertRowid) as
    | RecommendationRow
    | undefined;
  if (!row) {
    throw new Error("推薦資料保存失敗");
  }

  return mapRow(row);
}
