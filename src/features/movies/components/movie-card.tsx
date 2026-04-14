"use client";

import Image from "next/image";
import Link from "next/link";
import type { MovieSummary } from "@/features/movies/types";
import { buildPosterUrl } from "@/features/movies/api/tmdb-client";
import { formatRating, formatReleaseDate } from "@/shared/lib/format";
import { useAppState } from "@/shared/providers/app-state";
import { Button } from "@/shared/ui/button";

type MovieCardProps = {
  movie: MovieSummary;
  mode?: "default" | "watchlist";
  onMarkWatched?: (movie: MovieSummary) => void;
};

export function MovieCard({
  movie,
  mode = "default",
  onMarkWatched,
}: MovieCardProps) {
  const { addMovieToWatchlist, removeMovieFromWatchlist, isInWatchlist } =
    useAppState();
  const inWatchlist = isInWatchlist(movie.id);
  const posterUrl = buildPosterUrl(movie.posterPath);

  function toggleWatchlist() {
    if (inWatchlist) {
      removeMovieFromWatchlist(movie.id);
      return;
    }
    addMovieToWatchlist(movie);
  }

  return (
    <article className="glass-surface group flex h-full flex-col rounded-[var(--radius-md)] p-2 transition-transform duration-200 hover:-translate-y-0.5">
      <Link
        className="relative block overflow-hidden rounded-[var(--radius-sm)]"
        href={`/movie/${movie.id}`}
      >
        {posterUrl ? (
          <Image
            alt={`${movie.title} 海報`}
            className="aspect-[var(--poster-ratio)] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            height={640}
            loading="lazy"
            src={posterUrl}
            width={430}
          />
        ) : (
          <div className="flex aspect-[var(--poster-ratio)] items-center justify-center bg-white/7 text-sm text-[var(--text-soft)]">
            No Poster
          </div>
        )}
      </Link>

      <div className="mt-3 flex flex-1 flex-col">
        <Link href={`/movie/${movie.id}`}>
          <h3 className="line-clamp-2 text-xl text-[var(--text)]">{movie.title}</h3>
        </Link>
        <div className="mt-1 flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>{formatReleaseDate(movie.releaseDate)}</span>
          <span>★ {formatRating(movie.voteAverage)}</span>
        </div>
        <p className="mt-2 line-clamp-3 text-sm text-[var(--text-soft)]">
          {movie.overview || "暫無簡介"}
        </p>
        {mode === "watchlist" ? (
          <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
            <Button
              className="w-full"
              onClick={() => onMarkWatched?.(movie)}
              type="button"
              variant="primary"
            >
              設為已看
            </Button>
            <Button
              className="w-full"
              onClick={toggleWatchlist}
              type="button"
              variant="secondary"
            >
              移出待看
            </Button>
          </div>
        ) : (
          <div className="mt-auto pt-3">
            <Button
              className="w-full"
              onClick={toggleWatchlist}
              type="button"
              variant={inWatchlist ? "secondary" : "primary"}
            >
              {inWatchlist ? "移出待看" : "加入待看"}
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
