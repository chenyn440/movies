import type {
  MovieDetail,
  MovieSummary,
  PagedResult,
  PersonCredit,
  ReviewItem,
  Trailer,
} from "@/features/movies/types";

type Dict = Record<string, unknown>;

function asRecord(value: unknown): Dict | null {
  if (typeof value === "object" && value !== null) {
    return value as Dict;
  }
  return null;
}

function toString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const numberValue = toNumber(value, Number.NaN);
  return Number.isNaN(numberValue) ? null : numberValue;
}

function toNullableString(value: unknown): string | null {
  const str = toString(value).trim();
  return str ? str : null;
}

function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  const record = asRecord(value);
  if (record) {
    return Object.values(record);
  }
  return [];
}

function mapMovieSummary(input: unknown): MovieSummary | null {
  const record = asRecord(input);
  if (!record) {
    return null;
  }

  const id = toNumber(record.id, Number.NaN);
  if (Number.isNaN(id)) {
    return null;
  }

  return {
    id,
    title: toString(record.title || record.name, "Untitled"),
    posterPath: toNullableString(record.poster_path),
    backdropPath: toNullableString(record.backdrop_path),
    releaseDate: toNullableString(record.release_date),
    voteAverage: toNullableNumber(record.vote_average),
    overview: toString(record.overview, "暫無簡介"),
  };
}

function mapCast(input: unknown): PersonCredit | null {
  const record = asRecord(input);
  if (!record) {
    return null;
  }

  const id = toNumber(record.id, Number.NaN);
  if (Number.isNaN(id)) {
    return null;
  }

  return {
    id,
    name: toString(record.name, "未知演員"),
    character: toNullableString(record.character),
    job: toNullableString(record.job),
    profilePath: toNullableString(record.profile_path),
  };
}

function mapTrailer(input: unknown): Trailer | null {
  const record = asRecord(input);
  if (!record) {
    return null;
  }

  const id = toString(record.id);
  const key = toString(record.key);
  if (!id || !key) {
    return null;
  }

  return {
    id,
    key,
    name: toString(record.name, "未命名預告"),
    site: toString(record.site, "Unknown"),
    type: toString(record.type, "Trailer"),
    official: Boolean(record.official),
  };
}

function mapReview(input: unknown): ReviewItem | null {
  const record = asRecord(input);
  if (!record) {
    return null;
  }

  const id = toString(record.id);
  if (!id) {
    return null;
  }

  return {
    id,
    author: toString(record.author, "匿名"),
    content: toString(record.content, ""),
    url: toNullableString(record.url),
    createdAt: toNullableString(record.created_at),
  };
}

export function mapMovieSearchResponse(input: unknown): PagedResult<MovieSummary> {
  const root = asRecord(input) ?? {};

  const items = toArray(root.results)
    .map((item) => mapMovieSummary(item))
    .filter((movie): movie is MovieSummary => movie !== null);

  return {
    page: toNumber(root.page, 1),
    totalPages: toNumber(root.total_pages, 1),
    totalResults: toNumber(root.total_results, items.length),
    results: items,
  };
}

export function mapMovieDetailResponse(input: unknown): MovieDetail {
  const root = asRecord(input) ?? {};
  const summary = mapMovieSummary(root) ?? {
    id: toNumber(root.id, -1),
    title: "Untitled",
    posterPath: null,
    backdropPath: null,
    releaseDate: null,
    voteAverage: null,
    overview: "暫無簡介",
  };

  const genres = toArray(root.genres)
    .map((genre) => asRecord(genre))
    .filter((genre): genre is Dict => genre !== null)
    .map((genre) => toString(genre.name))
    .filter(Boolean);

  const credits = asRecord(root.credits) ?? {};
  const cast = toArray(credits.cast)
    .map((item) => mapCast(item))
    .filter((member): member is PersonCredit => member !== null)
    .slice(0, 12);
  const director = toArray(credits.crew)
    .map((item) => mapCast(item))
    .filter((member): member is PersonCredit => member !== null)
    .find((member) => member.job?.toLowerCase() === "director")?.name;

  const videos = asRecord(root.videos) ?? {};
  const trailers = toArray(videos.results)
    .map((item) => mapTrailer(item))
    .filter((item): item is Trailer => item !== null)
    .filter((item) => item.site.toLowerCase() === "youtube")
    .slice(0, 4);

  const reviewsRoot = asRecord(root.reviews) ?? {};
  const reviews = toArray(reviewsRoot.results)
    .map((item) => mapReview(item))
    .filter((item): item is ReviewItem => item !== null)
    .slice(0, 6);

  return {
    ...summary,
    genres,
    runtime: toNullableNumber(root.runtime),
    tagline: toNullableString(root.tagline),
    cast,
    director: director ?? null,
    trailers,
    reviews,
  };
}
