import type { MovieSummary } from "@/features/movies/types";
import type { WatchlistItem, WatchlistSort } from "@/features/watchlist/types";

export const WATCHLIST_STORAGE_KEY = "movies-to-watch.watchlist.v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseWatchlist(input: unknown): WatchlistItem[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      const id = Number(item.id);
      const title = typeof item.title === "string" ? item.title : "";
      const addedAt =
        typeof item.addedAt === "string" ? item.addedAt : new Date().toISOString();
      if (!Number.isFinite(id) || !title) {
        return null;
      }

      return {
        id,
        title,
        posterPath: typeof item.posterPath === "string" ? item.posterPath : null,
        backdropPath:
          typeof item.backdropPath === "string" ? item.backdropPath : null,
        releaseDate:
          typeof item.releaseDate === "string" ? item.releaseDate : null,
        voteAverage:
          typeof item.voteAverage === "number" && Number.isFinite(item.voteAverage)
            ? item.voteAverage
            : null,
        overview: typeof item.overview === "string" ? item.overview : "暫無簡介",
        addedAt,
      } satisfies WatchlistItem;
    })
    .filter((item): item is WatchlistItem => item !== null);
}

export function readWatchlistFromStorage(
  storage: Pick<Storage, "getItem"> | null,
): WatchlistItem[] {
  if (!storage) {
    return [];
  }
  try {
    const raw = storage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return parseWatchlist(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function writeWatchlistToStorage(
  storage: Pick<Storage, "setItem"> | null,
  list: WatchlistItem[],
) {
  if (!storage) {
    return;
  }
  storage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(list));
}

export function toWatchlistItem(movie: MovieSummary): WatchlistItem {
  return {
    id: movie.id,
    title: movie.title,
    posterPath: movie.posterPath,
    backdropPath: movie.backdropPath,
    releaseDate: movie.releaseDate,
    voteAverage: movie.voteAverage,
    overview: movie.overview,
    addedAt: new Date().toISOString(),
  };
}

export function addToWatchlist(
  current: WatchlistItem[],
  movie: MovieSummary,
): WatchlistItem[] {
  const exists = current.some((item) => item.id === movie.id);
  if (exists) {
    return current;
  }
  return [toWatchlistItem(movie), ...current];
}

export function removeFromWatchlist(current: WatchlistItem[], movieId: number) {
  return current.filter((item) => item.id !== movieId);
}

export function isWatchlisted(current: WatchlistItem[], movieId: number) {
  return current.some((item) => item.id === movieId);
}

export function sortWatchlist(list: WatchlistItem[], sort: WatchlistSort) {
  const normalized = [...list];
  normalized.sort((a, b) => {
    const timeA = new Date(a.addedAt).getTime();
    const timeB = new Date(b.addedAt).getTime();
    return sort === "added_asc" ? timeA - timeB : timeB - timeA;
  });
  return normalized;
}
