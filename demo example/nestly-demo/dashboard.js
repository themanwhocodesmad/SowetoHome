// Admin/owner dashboard: tabbed sections driven by the same mock data as the public site.
// Add/edit/delete mutate the in-memory LISTINGS array only — nothing is persisted.

let listings = [...LISTINGS];
let editingId = null;

const PAGE_TITLES = { overview: "Overview", listings: "Listings", bookings: "Bookings", reviews: "Reviews" };

function starIcon() {
  return `<svg viewBox="0 0 24 24" style="width:13px;height:13px;fill:#222"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7-5.4-4.7 7.1-.6z"/></svg>`;
}

function editIcon() {
  return `<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`;
}
function trashIcon() {
  return `<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
}

/* ---------------- Tab switching ---------------- */
document.querySelectorAll(".sidebar-nav button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".sidebar-nav button").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".dash-section").forEach((s) => s.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
    document.getElementById("pageTitle").textContent = PAGE_TITLES[btn.dataset.tab];
  });
});

/* ---------------- Overview ---------------- */
function bookingsFor(listingId) {
  return BOOKINGS.filter((b) => b.listingId === listingId);
}

function renderStats() {
  const totalRevenue = BOOKINGS.filter((b) => b.status !== "Cancelled").reduce((sum, b) => sum + b.total, 0);
  const activeBookings = BOOKINGS.filter((b) => b.status !== "Cancelled").length;
  const avgRating = (listings.reduce((s, l) => s + l.rating, 0) / listings.length).toFixed(2);

  const stats = [
    { label: "Total listings", value: listings.length, delta: "+1 this month", up: true },
    { label: "Active bookings", value: activeBookings, delta: "+3 this week", up: true },
    { label: "Total revenue", value: `R${totalRevenue.toLocaleString()}`, delta: "+12.4% vs last month", up: true },
    { label: "Average rating", value: avgRating, delta: "-0.02 vs last month", up: false },
  ];

  document.getElementById("statGrid").innerHTML = stats
    .map(
      (s) => `
    <div class="stat-card">
      <div class="label">${s.label}</div>
      <div class="value">${s.value}</div>
      <div class="delta ${s.up ? "up" : "down"}">${s.delta}</div>
    </div>`
    )
    .join("");
}

function renderChart() {
  const w = 560, h = 200, pad = 24;
  const max = Math.max(...REVENUE_TREND.map((d) => d.revenue));
  const min = Math.min(...REVENUE_TREND.map((d) => d.revenue));
  const stepX = (w - pad * 2) / (REVENUE_TREND.length - 1);

  const points = REVENUE_TREND.map((d, i) => {
    const x = pad + i * stepX;
    const y = h - pad - ((d.revenue - min) / (max - min || 1)) * (h - pad * 2);
    return [x, y];
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1][0]},${h - pad} L${points[0][0]},${h - pad} Z`;

  document.getElementById("chartWrap").innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ff385c" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#ff385c" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path d="${areaPath}" fill="url(#fade)" stroke="none"/>
      <path d="${linePath}" fill="none" stroke="#ff385c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      ${points.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#ff385c"/>`).join("")}
    </svg>
    <div class="chart-labels">${REVENUE_TREND.map((d) => `<span>${d.month}</span>`).join("")}</div>
  `;
}

function renderUpcoming() {
  const upcoming = [...BOOKINGS]
    .filter((b) => b.status !== "Cancelled")
    .sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn))
    .slice(0, 5);

  document.getElementById("upcomingList").innerHTML = upcoming
    .map((b) => {
      const listing = listings.find((l) => l.id === b.listingId);
      return `
      <li>
        <div>
          <div class="name">${b.guest}</div>
          <div class="sub">${listing ? listing.title : "Listing removed"} · ${b.checkIn} → ${b.checkOut}</div>
        </div>
        <span class="pill ${b.status.toLowerCase()}">${b.status}</span>
      </li>`;
    })
    .join("");
}

/* ---------------- Listings tab ---------------- */
function renderListingsTable() {
  document.getElementById("listingsTableBody").innerHTML = listings
    .map(
      (l) => `
    <tr>
      <td>
        <div class="row-thumb">
          <img src="${l.image}" alt="" />
          <div>
            <div class="t-title">${l.title}</div>
            <div class="t-sub">${l.location}</div>
          </div>
        </div>
      </td>
      <td>R${l.price.toLocaleString()}</td>
      <td>${bookingsFor(l.id).length}</td>
      <td>${starIcon()} ${l.rating.toFixed(2)}</td>
      <td><span class="pill ${l.status.toLowerCase()}">${l.status}</span></td>
      <td style="white-space:nowrap">
        <button class="icon-btn" data-edit="${l.id}" aria-label="Edit">${editIcon()}</button>
        <button class="icon-btn" data-delete="${l.id}" aria-label="Delete">${trashIcon()}</button>
      </td>
    </tr>`
    )
    .join("");

  document.querySelectorAll("[data-edit]").forEach((btn) =>
    btn.addEventListener("click", () => openListingModal(Number(btn.dataset.edit)))
  );
  document.querySelectorAll("[data-delete]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.delete);
      const listing = listings.find((l) => l.id === id);
      if (confirm(`Remove "${listing.title}" from your listings?`)) {
        listings = listings.filter((l) => l.id !== id);
        renderAll();
      }
    })
  );
}

const listingOverlay = document.getElementById("listingModalOverlay");
const listingModal = document.getElementById("listingModalContent");

function openListingModal(id) {
  editingId = id ?? null;
  const l = id ? listings.find((x) => x.id === id) : null;

  listingModal.innerHTML = `
    <button class="modal-close" id="listingModalClose" aria-label="Close">&times;</button>
    <div class="modal-body">
      <h2>${l ? "Edit listing" : "Add listing"}</h2>
      <form id="listingForm" style="display:flex;flex-direction:column;gap:12px;margin-top:16px">
        <label style="font-size:13px;font-weight:600">Title
          <input name="title" required value="${l ? l.title : ""}" style="width:100%;padding:9px;border:1px solid var(--border);border-radius:8px;margin-top:4px" />
        </label>
        <label style="font-size:13px;font-weight:600">Location
          <input name="location" required value="${l ? l.location : ""}" style="width:100%;padding:9px;border:1px solid var(--border);border-radius:8px;margin-top:4px" />
        </label>
        <label style="font-size:13px;font-weight:600">Price per night (R)
          <input name="price" type="number" min="0" required value="${l ? l.price : ""}" style="width:100%;padding:9px;border:1px solid var(--border);border-radius:8px;margin-top:4px" />
        </label>
        <label style="font-size:13px;font-weight:600">Status
          <select name="status" style="width:100%;padding:9px;border:1px solid var(--border);border-radius:8px;margin-top:4px">
            <option ${l && l.status === "Active" ? "selected" : ""}>Active</option>
            <option ${l && l.status === "Paused" ? "selected" : ""}>Paused</option>
          </select>
        </label>
        <button class="btn btn-brand" type="submit" style="justify-content:center;margin-top:8px">${l ? "Save changes" : "Add listing"}</button>
      </form>
    </div>
  `;

  document.getElementById("listingModalClose").addEventListener("click", closeListingModal);
  document.getElementById("listingForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    if (editingId) {
      const target = listings.find((x) => x.id === editingId);
      Object.assign(target, { title: data.title, location: data.location, price: Number(data.price), status: data.status });
    } else {
      const newId = Math.max(...listings.map((x) => x.id)) + 1;
      listings.push({
        id: newId,
        title: data.title,
        location: data.location,
        country: "",
        category: "Trending",
        price: Number(data.price),
        rating: 5,
        reviews: 0,
        guests: 2,
        bedrooms: 1,
        beds: 1,
        baths: 1,
        image: `https://picsum.photos/seed/new-${newId}/800/600`,
        gallery: [`https://picsum.photos/seed/new-${newId}/800/600`],
        amenities: ["Wifi", "Kitchen"],
        status: data.status,
        host: "Naledi M.",
      });
    }
    closeListingModal();
    renderAll();
  });

  listingOverlay.classList.add("open");
}

function closeListingModal() {
  listingOverlay.classList.remove("open");
  editingId = null;
}

listingOverlay.addEventListener("click", (e) => {
  if (e.target === listingOverlay) closeListingModal();
});

document.getElementById("addListingBtn").addEventListener("click", () => openListingModal(null));

/* ---------------- Bookings tab ---------------- */
function renderBookingsTable() {
  document.getElementById("bookingsTableBody").innerHTML = BOOKINGS.map((b) => {
    const listing = listings.find((l) => l.id === b.listingId);
    return `
    <tr>
      <td>${b.guest}</td>
      <td>${listing ? listing.title : "Listing removed"}</td>
      <td>${b.checkIn}</td>
      <td>${b.checkOut}</td>
      <td>${b.nights}</td>
      <td>R${b.total.toLocaleString()}</td>
      <td><span class="pill ${b.status.toLowerCase()}">${b.status}</span></td>
    </tr>`;
  }).join("");
}

/* ---------------- Reviews tab ---------------- */
function renderReviews() {
  document.getElementById("reviewsPanel").innerHTML = `
    <ul class="mini-list">
      ${REVIEWS.map((r) => {
        const listing = listings.find((l) => l.id === r.listingId);
        return `
        <li style="display:block">
          <div style="display:flex;justify-content:space-between">
            <span class="name">${r.guest} <span class="sub">on ${listing ? listing.title : "a removed listing"}</span></span>
            <span class="star-row">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</span>
          </div>
          <div style="margin-top:4px">${r.text}</div>
          <div class="sub" style="margin-top:4px">${r.date}</div>
        </li>`;
      }).join("")}
    </ul>
  `;
}

function renderAll() {
  renderStats();
  renderChart();
  renderUpcoming();
  renderListingsTable();
  renderBookingsTable();
  renderReviews();
}

renderAll();
