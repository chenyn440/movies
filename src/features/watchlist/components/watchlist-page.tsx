"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { createRecommendation } from "@/features/recommendations/api/recommendation-service";
import { MovieCard } from "@/features/movies/components/movie-card";
import { sortWatchlist } from "@/features/watchlist/lib/watchlist-utils";
import type { WatchlistItem, WatchlistSort } from "@/features/watchlist/types";
import { cn } from "@/shared/lib/cn";
import { useAppState } from "@/shared/providers/app-state";
import { Button } from "@/shared/ui/button";
import { Modal } from "@/shared/ui/modal";

const SORT_OPTIONS: Array<{ value: WatchlistSort; label: string }> = [
  { value: "added_desc", label: "加入時間：新到舊" },
  { value: "added_asc", label: "加入時間：舊到新" },
];

export function WatchlistPage() {
  const { watchlist, removeMovieFromWatchlist } = useAppState();
  const [sort, setSort] = useState<WatchlistSort>("added_desc");
  const [targetMovie, setTargetMovie] = useState<WatchlistItem | null>(null);
  const [shouldRecommend, setShouldRecommend] = useState(false);
  const [recommendReason, setRecommendReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const sorted = sortWatchlist(watchlist, sort);

  const saveRecommendationMutation = useMutation({
    mutationFn: createRecommendation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recommendation-groups"] });
    },
  });

  function openWatchedModal(movie: WatchlistItem) {
    setTargetMovie(movie);
    setShouldRecommend(false);
    setRecommendReason("");
    setActionError(null);
  }

  function closeWatchedModal() {
    if (saveRecommendationMutation.isPending) {
      return;
    }
    setTargetMovie(null);
    setShouldRecommend(false);
    setRecommendReason("");
    setActionError(null);
  }

  async function handleConfirmWatched() {
    if (!targetMovie || saveRecommendationMutation.isPending) {
      return;
    }

    setActionError(null);
    if (shouldRecommend) {
      try {
        await saveRecommendationMutation.mutateAsync({
          id: targetMovie.id,
          title: targetMovie.title,
          posterPath: targetMovie.posterPath,
          backdropPath: targetMovie.backdropPath,
          releaseDate: targetMovie.releaseDate,
          voteAverage: targetMovie.voteAverage,
          overview: targetMovie.overview,
          reason: recommendReason.trim() || null,
        });
      } catch (error) {
        setActionError(
          error instanceof Error ? error.message : "保存推薦資料失敗",
        );
        return;
      }
    }

    removeMovieFromWatchlist(targetMovie.id);
    closeWatchedModal();
  }

  return (
    <section className="space-y-4 pb-1">
      <header className="glass-surface w-full rounded-[var(--radius-lg)] p-4 md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1 className="text-[clamp(2.6rem,10.5vw,4.5rem)] leading-none text-[var(--text)] md:text-6xl">
              待看清單
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              已收藏 {sorted.length} 部電影，可設為已看並選擇加入推薦廣場。
            </p>
            <div className="mt-3">
              <Link href="/watchlist/lottery">
                <Button type="button">Watch Lottery</Button>
              </Link>
            </div>
          </div>

          <div className="min-w-0 md:max-w-[58%]">
            <p className="text-sm text-[var(--text-soft)]">排序方式</p>
            <div className="-mx-1 mt-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max items-center gap-2">
                {SORT_OPTIONS.map((option) => (
                  <button
                    className={cn(
                      "h-9 shrink-0 whitespace-nowrap rounded-[var(--radius-sm)] border px-3 text-sm transition-colors",
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
            </div>
          </div>
        </div>
      </header>

      {sorted.length === 0 ? (
        <div className="glass-surface rounded-[var(--radius-md)] p-6 text-sm text-[var(--text-muted)]">
          還沒有加入待看電影，先到
          <Link className="mx-1 text-[var(--primary)] underline" href="/">
            搜尋頁
          </Link>
          收藏幾部吧。
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {sorted.map((movie) => (
            <MovieCard
              key={`${movie.id}-${movie.addedAt}`}
              mode="watchlist"
              movie={movie}
              onMarkWatched={(item) => openWatchedModal(item as WatchlistItem)}
            />
          ))}
        </div>
      )}

      <Modal
        confirmDisabled={
          saveRecommendationMutation.isPending ||
          (shouldRecommend && recommendReason.length > 500)
        }
        confirmLabel="確認"
        description="確認後會從待看清單移除。你可以選擇是否加入推薦廣場。"
        onConfirm={() => {
          void handleConfirmWatched();
        }}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeWatchedModal();
          }
        }}
        open={Boolean(targetMovie)}
        pending={saveRecommendationMutation.isPending}
        title={targetMovie ? `《${targetMovie.title}》已看完` : "設為已看"}
      >
        <div className="space-y-3">
          <label className="inline-flex items-center gap-2 text-sm text-[var(--text)]">
            <input
              checked={shouldRecommend}
              className="h-4 w-4 accent-[var(--primary)]"
              onChange={(event) => setShouldRecommend(event.target.checked)}
              type="checkbox"
            />
            同步加入推薦廣場
          </label>

          <div className={cn(!shouldRecommend && "opacity-45")}>
            <p className="mb-1 text-sm text-[var(--text-muted)]">推薦理由（可選）</p>
            <textarea
              className="h-24 w-full resize-none rounded-[var(--radius-sm)] border border-white/12 bg-black/25 px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              disabled={!shouldRecommend}
              maxLength={500}
              onChange={(event) => setRecommendReason(event.target.value)}
              placeholder="例如：節奏明快、配樂很棒、懸念感十足..."
              value={recommendReason}
            />
            <p className="mt-1 text-right text-xs text-[var(--text-soft)]">
              {recommendReason.length}/500
            </p>
          </div>

          {actionError ? (
            <p className="rounded-[var(--radius-sm)] border border-[var(--danger)]/45 bg-[var(--danger)]/12 px-3 py-2 text-sm text-[#ffd6d6]">
              {actionError}
            </p>
          ) : null}
        </div>
      </Modal>
    </section>
  );
}
