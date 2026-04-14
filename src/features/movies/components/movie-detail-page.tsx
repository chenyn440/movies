"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { getMovieDetail } from "@/features/movies/api/movie-service";
import { buildPosterUrl } from "@/features/movies/api/tmdb-client";
import { useAppState } from "@/shared/providers/app-state";
import { toAppError } from "@/shared/types/app-error";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { ErrorNotice } from "@/shared/ui/error-notice";
import { LoadingIndicator } from "@/shared/ui/loading-indicator";
import { formatRating, formatReleaseDate, formatRuntime } from "@/shared/lib/format";

type MovieDetailPageProps = {
  movieId: number;
};

export function MovieDetailPage({ movieId }: MovieDetailPageProps) {
  const { auth, addMovieToWatchlist, removeMovieFromWatchlist, isInWatchlist } =
    useAppState();
  const inWatchlist = isInWatchlist(movieId);
  const authFingerprint = auth ? `${auth.mode}:${auth.value.slice(0, 6)}` : "none";

  const result = useQuery({
    queryKey: ["movie-detail", movieId, authFingerprint],
    enabled: Boolean(auth),
    queryFn: ({ signal }) => {
      if (!auth) {
        throw new Error("TMDB auth is required.");
      }
      return getMovieDetail({ auth, id: movieId, signal });
    },
  });

  if (!auth) {
    return (
      <ErrorNotice
        message="請先設定 TMDB 金鑰後再查看電影詳情。"
        title="尚未設定 TMDB API Key"
      />
    );
  }

  if (result.isPending) {
    return <LoadingIndicator label="電影詳情載入中..." />;
  }

  if (result.error) {
    const appError = toAppError(result.error);
    return (
      <ErrorNotice
        message={appError.message}
        onAction={() => void result.refetch()}
        title="電影詳情載入失敗"
      />
    );
  }

  if (!result.data) {
    return <LoadingIndicator label="電影詳情載入中..." />;
  }

  const movie = result.data;
  const backdropUrl = buildPosterUrl(movie.backdropPath, "w1280");
  const posterUrl = buildPosterUrl(movie.posterPath, "w500");

  return (
    <section className="space-y-4">
      <div className="glass-surface overflow-hidden rounded-[var(--radius-lg)]">
        {backdropUrl ? (
          <div className="relative h-52 w-full md:h-72">
            <Image
              alt={`${movie.title} 背景`}
              className="h-full w-full object-cover"
              fill
              priority
              src={backdropUrl}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
          </div>
        ) : (
          <div className="h-20 bg-white/5" />
        )}

        <div className="relative -mt-8 flex flex-col gap-4 p-4 md:-mt-16 md:flex-row md:p-6">
          <div className="mx-auto w-[210px] shrink-0 md:mx-0">
            {posterUrl ? (
              <Image
                alt={`${movie.title} 海報`}
                className="w-full rounded-[var(--radius-md)] object-cover shadow-2xl"
                height={640}
                src={posterUrl}
                width={430}
              />
            ) : (
              <div className="flex aspect-[var(--poster-ratio)] items-center justify-center rounded-[var(--radius-md)] bg-white/8 text-sm text-[var(--text-soft)]">
                No Poster
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-5xl text-[var(--text)] md:text-6xl">{movie.title}</h1>
            {movie.tagline ? (
              <p className="mt-1 text-sm text-[var(--text-muted)]">{movie.tagline}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>★ {formatRating(movie.voteAverage)}</Badge>
              <Badge>{formatReleaseDate(movie.releaseDate)}</Badge>
              <Badge>{formatRuntime(movie.runtime)}</Badge>
              {movie.director ? <Badge>導演：{movie.director}</Badge> : null}
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
              {movie.overview || "暫無簡介"}
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => {
                  if (inWatchlist) {
                    removeMovieFromWatchlist(movie.id);
                    return;
                  }
                  addMovieToWatchlist(movie);
                }}
                type="button"
                variant={inWatchlist ? "secondary" : "primary"}
              >
                {inWatchlist ? "已加入待看" : "加入待看清單"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-surface rounded-[var(--radius-md)] p-4">
          <h2 className="text-3xl text-[var(--text)]">演員陣容</h2>
          {movie.cast.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--text-muted)]">暫無演員資料</p>
          ) : (
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {movie.cast.map((member) => (
                <li
                  className="rounded-[var(--radius-sm)] border border-white/8 bg-black/20 px-3 py-2"
                  key={`${member.id}-${member.character}`}
                >
                  <p className="text-sm text-[var(--text)]">{member.name}</p>
                  <p className="text-xs text-[var(--text-soft)]">
                    {member.character || "角色未知"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass-surface rounded-[var(--radius-md)] p-4">
          <h2 className="text-3xl text-[var(--text)]">預告片</h2>
          {movie.trailers.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--text-muted)]">暫無預告片</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {movie.trailers.map((trailer) => (
                <li key={trailer.id}>
                  <a
                    className="block rounded-[var(--radius-sm)] border border-white/12 bg-black/18 px-3 py-2 text-sm text-[var(--text)] transition-colors hover:bg-white/12"
                    href={`https://www.youtube.com/watch?v=${trailer.key}`}
                    rel="noreferrer noopener"
                    target="_blank"
                  >
                    {trailer.name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="glass-surface rounded-[var(--radius-md)] p-4">
        <h2 className="text-3xl text-[var(--text)]">評論</h2>
        {movie.reviews.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--text-muted)]">暫無評論</p>
        ) : (
          <ul className="mt-2 space-y-3">
            {movie.reviews.map((review) => (
              <li
                className="rounded-[var(--radius-sm)] border border-white/10 bg-black/18 p-3"
                key={review.id}
              >
                <p className="text-sm text-[var(--text)]">{review.author}</p>
                <p className="mt-1 line-clamp-5 text-sm text-[var(--text-muted)]">
                  {review.content}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
