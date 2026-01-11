// ============================
// GET ELEMENTS
// ============================
const form = document.getElementById("movieForm");
const movieList = document.getElementById("movieList");
const toggleFormBtn = document.getElementById("toggleFormBtn");
const editModeBtn = document.getElementById("editModeBtn");
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");

const titleInput = document.getElementById("title");
const suggestionsBox = document.getElementById("suggestions");

const TMDB_API_KEY = "222162902e2c6b0570eb7fa4b9462d81";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w500";
const ratingStars = document.querySelectorAll("#ratingInput .star");

// ============================
// STATE
// ============================
let editMode = false;
let searchQuery = "";
let movies = JSON.parse(localStorage.getItem("movies")) || [];
let suggestionTimer;
let tempRating = 0;

// ============================
// FORCE FORM HIDDEN & RESET RATING SAAT LOAD
// ============================
form.classList.add("hidden");
tempRating = 0;
highlightStars(tempRating);
titleInput.dataset.poster = "";

// ============================
// EVENTS
// ============================

// Toggle form & edit mode
toggleFormBtn.addEventListener("click", () => {
  form.classList.toggle("hidden");

  if (!form.classList.contains("hidden")) {
    // reset form setiap kali dibuka
    form.reset();
    tempRating = 0;
    highlightStars(tempRating);
    titleInput.dataset.poster = "";
  }
});
editModeBtn.addEventListener("click", () => {
  editMode = !editMode;
  editModeBtn.innerText = editMode ? "✅ Done Editing" : "✏ Edit Mode";
  renderMovies();
});

// Search filter
searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value.toLowerCase();
  renderMovies();
});
clearSearchBtn.addEventListener("click", () => {
  searchQuery = "";
  searchInput.value = "";
  renderMovies();
});

// Autocomplete TMDB suggestion
titleInput.addEventListener("input", (e) => {
  const query = e.target.value.trim();
  if (query.length < 2) {
    suggestionsBox.classList.add("hidden");
    return;
  }
  clearTimeout(suggestionTimer);
  suggestionTimer = setTimeout(() => searchMovieSuggestions(query), 300);
});

// Form submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = titleInput.value;
  const review = document.getElementById("review").value;
  const rating = tempRating; // Ambil dari bintang interaktif

  const poster = titleInput.dataset.poster || (await fetchPoster(title));
  titleInput.dataset.poster = "";
  tempRating = 0;
  highlightStars(0);

  movies.push({ title, rating, review, poster });
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

ratingStars.forEach((star) => {
  star.addEventListener("mouseover", () => {
    const val = parseInt(star.dataset.value);
    highlightStars(val);
  });
  star.addEventListener("mouseout", () => highlightStars(tempRating));
  star.addEventListener("click", () => {
    tempRating = parseInt(star.dataset.value);
    highlightStars(tempRating);
  });
});

function highlightStars(rating) {
  ratingStars.forEach((star) => {
    star.classList.toggle("active", parseInt(star.dataset.value) <= rating);
  });
}

// Render movie cards
function renderMovies() {
  movieList.innerHTML = "";
  const filteredMovies = movies.filter((m) =>
    (m.title + m.review).toLowerCase().includes(searchQuery)
  );

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
          <div class="rating">${"★".repeat(movie.rating)}${"☆".repeat(
      5 - movie.rating
    )}</div>
          <p>${movie.review || "No review"}</p>
        </div>
      </div>
      <div class="movie-content">
        <div class="card-actions">
          <button onclick="deleteMovie(${index})">Delete</button>
          ${
            editMode
              ? `<button onclick="editMovie(${index})">Edit</button>`
              : ""
          }
        </div>
      </div>
    `;
    movieList.appendChild(div);
  });
}

// Delete & edit
function deleteMovie(index) {
  movies.splice(index, 1);
  saveMovies();
  renderMovies();
}

function editMovie(index) {
  const movie = movies[index];

  titleInput.value = movie.title;
  document.getElementById("review").value = movie.review;
  titleInput.dataset.poster = movie.poster || "";

  // 🟢 Set bintang interaktif sesuai rating movie
  tempRating = movie.rating;
  highlightStars(tempRating);

  // Hapus movie lama sementara
  movies.splice(index, 1);
  saveMovies();
  renderMovies();

  form.classList.remove("hidden");
}

// Fetch poster from TMDB
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

// Autocomplete suggestions
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
        (
          movie
        ) => `<div class="suggestion-item" onclick='selectSuggestion(${JSON.stringify(
          movie
        )})'>
          🎬 ${movie.title} (${movie.release_date?.slice(0, 4) || "N/A"})
        </div>`
      )
      .join("");
    suggestionsBox.classList.remove("hidden");
  } catch (err) {
    console.error("Suggestion error:", err);
  }
}

function selectSuggestion(movie) {
  titleInput.value = movie.title;
  if (movie.poster_path)
    titleInput.dataset.poster = TMDB_IMAGE_URL + movie.poster_path;
  suggestionsBox.classList.add("hidden");
}

// POSTER MODAL
const posterModal = document.getElementById("posterModal");
const modalPoster = document.getElementById("modalPoster");
const modalTitle = document.getElementById("modalTitle");
const modalRating = document.getElementById("modalRating");
const modalReview = document.getElementById("modalReview");
const closeModal = document.getElementById("closeModal");

movieList.addEventListener("click", (e) => {
  const card = e.target.closest(".movie-card");
  if (!card) return;

  const index = Array.from(movieList.children).indexOf(card);
  const movie = movies[index];

  if (e.target.classList.contains("poster")) {
    modalPoster.src = movie.poster || "";
    modalTitle.textContent = movie.title;
    modalRating.textContent =
      "★".repeat(movie.rating) + "☆".repeat(5 - movie.rating);
    modalReview.textContent = movie.review || "No review";

    posterModal.classList.remove("hidden");
  }
});

closeModal.addEventListener("click", () => posterModal.classList.add("hidden"));
posterModal.addEventListener("click", (e) => {
  if (e.target === posterModal) posterModal.classList.add("hidden");
});

// INIT
renderMovies();
