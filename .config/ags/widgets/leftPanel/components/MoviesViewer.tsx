import Gtk from "gi://Gtk?version=4.0";
import { execAsync } from "ags/process";
import { Movie } from "../../../interfaces/movie.interface";
import { createState, For, With } from "ags";
import { notify } from "../../../utils/notification";
import { Progress } from "../../Progress";
import Pango from "gi://Pango?version=1.0";
import Gdk from "gi://Gdk?version=4.0";
import { globalSettings, globalTransition } from "../../../variables";

const [movieList, setMovieList] = createState<Movie[]>([]);
const [progressStatus, setProgressStatus] = createState<
  "loading" | "error" | "success" | "idle"
>("idle");
const [currentTab, setCurrentTab] = createState<string>("Trending");
const [searchQuery, setSearchQuery] = createState<string>("");
const [currentPage, setCurrentPage] = createState<number>(1);
const [bottomIsRevealed, setBottomIsRevealed] = createState<boolean>(false);

const scriptPath = "./scripts/movies.py";

const fetchTrending = async (page: number = 1) => {
  setProgressStatus("loading");
  try {
    const output = await execAsync(`python3 ${scriptPath} --trending --limit 12 --page ${page}`);
    const data = JSON.parse(output);
    if (data.error) {
      notify({ summary: "Error", body: data.error });
      setProgressStatus("error");
      return;
    }
    setMovieList(data);
    setCurrentPage(page);
    setProgressStatus("success");
  } catch (err) {
    notify({ summary: "Error", body: String(err) });
    setProgressStatus("error");
  }
};

const fetchPopularMovies = async (page: number = 1) => {
  setProgressStatus("loading");
  try {
    const output = await execAsync(`python3 ${scriptPath} --popular-movies --limit 12 --page ${page}`);
    const data = JSON.parse(output);
    if (data.error) {
      notify({ summary: "Error", body: data.error });
      setProgressStatus("error");
      return;
    }
    setMovieList(data);
    setCurrentPage(page);
    setProgressStatus("success");
  } catch (err) {
    notify({ summary: "Error", body: String(err) });
    setProgressStatus("error");
  }
};

const fetchPopularTV = async (page: number = 1) => {
  setProgressStatus("loading");
  try {
    const output = await execAsync(`python3 ${scriptPath} --popular-tv --limit 12 --page ${page}`);
    const data = JSON.parse(output);
    if (data.error) {
      notify({ summary: "Error", body: data.error });
      setProgressStatus("error");
      return;
    }
    setMovieList(data);
    setCurrentPage(page);
    setProgressStatus("success");
  } catch (err) {
    notify({ summary: "Error", body: String(err) });
    setProgressStatus("error");
  }
};

const searchMovies = async (query: string, page: number = 1) => {
  setProgressStatus("loading");
  if (!query.trim()) return fetchTrending(page);
  try {
    const output = await execAsync(`python3 ${scriptPath} --search "${query}" --limit 12 --page ${page}`);
    const data = JSON.parse(output);
    if (data.error) {
      notify({ summary: "Error", body: data.error });
      setProgressStatus("error");
      return;
    }
    setMovieList(data);
    setCurrentPage(page);
    setProgressStatus("success");
  } catch (err) {
    notify({ summary: "Error", body: String(err) });
    setProgressStatus("error");
  }
};

const openInStremio = (movie: Movie) => {
  const title = movie.title || movie.name || "";
  const year = movie.release_date?.split("-")[0] || movie.first_air_date?.split("-")[0] || "";

  execAsync(`bash -c 'command -v stremio && stremio "https://web.stremio.com/#/search?search=${encodeURIComponent(title)}" || xdg-open "https://web.stremio.com/#/search?search=${encodeURIComponent(title)}"'`)
    .catch(() => {
      const type = movie.media_type === "tv" ? "tv" : "movie";
      execAsync(`xdg-open "https://www.themoviedb.org/${type}/${movie.id}"`);
    });
};

const MovieCard = ({ movie }: { movie: Movie }) => {
  const title = movie.title || movie.name || "Unknown";
  const year = movie.release_date?.split("-")[0] || movie.first_air_date?.split("-")[0] || "";
  const rating = movie.vote_average?.toFixed(1) || "N/A";
  const type = movie.media_type === "tv" ? "TV" : "Movie";
  const posterUrl = movie.poster_url || "";

  return (
    <button
      class="movie-card"
      onClicked={() => openInStremio(movie)}
      tooltipMarkup={`${title} (${year})\nRating: ${rating}/10\nType: ${type}\n\nClick to open in Stremio`}
    >
      <box orientation={Gtk.Orientation.VERTICAL} spacing={5} halign={Gtk.Align.CENTER}>
        {posterUrl ? (
          <image
            file={posterUrl}
            pixelSize={180}
          />
        ) : (
          <box heightRequest={180} widthRequest={120} class="movie-placeholder">
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
      class="action-button"
      label=""
      onClicked={() => searchMovies(searchQuery.get())}
    />
  </box>
);

const TabButtons = () => (
  <box class="tab-list" spacing={5}>
    <togglebutton
      active={currentTab((tab) => tab === "Trending")}
      label="Trending"
      onToggled={({ active }) => {
        if (active) {
          setCurrentTab("Trending");
          fetchTrending(1);
        }
      }}
    />
    <togglebutton
      active={currentTab((tab) => tab === "Movies")}
      label="Movies"
      onToggled={({ active }) => {
        if (active) {
          setCurrentTab("Movies");
          fetchPopularMovies(1);
        }
      }}
    />
    <togglebutton
      active={currentTab((tab) => tab === "TV Shows")}
      label="TV Shows"
      onToggled={({ active }) => {
        if (active) {
          setCurrentTab("TV Shows");
          fetchPopularTV(1);
        }
      }}
    />
  </box>
);

const Pagination = () => (
  <box class="pagination" spacing={5} halign={Gtk.Align.CENTER}>
    <button
      class="action-button"
      label=""
      onClicked={() => {
        const page = Math.max(1, currentPage.get() - 1);
        if (currentTab.get() === "Trending") fetchTrending(page);
        else if (currentTab.get() === "Movies") fetchPopularMovies(page);
        else if (currentTab.get() === "TV Shows") fetchPopularTV(page);
      }}
    />
    <label class="page-indicator" label={currentPage((p: number) => `Page ${p}`)} />
    <button
      class="action-button"
      label=""
      onClicked={() => {
        const page = currentPage.get() + 1;
        if (currentTab.get() === "Trending") fetchTrending(page);
        else if (currentTab.get() === "Movies") fetchPopularMovies(page);
        else if (currentTab.get() === "TV Shows") fetchPopularTV(page);
      }}
    />
  </box>
);

const Bottom = () => {
  const revealer = (
    <revealer
      class="bottom-revealer"
      transitionType={Gtk.RevealerTransitionType.SWING_UP}
      revealChild={bottomIsRevealed}
      transitionDuration={globalTransition}
    >
      <box
        class="bottom-bar"
        orientation={Gtk.Orientation.VERTICAL}
        spacing={10}
      >
        <Pagination />
        <SearchBar />
      </box>
    </revealer>
  );

  // action box
  const actions = (
    <box class="actions" spacing={5}>
      <button
        hexpand
        class="reveal-button"
        label={bottomIsRevealed((revealed: boolean) => (!revealed ? "" : ""))}
        onClicked={() => {
          setBottomIsRevealed(!bottomIsRevealed.get());
        }}
      />
    </box>
  );

  return (
    <box class={"bottom"} orientation={Gtk.Orientation.VERTICAL}>
      {actions}
      {revealer}
    </box>
  );
};

const MovieGrid = () => (
  <Gtk.ScrolledWindow
    vexpand
    hscrollbarPolicy={Gtk.PolicyType.NEVER}
    vscrollbarPolicy={Gtk.PolicyType.AUTOMATIC}
  >
    <box
      class="movie-grid"
      orientation={Gtk.Orientation.VERTICAL}
      spacing={15}
    >
      <With value={movieList}>
        {(movies: Movie[]) => {
          if (!movies || !Array.isArray(movies) || movies.length === 0) {
            return <box />;
          }

          return (
            <box orientation={Gtk.Orientation.VERTICAL} spacing={15}>
              {movies.reduce((acc: JSX.Element[], movie, idx) => {
                if (idx % 2 === 0) {
                  const rowMovies = movies.slice(idx, idx + 2);
                  acc.push(
                    <box spacing={10} homogeneous>
                      {rowMovies.map((m) => (
                        <MovieCard movie={m} />
                      ))}
                    </box>
                  );
                }
                return acc;
              }, [])}
            </box>
          );
        }}
      </With>
    </box>
  </Gtk.ScrolledWindow>
);

export default () => {
  fetchTrending(1);

  return (
    <box
      orientation={Gtk.Orientation.VERTICAL}
      class="movies-viewer"
      spacing={5}
      vexpand
      $={(self: any) => {
        const keyController = new Gtk.EventControllerKey();
        keyController.connect("key-pressed", (_: any, keyval: number) => {
          if (keyval === Gdk.KEY_Up && !bottomIsRevealed.get()) {
            setBottomIsRevealed(true);
            return true;
          }
          if (keyval === Gdk.KEY_Down && bottomIsRevealed.get()) {
            setBottomIsRevealed(false);
            return true;
          }
          return false;
        });
        self.add_controller(keyController);
      }}
    >
      <box orientation={Gtk.Orientation.VERTICAL} vexpand>
        <MovieGrid />
        <Progress status={progressStatus} />
      </box>
      <Bottom />
      <TabButtons />
    </box>
  );
};
