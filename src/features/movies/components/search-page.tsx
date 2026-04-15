"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { getPopularMovies, searchMovies } from "@/features/movies/api/movie-service";
import { MovieCard } from "@/features/movies/components/movie-card";
import { cn } from "@/shared/lib/cn";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { useAppState } from "@/shared/providers/app-state";
import { toAppError } from "@/shared/types/app-error";
import { ErrorNotice } from "@/shared/ui/error-notice";
import { Input } from "@/shared/ui/input";
import { LoadingIndicator, MovieGridSkeleton } from "@/shared/ui/loading-indicator";
import { getFallbackPopularMovies } from "@/features/movies/lib/fallback-movies";
import { rememberMovies } from "@/features/movies/lib/movie-cache";

type SearchSort = "default" | "rating_desc" | "release_desc" | "title_asc";
const SORT_OPTIONS: Array<{ value: SearchSort; label: string }> = [
  { value: "default", label: "默认" },
  { value: "rating_desc", label: "评分：高到低" },
  { value: "release_desc", label: "上映：新到旧" },
  { value: "title_asc", label: "片名：字母顺序" },
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
        throw new Error("需要先设置 TMDB 验证。");
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

  const movies = useMemo(
    () => result.data?.pages.flatMap((page) => page.results) ?? [],
    [result.data],
  );
  const appError = result.error ? toAppError(result.error) : null;
  const shouldUseFallbackPopular = !trimmedQuery && Boolean(appError);
  const visibleMovies = useMemo(() => {
    const baseMovies = shouldUseFallbackPopular
      ? getFallbackPopularMovies().results
      : movies;
    const nextMovies = [...baseMovies];
    if (sort === "rating_desc") {
      nextMovies.sort(
        (a, b) =>
          (b.voteAverage ?? Number.NEGATIVE_INFINITY) -
          (a.voteAverage ?? Number.NEGATIVE_INFINITY),
      );
    } else if (sort === "release_desc") {
      nextMovies.sort(
        (a, b) => toDateScore(b.releaseDate) - toDateScore(a.releaseDate),
      );
    } else if (sort === "title_asc") {
      nextMovies.sort((a, b) => a.title.localeCompare(b.title, "zh-Hans-CN"));
    }
    return nextMovies;
  }, [movies, shouldUseFallbackPopular, sort]);

  useEffect(() => {
    if (visibleMovies.length > 0) {
      rememberMovies(visibleMovies);
    }
  }, [visibleMovies]);

  return (
    <section className="space-y-4">
      <header className="glass-surface rounded-[var(--radius-lg)] p-4 md:p-6">
        <p className="text-sm tracking-[0.16em] text-[var(--text-muted)]">电影待看清单</p>
        <h1 className="mt-1 text-5xl text-[var(--text)] md:text-6xl">搜索电影</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          支持无限滚动、电影详情、待看清单收藏与排序。未输入关键词时默认显示热门电影。
        </p>
        <div className="mt-4">
          <Input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="输入电影名称，例如：星际穿越"
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
          message="请先通过右上角“设置 API 密钥”输入 TMDB 密钥后再搜索。"
          title="尚未设置 TMDB 密钥"
        />
      ) : null}

      {auth && trimmedQuery.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          当前显示热门电影。你也可以输入关键词搜索，例如 `星际穿越` 或 `蝙蝠侠`。
        </p>
      ) : null}

      {result.isPending && <MovieGridSkeleton />}

      {appError && trimmedQuery ? (
        <ErrorNotice
          message={appError.message}
          onAction={() => void result.refetch()}
          title="搜索发生错误"
        />
      ) : null}

      {shouldUseFallbackPopular ? (
        <div className="glass-surface rounded-[var(--radius-md)] p-4 text-sm text-[var(--text-muted)]">
          当前网络无法直接获取 TMDB 热门电影，已为你展示一组内置推荐片单。
        </div>
      ) : null}

      {!result.isPending && !appError && movies.length === 0 && trimmedQuery ? (
        <div className="glass-surface rounded-[var(--radius-md)] p-4 text-sm text-[var(--text-muted)]">
          找不到与“{trimmedQuery}”相关的结果。
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
      {isFetchingNextPage ? <LoadingIndicator label="加载更多电影..." /> : null}
    </section>
  );
}
