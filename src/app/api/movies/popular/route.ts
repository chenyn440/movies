import { NextResponse } from "next/server";
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
      { error: "热门电影缓存暂不可用" },
      { status: 503 },
    );
  }

  return NextResponse.json(cached, { status: 200 });
}
