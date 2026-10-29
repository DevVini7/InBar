const places = window.inbarPlaces;
let selectedId = null;
let activeFilter = "Todos";
let activePage = "Mapa";
let mapSearchValue = "";
let toastTimer;

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function normalizeText(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

function getVisiblePlaces() {
  const query = normalizeText(document.getElementById("searchInput").value.trim());
  return places.filter(place => {
    const matchesFilter = activeFilter === "Todos" || place.types.includes(activeFilter) || place.category === activeFilter;
    const searchText = normalizeText(`${place.name} ${place.distance} ${place.desc} ${place.types.join(" ")} ${(place.searchTerms || []).join(" ")}`);
    const matchesQuery = !query || searchText.includes(query);
    return matchesFilter && matchesQuery;
  });
}

function renderSearchResults() {
  const input = document.getElementById("searchInput");
  const results = document.getElementById("searchResults");
  if (activePage === "Missões") {
    results.classList.add("hidden");
    results.replaceChildren();
    input.setAttribute("aria-expanded", "false");
    return;
  }
  const query = input.value.trim();
  if (!query) {
    results.classList.add("hidden");
    results.replaceChildren();
    input.setAttribute("aria-expanded", "false");
    return;
  }

  const matches = getVisiblePlaces();
  results.replaceChildren();
  const summary = document.createElement("p");
  summary.className = "search-results-summary";
  summary.textContent = matches.length === 1 ? "1 lugar encontrado" : `${matches.length} lugares encontrados`;
  results.append(summary);

  matches.slice(0, 5).forEach(place => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "search-result";
    option.setAttribute("role", "option");
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    icon.classList.add("icon");
    icon.setAttribute("aria-hidden", "true");
    use.setAttribute("href", `assets/icons.svg#${place.icon || "map-pin"}`);
    icon.append(use);
    const details = document.createElement("span");
    details.className = "search-result-details";
    const name = document.createElement("strong");
    name.textContent = place.name;
    const location = document.createElement("small");
    location.textContent = `${place.distance} · ${place.category}`;
    details.append(name, location);
    option.append(icon, details);
    option.addEventListener("click", () => {
      input.value = place.name;
      document.getElementById("clearSearch").style.display = "block";
      results.classList.add("hidden");
      input.setAttribute("aria-expanded", "false");
      selectPlace(place.id, true);
    });
    results.append(option);
  });

  if (!matches.length) {
    const empty = document.createElement("p");
    empty.className = "search-results-empty";
    empty.textContent = "Tente buscar por nome, região ou tipo de lugar.";
    results.append(empty);
  }
  results.classList.remove("hidden");
  input.setAttribute("aria-expanded", "true");
}

function renderMarkers() {
  window.InbarMap.renderMarkers(getVisiblePlaces(), selectedId);
}

function hideSelectedPlace() {
  selectedId = null;
  window.InbarPlaceCard.hide();
  renderMarkers();
}

function selectPlace(id, pan = false) {
  const place = places.find(item => item.id === id);
  if (!place) return;
  if (selectedId !== id) window.InbarPlaceCard.setExpanded(false);
  selectedId = id;
  window.InbarPlaceCard.render(place, showToast);
  window.InbarPlaceCard.show();
  renderMarkers();
  if (pan) window.InbarMap.panTo(place);
}

function applyFilter(button) {
  document.querySelectorAll(".filter").forEach(filter => filter.classList.remove("active"));
  button.classList.add("active");
  activeFilter = button.dataset.filter;
  const visiblePlaces = getVisiblePlaces();
  if (!visiblePlaces.some(place => place.id === selectedId)) hideSelectedPlace();
  else renderMarkers();
  renderSearchResults();
  if (!visiblePlaces.length) showToast("Nenhum lugar encontrado para este filtro.");
}

function submitSearch(event) {
  event.preventDefault();
  if (activePage === "Missões") return;
  const query = document.getElementById("searchInput").value.trim();
  const firstPlace = getVisiblePlaces()[0];
  if (!firstPlace) {
    hideSelectedPlace();
    showToast(query ? `Nenhum resultado para “${query}”.` : "Digite um lugar ou bairro para buscar.");
    return;
  }
  if (!getVisiblePlaces().some(place => place.id === selectedId)) hideSelectedPlace();
  document.getElementById("searchResults").classList.add("hidden");
  document.getElementById("searchInput").setAttribute("aria-expanded", "false");
  renderMarkers();
  window.InbarMap.panTo(firstPlace);
}

function updateSearchResults() {
  if (activePage === "Missões") return;
  const query = document.getElementById("searchInput").value;
  document.getElementById("clearSearch").style.display = query ? "block" : "none";
  const visiblePlaces = getVisiblePlaces();
  if (!visiblePlaces.length || !visiblePlaces.some(place => place.id === selectedId)) hideSelectedPlace();
  else renderMarkers();
  renderSearchResults();
}

function clearSearch() {
  const searchInput = document.getElementById("searchInput");
  searchInput.value = "";
  document.getElementById("clearSearch").style.display = "none";
  if (activePage === "Missões") {
    searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    searchInput.focus();
    return;
  }
  renderSearchResults();
  renderMarkers();
  searchInput.focus();
}

function setActivePage(page, updateHistory = true) {
  if (page !== "Mapa" && page !== "Missões") return;
  if (page === activePage) {
    if (page === "Mapa") window.InbarMap.resetView();
    return;
  }

  const searchInput = document.getElementById("searchInput");
  if (page === "Missões") {
    mapSearchValue = searchInput.value;
    searchInput.value = "";
  }
  activePage = page;
  searchInput.dispatchEvent(new Event("input", { bubbles: true }));

  const missionsVisible = page === "Missões";
  document.querySelector(".map-shell").classList.toggle("hidden", missionsVisible);
  document.getElementById("missionsView").classList.toggle("hidden", !missionsVisible);
  searchInput.placeholder = missionsVisible ? "Buscar missões..." : "Buscar lugares, bairros...";
  document.title = missionsVisible ? "InBar — Missões" : "Inbar — Mapa";
  document.getElementById("clearSearch").style.display = "";
  document.getElementById("searchResults").classList.add("hidden");
  searchInput.setAttribute("aria-expanded", "false");

  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.toggle("active", link.dataset.page === page);
  });

  if (!missionsVisible) {
    searchInput.value = mapSearchValue;
    searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    document.getElementById("searchResults").classList.add("hidden");
    searchInput.setAttribute("aria-expanded", "false");
    window.requestAnimationFrame(() => window.InbarMap.invalidateSize());
  }

  if (updateHistory) {
    window.history.pushState({ page }, "", missionsVisible ? "#missions" : "#");
  }
}

function closeProfileMenu() {
  const menu = document.getElementById("profileMenu");
  menu.classList.add("hidden");
  document.getElementById("profileButton").setAttribute("aria-expanded", "false");
}

function toggleProfileMenu() {
  const button = document.getElementById("profileButton");
  const menu = document.getElementById("profileMenu");
  const isOpen = !menu.classList.contains("hidden");
  menu.classList.toggle("hidden", isOpen);
  button.setAttribute("aria-expanded", String(!isOpen));
}

function showNextPlace() {
  const visiblePlaces = getVisiblePlaces();
  if (!visiblePlaces.length) return;
  const index = visiblePlaces.findIndex(place => place.id === selectedId);
  selectPlace(visiblePlaces[(index + 1) % visiblePlaces.length].id, true);
}

function togglePlaceDetails() {
  window.InbarPlaceCard.setExpanded(!window.InbarPlaceCard.isExpanded());
}

function showPlaceFeed() {
  const place = places.find(item => item.id === selectedId);
  if (place) showToast(`Feed de ${place.name} — demonstração.`);
}

function setupEvents() {
  document.querySelectorAll(".filter").forEach(button => button.addEventListener("click", () => applyFilter(button)));
  document.getElementById("searchForm").addEventListener("submit", submitSearch);
  document.getElementById("searchInput").addEventListener("input", updateSearchResults);
  document.getElementById("searchInput").addEventListener("focus", renderSearchResults);
  document.getElementById("clearSearch").addEventListener("click", clearSearch);
  document.getElementById("zoomIn").addEventListener("click", window.InbarMap.zoomIn);
  document.getElementById("zoomOut").addEventListener("click", window.InbarMap.zoomOut);
  document.getElementById("locateButton").addEventListener("click", window.InbarMap.locateUser);
  document.getElementById("myLocation").addEventListener("click", window.InbarMap.locateUser);
  document.getElementById("nextPlace").addEventListener("click", showNextPlace);
  document.getElementById("closeCard").addEventListener("click", hideSelectedPlace);
  document.getElementById("detailsButton").addEventListener("click", togglePlaceDetails);
  document.getElementById("allPosts").addEventListener("click", () => showToast("Feed de publicações demonstrativo."));
  document.getElementById("feedButton").addEventListener("click", showPlaceFeed);
  document.getElementById("directionsButton").addEventListener("click", window.InbarPlaceCard.toggleNavigationOptions);
  document.querySelectorAll(".nav-link").forEach(button => {
    button.addEventListener("click", () => {
      const page = button.dataset.page;
      if (page === "Missões" || page === "Mapa") {
        setActivePage(page);
        return;
      }
      document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
      button.classList.add("active");
      showToast(`${page}: seção demonstrativa. A navegação pode ser conectada à página correspondente.`);
    });
  });
  document.querySelector(".brand").addEventListener("click", event => {
    if (activePage === "Missões") {
      event.preventDefault();
      setActivePage("Mapa");
    }
  });
  window.addEventListener("popstate", () => {
    setActivePage(window.location.hash === "#missions" ? "Missões" : "Mapa", false);
  });
  document.getElementById("profileButton").addEventListener("click", toggleProfileMenu);
  document.getElementById("editPreferences").addEventListener("click", () => {
    closeProfileMenu();
    window.location.assign("./onboarding.html?mode=edit");
  });
  document.addEventListener("click", event => {
    if (!event.target.closest(".profile-menu-wrap")) closeProfileMenu();
    if (!event.target.closest(".navigation-picker")) window.InbarPlaceCard.closeNavigationOptions();
    if (!event.target.closest(".search")) {
      document.getElementById("searchResults").classList.add("hidden");
      document.getElementById("searchInput").setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeProfileMenu();
      window.InbarPlaceCard.closeNavigationOptions();
      document.getElementById("searchResults").classList.add("hidden");
      document.getElementById("searchInput").setAttribute("aria-expanded", "false");
    }
  });
}

window.InbarMap.init({
  onPlaceSelect: selectPlace,
  onError: showToast
});
setupEvents();
renderMarkers();
if (window.location.hash === "#missions") setActivePage("Missões", false);