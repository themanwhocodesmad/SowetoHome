// Public listings page: renders category chips + a grid of image cards from mock data,
// and a simple detail modal. Everything here is client-side state, nothing persists.

const state = {
  category: "All",
  query: "",
  favorites: new Set(),
};

const chipRow = document.getElementById("chipRow");
const grid = document.getElementById("listingGrid");
const resultsBar = document.getElementById("resultsBar");
const overlay = document.getElementById("modalOverlay");
const modalContent = document.getElementById("modalContent");

function starIcon() {
  return `<svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7-5.4-4.7 7.1-.6z"/></svg>`;
}

function heartIcon() {
  return `<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-10-9C.5 8.5 2 4 6 4c2.2 0 3.8 1.3 6 4 2.2-2.7 3.8-4 6-4 4 0 5.5 4.5 4 8-2.5 4.4-10 9-10 9Z"/></svg>`;
}

function renderChips() {
  chipRow.innerHTML = CATEGORIES.map(
    (c) => `<button class="chip ${c === state.category ? "active" : ""}" data-cat="${c}">${c}</button>`
  ).join("");

  chipRow.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.category = btn.dataset.cat;
      renderChips();
      renderGrid();
    });
  });
}

function filteredListings() {
  return LISTINGS.filter((l) => {
    const matchesCategory = state.category === "All" || l.category === state.category;
    const q = state.query.trim().toLowerCase();
    const matchesQuery =
      !q || l.location.toLowerCase().includes(q) || l.country.toLowerCase().includes(q) || l.title.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });
}

function renderGrid() {
  const results = filteredListings();
  resultsBar.textContent = `${results.length} stay${results.length === 1 ? "" : "s"}${state.category !== "All" ? ` · ${state.category}` : ""}`;

  grid.innerHTML = results
    .map(
      (l) => `
    <button class="card" data-id="${l.id}">
      <div class="card-image">
        <img src="${l.image}" alt="${l.title}" loading="lazy" />
        <button class="fav-btn ${state.favorites.has(l.id) ? "active" : ""}" data-fav="${l.id}" aria-label="Save">${heartIcon()}</button>
      </div>
      <div class="card-title-row">
        <span>${l.location}</span>
        <span class="card-rating">${starIcon()} ${l.rating.toFixed(2)}</span>
      </div>
      <div class="card-sub">${l.title}</div>
      <div class="card-price"><b>R${l.price.toLocaleString()}</b> / night</div>
    </button>`
    )
    .join("");

  grid.querySelectorAll(".fav-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = Number(btn.dataset.fav);
      state.favorites.has(id) ? state.favorites.delete(id) : state.favorites.add(id);
      renderGrid();
    });
  });

  grid.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", () => openModal(Number(card.dataset.id)));
  });
}

function openModal(id) {
  const l = LISTINGS.find((x) => x.id === id);
  if (!l) return;

  modalContent.innerHTML = `
    <button class="modal-close" id="modalClose" aria-label="Close">&times;</button>
    <div class="modal-gallery">
      <img src="${l.gallery[0]}" alt="" />
      <img src="${l.gallery[1] || l.gallery[0]}" alt="" />
    </div>
    <div class="modal-body">
      <h2>${l.title}</h2>
      <div class="card-sub">${l.location}, ${l.country} · Hosted by ${l.host}</div>
      <div class="modal-meta">
        <span>${l.guests} guests</span>
        <span>${l.bedrooms} bedrooms</span>
        <span>${l.beds} beds</span>
        <span>${l.baths} baths</span>
        <span class="card-rating">${starIcon()} ${l.rating.toFixed(2)} (${l.reviews})</span>
      </div>
      <strong>What this place offers</strong>
      <ul class="amenity-grid">
        ${l.amenities.map((a) => `<li>${a}</li>`).join("")}
      </ul>
      <div class="modal-footer">
        <div class="card-price"><b>R${l.price.toLocaleString()}</b> / night</div>
        <button class="btn btn-brand" onclick="alert('This is a demo — booking is not implemented.')">Reserve</button>
      </div>
    </div>
  `;

  document.getElementById("modalClose").addEventListener("click", closeModal);
  overlay.classList.add("open");
}

function closeModal() {
  overlay.classList.remove("open");
}

overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeModal();
});

document.getElementById("searchLocation").addEventListener("input", (e) => {
  state.query = e.target.value;
  renderGrid();
});
document.getElementById("searchBtn").addEventListener("click", renderGrid);
document.getElementById("loginBtn").addEventListener("click", () => alert("This is a demo — authentication is not implemented."));

renderChips();
renderGrid();
