import { NextRequest, NextResponse } from "next/server";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";
const ALLOWED_SIZES = new Set([
  "w92",
  "w154",
  "w185",
  "w342",
  "w500",
  "w780",
  "w1280",
  "original",
]);

function sanitizeImagePath(value: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) {
    return null;
  }

  if (trimmed.includes("..")) {
    return null;
  }

  return trimmed;
}

export async function GET(request: NextRequest) {
  const path = sanitizeImagePath(request.nextUrl.searchParams.get("path"));
  const sizeParam = request.nextUrl.searchParams.get("size") ?? "w500";
  const size = ALLOWED_SIZES.has(sizeParam) ? sizeParam : "w500";

  if (!path) {
    return NextResponse.json({ error: "invalid image path" }, { status: 400 });
  }

  const upstreamUrl = `${TMDB_IMAGE_BASE_URL}/${size}${path}`;

  try {
    const response = await fetch(upstreamUrl, {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
      cache: "force-cache",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "failed to fetch image" },
        { status: response.status },
      );
    }

    const contentType =
      response.headers.get("content-type") ?? "image/jpeg";
    const cacheControl =
      response.headers.get("cache-control") ??
      "public, max-age=86400, s-maxage=86400";
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "content-type": contentType,
        "cache-control": cacheControl,
      },
    });
  } catch {
    return NextResponse.json({ error: "image proxy failed" }, { status: 502 });
  }
}
