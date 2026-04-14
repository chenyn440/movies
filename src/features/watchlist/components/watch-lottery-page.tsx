"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildPosterUrl } from "@/features/movies/api/tmdb-client";
import { buildSlotTrack, pickRandomMovie } from "@/features/watchlist/lib/watch-lottery";
import { sortWatchlist } from "@/features/watchlist/lib/watchlist-utils";
import type {
  LotteryResult,
  LotteryStatus,
  WatchlistItem,
} from "@/features/watchlist/types";
import { formatRating, formatReleaseDate } from "@/shared/lib/format";
import { useAppState } from "@/shared/providers/app-state";
import { Button } from "@/shared/ui/button";

const ROW_HEIGHT = 84;
const VISIBLE_ROWS = 3;
const SPIN_DURATION_MS = 2800;

export function WatchLotteryPage() {
  const { watchlist } = useAppState();
  const baseList = useMemo(
    () => sortWatchlist(watchlist, "added_desc"),
    [watchlist],
  );

  const [status, setStatus] = useState<LotteryStatus>("idle");
  const [result, setResult] = useState<LotteryResult>(null);
  const [track, setTrack] = useState<WatchlistItem[]>([]);
  const [offsetPx, setOffsetPx] = useState(0);
  const [animate, setAnimate] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const displayTrack = useMemo(() => {
    if (track.length > 0) {
      return track;
    }
    return buildSlotTrack(baseList, 4);
  }, [track, baseList]);

  function resetTimer() {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function spinLottery() {
    if (status === "spinning" || baseList.length === 0) {
      return;
    }

    const winner = pickRandomMovie(baseList);
    if (!winner) {
      return;
    }

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setResult(null);
    setStatus("spinning");

    if (reducedMotion || baseList.length === 1) {
      setTrack(buildSlotTrack(baseList, 4));
      setAnimate(false);
      setOffsetPx(0);
      setResult(winner);
      setStatus("done");
      return;
    }

    const cycles = 12;
    const nextTrack = buildSlotTrack(baseList, cycles + 3);
    const winnerIndex = baseList.findIndex(
      (item) => item.id === winner.id && item.addedAt === winner.addedAt,
    );
    const finalIndex = baseList.length * cycles + Math.max(0, winnerIndex);
    const finalOffset = Math.max(0, finalIndex * ROW_HEIGHT - ROW_HEIGHT);

    resetTimer();
    setTrack(nextTrack);
    setAnimate(false);
    setOffsetPx(0);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setAnimate(true);
        setOffsetPx(finalOffset);
      });
    });

    timerRef.current = window.setTimeout(() => {
      setAnimate(false);
      setResult(winner);
      setStatus("done");
      timerRef.current = null;
    }, SPIN_DURATION_MS + 60);
  }

  const canSpin = baseList.length > 0 && status !== "spinning";
  const resultPoster = buildPosterUrl(result?.posterPath ?? null);

  return (
    <section className="flex flex-col gap-4 xl:h-[calc(100dvh-9.5rem)]">
      <header className="glass-surface rounded-[var(--radius-lg)] p-4 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-5xl text-[var(--text)] md:text-6xl">
              Watch Lottery
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              從待看清單隨機抽一部，決定今天先看哪一部。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button disabled={!canSpin} onClick={spinLottery} type="button">
              {status === "spinning" ? "抽籤中..." : "開始抽籤"}
            </Button>
            <Link href="/watchlist">
              <Button type="button" variant="secondary">
                返回待看清單
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {baseList.length === 0 ? (
        <div className="glass-surface rounded-[var(--radius-md)] p-6 text-sm text-[var(--text-muted)]">
          目前沒有可抽籤的電影，先到
          <Link className="mx-1 text-[var(--primary)] underline" href="/">
            搜尋頁
          </Link>
          加入待看清單吧。
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="glass-surface flex min-h-0 flex-col rounded-[var(--radius-md)] p-4">
            <h2 className="text-3xl text-[var(--text)]">滾軸抽籤</h2>
            <div className="relative mt-3 overflow-hidden rounded-[var(--radius-md)] border border-white/10 bg-black/35">
              <div
                className="relative"
                style={{ height: `${ROW_HEIGHT * VISIBLE_ROWS}px` }}
              >
                <ul
                  className={animate ? "transition-transform duration-[2800ms] ease-out" : ""}
                  style={{ transform: `translateY(-${offsetPx}px)` }}
                >
                  {displayTrack.map((movie, index) => (
                    <li
                      className="flex items-center justify-between border-b border-white/8 px-4"
                      key={`${movie.id}-${movie.addedAt}-${index}`}
                      style={{ height: `${ROW_HEIGHT}px` }}
                    >
                      <span className="line-clamp-1 text-base text-[var(--text)]">
                        {movie.title}
                      </span>
                      <span className="ml-2 text-sm text-[var(--text-soft)]">
                        ★ {formatRating(movie.voteAverage)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="pointer-events-none absolute left-0 top-0 h-14 w-full bg-gradient-to-b from-[#070b12] to-transparent" />
                <div className="pointer-events-none absolute bottom-0 left-0 h-14 w-full bg-gradient-to-t from-[#070b12] to-transparent" />
                <div
                  className="pointer-events-none absolute inset-x-2 rounded-[var(--radius-sm)] border border-[var(--primary)]/45 bg-[var(--primary)]/8"
                  style={{
                    top: `${ROW_HEIGHT}px`,
                    height: `${ROW_HEIGHT}px`,
                  }}
                />
              </div>
            </div>
          </section>

          <section className="glass-surface flex min-h-0 flex-col rounded-[var(--radius-md)] p-4">
            <h2 className="text-3xl text-[var(--text)]">抽籤結果</h2>
            {!result ? (
              <p className="mt-3 min-h-0 flex-1 overflow-y-auto text-sm text-[var(--text-muted)]">
                {status === "spinning"
                  ? "正在滾動中，結果即將揭曉..."
                  : "點擊「開始抽籤」隨機選出一部電影。"}
              </p>
            ) : (
              <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="rounded-[var(--radius-md)] bg-white/[0.03] p-3">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="mx-auto w-36 shrink-0 sm:mx-0">
                      {resultPoster ? (
                        <Image
                          alt={`${result.title} 海報`}
                          className="aspect-[var(--poster-ratio)] w-full rounded-[var(--radius-sm)] object-cover"
                          height={460}
                          src={resultPoster}
                          width={310}
                        />
                      ) : (
                        <div className="flex aspect-[var(--poster-ratio)] items-center justify-center rounded-[var(--radius-sm)] bg-white/8 text-[var(--text-soft)]">
                          No Poster
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-3xl leading-tight text-[var(--text)]">
                        {result.title}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {formatReleaseDate(result.releaseDate)} · ★{" "}
                        {formatRating(result.voteAverage)}
                      </p>
                      <p className="mt-2 line-clamp-6 text-sm leading-7 text-[var(--text-soft)]">
                        {result.overview || "暫無簡介"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link href={`/movie/${result.id}`}>
                          <Button type="button">前往詳情</Button>
                        </Link>
                        <Button onClick={spinLottery} type="button" variant="secondary">
                          再抽一次
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
