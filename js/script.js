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
const PRODUCTION_API_BASE_URL = "https://kasilink-backend-1.onrender.com";

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
// NOTE (photo fix): the imagePath values below are all LOWERCASE now. Before, the
// files were called "Thabo-Mokoena.jpg" but the backend sent "thabo-mokoena.jpg".
// Our host (Linux) treats those as different files, so the photos never loaded.
// Now the file names, this list and KasiLink.java all use the same lowercase names.
const FALLBACK_PLUMBERS = [
  {
    id: "p1", name: "Thabo Mokoena", experience: 8, baseLocation: "Soshanguve South",
    specialisation: "Residential Plumbing", businessPhone: "071 000 0001", email: "thabo@kasilink.co.za",
    background: "Experienced in household water systems, pipe installation and leak repairs.",
    serviceAreas: ["Soshanguve South", "Soshanguve", "Mabopane", "Pretoria North"],
    emergencyAvailable: true, imagePath: "images/plumbers/thabo-mokoena.jpg", rating: 0, reviewCount: 0
  },
  {
    id: "p2", name: "Kabelo Maseko", experience: 6, baseLocation: "Soshanguve South",
    specialisation: "Leak Repairs", businessPhone: "071 000 0002", email: "kabelo@kasilink.co.za",
    background: "Specialises in finding and repairing water leaks, damaged pipes, taps and toilets.",
    serviceAreas: ["Soshanguve South", "Soshanguve North", "Soshanguve", "Pretoria North"],
    emergencyAvailable: true, imagePath: "images/plumbers/kabelo-maseko.jpg", rating: 0, reviewCount: 0
  },
  {
    id: "p3", name: "Sipho Nkosi", experience: 10, baseLocation: "Soshanguve West",
    specialisation: "Installation and Maintenance", businessPhone: "071 000 0003", email: "sipho@kasilink.co.za",
    background: "Experienced in residential and commercial plumbing projects.",
    serviceAreas: ["Soshanguve West", "Soshanguve", "Ga-Rankuwa", "Pretoria"],
    emergencyAvailable: false, imagePath: "images/plumbers/sipho-nkosi.jpg", rating: 0, reviewCount: 0
  },
  {
    id: "p4", name: "Mpho Baloyi", experience: 5, baseLocation: "Soshanguve North",
    specialisation: "Bathroom Plumbing", businessPhone: "071 000 0004", email: "mpho@kasilink.co.za",
    background: "Specialises in toilets, showers, basins, taps and renovations.",
    serviceAreas: ["Soshanguve North", "Soshanguve", "Mabopane", "Pretoria North"],
    emergencyAvailable: false, imagePath: "images/plumbers/mpho-baloyi.jpg", rating: 0, reviewCount: 0
  },
  {
    id: "p5", name: "Lucky Makhubele", experience: 6, baseLocation: "Soshanguve Block L",
    specialisation: "Drainage Systems", businessPhone: "071 000 0005", email: "lucky@kasilink.co.za",
    background: "Experienced in blocked drains, wastewater systems and drainage maintenance.",
    serviceAreas: ["Soshanguve Block L", "Soshanguve", "Mabopane"],
    emergencyAvailable: true, imagePath: "images/plumbers/lucky-makhubele.jpg", rating: 0, reviewCount: 0
  },
  {
    id: "p6", name: "Thabang Molefe", experience: 11, baseLocation: "Soshanguve Block L",
    specialisation: "Water Pipe Installation", businessPhone: "071 000 0006", email: "thabang@kasilink.co.za",
    background: "Experienced in installing and repairing household water pipes.",
    serviceAreas: ["Soshanguve Block L", "Soshanguve", "Ga-Rankuwa", "Pretoria"],
    emergencyAvailable: false, imagePath: "images/plumbers/thabang-molefe.jpg", rating: 0, reviewCount: 0
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
  // Show cents as two digits when there are any (R1,307.50, not R1,307.5).
  const hasCents = Math.round(value * 100) % 100 !== 0;
  return "R" + value.toLocaleString("en-ZA", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2
  });
}

function starString(rating) {
  const fullStars = Math.round(rating || 0);
  return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
}

function initialsFor(name) {
  return name.split(" ").map(function (p) { return p.charAt(0); }).join("").slice(0, 2).toUpperCase();
}

/* Renders a plumber's photo if images/plumbers/<file>.jpg has actually
   been uploaded, otherwise falls back to the initials avatar.
   Student explanation: our photo files used to be empty (2 bytes), which is
   not a real picture. A broken <img> shows an ugly icon, so I use two safety nets:
   1) onerror  -> the image failed to load (404 or not a real image)
   2) onload   -> the image "loaded" but has no size (naturalWidth is 0)
   In both cases I remove the <img> so the initials circle shows instead.
   I also encodeURI the path so odd characters can't break the HTML. */
function plumberAvatarHtml(plumber, extraClass) {
  const cls = "plumber-photo" + (extraClass ? " " + extraClass : "");
  const baseClass = cls.split(" ")[0]; // "plumber-photo" - used to find the parent box
  const initials = initialsFor(plumber.name);
  if (!plumber.imagePath) {
    return '<div class="' + cls + '" aria-hidden="true">' + initials + '</div>';
  }
  const dropImage = "this.closest('." + baseClass + "').classList.remove('has-photo'); this.remove();";
  return (
    '<div class="' + cls + ' has-photo" aria-hidden="true">' +
      '<img src="' + encodeURI(plumber.imagePath) + '" alt="" loading="lazy" ' +
        'onerror="' + dropImage + '" ' +
        'onload="if (!this.naturalWidth) { ' + dropImage + ' }">' +
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

/* Student explanation: this is the one function every API call goes through.
   Bug I fixed: if the server sent back something that is not JSON (for example
   Render's HTML error page while the free server is waking up), response.json()
   threw an error and the booking form said "could not reach the backend" with
   no real reason. Now I read the reply as text first and only then try JSON.parse,
   so we always return an object with success true/false and a message. */
function apiFetch(path, options) {
  return fetch(API_BASE_URL + path, options).then(function (response) {
    return response.text().then(function (raw) {
      let data;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch (e) {
        data = { success: false, message: "The server sent an unexpected reply (status " + response.status + "). Please try again." };
      }
      if (!response.ok && data && typeof data === "object" && !Array.isArray(data) && !("success" in data)) {
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
  // Bug I fixed: rebuilding the list used to RESET the service the customer
  // had already chosen, so I remember the choice and put it back.
  const select = document.getElementById("booking-service");
  const chosen = select ? select.value : "";
  populateServiceSelect();
  if (select && chosen) select.value = chosen;
}

/* ---------------------------------------------------------
   8. AVAILABILITY LOOKUP
   --------------------------------------------------------- */
/* Today's date as YYYY-MM-DD in the USER'S local time.
   Bug I fixed: the old code used new Date().toISOString(), which gives the UTC
   date. In South Africa (UTC+2) that is wrong after 22:00 and the calendar
   could block "today". Here I build the string from local year/month/day. */
function localDateString() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + mm + "-" + dd;
}

// Shared by the availability dropdown and the booking form, so after a
// successful booking we can reload the free slots (the booked one disappears).
let refreshAvailabilityNow = function () {};

function setupAvailabilityCheck() {
  const dateInput = document.getElementById("booking-date");
  const plumberSelect = document.getElementById("booking-plumber");
  const timeSelect = document.getElementById("booking-time");
  const statusEl = document.getElementById("availability-status");
  if (!dateInput || !plumberSelect || !timeSelect) return;

  dateInput.setAttribute("min", localDateString());

  // Bug I fixed: if someone changed plumber quickly, an OLD reply could arrive
  // after a NEW one and overwrite the times. I number each request and ignore
  // any reply that is not the latest one.
  let latestRequest = 0;

  function refreshAvailability() {
    const plumberId = plumberSelect.value;
    const date = dateInput.value;
    const previousChoice = timeSelect.value; // so we can keep the time if still free
    timeSelect.innerHTML = '<option value="">Select a time</option>';

    if (!plumberId || !date) {
      if (statusEl) statusEl.textContent = "";
      return;
    }

    const thisRequest = ++latestRequest;
    if (statusEl) statusEl.textContent = "Checking availability…";

    apiFetch("/api/plumbers/" + encodeURIComponent(plumberId) + "/availability?date=" + encodeURIComponent(date))
      .then(function (result) {
        if (thisRequest !== latestRequest) return; // an newer request replaced this one
        if (!result || !Array.isArray(result.availableTimes)) {
          // e.g. backend said "Invalid or past date" - show its message instead of guessing
          if (statusEl) statusEl.textContent = (result && result.message) || "Could not load time slots.";
          return;
        }
        const times = result.availableTimes;
        if (!times.length) {
          if (statusEl) statusEl.textContent = "No time slots left for that date — try another date.";
          return;
        }
        timeSelect.innerHTML = '<option value="">Select a time</option>' +
          times.map(function (t) { return '<option value="' + t + '">' + t + '</option>'; }).join("");
        if (previousChoice && times.indexOf(previousChoice) !== -1) timeSelect.value = previousChoice;
        if (statusEl) statusEl.textContent = times.length + " time slot(s) available.";
      })
      .catch(function () {
        if (thisRequest !== latestRequest) return;
        if (statusEl) statusEl.textContent = "Could not check live availability (backend unreachable). Choose a time and the backend will still reject a double-booking on submit.";
        timeSelect.innerHTML = '<option value="">Select a time</option>' +
          ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00"]
            .map(function (t) { return '<option value="' + t + '">' + t + '</option>'; }).join("");
      });
  }

  refreshAvailabilityNow = refreshAvailability;
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

    // Student explanation: I check everything in the browser first so the
    // customer gets a quick message. The backend checks it all again, because
    // we must never trust only the frontend.
    const contact = document.getElementById("booking-contact").value.trim();
    if (!isValidSaPhone(contact)) {
      showBookingResult({ success: false, message: "Enter a valid 10-digit South African contact number starting with 0 (e.g. 0821234567)." });
      return;
    }

    const plumberId = document.getElementById("booking-plumber").value;
    const service = document.getElementById("booking-service").value;
    const date = document.getElementById("booking-date").value;
    const time = document.getElementById("booking-time").value;
    // Bug I fixed: the old code let you submit with no plumber/service/time
    // chosen and only the server complained. Now we stop it here.
    if (!plumberId || !service || !date || !time) {
      showBookingResult({ success: false, message: "Please choose a plumber, a service, a date and a time slot." });
      return;
    }

    // Math.floor + Math.max: quantity must be a whole number of at least 1
    const quantity = Math.max(1, Math.floor(Number(document.getElementById("booking-count").value) || 1));

    const requestBody = {
      customerName: document.getElementById("booking-name").value.trim(),
      contact: contact,
      email: document.getElementById("booking-email").value.trim(),
      location: document.getElementById("booking-location").value.trim(),
      plumberId: plumberId,
      service: service,
      date: date,
      time: time,
      quantity: quantity
    };

    const submitBtn = form.querySelector("button[type=submit]");
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Submitting…"; }

    authFetch("/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    })
      .then(function (result) {
        showBookingResult(result);
        // Whether it worked or the slot was taken (409), reload the free
        // times so the dropdown always matches what the server knows.
        refreshAvailabilityNow();
        if (result && result.success) {
          // Clear the personal details so the same booking is not sent twice,
          // but keep plumber/date so the customer can see the slot disappear.
          ["booking-name", "booking-contact", "booking-email", "booking-location"].forEach(function (id) {
            document.getElementById(id).value = "";
          });
          document.getElementById("booking-count").value = 1;
        }
      })
      .catch(function () {
        showBookingResult({ success: false, message: "Could not reach the KasiLink SA backend. Please try again shortly." });
      })
      .finally(function () {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Request Service"; }
        applyAuthGates(); // if the login expired meanwhile, lock the form again
      });
  });
}

/* Shows the result of a booking. I use textContent for anything that came
   from the server/user (not innerHTML) so nobody can inject HTML into the page. */
function showBookingResult(result) {
  const messageBox = document.getElementById("booking-message");
  if (!messageBox) return;

  messageBox.className = "form-msg " + (result && result.success ? "success" : "error");
  messageBox.textContent = "";

  if (result && result.success) {
    const b = result.booking || {};
    const lines = [result.message];
    if (result.plumberName) lines.push("Plumber: " + result.plumberName);
    if (b.date) lines.push("Date/time: " + b.date + " at " + b.time);
    if (b.totalPrice != null) lines.push("Estimated total: " + formatRand(b.totalPrice));
    lines.forEach(function (line, i) {
      if (i > 0) messageBox.appendChild(document.createElement("br"));
      messageBox.appendChild(document.createTextNode(line));
    });
  } else {
    messageBox.textContent = (result && result.message) || "Something went wrong with that booking.";
  }
  messageBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
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

    authFetch("/api/rating", {
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
   Profit/loss is shown honestly (negative = loss) and inputs cannot go
   below zero.
   --------------------------------------------------------- */
const PLATFORM_COST_PER_BOOKING = 8; // cv: payment gateway + SMS, per booking (Maths Appendix)
const PLATFORM_FIXED_COST = 3500;   // F : hosting, domain, marketing per month (Maths Appendix)

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
    const totalCost = PLATFORM_FIXED_COST + PLATFORM_COST_PER_BOOKING * bookings; // TC = F + cv x q
    const rawProfit = revenue - totalCost;                                          // profit = R - TC
    const profit = rawProfit; // a loss is shown honestly as a negative number
    const breakEvenEl = document.getElementById("calc-breakeven");
    if (breakEvenEl) {
      breakEvenEl.textContent = Math.ceil(PLATFORM_FIXED_COST / (BOOKING_FEE - PLATFORM_COST_PER_BOOKING)) + " bookings / month";
    }

    document.getElementById("calc-revenue").textContent = formatRand(revenue);
    document.getElementById("calc-cost").textContent = formatRand(totalCost);

    const profitEl = document.getElementById("calc-profit");
    profitEl.textContent = (profit < 0 ? "-" : "") + formatRand(Math.abs(profit));
    profitEl.className = "value " + (rawProfit >= 0 ? "positive" : "negative");

    if (exampleQuoteEl) {
      const quote = KasiLink_computeQuoteClientSide(servicePrice, 1);
      exampleQuoteEl.textContent = formatRand(quote.totalPrice);
    }
  }

  form.addEventListener("input", update);
  update();
}

/* ---------------------------------------------------------
   14. ANALYTICS CHARTS (revenue.html)
   Plain SVG charts so no external library is needed. Data comes
   from the Mathematics Appendix (Statistical Summaries 1-3) and
   the month-by-month profit workings in the Excel model.
   --------------------------------------------------------- */
function svgEl(tag, attrs, text) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
  if (text !== undefined) el.textContent = text;
  return el;
}

/* type: "bar" or "line". values may be negative. */
function drawChart(containerId, cfg) {
  const host = document.getElementById(containerId);
  if (!host) return;
  const W = 560, H = 320, L = 64, R = 16, T = 40, B = 56;
  const svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": cfg.title + ". " + cfg.caption, width: "100%" });
  svg.appendChild(svgEl("text", { x: W / 2, y: 22, "text-anchor": "middle", "font-size": 15, "font-weight": "bold", fill: "#1a1a1a" }, cfg.title));

  const all = cfg.values.concat(cfg.values2 || []).concat([0]);
  let max = Math.max.apply(null, all), min = Math.min.apply(null, all);
  if (max === min) max = min + 1;
  const pad = (max - min) * 0.08; max += pad; if (min < 0) min -= pad;
  const x0 = L, x1 = W - R, y0 = H - B, y1 = T;
  const yPos = function (v) { return y0 - ((v - min) / (max - min)) * (y0 - y1); };
  const n = cfg.labels.length, step = (x1 - x0) / n;

  for (let i = 0; i <= 4; i++) {            // horizontal grid + y labels
    const v = min + ((max - min) * i) / 4, y = yPos(v);
    svg.appendChild(svgEl("line", { x1: x0, x2: x1, y1: y, y2: y, stroke: "#d8d8d4" }));
    svg.appendChild(svgEl("text", { x: x0 - 6, y: y + 4, "text-anchor": "end", "font-size": 11, fill: "#1a1a1a" }, Math.round(v).toLocaleString("en-ZA")));
  }
  svg.appendChild(svgEl("line", { x1: x0, x2: x1, y1: yPos(0), y2: yPos(0), stroke: "#1a1a1a" }));

  cfg.labels.forEach(function (lab, i) {    // x labels
    svg.appendChild(svgEl("text", { x: x0 + step * i + step / 2, y: y0 + 18, "text-anchor": "middle", "font-size": 11, fill: "#1a1a1a" }, lab));
  });

  if (cfg.type === "bar") {
    cfg.values.forEach(function (v, i) {
      const bw = step * 0.6, bx = x0 + step * i + (step - bw) / 2;
      const top = Math.min(yPos(v), yPos(0)), h = Math.abs(yPos(v) - yPos(0));
      svg.appendChild(svgEl("rect", { x: bx, y: top, width: bw, height: h, fill: v < 0 ? "#E03C31" : "#007749" }));
      svg.appendChild(svgEl("text", { x: bx + bw / 2, y: top - 4, "text-anchor": "middle", "font-size": 11, fill: "#1a1a1a" }, cfg.fmt ? cfg.fmt(v) : v));
    });
  } else {
    [[cfg.values, "#007749"], [cfg.values2, "#001489"]].forEach(function (pair) {
      if (!pair[0]) return;
      const pts = pair[0].map(function (v, i) { return (x0 + step * i + step / 2) + "," + yPos(v); }).join(" ");
      svg.appendChild(svgEl("polyline", { points: pts, fill: "none", stroke: pair[1], "stroke-width": 3 }));
      pair[0].forEach(function (v, i) {
        svg.appendChild(svgEl("circle", { cx: x0 + step * i + step / 2, cy: yPos(v), r: 4, fill: pair[1] }));
      });
    });
  }
  svg.appendChild(svgEl("text", { x: W / 2, y: H - 6, "text-anchor": "middle", "font-size": 12, fill: "#1a1a1a" }, cfg.xTitle));
  svg.appendChild(svgEl("text", { x: 14, y: (y0 + y1) / 2, "text-anchor": "middle", "font-size": 12, fill: "#1a1a1a", transform: "rotate(-90 14 " + (y0 + y1) / 2 + ")" }, cfg.yTitle));
  host.appendChild(svg);
}

function setupAnalyticsCharts() {
  if (!document.getElementById("chart-commission")) return;
  drawChart("chart-commission", { type: "bar", title: "Figure 1: Accepted commission (n = 10)",
    caption: "Most plumbers accept a 10 percent commission.", labels: ["5%", "8%", "10%", "12%", "15%"], values: [1, 2, 4, 2, 1],
    xTitle: "Acceptable commission rate", yTitle: "Number of plumbers" });
  drawChart("chart-bookings", { type: "line", title: "Figure 2: Projected bookings per month",
    caption: "Bookings grow quickly then level off near 150.", labels: ["M1", "M2", "M3", "M4", "M5", "M6"], values: [20, 45, 70, 100, 130, 150],
    xTitle: "Month since launch", yTitle: "Bookings per month" });
  drawChart("chart-jobvalue", { type: "bar", title: "Figure 3: Average job value (mean R500)",
    caption: "Average job value of five competing channels.", labels: ["P1", "P2", "P3", "P4", "P5"], values: [650, 480, 420, 550, 400],
    xTitle: "Competing channel (see sources page)", yTitle: "Average job value (R)", fmt: function (v) { return "R" + v; } });
  drawChart("chart-profit", { type: "line", title: "Figure 4: Monthly vs cumulative profit",
    caption: "Cumulative loss peaks at R4,830 in month 3 and turns positive in month 6.", labels: ["M1", "M2", "M3", "M4", "M5", "M6"],
    values: [-2660, -1610, -560, 700, 1960, 2800], values2: [-2660, -4270, -4830, -4130, -2170, 630],
    xTitle: "Month since launch", yTitle: "Profit (R)" });
}

/* Mirrors za.co.kasilink.KasiLink#computeQuote exactly, for the
   informational "example customer quote" line only. This is display
   logic, not a source of truth — the real quote always comes back
   from POST /api/booking. */
function KasiLink_computeQuoteClientSide(unitPrice, quantity) {
  const subtotal = unitPrice * Math.max(0, quantity);
  const taxAmount = BOOKING_FEE * TAX_RATE;           // VAT on the booking fee only (Equation 5)
  const totalPrice = subtotal + BOOKING_FEE + taxAmount;
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
   15. ACCOUNTS: SIGN UP, LOG IN, LOG OUT
   Student explanation of how login works in our site:
   1) The customer signs up or logs in. The backend checks the details and
      sends back a long random TOKEN plus the user's name/email/phone.
   2) We keep that token in the browser (localStorage) so the customer stays
      logged in when they change pages.
   3) Every request that needs a login (booking, rating, my bookings) sends the
      token in the "Authorization: Bearer <token>" header. The BACKEND is what
      really checks it, so hiding buttons here is only for a nicer experience.
   4) Log out deletes the token here and on the server.
   Passwords are never saved in the browser; only the token and the user's name.
   --------------------------------------------------------- */
const SESSION_KEY = "kasilinkSession";

// localStorage can throw (private mode, blocked storage), so everything is in try/catch.
function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const data = raw ? JSON.parse(raw) : null;
    return data && data.token && data.user ? data : null;
  } catch (e) { return null; }
}
function saveSession(token, user) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify({ token: token, user: user })); } catch (e) { /* ignore */ }
}
function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
}

/* Same as apiFetch but adds the login token. If the backend says
   "login_required" (token expired, or the server restarted and forgot it) we
   clear our old login so the page does not pretend the user is still logged in. */
function authFetch(path, options) {
  const opts = Object.assign({}, options || {});
  opts.headers = Object.assign({}, opts.headers || {});
  const session = getSession();
  if (session) opts.headers["Authorization"] = "Bearer " + session.token;
  return apiFetch(path, opts).then(function (result) {
    if (result && result.code === "login_required" && getSession()) {
      clearSession();
      renderAuthNav();
      applyAuthGates();
    }
    return result;
  });
}

/* Only allow redirects to our own pages (e.g. "services.html#booking").
   Without this check, a link like login.html?next=https://evil.com could send
   a freshly logged-in user to another website. */
function safeNextPage(fallback) {
  const next = new URLSearchParams(window.location.search).get("next") || "";
  return /^[a-z0-9-]+\.html(#[a-z0-9-]+)?$/i.test(next) ? next : fallback;
}

function setupAuthNav() {
  renderAuthNav();
  // Check with the server that the saved login is still valid.
  if (getSession()) {
    authFetch("/api/auth/me").then(function (result) {
      if (result && result.success && result.user) {
        saveSession(getSession().token, result.user);
        renderAuthNav();
        applyAuthGates();
      }
    }).catch(function () { /* server asleep: keep the saved login for now */ });
  }
  applyAuthGates();
}

function renderAuthNav() {
  const list = document.querySelector("#main-nav ul");
  if (!list) return;
  list.querySelectorAll(".nav-auth").forEach(function (el) { el.remove(); });

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  function addLink(text, href, id) {
    const li = document.createElement("li");
    li.className = "nav-auth";
    const a = document.createElement("a");
    a.textContent = text;           // textContent: a user's name can never inject HTML
    a.href = href;
    if (id) a.id = id;
    if (href === currentPage) a.setAttribute("aria-current", "page");
    li.appendChild(a);
    list.appendChild(li);
    return a;
  }

  const session = getSession();
  if (session) {
    const firstName = String(session.user.name || "Account").split(" ")[0];
    addLink("My account (" + firstName + ")", "account.html");
    addLink("Log out", "#", "nav-logout").addEventListener("click", function (event) {
      event.preventDefault();
      performLogout();
    });
  } else {
    addLink("Log in", "login.html");
    addLink("Sign up", "signup.html");
  }
}

function performLogout() {
  // Tell the server to delete the token, but log out here even if that fails.
  authFetch("/api/auth/logout", { method: "POST" })
    .catch(function () { /* ignore */ })
    .finally(function () {
      clearSession();
      window.location.href = "index.html";
    });
}

/* Booking and rating need an account. Logged out: show a notice with Log in /
   Sign up links and disable the submit button. Logged in: remove the notice and
   pre-fill the booking form with the customer's saved details. */
function applyAuthGates() {
  const session = getSession();
  [["booking-form", "book a plumber"], ["rating-form", "rate a plumber"]].forEach(function (pair) {
    const form = document.getElementById(pair[0]);
    if (!form) return;
    const noticeId = pair[0] + "-login-notice";
    let notice = document.getElementById(noticeId);
    const submitBtn = form.querySelector("button[type=submit]");

    if (session) {
      if (notice) notice.remove();
      if (submitBtn) submitBtn.disabled = false;
      if (pair[0] === "booking-form") {
        [["booking-name", session.user.name], ["booking-email", session.user.email], ["booking-contact", session.user.phone]]
          .forEach(function (f) {
            const input = document.getElementById(f[0]);
            if (input && !input.value) input.value = f[1] || "";
          });
      }
    } else {
      if (!notice) {
        notice = document.createElement("div");
        notice.id = noticeId;
        notice.className = "auth-notice";
        const text = document.createElement("p");
        text.textContent = "You need a free account to " + pair[1] + ".";
        const login = document.createElement("a");
        login.className = "btn btn-primary";
        login.textContent = "Log in";
        login.href = "login.html?next=" + (window.location.pathname.split("/").pop() || "services.html") + (pair[0] === "booking-form" ? "%23booking" : "");
        const signup = document.createElement("a");
        signup.className = "btn btn-outline";
        signup.textContent = "Sign up";
        signup.href = "signup.html?next=" + (window.location.pathname.split("/").pop() || "services.html") + (pair[0] === "booking-form" ? "%23booking" : "");
        notice.appendChild(text);
        notice.appendChild(login);
        notice.appendChild(signup);
        form.parentNode.insertBefore(notice, form);
      }
      if (submitBtn) submitBtn.disabled = true;
    }
  });
}

/* "Show password" checkboxes on the signup and login forms. */
function setupPasswordToggles() {
  document.querySelectorAll("[data-toggle-password]").forEach(function (box) {
    box.addEventListener("change", function () {
      const form = box.closest("form");
      form.querySelectorAll("input[type=password], input[data-was-password]").forEach(function (input) {
        input.setAttribute("data-was-password", "1");
        input.type = box.checked ? "text" : "password";
      });
    });
  });
}

function showAuthMessage(id, ok, text) {
  const box = document.getElementById(id);
  if (!box) return;
  box.className = "form-msg " + (ok ? "success" : "error");
  box.textContent = text;
}

/* Same password rule as the backend (backend is still the one that enforces it). */
function passwordProblem(password) {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 72) return "Password is too long (max 72 characters).";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return "Password must contain at least one letter and one number.";
  return "";
}

function setupSignupForm() {
  const form = document.getElementById("signup-form");
  if (!form) return;

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const name = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const phone = document.getElementById("signup-phone").value.trim();
    const password = document.getElementById("signup-password").value;
    const confirm = document.getElementById("signup-confirm").value;

    // Quick checks in the browser first (the backend checks all of it again).
    if (name.length < 2) return showAuthMessage("signup-message", false, "Enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showAuthMessage("signup-message", false, "Enter a valid email address.");
    if (!isValidSaPhone(phone)) return showAuthMessage("signup-message", false, "Enter a valid 10-digit South African number starting with 0 (e.g. 0821234567).");
    const problem = passwordProblem(password);
    if (problem) return showAuthMessage("signup-message", false, problem);
    if (password !== confirm) return showAuthMessage("signup-message", false, "The two passwords do not match.");
    if (!document.getElementById("signup-consent").checked) return showAuthMessage("signup-message", false, "Please tick the box to agree to how we store your details.");

    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Creating account…";
    showAuthMessage("signup-message", true, "Creating your account… (the first request can take a minute if the server was asleep)");

    apiFetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name, email: email, phone: phone, password: password })
    })
      .then(function (result) {
        if (result && result.success && result.token) {
          saveSession(result.token, result.user);
          showAuthMessage("signup-message", true, result.message);
          window.setTimeout(function () { window.location.href = safeNextPage("services.html#booking"); }, 800);
        } else {
          showAuthMessage("signup-message", false, (result && result.message) || "Could not create the account.");
        }
      })
      .catch(function () {
        showAuthMessage("signup-message", false, "Could not reach the KasiLink SA backend. Please try again shortly.");
      })
      .finally(function () { btn.disabled = false; btn.textContent = "Create account"; });
  });
}

function setupLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    if (!email || !password) return showAuthMessage("login-message", false, "Enter your email and password.");

    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Logging in…";
    // The first login after the server wakes up can take a few seconds, so say so.
    showAuthMessage("login-message", true, "Checking your details…");

    apiFetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password })
    })
      .then(function (result) {
        if (result && result.success && result.token) {
          saveSession(result.token, result.user);
          showAuthMessage("login-message", true, result.message);
          window.setTimeout(function () { window.location.href = safeNextPage("account.html"); }, 600);
        } else {
          showAuthMessage("login-message", false, (result && result.message) || "Could not log in.");
        }
      })
      .catch(function () {
        showAuthMessage("login-message", false, "Could not reach the KasiLink SA backend. Please try again shortly.");
      })
      .finally(function () { btn.disabled = false; btn.textContent = "Log in"; });
  });
}

/* account.html: shows the customer's details and their own bookings. */
function setupAccountPage() {
  const signedIn = document.getElementById("account-signed-in");
  const signedOut = document.getElementById("account-signed-out");
  if (!signedIn || !signedOut) return;

  function showSignedOut() { signedIn.hidden = true; signedOut.hidden = false; }

  if (!getSession()) { showSignedOut(); return; }

  authFetch("/api/auth/me").then(function (result) {
    if (!result || !result.success) { showSignedOut(); return; }
    const user = result.user;
    saveSession(getSession().token, user);
    document.getElementById("account-name").textContent = user.name;
    document.getElementById("account-email").textContent = user.email;
    document.getElementById("account-phone").textContent = user.phone;
    signedOut.hidden = true; signedIn.hidden = false;

    const list = document.getElementById("account-bookings");
    return authFetch("/api/my-bookings").then(function (data) {
      list.textContent = "";
      const bookings = (data && data.bookings) || [];
      if (!bookings.length) {
        const p = document.createElement("p");
        p.textContent = "You have no bookings yet.";
        list.appendChild(p);
        return;
      }
      bookings.forEach(function (b) {
        const card = document.createElement("div");
        card.className = "booking-card";
        const title = document.createElement("h3");
        title.textContent = b.service + " with " + (b.plumberName || "your plumber");
        const when = document.createElement("p");
        when.textContent = b.date + " at " + b.time + " · " + b.location;
        const total = document.createElement("p");
        total.textContent = "Estimated total: " + formatRand(b.totalPrice) + " (reference " + b.id + ")";
        card.appendChild(title); card.appendChild(when); card.appendChild(total);
        list.appendChild(card);
      });
    });
  }).catch(function () {
    // Backend unreachable: do not claim the user is logged out, just say so.
    signedOut.hidden = false;
    signedOut.querySelector("p").textContent = "Could not reach the KasiLink SA backend. Please try again shortly.";
  });

  document.getElementById("account-logout").addEventListener("click", performLogout);
}

/* ---------------------------------------------------------
   14. RUN EVERYTHING ONCE THE PAGE HAS LOADED
   --------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function () {
  setupNavToggle();
  setupAuthNav();          // shows Log in / Sign up, or My account / Log out
  setupPasswordToggles();
  setupSignupForm();
  setupLoginForm();
  setupAccountPage();
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
    setupAnalyticsCharts();
  });
});
