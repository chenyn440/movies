"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { getRecommendationGroups } from "@/features/recommendations/api/recommendation-service";
import type { RecommendationEntry } from "@/features/recommendations/types";
import { buildPosterUrl } from "@/features/movies/api/tmdb-client";
import { formatRating, formatReleaseDate } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";

function formatRecommendedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "時間未知";
  }

  return date.toLocaleString("zh-TW", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function RecommendationReasonList({ reasons }: { reasons: RecommendationEntry[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {reasons.map((reason) => (
        <li
          className="rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.03] px-3 py-2"
          key={reason.id}
        >
          <p className="text-sm leading-6 text-[var(--text-soft)]">
            {reason.reason || "沒有填寫推薦理由"}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {formatRecommendedAt(reason.recommendedAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function RecommendationsPage() {
  const queryClient = useQueryClient();
  const groupsQuery = useQuery({
    queryKey: ["recommendation-groups"],
    queryFn: () => getRecommendationGroups(24),
  });

  return (
    <section className="space-y-4">
      <header className="glass-surface rounded-[var(--radius-lg)] p-4 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-5xl text-[var(--text)] md:text-6xl">推薦廣場</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              所有訪客都能看到推薦內容；同一部電影可有多條推薦理由。
            </p>
          </div>
          <Button
            onClick={() =>
              void queryClient.invalidateQueries({
                queryKey: ["recommendation-groups"],
              })
            }
            type="button"
            variant="secondary"
          >
            重新整理
          </Button>
        </div>
      </header>

      {groupsQuery.isPending ? (
        <p className="text-sm text-[var(--text-muted)]">載入推薦廣場中...</p>
      ) : null}

      {groupsQuery.isError ? (
        <div className="rounded-[var(--radius-sm)] border border-[var(--danger)]/40 bg-[var(--danger)]/12 p-3 text-sm text-[#ffd6d6]">
          推薦廣場載入失敗：{groupsQuery.error.message}
        </div>
      ) : null}

      {groupsQuery.data && groupsQuery.data.length === 0 ? (
        <div className="glass-surface rounded-[var(--radius-md)] p-5 text-sm text-[var(--text-muted)]">
          目前還沒有推薦內容，先到
          <Link className="mx-1 text-[var(--primary)] underline" href="/watchlist">
            待看清單
          </Link>
          把電影設為已看並推薦吧。
        </div>
      ) : null}

      {groupsQuery.data && groupsQuery.data.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {groupsQuery.data.map((group) => {
            const posterUrl = buildPosterUrl(group.movie.posterPath, "w342");
            return (
              <article
                className="glass-surface rounded-[var(--radius-md)] p-4"
                key={group.movie.id}
              >
                <div className="flex gap-3">
                  <div className="w-[4.5rem] shrink-0">
                    {posterUrl ? (
                      <Image
                        alt={`${group.movie.title} 海報`}
                        className="aspect-[var(--poster-ratio)] w-full rounded-[var(--radius-sm)] object-cover"
                        height={260}
                        src={posterUrl}
                        width={176}
                      />
                    ) : (
                      <div className="flex aspect-[var(--poster-ratio)] items-center justify-center rounded-[var(--radius-sm)] bg-white/8 text-xs text-[var(--text-soft)]">
                        No Poster
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="line-clamp-2 text-3xl leading-tight text-[var(--text)]">
                      {group.movie.title}
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {formatReleaseDate(group.movie.releaseDate)} · ★{" "}
                      {formatRating(group.movie.voteAverage)}
                    </p>
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      共 {group.recommendedCount} 則推薦 · 最近更新{" "}
                      {formatRecommendedAt(group.lastRecommendedAt)}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-[var(--text-soft)]">
                      {group.movie.overview || "暫無簡介"}
                    </p>
                    <div className="mt-3">
                      <Link href={`/movie/${group.movie.id}`}>
                        <Button type="button" variant="secondary">
                          查看電影詳情
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                <RecommendationReasonList reasons={group.reasons} />
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
