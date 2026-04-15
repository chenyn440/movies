export const TMDB_AUTH_STORAGE_KEY = "movies-to-watch.tmdb-auth.v1";
const DEFAULT_TMDB_BEARER_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmY2FmMjU3MTJiNmZiNTJjOGM5NDk1MmY1ZjEyZGI4NiIsIm5iZiI6MTc3NjE1MDEyNy4zNjgsInN1YiI6IjY5ZGRlNjZmZDU3MDZkZThhNzcwYjRkZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.2mH7ZhRf2A5VITXWQ6q8jHRhoHhJpJX7-HZsQF3yUX0";

export type TmdbAuth = {
  mode: "bearer" | "apiKey";
  value: string;
};

export type TmdbAuthResolution = {
  auth: TmdbAuth | null;
  source: "runtime" | "env" | "none";
};

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  if (typeof globalThis.atob === "function") {
    return globalThis.atob(padded);
  }

  return null;
}

export function extractApiKeyFromBearerToken(token: string) {
  const trimmed = token.trim();
  const parts = trimmed.split(".");
  const payloadPart = parts[1];

  if (!payloadPart) {
    return null;
  }

  try {
    const decoded = decodeBase64Url(payloadPart);
    if (!decoded) {
      return null;
    }

    const payload = JSON.parse(decoded) as {
      aud?: unknown;
    };

    return typeof payload.aud === "string" && /^[a-z0-9]{32}$/i.test(payload.aud)
      ? payload.aud
      : null;
  } catch {
    return null;
  }
}

export function parseTmdbAuthInput(input: string): TmdbAuth | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("Bearer ")) {
    const token = trimmed.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return null;
    }
    return { mode: "bearer", value: token };
  }

  if (/^[a-z0-9]{32}$/i.test(trimmed)) {
    return { mode: "apiKey", value: trimmed };
  }

  if (trimmed.length >= 24) {
    return { mode: "bearer", value: trimmed };
  }

  return null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseStoredTmdbAuth(input: unknown): TmdbAuth | null {
  if (!isObject(input)) {
    return null;
  }

  const mode = input.mode;
  const value = input.value;

  if ((mode === "bearer" || mode === "apiKey") && typeof value === "string") {
    const sanitized = value.trim();
    if (sanitized.length === 0) {
      return null;
    }
    return { mode, value: sanitized };
  }

  return null;
}

export function getEnvTmdbAuth(): TmdbAuth | null {
  const bearer =
    process.env.NEXT_PUBLIC_TMDB_BEARER_TOKEN?.trim() ||
    (process.env.NODE_ENV === "test" ? "" : DEFAULT_TMDB_BEARER_TOKEN);
  if (bearer) {
    const derivedApiKey = extractApiKeyFromBearerToken(bearer);
    if (derivedApiKey) {
      return { mode: "apiKey", value: derivedApiKey };
    }

    return { mode: "bearer", value: bearer };
  }

  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY?.trim();
  if (apiKey) {
    return { mode: "apiKey", value: apiKey };
  }

  return null;
}

export function readTmdbAuthFromStorage(
  storage: Pick<Storage, "getItem"> | null,
): TmdbAuth | null {
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(TMDB_AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return parseStoredTmdbAuth(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeTmdbAuthToStorage(
  storage: Pick<Storage, "setItem"> | null,
  auth: TmdbAuth,
) {
  if (!storage) {
    return;
  }
  storage.setItem(TMDB_AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function clearTmdbAuthFromStorage(
  storage: Pick<Storage, "removeItem"> | null,
) {
  storage?.removeItem(TMDB_AUTH_STORAGE_KEY);
}

export function resolveTmdbAuth(storage: Storage | null): TmdbAuthResolution {
  const runtimeAuth = readTmdbAuthFromStorage(storage);
  if (runtimeAuth) {
    return { auth: runtimeAuth, source: "runtime" };
  }

  const envAuth = getEnvTmdbAuth();
  if (envAuth) {
    return { auth: envAuth, source: "env" };
  }

  return { auth: null, source: "none" };
}
