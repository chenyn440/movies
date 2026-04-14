"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { getPopularMovies, searchMovies } from "@/features/movies/api/movie-service";
import { MovieCard } from "@/features/movies/components/movie-card";
import { cn } from "@/shared/lib/cn";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { useAppState } from "@/shared/providers/app-state";
import { toAppError } from "@/shared/types/app-error";
import { ErrorNotice } from "@/shared/ui/error-notice";
import { Input } from "@/shared/ui/input";
import { LoadingIndicator, MovieGridSkeleton } from "@/shared/ui/loading-indicator";

type SearchSort = "default" | "rating_desc" | "release_desc" | "title_asc";
const SORT_OPTIONS: Array<{ value: SearchSort; label: string }> = [
  { value: "default", label: "預設" },
  { value: "rating_desc", label: "評分：高到低" },
  { value: "release_desc", label: "上映：新到舊" },
  { value: "title_asc", label: "片名：A-Z" },
];

function toDateScore(value: string | null) {
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
}

export function SearchPage() {
  const { auth } = useAppState();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SearchSort>("default");
  const debouncedQuery = useDebouncedValue(query, 420);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const trimmedQuery = debouncedQuery.trim();
  const authFingerprint = auth ? `${auth.mode}:${auth.value.slice(0, 6)}` : "none";

  const result = useInfiniteQuery({
    queryKey: ["movie-search", trimmedQuery, authFingerprint],
    enabled: Boolean(auth),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => {
      if (!auth) {
        throw new Error("TMDB auth is required.");
      }

      if (!trimmedQuery) {
        return getPopularMovies({
          auth,
          page: Number(pageParam),
          signal,
        });
      }

      return searchMovies({
        auth,
        query: trimmedQuery,
        page: Number(pageParam),
        signal,
      });
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page >= lastPage.totalPages) {
        return undefined;
      }
      return lastPage.page + 1;
    },
  });
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = result;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "140px" },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const movies = result.data?.pages.flatMap((page) => page.results) ?? [];
  const visibleMovies = [...movies];
  if (sort === "rating_desc") {
    visibleMovies.sort(
      (a, b) => (b.voteAverage ?? Number.NEGATIVE_INFINITY) - (a.voteAverage ?? Number.NEGATIVE_INFINITY),
    );
  } else if (sort === "release_desc") {
    visibleMovies.sort((a, b) => toDateScore(b.releaseDate) - toDateScore(a.releaseDate));
  } else if (sort === "title_asc") {
    visibleMovies.sort((a, b) => a.title.localeCompare(b.title, "zh-Hans-CN"));
  }
  const appError = result.error ? toAppError(result.error) : null;

  return (
    <section className="space-y-4">
      <header className="glass-surface rounded-[var(--radius-lg)] p-4 md:p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-[var(--text-muted)]">
          Movies To Watch
        </p>
        <h1 className="mt-1 text-5xl text-[var(--text)] md:text-6xl">搜尋電影</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          支援無限滾動、電影詳情、待看清單收藏與排序。未輸入關鍵字時預設顯示熱門電影。
        </p>
        <div className="mt-4">
          <Input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="輸入電影名稱，例如：Inception"
            value={query}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-[var(--text-soft)]">排序</span>
          {SORT_OPTIONS.map((option) => (
            <button
              className={cn(
                "h-9 rounded-[var(--radius-sm)] border px-3 text-sm transition-colors",
                sort === option.value
                  ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "border-white/14 bg-black/24 text-[var(--text-muted)] hover:bg-white/10",
              )}
              key={option.value}
              onClick={() => setSort(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      {!auth ? (
        <ErrorNotice
          message="請先透過右上角「設定 API Key」輸入 TMDB 金鑰後再搜尋。"
          title="尚未設定 TMDB API Key"
        />
      ) : null}

      {auth && trimmedQuery.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          目前顯示熱門電影。你也可以輸入關鍵字搜尋，例如 `Interstellar` 或 `The Batman`。
        </p>
      ) : null}

      {result.isPending && <MovieGridSkeleton />}

      {appError ? (
        <ErrorNotice
          message={appError.message}
          onAction={() => void result.refetch()}
          title="搜尋發生錯誤"
        />
      ) : null}

      {!result.isPending && !appError && movies.length === 0 && trimmedQuery ? (
        <div className="glass-surface rounded-[var(--radius-md)] p-4 text-sm text-[var(--text-muted)]">
          找不到與「{trimmedQuery}」相關的結果。
        </div>
      ) : null}

      {visibleMovies.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {visibleMovies.map((movie) => (
            <MovieCard key={`${movie.id}-${movie.title}`} movie={movie} />
          ))}
        </div>
      ) : null}

      <div ref={sentinelRef} />
      {isFetchingNextPage ? <LoadingIndicator label="載入更多電影..." /> : null}
    </section>
  );
}
