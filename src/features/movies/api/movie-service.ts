import type { TmdbAuth } from "@/features/settings/lib/tmdb-auth";
import type { MovieDetail, MovieSummary, PagedResult } from "@/features/movies/types";
import { mapMovieDetailResponse, mapMovieSearchResponse } from "./mappers";
import { requestTmdb } from "./tmdb-client";

const TMDB_LANGUAGE = "zh-CN";
const TMDB_FALLBACK_LANGUAGE = "en-US";
const CJK_REGEXP = /[\u3400-\u9fff\u3040-\u30ff]/;
const LATIN_REGEXP = /[A-Za-z]/;

type SearchMoviesArgs = {
  auth: TmdbAuth;
  query: string;
  page: number;
  signal?: AbortSignal;
};

type MovieDetailArgs = {
  auth: TmdbAuth;
  id: number;
  signal?: AbortSignal;
};

type CachedPopularResponse = {
  data: PagedResult<MovieSummary>;
  meta: {
    source: "cache" | "stale-cache" | "tmdb-fallback";
    cachedAt?: string;
    stale?: boolean;
  };
};

type CreditCandidate = {
  id: number;
  name: string | null;
  originalName: string | null;
  character: string | null;
  originalCharacter: string | null;
  job: string | null;
};

type ParsedCredits = {
  cast: CreditCandidate[];
  crew: CreditCandidate[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  return value as Record<string, unknown>;
}

function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  const record = asRecord(value);
  return record ? Object.values(record) : [];
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return Number.NaN;
}

function hasCjk(value: string | null) {
  return Boolean(value && CJK_REGEXP.test(value));
}

function hasLatin(value: string | null) {
  return Boolean(value && LATIN_REGEXP.test(value));
}

function pickLocalizedText(
  chineseCandidate: string | null,
  englishCandidate: string | null,
  fallbackCandidate: string | null,
) {
  if (hasCjk(chineseCandidate)) {
    return chineseCandidate;
  }
  if (hasCjk(englishCandidate)) {
    return englishCandidate;
  }
  if (hasLatin(englishCandidate)) {
    return englishCandidate;
  }
  if (hasLatin(chineseCandidate)) {
    return chineseCandidate;
  }
  return chineseCandidate ?? englishCandidate ?? fallbackCandidate;
}

function parseCreditCandidate(value: unknown): CreditCandidate | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const id = toNumber(record.id);
  if (Number.isNaN(id)) {
    return null;
  }

  return {
    id,
    name: toStringOrNull(record.name),
    originalName: toStringOrNull(record.original_name),
    character: toStringOrNull(record.character),
    originalCharacter: toStringOrNull(record.original_character),
    job: toStringOrNull(record.job),
  };
}

function parseCredits(value: unknown): ParsedCredits {
  const root = asRecord(value) ?? {};

  return {
    cast: toArray(root.cast)
      .map((item) => parseCreditCandidate(item))
      .filter((item): item is CreditCandidate => item !== null),
    crew: toArray(root.crew)
      .map((item) => parseCreditCandidate(item))
      .filter((item): item is CreditCandidate => item !== null),
  };
}

function applyLocalizationFallbacks(
  detail: ReturnType<typeof mapMovieDetailResponse>,
  englishDetailPayload: unknown,
  englishCreditsPayload: unknown,
) {
  const englishRoot = asRecord(englishDetailPayload) ?? {};
  const englishTitle = toStringOrNull(englishRoot.title);
  const englishOriginalTitle = toStringOrNull(englishRoot.original_title);
  const englishOverview = toStringOrNull(englishRoot.overview);
  const englishTagline = toStringOrNull(englishRoot.tagline);

  const localized = {
    ...detail,
    title:
      pickLocalizedText(detail.title, englishTitle, englishOriginalTitle) ??
      detail.title,
    overview:
      pickLocalizedText(detail.overview, englishOverview, null) ?? detail.overview,
    tagline: pickLocalizedText(detail.tagline, englishTagline, null),
  };

  const englishCredits = parseCredits(englishCreditsPayload);
  const englishCastById = new Map<number, CreditCandidate>();
  for (const credit of englishCredits.cast) {
    englishCastById.set(credit.id, credit);
  }

  localized.cast = localized.cast.map((member) => {
    const english = englishCastById.get(member.id);
    if (!english) {
      return member;
    }

    return {
      ...member,
      name:
        pickLocalizedText(member.name, english.name, english.originalName) ??
        member.name,
      character: pickLocalizedText(
        member.character,
        english.character,
        english.originalCharacter,
      ),
    };
  });

  const englishDirector = englishCredits.crew.find(
    (credit) => credit.job?.toLowerCase() === "director",
  );
  localized.director = pickLocalizedText(
    localized.director,
    englishDirector?.name ?? null,
    englishDirector?.originalName ?? null,
  );

  return localized;
}

export async function searchMovies({
  auth,
  query,
  page,
  signal,
}: SearchMoviesArgs) {
  const payload = await requestTmdb<unknown>("/search/movie", {
    auth,
    query: {
      query,
      page,
      include_adult: false,
      language: TMDB_LANGUAGE,
    },
    signal,
  });

  return mapMovieSearchResponse(payload);
}

export async function getMovieDetail({ auth, id, signal }: MovieDetailArgs) {
  const detailPromise = requestTmdb<unknown>(`/movie/${id}`, {
    auth,
    query: {
      append_to_response: "credits,videos,reviews",
      language: TMDB_LANGUAGE,
    },
    signal,
  });

  const englishDetailPromise = requestTmdb<unknown>(`/movie/${id}`, {
    auth,
    query: {
      language: TMDB_FALLBACK_LANGUAGE,
    },
    signal,
  }).catch(() => null);

  const englishCreditsPromise = requestTmdb<unknown>(`/movie/${id}/credits`, {
    auth,
    query: {
      language: TMDB_FALLBACK_LANGUAGE,
    },
    signal,
  }).catch(() => null);

  const [detailPayload, englishDetailPayload, englishCreditsPayload] =
    await Promise.all([detailPromise, englishDetailPromise, englishCreditsPromise]);

  const detail = mapMovieDetailResponse(detailPayload);
  if (!englishDetailPayload || !englishCreditsPayload) {
    return detail;
  }

  return applyLocalizationFallbacks(
    detail,
    englishDetailPayload,
    englishCreditsPayload,
  );
}

export async function getPopularMovies({
  auth,
  page,
  signal,
}: {
  auth: TmdbAuth;
  page: number;
  signal?: AbortSignal;
}) {
  const payload = await requestTmdb<unknown>("/movie/popular", {
    auth,
    query: {
      page,
      language: TMDB_LANGUAGE,
    },
    signal,
  });

  return mapMovieSearchResponse(payload);
}

export async function getCachedPopularMovies({
  page,
  signal,
}: {
  page: number;
  signal?: AbortSignal;
}) {
  const endpoint =
    typeof window === "undefined"
      ? `http://127.0.0.1:3000/api/movies/popular?page=${page}`
      : `/api/movies/popular?page=${page}`;
  const requestInit: RequestInit = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };
  if (signal) {
    requestInit.signal = signal;
  }

  const response = await fetch(endpoint, requestInit);

  const payload = (await response.json().catch(() => null)) as CachedPopularResponse | null;
  if (!response.ok || !payload?.data) {
    throw new Error("热门电影缓存暂不可用");
  }

  return payload;
}

export async function getCachedMovieDetail(movieId: number, signal?: AbortSignal) {
  const endpoint =
    typeof window === "undefined"
      ? `http://127.0.0.1:3000/api/movies/${movieId}`
      : `/api/movies/${movieId}`;
  const requestInit: RequestInit = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };
  if (signal) {
    requestInit.signal = signal;
  }

  const response = await fetch(endpoint, requestInit);

  const payload = (await response.json().catch(() => null)) as { data?: MovieDetail } | null;
  if (!response.ok || !payload?.data) {
    throw new Error("电影详情缓存暂不可用");
  }

  return payload.data;
}
