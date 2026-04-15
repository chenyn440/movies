import { NextResponse } from "next/server";
import { getFallbackPopularMovies } from "@/features/movies/lib/fallback-movies";
import { getPopularCache } from "@/server/movie-cache-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const normalizedPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const cached = getPopularCache(normalizedPage);

  if (!cached) {
    return NextResponse.json(
      {
        data: getFallbackPopularMovies(normalizedPage),
        meta: {
          source: "tmdb-fallback",
          stale: true,
        },
      },
      { status: 200 },
    );
  }

  return NextResponse.json(cached, { status: 200 });
}
