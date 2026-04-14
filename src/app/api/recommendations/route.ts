import { NextResponse } from "next/server";
import type { CreateRecommendationInput } from "@/features/recommendations/types";
import {
  createRecommendation,
  listRecommendationGroups,
  listRecommendations,
} from "@/server/recommendations-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REASON_LENGTH = 500;
const MAX_OVERVIEW_LENGTH = 4_000;

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function asNullableString(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return typeof value === "string" ? value : null;
}

function parseCreatePayload(input: unknown): CreateRecommendationInput | null {
  if (typeof input !== "object" || input === null) {
    return null;
  }

  const payload = input as Record<string, unknown>;
  const id = Number(payload.id);
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  if (!Number.isFinite(id) || id <= 0 || !title) {
    return null;
  }

  const reasonRaw = asNullableString(payload.reason);
  const reason = reasonRaw ? reasonRaw.trim() : null;
  if (reason && reason.length > MAX_REASON_LENGTH) {
    return null;
  }

  const overviewRaw =
    typeof payload.overview === "string" ? payload.overview.trim() : "";
  const overview = overviewRaw.slice(0, MAX_OVERVIEW_LENGTH) || "暫無簡介";

  const voteAverageRaw = payload.voteAverage;
  const voteAverage =
    typeof voteAverageRaw === "number" && Number.isFinite(voteAverageRaw)
      ? voteAverageRaw
      : null;

  return {
    id,
    title,
    posterPath: asNullableString(payload.posterPath),
    backdropPath: asNullableString(payload.backdropPath),
    releaseDate: asNullableString(payload.releaseDate),
    voteAverage,
    overview,
    reason,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 24);
  const groupByMovie = searchParams.get("groupByMovie") === "1";
  const data = groupByMovie
    ? listRecommendationGroups(limit)
    : listRecommendations(limit);
  return NextResponse.json(
    { data },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const payload = parseCreatePayload(body);
  if (!payload) {
    return errorResponse("請提供有效的推薦資料");
  }

  const data = createRecommendation(payload);
  return NextResponse.json({ data }, { status: 200 });
}
