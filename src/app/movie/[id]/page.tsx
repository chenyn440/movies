import { notFound } from "next/navigation";
import { MovieDetailPage } from "@/features/movies/components/movie-detail-page";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function MoviePage({ params }: PageProps) {
  const { id } = await params;
  const movieId = Number(id);
  if (!Number.isInteger(movieId) || movieId <= 0) {
    notFound();
  }

  return <MovieDetailPage movieId={movieId} />;
}
