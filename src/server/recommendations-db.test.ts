import { afterEach, describe, expect, it } from "vitest";

describe("recommendations-db", () => {
  afterEach(() => {
    delete process.env.RECOMMENDATIONS_DB_PATH;
  });

  it("creates multiple records for same movie and groups reasons", async () => {
    process.env.RECOMMENDATIONS_DB_PATH = `tmp/recommendations-test-${Date.now()}.sqlite`;
    const dbModule = await import("./recommendations-db");

    dbModule.createRecommendation({
      id: 1,
      title: "Movie A",
      posterPath: null,
      backdropPath: null,
      releaseDate: null,
      voteAverage: 8.1,
      overview: "overview",
      reason: "第一条",
    });

    dbModule.createRecommendation({
      id: 1,
      title: "Movie A",
      posterPath: null,
      backdropPath: null,
      releaseDate: null,
      voteAverage: 8.1,
      overview: "overview",
      reason: "第二条",
    });

    const rows = dbModule.listRecommendations(10);
    expect(rows.length).toBe(2);
    expect(rows[0]?.movieId).toBe(1);
    expect(rows[1]?.movieId).toBe(1);

    const groups = dbModule.listRecommendationGroups(10);
    expect(groups.length).toBe(1);
    expect(groups[0]?.recommendedCount).toBe(2);
    expect(groups[0]?.reasons.length).toBe(2);
  });
});
