import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { WATCHLIST_STORAGE_KEY } from "@/features/watchlist/lib/watchlist-utils";
import { WatchLotteryPage } from "./watch-lottery-page";
import { renderWithProviders } from "@/test/render";

describe("WatchLotteryPage", () => {
  it("shows empty-state guidance when watchlist is empty", () => {
    renderWithProviders(<WatchLotteryPage />);
    expect(screen.getByText(/目前沒有可抽籤的電影/)).toBeInTheDocument();
  });

  it("shows a result immediately when only one movie exists", async () => {
    window.localStorage.setItem(
      WATCHLIST_STORAGE_KEY,
      JSON.stringify([
        {
          id: 77,
          title: "Single Movie",
          posterPath: null,
          backdropPath: null,
          releaseDate: "2026-01-01",
          voteAverage: 7.7,
          overview: "Only one choice",
          addedAt: "2026-01-01T00:00:00.000Z",
        },
      ]),
    );
    const user = userEvent.setup();
    renderWithProviders(<WatchLotteryPage />);

    await user.click(screen.getByRole("button", { name: "開始抽籤" }));
    expect(await screen.findByRole("button", { name: "前往詳情" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Single Movie" })).toBeInTheDocument();
  });
});
