import { NextResponse } from "next/server";
import { getMovieDetailCache } from "@/server/movie-cache-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const movieId = Number(id);
  if (!Number.isFinite(movieId) || movieId <= 0) {
    return NextResponse.json({ error: "无效的电影 id" }, { status: 400 });
  }

  const data = getMovieDetailCache(movieId);
  if (!data) {
    return NextResponse.json({ error: "电影详情缓存暂不可用" }, { status: 404 });
  }

  return NextResponse.json({ data }, { status: 200 });
}
