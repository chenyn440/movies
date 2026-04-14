import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { WatchlistPage } from "@/features/watchlist/components/watchlist-page";
import { WATCHLIST_STORAGE_KEY } from "@/features/watchlist/lib/watchlist-utils";
import { renderWithProviders } from "@/test/render";

describe("WatchlistPage", () => {
  it("shows empty state when no watchlist data", () => {
    renderWithProviders(<WatchlistPage />);
    expect(screen.getByText(/還沒有加入待看電影/)).toBeInTheDocument();
  });

  it("renders saved watchlist movies", () => {
    window.localStorage.setItem(
      WATCHLIST_STORAGE_KEY,
      JSON.stringify([
        {
          id: 999,
          title: "Saved Movie",
          posterPath: null,
          backdropPath: null,
          releaseDate: "2021-01-01",
          voteAverage: 7.8,
          overview: "desc",
          addedAt: "2024-01-01T00:00:00.000Z",
        },
      ]),
    );
    renderWithProviders(<WatchlistPage />);
    expect(screen.getByText("Saved Movie")).toBeInTheDocument();
  });
});
