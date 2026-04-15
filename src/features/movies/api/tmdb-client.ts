import type { TmdbAuth } from "@/features/settings/lib/tmdb-auth";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export class TmdbApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "TmdbApiError";
    this.status = status;
    this.payload = payload;
  }
}

const TMDB_REQUEST_TIMEOUT_MS = 12000;

type PrimitiveQuery = string | number | boolean | null | undefined;

type RequestTmdbOptions = {
  auth: TmdbAuth;
  query?: Record<string, PrimitiveQuery>;
  signal?: AbortSignal | undefined;
};

function buildUrl(path: string, options: RequestTmdbOptions) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${TMDB_BASE_URL}${normalizedPath}`);

  const query = options.query ?? {};
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === "") {
      continue;
    }
    url.searchParams.set(key, String(value));
  }

  if (options.auth.mode === "apiKey") {
    url.searchParams.set("api_key", options.auth.value);
  }

  return url;
}

export async function requestTmdb<T>(
  path: string,
  options: RequestTmdbOptions,
): Promise<T> {
  const url = buildUrl(path, options);
  const headers = new Headers({
    Accept: "application/json",
  });

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort(
      new DOMException("TMDB 请求超时，请检查网络连接。", "AbortError"),
    );
  }, TMDB_REQUEST_TIMEOUT_MS);

  if (options.auth.mode === "bearer") {
    headers.set("Authorization", `Bearer ${options.auth.value}`);
  }

  const requestInit: RequestInit = {
    method: "GET",
    headers,
    signal: abortController.signal,
  };

  if (options.signal) {
    options.signal.addEventListener(
      "abort",
      () => {
        abortController.abort(options.signal?.reason);
      },
      { once: true },
    );
  }

  let response: Response;
  try {
    response = await fetch(url, requestInit);
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("电影数据请求超时，请稍后重试或检查网络。");
    }

    throw new Error("电影数据请求失败，请检查网络或稍后重试。");
  }
  clearTimeout(timeoutId);

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const fallbackMessage = `TMDB API error (${response.status})`;
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "status_message" in payload &&
      typeof payload.status_message === "string"
        ? payload.status_message
        : fallbackMessage;

    throw new TmdbApiError(message, response.status, payload);
  }

  return payload as T;
}

export async function validateTmdbAuth(auth: TmdbAuth) {
  await requestTmdb("/configuration", { auth });
}

export function buildPosterUrl(path: string | null, size = "w500") {
  if (!path) {
    return null;
  }

  const searchParams = new URLSearchParams({
    path,
    size,
  });

  return `/api/tmdb-image?${searchParams.toString()}`;
}
