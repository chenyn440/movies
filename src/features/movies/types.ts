export type MovieSummary = {
  id: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  voteAverage: number | null;
  overview: string;
};

export type PersonCredit = {
  id: number;
  name: string;
  character: string | null;
  job: string | null;
  profilePath: string | null;
};

export type Trailer = {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
};

export type ReviewItem = {
  id: string;
  author: string;
  content: string;
  url: string | null;
  createdAt: string | null;
};

export type MovieDetail = MovieSummary & {
  genres: string[];
  runtime: number | null;
  tagline: string | null;
  cast: PersonCredit[];
  director: string | null;
  trailers: Trailer[];
  reviews: ReviewItem[];
};

export type PagedResult<T> = {
  page: number;
  totalPages: number;
  totalResults: number;
  results: T[];
};
