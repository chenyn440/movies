import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

type SqliteDb = InstanceType<typeof Database>;

declare global {
  // eslint-disable-next-line no-var
  var __moviesToWatchAppDb: SqliteDb | undefined;
}

function resolveDbPath() {
  const envPath = process.env.APP_DB_PATH?.trim();
  if (envPath) {
    return path.isAbsolute(envPath) ? envPath : path.join(process.cwd(), envPath);
  }
  return path.join(process.cwd(), "data", "app.sqlite");
}

function ensureSchema(db: SqliteDb) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);

    CREATE TABLE IF NOT EXISTS watchlist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      movie_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      poster_path TEXT,
      backdrop_path TEXT,
      release_date TEXT,
      vote_average REAL,
      overview TEXT NOT NULL,
      added_at TEXT NOT NULL,
      UNIQUE(user_id, movie_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist_items (user_id);
    CREATE INDEX IF NOT EXISTS idx_watchlist_added_at ON watchlist_items (added_at DESC);

    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      username_snapshot TEXT NOT NULL,
      movie_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      poster_path TEXT,
      backdrop_path TEXT,
      release_date TEXT,
      vote_average REAL,
      overview TEXT NOT NULL,
      reason TEXT,
      recommended_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_recommendations_movie_id
      ON recommendations (movie_id);
    CREATE INDEX IF NOT EXISTS idx_recommendations_recommended_at
      ON recommendations (recommended_at DESC);

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
    CREATE INDEX IF NOT EXISTS idx_movie_cache_items_fetched_at
      ON movie_cache_items (fetched_at DESC);

    CREATE TABLE IF NOT EXISTS movie_cache_popular (
      page INTEGER NOT NULL,
      movie_id INTEGER NOT NULL,
      sort_order INTEGER NOT NULL,
      cached_at TEXT NOT NULL,
      PRIMARY KEY (page, movie_id),
      FOREIGN KEY (movie_id) REFERENCES movie_cache_items(movie_id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_movie_cache_popular_page_sort
      ON movie_cache_popular (page, sort_order ASC);
  `);
}

export function getAppDb() {
  if (global.__moviesToWatchAppDb) {
    return global.__moviesToWatchAppDb;
  }

  const dbPath = resolveDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  ensureSchema(db);
  global.__moviesToWatchAppDb = db;
  return db;
}
