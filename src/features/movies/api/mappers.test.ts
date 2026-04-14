import { describe, expect, it } from "vitest";
import { mapMovieDetailResponse, mapMovieSearchResponse } from "./mappers";

describe("movie mappers", () => {
  it("maps search response with object-shaped results", () => {
    const payload = {
      page: "2",
      total_pages: "4",
      total_results: 5,
      results: {
        first: {
          id: 9,
          title: "Interstellar",
          poster_path: "/x.jpg",
          release_date: "2014-11-07",
          vote_average: 8.6,
          overview: "Space epic",
        },
      },
    };
    const mapped = mapMovieSearchResponse(payload);
    expect(mapped.page).toBe(2);
    expect(mapped.totalPages).toBe(4);
    expect(mapped.results[0]?.title).toBe("Interstellar");
  });

  it("maps detail response and tolerates irregular arrays", () => {
    const payload = {
      id: 1,
      title: "The Batman",
      credits: {
        cast: {
          a: { id: 10, name: "Actor A", character: "Hero" },
        },
        crew: [{ id: 20, name: "Matt Reeves", job: "Director" }],
      },
      videos: {
        results: [{ id: "v1", key: "abc123", site: "YouTube", name: "Trailer" }],
      },
      reviews: {
        results: [{ id: "r1", author: "John", content: "Great movie" }],
      },
      genres: [{ id: 99, name: "Action" }],
    };

    const mapped = mapMovieDetailResponse(payload);
    expect(mapped.cast).toHaveLength(1);
    expect(mapped.director).toBe("Matt Reeves");
    expect(mapped.trailers[0]?.key).toBe("abc123");
    expect(mapped.reviews[0]?.author).toBe("John");
    expect(mapped.genres).toEqual(["Action"]);
  });
});
