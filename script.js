// ============================
// GET ELEMENTS
// ============================
const form = document.getElementById("movieForm");
const movieList = document.getElementById("movieList");
const toggleFormBtn = document.getElementById("toggleFormBtn");
const editModeBtn = document.getElementById("editModeBtn");
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const TMDB_API_KEY = "222162902e2c6b0570eb7fa4b9462d81";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w500";
const titleInput = document.getElementById("title");
const suggestionsBox = document.getElementById("suggestions");

// ============================
// STATE
// ============================
let editMode = false;
let searchQuery = "";
let movies = JSON.parse(localStorage.getItem("movies")) || [];
let searchTimer;
let suggestionTimer;

// ============================
// EVENTS
// ============================
searchInput.addEventListener("input", (e) => {
  clearTimeout(searchTimer);

  searchTimer = setTimeout(() => {
    searchQuery = e.target.value.toLowerCase();
    renderMovies();
  }, 200);
});

titleInput.addEventListener("input", (e) => {
  clearTimeout(suggestionTimer);

  const query = e.target.value.trim();
  if (query.length < 2) {
    suggestionsBox.classList.add("hidden");
    return;
  }

  suggestionTimer = setTimeout(() => {
    searchMovieSuggestions(query);
  }, 300);
});

clearSearchBtn.addEventListener("click", () => {
  searchQuery = "";
  searchInput.value = "";
  renderMovies();
});

toggleFormBtn.addEventListener("click", () => {
  form.classList.toggle("hidden");
});

editModeBtn.addEventListener("click", () => {
  editMode = !editMode;
  editModeBtn.innerText = editMode ? "✅ Done Editing" : "✏ Edit Mode";
  renderMovies();
});

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const rating = document.getElementById("rating").value;
  const review = document.getElementById("review").value;

  const poster = titleInput.dataset.poster || (await fetchPoster(title));

  titleInput.dataset.poster = "";

  movies.push({
    title,
    rating,
    review,
    poster,
  });

  saveMovies();
  renderMovies();
  form.reset();
  form.classList.add("hidden");
});

// ============================
// FUNCTIONS
// ============================
function saveMovies() {
  localStorage.setItem("movies", JSON.stringify(movies));
}

function renderMovies() {
  movieList.innerHTML = "";

  const filteredMovies = movies.filter((movie) => {
    const text = (movie.title + " " + movie.review).toLowerCase();
    return text.includes(searchQuery);
  });

  filteredMovies.forEach((movie, index) => {
    const div = document.createElement("div");
    div.className = "movie-card";

    div.innerHTML = `
  <div class="poster-wrapper">
  ${
    movie.poster
      ? `<img src="${movie.poster}" class="poster" />`
      : `<div class="poster placeholder">No Poster</div>`
  }

  <div class="overlay">
    <h4>${movie.title}</h4>
    <div class="rating">
      ${renderStars(movie.rating || 0, index)}
    </div>
    <p>${movie.review || "No review"}</p>
  </div>
</div>


  <div class="movie-content">

    <div class="card-actions">
      <button onclick="deleteMovie(${index})">Delete</button>
      ${editMode ? `<button onclick="editMovie(${index})">Edit</button>` : ""}
    </div>
  </div>
`;

    movieList.appendChild(div);
  });
}

function highlight(text) {
  if (!searchQuery) return text;

  const regex = new RegExp(`(${searchQuery})`, "gi");
  return text.replace(regex, `<mark>$1</mark>`);
}

function deleteMovie(index) {
  movies.splice(index, 1);
  saveMovies();
  renderMovies();
}

function editMovie(index) {
  const movie = movies[index];

  document.getElementById("title").value = movie.title;
  document.getElementById("rating").value = movie.rating;
  document.getElementById("review").value = movie.review;

  movies.splice(index, 1);
  saveMovies();
  renderMovies();

  form.classList.remove("hidden");
}

function renderStars(rating, index) {
  let stars = "";

  for (let i = 1; i <= 5; i++) {
    const active = i <= rating ? "active" : "";
    stars += `<span 
      class="star ${active}" 
      onclick="setRating(${index}, ${i})"
    >★</span>`;
  }

  return stars;
}

function setRating(movieIndex, rating) {
  movies[movieIndex].rating = rating;
  saveMovies();
  renderMovies();
}

async function fetchPoster(title) {
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
        title
      )}`
    );

    const data = await res.json();
    const movie = data.results?.[0];

    if (!movie || !movie.poster_path) return null;

    return TMDB_IMAGE_URL + movie.poster_path;
  } catch (err) {
    console.error("TMDB Error:", err);
    return null;
  }
}

async function searchMovieSuggestions(query) {
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
        query
      )}`
    );

    const data = await res.json();
    const results = data.results?.slice(0, 6) || [];

    if (!results.length) {
      suggestionsBox.classList.add("hidden");
      return;
    }

    suggestionsBox.innerHTML = results
      .map(
        (movie) => `
        <div class="suggestion-item" onclick='selectSuggestion(${JSON.stringify(
          movie
        )})'>
          🎬 ${movie.title} (${movie.release_date?.slice(0, 4) || "N/A"})
        </div>
      `
      )
      .join("");

    suggestionsBox.classList.remove("hidden");
  } catch (err) {
    console.error("Suggestion error:", err);
  }
}

function selectSuggestion(movie) {
  titleInput.value = movie.title;

  // Auto poster langsung pakai hasil TMDB
  if (movie.poster_path) {
    titleInput.dataset.poster = TMDB_IMAGE_URL + movie.poster_path;
  }

  suggestionsBox.classList.add("hidden");
}

// ============================
// INIT
// ============================
renderMovies();
