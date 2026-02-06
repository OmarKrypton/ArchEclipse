import Gtk from "gi://Gtk?version=4.0";
import { execAsync } from "ags/process";
import { Movie } from "../../../interfaces/movie.interface";
import { createState, For, With } from "ags";
import { notify } from "../../../utils/notification";
import Picture from "../../Picture";
import { Progress } from "../../Progress";
import Pango from "gi://Pango?version=1.0";
import Gdk from "gi://Gdk?version=4.0";
import { globalSettings, globalTransition } from "../../../variables";

const [movieList, setMovieList] = createState<Movie[]>([]);
const [selectedMovie, setSelectedMovie] = createState<Movie | null>(null);
const [progressStatus, setProgressStatus] = createState<
  "loading" | "error" | "success" | "idle"
>("idle");
const [currentTab, setCurrentTab] = createState<string>("Trending");
const [searchQuery, setSearchQuery] = createState<string>("");
const [initialized, setInitialized] = createState(false);

const scriptPath = "./scripts/movies.py";

const fetchTrending = async () => {
  setProgressStatus("loading");
  try {
    const output = await execAsync(`python3 ${scriptPath} --trending --limit 12`);
    const data = JSON.parse(output);
    if (data.error) {
      notify({ summary: "Error", body: data.error });
      setProgressStatus("error");
      return;
    }
    setMovieList(data);
    setProgressStatus("success");
  } catch (err) {
    notify({ summary: "Error", body: String(err) });
    setProgressStatus("error");
  }
};

const fetchPopularMovies = async () => {
  setProgressStatus("loading");
  try {
    const output = await execAsync(`python3 ${scriptPath} --popular-movies --limit 12`);
    const data = JSON.parse(output);
    if (data.error) {
      notify({ summary: "Error", body: data.error });
      setProgressStatus("error");
      return;
    }
    setMovieList(data);
    setProgressStatus("success");
  } catch (err) {
    notify({ summary: "Error", body: String(err) });
    setProgressStatus("error");
  }
};

const fetchPopularTV = async () => {
  setProgressStatus("loading");
  try {
    const output = await execAsync(`python3 ${scriptPath} --popular-tv --limit 12`);
    const data = JSON.parse(output);
    if (data.error) {
      notify({ summary: "Error", body: data.error });
      setProgressStatus("error");
      return;
    }
    setMovieList(data);
    setProgressStatus("success");
  } catch (err) {
    notify({ summary: "Error", body: String(err) });
    setProgressStatus("error");
  }
};

const searchMovies = async (query: string) => {
  setProgressStatus("loading");
  if (!query.trim()) return fetchTrending();
  try {
    const output = await execAsync(`python3 ${scriptPath} --search "${query}" --limit 12`);
    const data = JSON.parse(output);
    if (data.error) {
      notify({ summary: "Error", body: data.error });
      setProgressStatus("error");
      return;
    }
    setMovieList(data);
    setProgressStatus("success");
  } catch (err) {
    notify({ summary: "Error", body: String(err) });
    setProgressStatus("error");
  }
};

const openInStremio = (movie: Movie) => {
  const title = movie.title || movie.name || "";
  const year = movie.release_date?.split("-")[0] || movie.first_air_date?.split("-")[0] || "";
  
  // Try to open in Stremio if available, otherwise open in browser
  execAsync(`bash -c 'command -v stremio && stremio "https://web.stremio.com/#/search?search=${encodeURIComponent(title)}" || xdg-open "https://web.stremio.com/#/search?search=${encodeURIComponent(title)}"'`)
    .catch(() => {
      // Fallback to TMDB page
      const type = movie.media_type === "tv" ? "tv" : "movie";
      execAsync(`xdg-open "https://www.themoviedb.org/${type}/${movie.id}"`);
    });
};

const MovieCard = ({ movie }: { movie: Movie }) => {
  const title = movie.title || movie.name || "Unknown";
  const year = movie.release_date?.split("-")[0] || movie.first_air_date?.split("-")[0] || "";
  const rating = movie.vote_average?.toFixed(1) || "N/A";
  const type = movie.media_type === "tv" ? "TV" : "Movie";
  
  return (
    <button
      class="movie-card"
      onClicked={() => openInStremio(movie)}
      tooltipMarkup={`${title} (${year})\nRating: ${rating}/10\nType: ${type}\n\nClick to open in Stremio`}
    >
      <box orientation={Gtk.Orientation.VERTICAL} spacing={5}>
        {movie.poster_url ? (
          <image
            file={movie.poster_url}
            pixelSize={150}
          />
        ) : (
          <box heightRequest={150} widthRequest={100} class="movie-placeholder">
            <label label="No Image" />
          </box>
        )}
        <label 
          label={title} 
          ellipsize={Pango.EllipsizeMode.END}
          maxWidthChars={15}
        />
        <label label={`${year} • ${rating}`} class="movie-meta" />
      </box>
    </button>
  );
};

const SearchBar = () => (
  <box class="search-bar" spacing={5}>
    <Gtk.Entry
      hexpand
      placeholderText="Search movies and series..."
      onChanged={(self) => setSearchQuery(self.get_text())}
      onActivate={(self) => searchMovies(self.get_text())}
    />
    <button
      label="Search"
      onClicked={() => searchMovies(searchQuery.get())}
    />
  </box>
);

const TabButtons = () => (
  <box class="tab-buttons" spacing={5}>
    <button
      class={currentTab((tab) => tab === "Trending" ? "active" : "")}
      label="Trending"
      onClicked={() => {
        setCurrentTab("Trending");
        fetchTrending();
      }}
    />
    <button
      class={currentTab((tab) => tab === "Movies" ? "active" : "")}
      label="Movies"
      onClicked={() => {
        setCurrentTab("Movies");
        fetchPopularMovies();
      }}
    />
    <button
      class={currentTab((tab) => tab === "TV Shows" ? "active" : "")}
      label="TV Shows"
      onClicked={() => {
        setCurrentTab("TV Shows");
        fetchPopularTV();
      }}
    />
  </box>
);

const MovieGrid = () => (
  <Gtk.ScrolledWindow vexpand>
    <box class="movie-grid" spacing={10}>
      <For each={movieList}>
        {(movie) => <MovieCard movie={movie} />}
      </For>
    </box>
  </Gtk.ScrolledWindow>
);

export default () => {
  // Initialize on first render
  if (!initialized.get()) {
    fetchTrending();
    setInitialized(true);
  }

  return (
    <box
      orientation={Gtk.Orientation.VERTICAL}
      class="movies-viewer"
      spacing={10}
      vexpand
    >
      <Progress status={progressStatus} />
      <TabButtons />
      <SearchBar />
      <MovieGrid />
    </box>
  );
};
