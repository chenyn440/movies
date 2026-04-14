import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { RecommendationsPage } from "@/features/recommendations/components/recommendations-page";
import { renderWithProviders } from "@/test/render";

vi.mock("@/features/recommendations/api/recommendation-service", () => ({
  getRecommendationGroups: vi.fn(async () => [
    {
      movie: {
        id: 101,
        title: "Demo Movie",
        posterPath: null,
        backdropPath: null,
        releaseDate: "2022-01-01",
        voteAverage: 7.5,
        overview: "overview",
      },
      reasons: [
        {
          id: 11,
          movieId: 101,
          reason: "很好看",
          recommendedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: 12,
          movieId: 101,
          reason: "節奏很好",
          recommendedAt: "2026-01-02T00:00:00.000Z",
        },
      ],
      recommendedCount: 2,
      lastRecommendedAt: "2026-01-02T00:00:00.000Z",
    },
  ]),
}));

describe("RecommendationsPage", () => {
  it("renders grouped recommendations with multiple reasons", async () => {
    renderWithProviders(<RecommendationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Demo Movie")).toBeInTheDocument();
    });

    expect(screen.getByText("很好看")).toBeInTheDocument();
    expect(screen.getByText("節奏很好")).toBeInTheDocument();
    expect(screen.getByText(/共 2 則推薦/)).toBeInTheDocument();
  });
});
