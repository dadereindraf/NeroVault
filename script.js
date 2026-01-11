// ============================
// GET ELEMENTS
// ============================
const form = document.getElementById("movieForm");
const movieList = document.getElementById("movieList");
const toggleFormBtn = document.getElementById("toggleFormBtn");
const editModeBtn = document.getElementById("editModeBtn");
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");

// ============================
// STATE
// ============================
let editMode = false;
let searchQuery = "";
let movies = JSON.parse(localStorage.getItem("movies")) || [];
let searchTimer;

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

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const rating = document.getElementById("rating").value;
  const review = document.getElementById("review").value;
  const posterFile = document.getElementById("poster").files[0];

  if (posterFile) {
    const reader = new FileReader();
    reader.onload = function () {
      movies.push({
        title,
        rating,
        review,
        poster: reader.result,
      });

      saveMovies();
      renderMovies();
      form.reset();
      form.classList.add("hidden");
    };
    reader.readAsDataURL(posterFile);
  } else {
    movies.push({
      title,
      rating,
      review,
      poster: null,
    });

    saveMovies();
    renderMovies();
    form.reset();
    form.classList.add("hidden");
  }
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

// ============================
// INIT
// ============================
renderMovies();
