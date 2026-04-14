"use client";

import {
  type Dispatch,
  type SetStateAction,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import type { MovieSummary } from "@/features/movies/types";
import {
  clearTmdbAuthFromStorage,
  resolveTmdbAuth,
  type TmdbAuth,
  writeTmdbAuthToStorage,
} from "@/features/settings/lib/tmdb-auth";
import {
  addToWatchlist,
  isWatchlisted,
  readWatchlistFromStorage,
  removeFromWatchlist,
  writeWatchlistToStorage,
} from "@/features/watchlist/lib/watchlist-utils";
import type { WatchlistItem } from "@/features/watchlist/types";

type AppStateContextValue = {
  auth: TmdbAuth | null;
  authSource: "runtime" | "env" | "none";
  hasAuth: boolean;
  setRuntimeAuth: (auth: TmdbAuth) => void;
  clearRuntimeAuth: () => void;
  watchlist: WatchlistItem[];
  setWatchlist: Dispatch<SetStateAction<WatchlistItem[]>>;
  addMovieToWatchlist: (movie: MovieSummary) => void;
  removeMovieFromWatchlist: (movieId: number) => void;
  isInWatchlist: (movieId: number) => boolean;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage;
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState(() => resolveTmdbAuth(getStorage()));
  const [watchlist, setWatchlist] = useState(() =>
    readWatchlistFromStorage(getStorage()),
  );

  useEffect(() => {
    writeWatchlistToStorage(getStorage(), watchlist);
  }, [watchlist]);

  function setRuntimeAuth(auth: TmdbAuth) {
    writeTmdbAuthToStorage(getStorage(), auth);
    setAuthState({ auth, source: "runtime" });
  }

  function clearRuntimeAuth() {
    clearTmdbAuthFromStorage(getStorage());
    setAuthState(resolveTmdbAuth(getStorage()));
  }

  function addMovieToWatchlist(movie: MovieSummary) {
    setWatchlist((current) => addToWatchlist(current, movie));
  }

  function removeMovieFromWatchlist(movieId: number) {
    setWatchlist((current) => removeFromWatchlist(current, movieId));
  }

  function isInWatchlist(movieId: number) {
    return isWatchlisted(watchlist, movieId);
  }

  return (
    <AppStateContext.Provider
      value={{
        auth: authState.auth,
        authSource: authState.source,
        hasAuth: Boolean(authState.auth),
        setRuntimeAuth,
        clearRuntimeAuth,
        watchlist,
        setWatchlist,
        addMovieToWatchlist,
        removeMovieFromWatchlist,
        isInWatchlist,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return context;
}
