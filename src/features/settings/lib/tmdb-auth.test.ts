import { afterEach, describe, expect, it } from "vitest";
import {
  extractApiKeyFromBearerToken,
  getEnvTmdbAuth,
  parseTmdbAuthInput,
  parseStoredTmdbAuth,
  resolveTmdbAuth,
  TMDB_AUTH_STORAGE_KEY,
} from "./tmdb-auth";

describe("tmdb-auth", () => {
  const originalBearer = process.env.NEXT_PUBLIC_TMDB_BEARER_TOKEN;
  const originalApiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  afterEach(() => {
    if (originalBearer === undefined) {
      delete process.env.NEXT_PUBLIC_TMDB_BEARER_TOKEN;
    } else {
      process.env.NEXT_PUBLIC_TMDB_BEARER_TOKEN = originalBearer;
    }

    if (originalApiKey === undefined) {
      delete process.env.NEXT_PUBLIC_TMDB_API_KEY;
    } else {
      process.env.NEXT_PUBLIC_TMDB_API_KEY = originalApiKey;
    }
  });

  it("parses bearer token with prefix", () => {
    expect(parseTmdbAuthInput("Bearer abc.def.ghi")).toEqual({
      mode: "bearer",
      value: "abc.def.ghi",
    });
  });

  it("parses 32-char api key", () => {
    expect(parseTmdbAuthInput("1234567890abcdef1234567890abcdef")).toEqual({
      mode: "apiKey",
      value: "1234567890abcdef1234567890abcdef",
    });
  });

  it("rejects invalid input", () => {
    expect(parseTmdbAuthInput("bad-key")).toBeNull();
    expect(parseStoredTmdbAuth({ mode: "bad", value: "x" })).toBeNull();
  });

  it("prefers runtime auth over env auth", () => {
    process.env.NEXT_PUBLIC_TMDB_BEARER_TOKEN = "env-token";

    const storage = {
      getItem: (key: string) =>
        key === TMDB_AUTH_STORAGE_KEY
          ? JSON.stringify({
              mode: "apiKey",
              value: "1234567890abcdef1234567890abcdef",
            })
          : null,
    } as Pick<Storage, "getItem">;

    expect(resolveTmdbAuth(storage as Storage)).toEqual({
      auth: {
        mode: "apiKey",
        value: "1234567890abcdef1234567890abcdef",
      },
      source: "runtime",
    });
  });

  it("falls back to env auth", () => {
    process.env.NEXT_PUBLIC_TMDB_API_KEY = "1234567890abcdef1234567890abcdef";
    expect(getEnvTmdbAuth()).toEqual({
      mode: "apiKey",
      value: "1234567890abcdef1234567890abcdef",
    });
  });

  it("extracts api key from tmdb bearer token payload", () => {
    expect(
      extractApiKeyFromBearerToken(
        "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmY2FmMjU3MTJiNmZiNTJjOGM5NDk1MmY1ZjEyZGI4NiIsIm5iZiI6MTc3NjE1MDEyNy4zNjgsInN1YiI6IjY5ZGRlNjZmZDU3MDZkZThhNzcwYjRkZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.2mH7ZhRf2A5VITXWQ6q8jHRhoHhJpJX7-HZsQF3yUX0",
      ),
    ).toBe("fcaf25712b6fb52c8c94952f5f12db86");
  });
});
