/* =========================================================
   KasiLink SA — script.js
   Plain (vanilla) JavaScript frontend, connected to the
   KasiLink SA plain-Java backend (za.co.kasilink.KasiLinkServer).
   ========================================================= */

/* ---------------------------------------------------------
   0. BACKEND API BASE URL
   The frontend (Cloudflare Pages) and backend (Render) are on
   different domains, so every API call needs the full backend
   URL rather than a relative path like "/api/plumbers".

   Local development automatically uses localhost:8080. In
   production, set PRODUCTION_API_BASE_URL below to your actual
   Render URL once deployed, e.g.
   "https://kasilink-backend.onrender.com" — do NOT leave a
   placeholder in production, or every API call will fail.
   --------------------------------------------------------- */
const PRODUCTION_API_BASE_URL = "https://kasilink-backend.onrender.com";

const API_BASE_URL = (function () {
  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "";
  return isLocal ? "http://localhost:8080" : PRODUCTION_API_BASE_URL;
})();

/* ---------------------------------------------------------
   1. PLUMBER DATA (fallback copy)
   These records mirror exactly what the Java backend
   (za.co.kasilink.KasiLink) returns from GET /api/plumbers, so
   the site still works — with a clear "offline mode" notice —
   if the backend cannot be reached.
   --------------------------------------------------------- */
const FALLBACK_PLUMBERS = [
  {
    id: "p1", name: "Thabo Mokoena", experience: 8, baseLocation: "Soshanguve South",
    specialisation: "Residential Plumbing", businessPhone: "071 000 0001", email: "thabo@kasilink.co.za",
    background: "Experienced in household water systems, pipe installation and leak repairs.",
    serviceAreas: ["Soshanguve South", "Soshanguve", "Mabopane", "Pretoria North"],
    emergencyAvailable: true, imagePath: "images/plumbers/thabo-mokoena.png", rating: 0, reviewCount: 0
  },
  {
    id: "p2", name: "Kabelo Maseko", experience: 6, baseLocation: "Soshanguve South",
    specialisation: "Leak Repairs", businessPhone: "071 000 0002", email: "kabelo@kasilink.co.za",
    background: "Specialises in finding and repairing water leaks, damaged pipes, taps and toilets.",
    serviceAreas: ["Soshanguve South", "Soshanguve North", "Soshanguve", "Pretoria North"],
    emergencyAvailable: true, imagePath: "images/plumbers/kabelo-maseko.png", rating: 0, reviewCount: 0
  },
  {
    id: "p3", name: "Sipho Nkosi", experience: 10, baseLocation: "Soshanguve West",
    specialisation: "Installation and Maintenance", businessPhone: "071 000 0003", email: "sipho@kasilink.co.za",
    background: "Experienced in residential and commercial plumbing projects.",
    serviceAreas: ["Soshanguve West", "Soshanguve", "Ga-Rankuwa", "Pretoria"],
    emergencyAvailable: false, imagePath: "images/plumbers/sipho-nkosi.png", rating: 0, reviewCount: 0
  },
  {
    id: "p4", name: "Mpho Baloyi", experience: 5, baseLocation: "Soshanguve North",
    specialisation: "Bathroom Plumbing", businessPhone: "071 000 0004", email: "mpho@kasilink.co.za",
    background: "Specialises in toilets, showers, basins, taps and renovations.",
    serviceAreas: ["Soshanguve North", "Soshanguve", "Mabopane", "Pretoria North"],
    emergencyAvailable: false, imagePath: "images/plumbers/mpho-baloyi.png", rating: 0, reviewCount: 0
  },
  {
    id: "p5", name: "Lucky Makhubele", experience: 6, baseLocation: "Soshanguve Block L",
    specialisation: "Drainage Systems", businessPhone: "071 000 0005", email: "lucky@kasilink.co.za",
    background: "Experienced in blocked drains, wastewater systems and drainage maintenance.",
    serviceAreas: ["Soshanguve Block L", "Soshanguve", "Mabopane"],
    emergencyAvailable: true, imagePath: "images/plumbers/lucky-makhubele.png", rating: 0, reviewCount: 0
  },
  {
    id: "p6", name: "Thabang Molefe", experience: 11, baseLocation: "Soshanguve Block L",
    specialisation: "Water Pipe Installation", businessPhone: "071 000 0006", email: "thabang@kasilink.co.za",
    background: "Experienced in installing and repairing household water pipes.",
    serviceAreas: ["Soshanguve Block L", "Soshanguve", "Ga-Rankuwa", "Pretoria"],
    emergencyAvailable: false, imagePath: "images/plumbers/thabang-molefe.png", rating: 0, reviewCount: 0
  }
];

/* Services and prices — kept identical to za.co.kasilink.KasiLink so the
   revenue calculator matches the real backend logic exactly. */
const SERVICES = [
  { name: "Maintenance", price: 4000 },
  { name: "Tap Repair", price: 1250 },
  { name: "Leak Repair", price: 2250 },
  { name: "Drain Unblocking", price: 2700 },
  { name: "Toilet Repair", price: 1600 },
  { name: "Pipe Repair", price: 1850 },
  { name: "Bathroom Plumbing", price: 1200 },
  { name: "Geyser Repair", price: 1500 },
  { name: "Emergency Plumbing", price: 1000 },
  { name: "New Geyser Installation", price: 7500 }
];
const BOOKING_FEE = 50;
const TAX_RATE = 0.15;

let currentPlumbers = FALLBACK_PLUMBERS;
let currentServices = SERVICES; // replaced with live backend data by loadServices()

/* Fetches GET /api/services so the backend stays the single source of
   truth for the service list and prices, per KasiLink SA requirement
   that prices must not live only in frontend JavaScript. Falls back to
   the local SERVICES mirror (kept identical to za.co.kasilink.KasiLink)
   if the backend can't be reached. Returns a Promise. */
function loadServices() {
  return apiFetch("/api/services")
    .then(function (list) {
      if (Array.isArray(list) && list.length) {
        currentServices = list;
      }
      return currentServices;
    })
    .catch(function () {
      currentServices = SERVICES;
      return currentServices;
    });
}

function renderServiceCategoryCards() {
  const grid = document.getElementById("service-category-grid");
  if (!grid) return;
  grid.innerHTML = currentServices.map(function (s) {
    const emergencyClass = s.name.toLowerCase().includes("emergency") ? " emergency" : "";
    return '<div class="service-card' + emergencyClass + '"><h3>' + s.name + '</h3><p class="service-price">' + formatRand(s.price) + '</p></div>';
  }).join("");
}

/* ---------------------------------------------------------
   2. SMALL HELPERS
   --------------------------------------------------------- */

function formatRand(amount) {
  const value = Math.max(0, Number(amount) || 0);
  return "R" + value.toLocaleString("en-ZA", { maximumFractionDigits: 2 });
}

function starString(rating) {
  const fullStars = Math.round(rating || 0);
  return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
}

function initialsFor(name) {
  return name.split(" ").map(function (p) { return p.charAt(0); }).join("").slice(0, 2).toUpperCase();
}

/* Renders a plumber's photo if images/plumbers/<file>.jpg has actually
   been uploaded, otherwise falls back to the initials avatar. The
   onerror handler swaps to initials automatically if the image is
   missing or fails to load, so nothing breaks before photos are added. */
function plumberAvatarHtml(plumber, extraClass) {
  const cls = "plumber-photo" + (extraClass ? " " + extraClass : "");
  const initials = initialsFor(plumber.name);
  if (!plumber.imagePath) {
    return '<div class="' + cls + '" aria-hidden="true">' + initials + '</div>';
  }
  return (
    '<div class="' + cls + ' has-photo" aria-hidden="true">' +
      '<img src="' + plumber.imagePath + '" alt="" loading="lazy" ' +
        'onerror="this.closest(\'.' + cls.split(' ')[0] + '\').classList.remove(\'has-photo\'); this.remove();">' +
      '<span class="plumber-photo-fallback">' + initials + '</span>' +
    '</div>'
  );
}

function normalisePhoneDigits(raw) {
  return String(raw || "").replace(/\D/g, "");
}

function isValidSaPhone(raw) {
  const digits = String(raw || "").replace(/\s+/g, "");
  return /^0[0-9]{9}$/.test(digits);
}

function apiFetch(path, options) {
  return fetch(API_BASE_URL + path, options).then(function (response) {
    return response.json().then(function (data) {
      if (!response.ok && data && typeof data === "object" && !("success" in data)) {
        data.success = false;
      }
      return data;
    });
  });
}

/* ---------------------------------------------------------
   3. MOBILE NAVIGATION TOGGLE
   --------------------------------------------------------- */
function setupNavToggle() {
  const toggleButton = document.getElementById("nav-toggle");
  const nav = document.getElementById("main-nav");
  if (!toggleButton || !nav) return;

  toggleButton.addEventListener("click", function () {
    const isOpen = nav.classList.toggle("open");
    toggleButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
}

/* ---------------------------------------------------------
   4. PLUMBER CARD RENDERING
   --------------------------------------------------------- */
function buildPlumberCard(plumber) {
  const emergencyBadge = plumber.emergencyAvailable
    ? '<span class="emergency-badge">Emergency callout available</span>'
    : "";

  const hasRating = plumber.reviewCount > 0;
  const ratingLine = hasRating
    ? starString(plumber.rating) + ' <span class="count">' + plumber.rating.toFixed(1) + " (" + plumber.reviewCount + " ratings)</span>"
    : '<span class="count">No ratings yet</span>';

  return (
    '<article class="plumber-card" data-plumber-id="' + plumber.id + '">' +
      plumberAvatarHtml(plumber) +
      '<div class="plumber-body">' +
        '<h3 class="plumber-name">' + plumber.name + '</h3>' +
        '<p class="plumber-spec">' + plumber.specialisation + ' &middot; ' + plumber.baseLocation + '</p>' +
        emergencyBadge +
        '<div class="plumber-meta">' +
          '<span>' + plumber.experience + ' yrs experience</span>' +
        '</div>' +
        '<p class="plumber-rating">' + ratingLine + '</p>' +
        '<div class="plumber-actions">' +
          '<button type="button" class="btn btn-outline" data-action="view-profile" data-id="' + plumber.id + '">View Profile</button>' +
          '<button type="button" class="btn btn-primary" data-action="request-service" data-id="' + plumber.id + '">Request Service</button>' +
        '</div>' +
        '<div class="plumber-contact-actions">' +
          '<a class="btn btn-small" href="tel:' + normalisePhoneDigits(plumber.businessPhone) + '">Call</a>' +
          '<a class="btn btn-small" href="mailto:' + plumber.email + '">Email</a>' +
          '<a class="btn btn-small" target="_blank" rel="noopener" href="https://wa.me/27' + normalisePhoneDigits(plumber.businessPhone).replace(/^0/, "") + '">WhatsApp</a>' +
        '</div>' +
      '</div>' +
    '</article>'
  );
}

function findPlumber(id) {
  return currentPlumbers.find(function (p) { return p.id === id; });
}

/* Delegated click handling for View Profile / Request Service buttons,
   since cards are re-rendered dynamically. */
document.addEventListener("click", function (event) {
  const btn = event.target.closest("[data-action]");
  if (!btn) return;
  const id = btn.getAttribute("data-id");
  if (btn.getAttribute("data-action") === "view-profile") {
    viewPlumberProfile(id);
  } else if (btn.getAttribute("data-action") === "request-service") {
    requestService(id);
  }
});

/* ---------------------------------------------------------
   5. VIEW PROFILE — modal dialog with real plumber data
   --------------------------------------------------------- */
function ensureProfileModal() {
  let modal = document.getElementById("profile-modal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "profile-modal";
  modal.className = "profile-modal";
  modal.innerHTML =
    '<div class="profile-modal-card" role="dialog" aria-modal="true">' +
      '<button type="button" class="profile-modal-close" aria-label="Close profile">✕</button>' +
      '<div id="profile-modal-body"></div>' +
    '</div>';
  document.body.appendChild(modal);

  modal.addEventListener("click", function (event) {
    if (event.target === modal) closeProfileModal();
  });
  modal.querySelector(".profile-modal-close").addEventListener("click", closeProfileModal);

  return modal;
}

function closeProfileModal() {
  const modal = document.getElementById("profile-modal");
  if (modal) modal.classList.remove("open");
}

function viewPlumberProfile(id) {
  const plumber = findPlumber(id);
  if (!plumber) return;

  const modal = ensureProfileModal();
  const body = document.getElementById("profile-modal-body");
  const emergencyLine = plumber.emergencyAvailable
    ? '<p class="emergency-badge">Emergency callout available</p>' : "";
  const ratingLine = plumber.reviewCount > 0
    ? starString(plumber.rating) + " " + plumber.rating.toFixed(1) + " (" + plumber.reviewCount + " ratings)"
    : "No ratings yet";

  body.innerHTML =
    plumberAvatarHtml(plumber, "profile-photo") +
    '<h2>' + plumber.name + '</h2>' +
    '<p class="profile-spec">' + plumber.specialisation + '</p>' +
    emergencyLine +
    '<ul class="profile-list">' +
      '<li><strong>Experience:</strong> ' + plumber.experience + ' years</li>' +
      '<li><strong>Based in:</strong> ' + plumber.baseLocation + '</li>' +
      '<li><strong>Service areas:</strong> ' + plumber.serviceAreas.join(", ") + '</li>' +
      '<li><strong>Rating:</strong> ' + ratingLine + '</li>' +
      '<li><strong>Business phone:</strong> ' + plumber.businessPhone + '</li>' +
      '<li><strong>Email:</strong> ' + plumber.email + '</li>' +
    '</ul>' +
    '<p class="profile-background">' + plumber.background + '</p>' +
    '<div class="profile-actions">' +
      '<a class="btn btn-small" href="tel:' + normalisePhoneDigits(plumber.businessPhone) + '">Call</a>' +
      '<a class="btn btn-small" href="mailto:' + plumber.email + '">Email</a>' +
      '<a class="btn btn-small" target="_blank" rel="noopener" href="https://wa.me/27' + normalisePhoneDigits(plumber.businessPhone).replace(/^0/, "") + '">WhatsApp</a>' +
      '<button type="button" class="btn btn-primary" data-action="request-service" data-id="' + plumber.id + '">Request Service</button>' +
    '</div>';

  modal.classList.add("open");
}

/* "Request Service" — jumps to the booking form and pre-selects the
   plumber. The booking form only exists on services.html, so if this is
   clicked from a plumber card on another page (e.g. the homepage search
   results), redirect there with the plumber id in the URL instead of
   silently doing nothing. */
function requestService(id) {
  closeProfileModal();
  const bookingSelect = document.getElementById("booking-plumber");
  const bookingSection = document.getElementById("booking");

  if (!bookingSelect || !bookingSection) {
    window.location.href = "services.html?plumber=" + encodeURIComponent(id) + "#booking";
    return;
  }

  selectPlumberInBookingForm(id);
  bookingSection.scrollIntoView({ behavior: "smooth" });
}

/* Sets the booking form's plumber dropdown to the given id (if present as
   an option), refreshes dependent fields, and fires a change event so the
   availability lookup (setupAvailabilityCheck) picks it up. */
function selectPlumberInBookingForm(id) {
  const bookingSelect = document.getElementById("booking-plumber");
  if (!bookingSelect || !id) return false;

  const hasOption = Array.prototype.some.call(bookingSelect.options, function (opt) { return opt.value === id; });
  if (!hasOption) return false;

  bookingSelect.value = id;
  populateServiceOptionsForPlumber();
  bookingSelect.dispatchEvent(new Event("change"));
  return true;
}

/* On services.html, applies a plumber id carried over from another page
   via ?plumber=p1 (see requestService above), once the plumber select has
   been populated from the backend/fallback data. */
function applyPlumberFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const plumberId = params.get("plumber");
  if (!plumberId) return;

  const applied = selectPlumberInBookingForm(plumberId);
  if (applied) {
    const bookingSection = document.getElementById("booking");
    if (bookingSection) {
      window.setTimeout(function () { bookingSection.scrollIntoView({ behavior: "smooth" }); }, 50);
    }
  }
}

/* ---------------------------------------------------------
   6. HOME PAGE — "FIND A PLUMBER" SEARCH
   --------------------------------------------------------- */
function setupHomeSearch() {
  const form = document.getElementById("plumber-search-form");
  if (!form) return;

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const location = document.getElementById("search-location").value.trim();
    const service = document.getElementById("search-service").value;
    runPlumberSearch(location, service);
  });

  runPlumberSearch("", "");
}

function runPlumberSearch(location, service) {
  const query = new URLSearchParams();
  if (location) query.set("location", location);
  if (service) query.set("service", service);

  apiFetch("/api/plumbers/search?" + query.toString())
    .then(function (results) {
      if (!Array.isArray(results)) throw new Error("Unexpected response");
      currentPlumbers = results;
      renderSearchResults(results, "Live results from KasiLink SA.");
    })
    .catch(function () {
      const filtered = FALLBACK_PLUMBERS.filter(function (p) {
        const locOk = !location || p.serviceAreas.some(function (a) {
          return a.toLowerCase().includes(location.toLowerCase()) || location.toLowerCase().includes(a.toLowerCase());
        });
        const svcOk = !service || (service.toLowerCase().includes("emergency")
          ? p.emergencyAvailable
          : p.specialisation.toLowerCase().includes(service.toLowerCase()) || service.toLowerCase().includes(p.specialisation.toLowerCase()));
        return locOk && svcOk;
      });
      currentPlumbers = filtered;
      renderSearchResults(filtered, "Offline mode — showing saved plumber data (the live KasiLink SA backend could not be reached).");
    });
}

function renderSearchResults(list, statusMessage) {
  const resultsContainer = document.getElementById("search-results");
  const statusContainer = document.getElementById("search-status");
  if (!resultsContainer) return;

  if (statusContainer) statusContainer.textContent = statusMessage;

  if (!list.length) {
    resultsContainer.innerHTML = "<p>No plumbers matched that search. Try a different location or service.</p>";
    return;
  }

  resultsContainer.innerHTML = '<div class="plumber-grid">' + list.map(buildPlumberCard).join("") + "</div>";
}

/* ---------------------------------------------------------
   7. PRODUCTS / SERVICES PAGE — FULL PLUMBER DIRECTORY
   --------------------------------------------------------- */
function setupPlumberDirectory() {
  const grid = document.getElementById("plumber-directory");
  const statusEl = document.getElementById("directory-status");
  if (!grid) return;

  apiFetch("/api/plumbers")
    .then(function (plumbers) {
      if (!Array.isArray(plumbers)) throw new Error("Unexpected response");
      currentPlumbers = plumbers;
      grid.innerHTML = plumbers.map(buildPlumberCard).join("");
      if (statusEl) statusEl.textContent = "Live data from KasiLink SA.";
      populatePlumberSelect(plumbers);
      applyPlumberFromUrl();
    })
    .catch(function () {
      currentPlumbers = FALLBACK_PLUMBERS;
      grid.innerHTML = FALLBACK_PLUMBERS.map(buildPlumberCard).join("");
      if (statusEl) statusEl.textContent = "Offline mode — the live KasiLink SA backend could not be reached, showing saved plumber data.";
      populatePlumberSelect(FALLBACK_PLUMBERS);
      applyPlumberFromUrl();
    });
}

function populatePlumberSelect(plumbers) {
  const select = document.getElementById("booking-plumber");
  if (!select) return;
  const current = select.value;
  select.innerHTML = '<option value="">Select a plumber</option>' +
    plumbers.map(function (p) { return '<option value="' + p.id + '">' + p.name + ' — ' + p.specialisation + '</option>'; }).join("");
  if (current) select.value = current;
}

function populateServiceSelect() {
  const select = document.getElementById("booking-service");
  if (!select) return;
  select.innerHTML = '<option value="">Select a service</option>' +
    currentServices.map(function (s) { return '<option value="' + s.name + '">' + s.name + ' — ' + formatRand(s.price) + '</option>'; }).join("");
}

function populateServiceOptionsForPlumber() {
  // Placeholder hook: all services are bookable with any plumber in this
  // dataset, but this function exists so a future version can restrict the
  // service list per plumber specialisation without touching other code.
  populateServiceSelect();
}

/* ---------------------------------------------------------
   8. AVAILABILITY LOOKUP
   --------------------------------------------------------- */
function setupAvailabilityCheck() {
  const dateInput = document.getElementById("booking-date");
  const plumberSelect = document.getElementById("booking-plumber");
  const timeSelect = document.getElementById("booking-time");
  const statusEl = document.getElementById("availability-status");
  if (!dateInput || !plumberSelect || !timeSelect) return;

  const today = new Date().toISOString().slice(0, 10);
  dateInput.setAttribute("min", today);

  function refreshAvailability() {
    const plumberId = plumberSelect.value;
    const date = dateInput.value;
    timeSelect.innerHTML = '<option value="">Select a time</option>';

    if (!plumberId || !date) return;

    if (statusEl) statusEl.textContent = "Checking availability…";

    apiFetch("/api/plumbers/" + encodeURIComponent(plumberId) + "/availability?date=" + encodeURIComponent(date))
      .then(function (result) {
        const times = (result && result.availableTimes) || [];
        if (!times.length) {
          if (statusEl) statusEl.textContent = "No time slots left for that date — try another date.";
          return;
        }
        timeSelect.innerHTML = '<option value="">Select a time</option>' +
          times.map(function (t) { return '<option value="' + t + '">' + t + '</option>'; }).join("");
        if (statusEl) statusEl.textContent = times.length + " time slot(s) available.";
      })
      .catch(function () {
        if (statusEl) statusEl.textContent = "Could not check live availability (backend unreachable). Choose a time and the backend will still reject a double-booking on submit.";
        timeSelect.innerHTML = '<option value="">Select a time</option>' +
          ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00"]
            .map(function (t) { return '<option value="' + t + '">' + t + '</option>'; }).join("");
      });
  }

  plumberSelect.addEventListener("change", refreshAvailability);
  dateInput.addEventListener("change", refreshAvailability);
}

/* ---------------------------------------------------------
   9. BOOKING FORM (Request Service)
   --------------------------------------------------------- */
function setupBookingForm() {
  const form = document.getElementById("booking-form");
  if (!form) return;

  populateServiceSelect();

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const contact = document.getElementById("booking-contact").value.trim();
    if (!isValidSaPhone(contact)) {
      showBookingResult({ success: false, message: "Enter a valid 10-digit South African contact number starting with 0 (e.g. 0821234567)." });
      return;
    }

    const requestBody = {
      customerName: document.getElementById("booking-name").value.trim(),
      contact: contact,
      email: document.getElementById("booking-email").value.trim(),
      location: document.getElementById("booking-location").value.trim(),
      plumberId: document.getElementById("booking-plumber").value,
      service: document.getElementById("booking-service").value,
      date: document.getElementById("booking-date").value,
      time: document.getElementById("booking-time").value,
      quantity: Number(document.getElementById("booking-count").value) || 1
    };

    const submitBtn = form.querySelector("button[type=submit]");
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Submitting…"; }

    apiFetch("/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    })
      .then(function (result) { showBookingResult(result); })
      .catch(function () {
        showBookingResult({ success: false, message: "Could not reach the KasiLink SA backend. Please try again shortly." });
      })
      .finally(function () {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Request Service"; }
      });
  });
}

function showBookingResult(result) {
  const messageBox = document.getElementById("booking-message");
  if (!messageBox) return;

  messageBox.className = "form-msg " + (result.success ? "success" : "error");

  if (result.success) {
    const b = result.booking || {};
    messageBox.innerHTML =
      result.message + "<br>" +
      "Plumber: " + (result.plumberName || "") + "<br>" +
      (b.date ? ("Date/time: " + b.date + " at " + b.time + "<br>") : "") +
      (b.totalPrice != null ? ("Estimated total: " + formatRand(b.totalPrice)) : "");
  } else {
    messageBox.textContent = result.message || "Something went wrong with that booking.";
  }
}

/* ---------------------------------------------------------
   10. STAR RATING WIDGET
   --------------------------------------------------------- */
function setupRatingWidget() {
  const widget = document.getElementById("star-rating");
  const ratingForm = document.getElementById("rating-form");
  const ratingPlumberSelect = document.getElementById("rating-plumber");
  if (!widget || !ratingForm) return;

  const stars = widget.querySelectorAll("button");
  let selectedRating = 0;

  stars.forEach(function (star) {
    star.addEventListener("click", function () {
      selectedRating = Number(star.dataset.value);
      stars.forEach(function (s) {
        s.classList.toggle("filled", Number(s.dataset.value) <= selectedRating);
      });
    });
  });

  ratingForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!selectedRating) {
      showRatingResult({ success: false, message: "Choose a star rating first." });
      return;
    }

    apiFetch("/api/rating", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: selectedRating,
        plumberId: ratingPlumberSelect ? ratingPlumberSelect.value : ""
      })
    })
      .then(function (result) { showRatingResult(result); })
      .catch(function () {
        showRatingResult({ success: false, message: "Could not reach the KasiLink SA backend. Please try again shortly." });
      });
  });
}

function showRatingResult(result) {
  const messageBox = document.getElementById("rating-message");
  if (!messageBox) return;
  messageBox.className = "form-msg " + (result.success ? "success" : "error");
  messageBox.textContent = result.message;
}

/* ---------------------------------------------------------
   11. REVENUE MODEL CALCULATOR
   Models KasiLink SA's OWN revenue (the R50 booking fee collected
   on every booking), not the plumber's service price — the service
   dropdown only feeds the informational "example customer quote"
   line so people can see what the customer actually pays.
   Profit is always clamped to a minimum of R0 for display, and
   inputs cannot go below zero.
   --------------------------------------------------------- */
const PLATFORM_COST_PER_BOOKING = 8; // hosting, payment processing & support, per booking

function setupRevenueCalculator() {
  const form = document.getElementById("revenue-calculator");
  if (!form) return;

  const priceSelect = document.getElementById("calc-service");
  const bookingsInput = document.getElementById("calc-bookings");
  const exampleQuoteEl = document.getElementById("calc-example-quote");

  priceSelect.innerHTML = currentServices.map(function (s) {
    return '<option value="' + s.price + '">' + s.name + ' — ' + formatRand(s.price) + '</option>';
  }).join("");

  function update() {
    if (Number(bookingsInput.value) < 0) bookingsInput.value = 0;
    const bookings = Math.max(0, Math.floor(Number(bookingsInput.value) || 0));
    const servicePrice = Math.max(0, Number(priceSelect.value) || 0);

    const revenue = BOOKING_FEE * bookings;
    const totalCost = PLATFORM_COST_PER_BOOKING * bookings;
    const rawProfit = revenue - totalCost;
    const profit = Math.max(0, rawProfit);

    document.getElementById("calc-revenue").textContent = formatRand(revenue);
    document.getElementById("calc-cost").textContent = formatRand(totalCost);

    const profitEl = document.getElementById("calc-profit");
    profitEl.textContent = formatRand(profit);
    profitEl.className = "value " + (rawProfit >= 0 ? "positive" : "negative");

    if (exampleQuoteEl) {
      const quote = KasiLink_computeQuoteClientSide(servicePrice, 1);
      exampleQuoteEl.textContent = formatRand(quote.totalPrice);
    }
  }

  form.addEventListener("input", update);
  update();
}

/* Mirrors za.co.kasilink.KasiLink#computeQuote exactly, for the
   informational "example customer quote" line only. This is display
   logic, not a source of truth — the real quote always comes back
   from POST /api/booking. */
function KasiLink_computeQuoteClientSide(unitPrice, quantity) {
  const subtotal = unitPrice * Math.max(0, quantity);
  const amountBeforeTax = subtotal + BOOKING_FEE;
  const taxAmount = amountBeforeTax * TAX_RATE;
  const totalPrice = amountBeforeTax;
  return { subtotal: subtotal, bookingFee: BOOKING_FEE, taxAmount: taxAmount, totalPrice: totalPrice };
}

/* ---------------------------------------------------------
   12. CONTACT FORM
   --------------------------------------------------------- */
function setupContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("contact-name").value.trim();
    const email = document.getElementById("contact-email").value.trim();
    const message = document.getElementById("contact-message").value.trim();
    const reasonEl = document.getElementById("contact-reason");
    const subject = reasonEl ? reasonEl.value : "";
    const messageBox = document.getElementById("contact-message-status");
    const submitBtn = form.querySelector("button[type=submit]");

    if (!name || !email || !message) {
      messageBox.className = "form-msg error";
      messageBox.textContent = "Please fill in your name, email and message.";
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      messageBox.className = "form-msg error";
      messageBox.textContent = "Enter a valid email address.";
      return;
    }

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Sending…"; }
    messageBox.className = "form-msg";
    messageBox.textContent = "Sending your message…";

    apiFetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name, email: email, subject: subject, message: message })
    })
      .then(function (result) {
        messageBox.className = "form-msg " + (result.success ? "success" : "error");
        messageBox.textContent = result.message || (result.success ? "Message sent." : "Something went wrong sending that message.");
        if (result.success) form.reset();
      })
      .catch(function () {
        messageBox.className = "form-msg error";
        messageBox.textContent = "Could not reach the KasiLink SA backend, so your message wasn't sent. Please try again shortly, or call/WhatsApp a plumber directly from their profile for anything urgent.";
      })
      .finally(function () {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Send Message"; }
      });
  });
}

/* ---------------------------------------------------------
   13. AI ASSISTANT — backend-connected chat widget
   Calls POST /api/chat on the KasiLink SA backend, which
   answers only from real service/price/plumber data. Falls
   back to a small local keyword matcher if the backend cannot
   be reached, so the widget never goes fully dead.
   --------------------------------------------------------- */
const LOCAL_CHAT_FALLBACK_REPLY =
  "I can't reach the KasiLink SA backend right now, so I can only answer with saved information. Try the Products / Services page for services, prices and plumbers, or the Contact page.";

const CHAT_QUICK_REPLIES = ["Our services", "Emergency plumbing", "How booking works", "Service areas"];

function appendChatMessage(log, text, sender) {
  const bubble = document.createElement("div");
  bubble.className = "chat-msg " + sender;
  bubble.textContent = text;
  log.appendChild(bubble);
  log.scrollTop = log.scrollHeight;
}

function setupChatWidget() {
  const toggleButton = document.getElementById("chat-toggle");
  const panel = document.getElementById("chat-panel");
  const closeButton = document.getElementById("chat-close");
  const log = document.getElementById("chat-log");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const quickRepliesBar = document.getElementById("chat-quick-replies");

  if (!toggleButton || !panel || !form || !input || !log) return;

  CHAT_QUICK_REPLIES.forEach(function (label) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.addEventListener("click", function () { handleChatSubmit(label); });
    quickRepliesBar.appendChild(btn);
  });

  toggleButton.addEventListener("click", function () {
    panel.classList.toggle("open");
    if (panel.classList.contains("open")) input.focus();
  });

  if (closeButton) {
    closeButton.addEventListener("click", function () { panel.classList.remove("open"); });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    handleChatSubmit(text);
    input.value = "";
  });

  function handleChatSubmit(text) {
    appendChatMessage(log, text, "user");

    apiFetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    })
      .then(function (result) {
        appendChatMessage(log, (result && result.reply) || LOCAL_CHAT_FALLBACK_REPLY, "bot");
      })
      .catch(function () {
        appendChatMessage(log, LOCAL_CHAT_FALLBACK_REPLY, "bot");
      });
  }
}

/* ---------------------------------------------------------
   14. RUN EVERYTHING ONCE THE PAGE HAS LOADED
   --------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function () {
  setupNavToggle();
  setupHomeSearch();
  setupPlumberDirectory();
  setupAvailabilityCheck();
  setupRatingWidget();
  setupContactForm();
  setupChatWidget();

  // These render prices, so wait for the backend's service catalogue
  // (or the local fallback) before building them.
  loadServices().then(function () {
    renderServiceCategoryCards();
    setupBookingForm();
    setupRevenueCalculator();
  });
});
