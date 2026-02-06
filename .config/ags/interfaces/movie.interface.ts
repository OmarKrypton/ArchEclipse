export interface Movie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  poster_url?: string;
  backdrop_url?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  media_type: "movie" | "tv";
}

export interface MovieSearchResult {
  movies: Movie[];
  query: string;
}
