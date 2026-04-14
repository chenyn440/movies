import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { SearchPage } from "@/features/movies/components/search-page";
import { renderWithProviders } from "@/test/render";

describe("SearchPage", () => {
  it("shows auth guidance when tmdb key is missing", () => {
    renderWithProviders(<SearchPage />);
    expect(screen.getByText("尚未設定 TMDB API Key")).toBeInTheDocument();
  });
});
