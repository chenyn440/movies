import type {
  CreateRecommendationInput,
  RecommendationEntry,
  RecommendationGroup,
  RecommendationItem,
  RecommendationMovie,
} from "@/features/recommendations/types";

type ApiResponse<T> = {
  data: T;
};

const RECOMMENDATIONS_ENDPOINT = "/api/recommendations";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function resolveEndpoint(path: string) {
  if (typeof window === "undefined") {
    return path;
  }
  return new URL(path, window.location.origin).toString();
}

function parseRecommendation(input: unknown): RecommendationItem | null {
  if (!isRecord(input)) {
    return null;
  }

  const id = Number(input.id);
  const movieId = Number(input.movieId);
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!Number.isFinite(id) || !Number.isFinite(movieId) || !title) {
    return null;
  }

  return {
    id,
    movieId,
    title,
    posterPath: typeof input.posterPath === "string" ? input.posterPath : null,
    backdropPath:
      typeof input.backdropPath === "string" ? input.backdropPath : null,
    releaseDate: typeof input.releaseDate === "string" ? input.releaseDate : null,
    voteAverage:
      typeof input.voteAverage === "number" && Number.isFinite(input.voteAverage)
        ? input.voteAverage
        : null,
    overview: typeof input.overview === "string" ? input.overview : "暫無簡介",
    reason: typeof input.reason === "string" ? input.reason : null,
    recommendedAt:
      typeof input.recommendedAt === "string"
        ? input.recommendedAt
        : new Date().toISOString(),
  };
}

function parseRecommendationMovie(input: unknown): RecommendationMovie | null {
  if (!isRecord(input)) {
    return null;
  }

  const id = Number(input.id);
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!Number.isFinite(id) || !title) {
    return null;
  }

  return {
    id,
    title,
    posterPath: typeof input.posterPath === "string" ? input.posterPath : null,
    backdropPath:
      typeof input.backdropPath === "string" ? input.backdropPath : null,
    releaseDate: typeof input.releaseDate === "string" ? input.releaseDate : null,
    voteAverage:
      typeof input.voteAverage === "number" && Number.isFinite(input.voteAverage)
        ? input.voteAverage
        : null,
    overview: typeof input.overview === "string" ? input.overview : "暫無簡介",
  };
}

function parseRecommendationEntry(input: unknown): RecommendationEntry | null {
  if (!isRecord(input)) {
    return null;
  }

  const id = Number(input.id);
  const movieId = Number(input.movieId);
  if (!Number.isFinite(id) || !Number.isFinite(movieId)) {
    return null;
  }

  return {
    id,
    movieId,
    reason: typeof input.reason === "string" ? input.reason : null,
    recommendedAt:
      typeof input.recommendedAt === "string"
        ? input.recommendedAt
        : new Date().toISOString(),
  };
}

function parseRecommendationGroup(input: unknown): RecommendationGroup | null {
  if (!isRecord(input)) {
    return null;
  }

  const movie = parseRecommendationMovie(input.movie);
  const recommendedCount = Number(input.recommendedCount);
  const lastRecommendedAt =
    typeof input.lastRecommendedAt === "string"
      ? input.lastRecommendedAt
      : new Date().toISOString();
  const reasonsRaw = Array.isArray(input.reasons) ? input.reasons : null;
  if (!movie || !Number.isFinite(recommendedCount) || !reasonsRaw) {
    return null;
  }

  const reasons = reasonsRaw
    .map((reason) => parseRecommendationEntry(reason))
    .filter((reason): reason is RecommendationEntry => reason !== null);

  return {
    movie,
    reasons,
    recommendedCount,
    lastRecommendedAt,
  };
}

async function parseApiResponse<T>(
  response: Response,
  parser: (raw: unknown) => T | null,
): Promise<T> {
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      isRecord(payload) && typeof payload.error === "string"
        ? payload.error
        : "請求推薦資料失敗";
    throw new Error(message);
  }

  if (!isRecord(payload) || !("data" in payload)) {
    throw new Error("推薦資料格式錯誤");
  }

  const data = parser((payload as ApiResponse<unknown>).data);
  if (!data) {
    throw new Error("推薦資料格式錯誤");
  }

  return data;
}

export async function getRecommendations(limit = 24): Promise<RecommendationItem[]> {
  const endpoint = new URL(resolveEndpoint(RECOMMENDATIONS_ENDPOINT));
  endpoint.searchParams.set("limit", String(limit));

  const response = await fetch(endpoint.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  return parseApiResponse(response, (raw) => {
    if (!Array.isArray(raw)) {
      return null;
    }

    const list = raw
      .map((item) => parseRecommendation(item))
      .filter((item): item is RecommendationItem => item !== null);

    return list;
  });
}

export async function getRecommendationGroups(
  limit = 24,
): Promise<RecommendationGroup[]> {
  const endpoint = new URL(resolveEndpoint(RECOMMENDATIONS_ENDPOINT));
  endpoint.searchParams.set("limit", String(limit));
  endpoint.searchParams.set("groupByMovie", "1");

  const response = await fetch(endpoint.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  return parseApiResponse(response, (raw) => {
    if (!Array.isArray(raw)) {
      return null;
    }

    const groups = raw
      .map((item) => parseRecommendationGroup(item))
      .filter((item): item is RecommendationGroup => item !== null);
    return groups;
  });
}

export async function createRecommendation(
  input: CreateRecommendationInput,
): Promise<RecommendationItem> {
  const response = await fetch(resolveEndpoint(RECOMMENDATIONS_ENDPOINT), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseApiResponse(response, (raw) => parseRecommendation(raw));
}
