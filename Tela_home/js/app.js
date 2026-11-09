const places = window.inbarPlaces;
let selectedId = null;
let activeFilter = "Todos";
let activePage = "Mapa";
const searchValues = { Mapa: "", Explorar: "", Feed: "", Missões: "", Perfil: "" };
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

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
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
  if (activePage !== "Mapa") {
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
  if (window.InbarRewards) window.InbarRewards.trackPlaceOpened(place.id);
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
  if (activePage !== "Mapa") return;
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
  const query = document.getElementById("searchInput").value;
  document.getElementById("clearSearch").style.display = query ? "block" : "none";
  if (activePage !== "Mapa") {
    const results = document.getElementById("searchResults");
    results.classList.add("hidden");
    results.replaceChildren();
    document.getElementById("searchInput").setAttribute("aria-expanded", "false");
    if (activePage === "Explorar") renderExplore();
    return;
  }
  const visiblePlaces = getVisiblePlaces();
  if (!visiblePlaces.length || !visiblePlaces.some(place => place.id === selectedId)) hideSelectedPlace();
  else renderMarkers();
  renderSearchResults();
}

function clearSearch() {
  const searchInput = document.getElementById("searchInput");
  searchInput.value = "";
  searchValues[activePage] = "";
  searchInput.dispatchEvent(new Event("input", { bubbles: true }));
  if (activePage === "Mapa") renderMarkers();
  searchInput.focus();
}

function setActivePage(page, updateHistory = true) {
  if (!Object.prototype.hasOwnProperty.call(searchValues, page)) return;
  if (page === activePage) {
    if (page === "Feed" && window.InbarFeed) {
      window.InbarFeed.showGeneralFeed();
      if (updateHistory && window.location.hash !== "#feed") {
        window.history.pushState({ page }, "", "#feed");
      }
      return;
    }
    if (page === "Mapa") window.InbarMap.resetView();
    return;
  }

  const searchInput = document.getElementById("searchInput");
  searchValues[activePage] = searchInput.value;
  activePage = page;
  if (page === "Feed" && window.InbarFeed) window.InbarFeed.showGeneralFeed();
  searchInput.value = searchValues[page];
  searchInput.dispatchEvent(new Event("input", { bubbles: true }));

  const mapVisible = page === "Mapa";
  const exploreVisible = page === "Explorar";
  const feedVisible = page === "Feed";
  const missionsVisible = page === "Missões";
  const profileVisible = page === "Perfil";
  document.querySelector(".map-shell").classList.toggle("hidden", !mapVisible);
  document.getElementById("exploreView").classList.toggle("hidden", !exploreVisible);
  document.getElementById("feedView").classList.toggle("hidden", !feedVisible);
  document.getElementById("missionsView").classList.toggle("hidden", !missionsVisible);
  document.getElementById("profileView").classList.toggle("hidden", !profileVisible);
  searchInput.placeholder = missionsVisible ? "Buscar missões..."
    : feedVisible ? "Buscar publicações e lugares..."
      : "Buscar lugares, bairros...";
  document.title = `InBar — ${page}`;
  document.getElementById("clearSearch").style.display = "";
  document.getElementById("searchResults").classList.add("hidden");
  searchInput.setAttribute("aria-expanded", "false");

  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.toggle("active", link.dataset.page === page);
  });
  if (profileVisible && window.InbarProfile) window.InbarProfile.refresh();

  if (mapVisible) {
    window.requestAnimationFrame(() => window.InbarMap.invalidateSize());
  }

  if (updateHistory) {
    const route = { "Mapa": "", "Explorar": "#explorar", "Feed": "#feed", "Missões": "#missions", "Perfil": "#perfil" }[page];
    window.history.pushState({ page }, "", route || "#");
  }
}

function renderExplore() {
  const view = document.getElementById("exploreView");
  const query = normalizeText(document.getElementById("searchInput").value.trim());
  const matches = places.filter(place => {
    const searchable = normalizeText(`${place.name} ${place.distance} ${place.desc} ${place.types.join(" ")} ${(place.searchTerms || []).join(" ")}`);
    return !query || searchable.includes(query);
  });
  const ranked = window.InbarRecommendations
    ? window.InbarRecommendations.rankPlaces(matches)
    : matches.map(entity => ({ entity, score: 0 }));
  const orderedMatches = ranked.map(item => item.entity);
  const vibe = window.InbarVibe && window.InbarVibe.getCurrent();
  const sortedByRelevance = ranked.some(item => item.score > 0);
  view.innerHTML = `<div class="explore-layout">
    <header class="explore-heading">
      <div><p class="feed-kicker">ENCONTRE SEU PRÓXIMO ROLÊ</p><h1>Explorar</h1><p>${vibe ? `Prioridade para: ${escapeHtml(vibe.label)}. ` : ""}${sortedByRelevance ? "Sugestões priorizadas pelos seus interesses e pela vibe desta sessão." : "Descubra os lugares cadastrados no InBar e veja seus detalhes no mapa."}</p></div>
      <span class="explore-count">${matches.length} ${matches.length === 1 ? "lugar" : "lugares"}</span>
    </header>
    <section class="explore-grid" aria-label="Lugares cadastrados">
      ${orderedMatches.map(place => `<article class="explore-card">
        <img src="${escapeHtml(window.InbarPlaceMedia.getCoverImage(place))}" alt="${window.InbarPlaceMedia.isIllustrative(place) ? `Imagem ilustrativa de ${escapeHtml(place.name)}; foto não disponível` : `Ambiente de ${escapeHtml(place.name)}`}" data-place-image="${place.id}" loading="lazy">
        <div class="explore-card-body">
          <div class="explore-card-title"><h2>${escapeHtml(place.name)}</h2><span>${escapeHtml(place.category)}</span></div>
          <p>${escapeHtml(place.desc)}</p>
          <div class="explore-tags">${place.types.map(type => `<span>${escapeHtml(type)}</span>`).join("")}</div>
          <button type="button" class="explore-place-button" data-open-place="${escapeHtml(place.id)}">Ver no mapa <span aria-hidden="true">→</span></button>
        </div>
      </article>`).join("")}
      ${matches.length ? "" : '<p class="explore-empty">Nenhum lugar encontrado. Tente outra busca.</p>'}
    </section>
  </div>`;
}

function routeFromHash() {
  const route = window.location.hash.replace(/^#\/?/, "").toLocaleLowerCase("pt-BR");
  const localFeed = route.match(/^feed\/local\/(\d+)$/);
  if (localFeed) return { page: "Feed", placeId: Number(localFeed[1]) };
  return {
    page: route === "missions" || route === "feed" || route === "explorar" || route === "perfil" ? {
      missions: "Missões",
      feed: "Feed",
      explorar: "Explorar",
      perfil: "Perfil"
    }[route] : "Mapa",
    placeId: null
  };
}

function setupProfile() {
  const currentUser = window.InbarAuth.getCurrentUser();
  if (!currentUser) {
    window.location.replace("login.html");
    return;
  }

  const fullName = currentUser.displayName || currentUser.nickname || currentUser.username
    || (typeof currentUser.fullName === "string" && currentUser.fullName.trim() ? currentUser.fullName.trim() : "Usuário");
  const email = typeof currentUser.email === "string" ? currentUser.email : "";
  document.getElementById("profileTriggerName").textContent = fullName;
  document.getElementById("profileFullName").textContent = fullName;
  document.getElementById("profileEmail").textContent = email;
  document.getElementById("profileEmail").hidden = !email;
  document.getElementById("profileButton").setAttribute("aria-label", `Abrir perfil de ${fullName}`);
  document.getElementById("profilePageAvatar").replaceChildren();
  document.getElementById("profileNickname").textContent = `@${fullName}`;
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
  if (!place) return;
  window.InbarNavigation.openPlaceFeed(place.id);
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
  document.getElementById("allPosts").addEventListener("click", showPlaceFeed);
  document.getElementById("feedButton").addEventListener("click", showPlaceFeed);
  document.getElementById("directionsButton").addEventListener("click", window.InbarPlaceCard.toggleNavigationOptions);
  document.querySelectorAll(".nav-link").forEach(button => {
    button.addEventListener("click", () => {
      setActivePage(button.dataset.page);
    });
  });
  document.getElementById("exploreView").addEventListener("click", event => {
    const button = event.target.closest("[data-open-place]");
    if (button) window.InbarNavigation.openPlace(Number(button.dataset.openPlace));
  });
  document.getElementById("exploreView").addEventListener("error", event => {
    const image = event.target.closest("[data-place-image]");
    if (!image) return;
    const place = places.find(item => String(item.id) === image.dataset.placeImage);
    if (place) window.InbarPlaceMedia.applyFallback(image, place);
  }, true);
  document.getElementById("homeRecommendationsList").addEventListener("click", event => {
    const button = event.target.closest("[data-open-place]");
    if (button) window.InbarNavigation.openPlace(Number(button.dataset.openPlace));
  });
  window.addEventListener("inbar:vibe-updated", () => {
    if (activePage === "Explorar") renderExplore();
  });
  window.addEventListener("inbar:preferences-updated", () => {
    if (activePage === "Explorar") renderExplore();
  });
  window.addEventListener("inbar:feed-updated", () => {
    const selectedPlace = places.find(place => place.id === selectedId);
    if (selectedPlace) window.InbarPlaceCard.render(selectedPlace, showToast);
  });
  document.querySelector(".brand").addEventListener("click", event => {
    if (activePage !== "Mapa") {
      event.preventDefault();
      setActivePage("Mapa");
    }
  });
  const syncNavigation = () => {
    const route = routeFromHash();
    setActivePage(route.page, false);
    if (route.page === "Feed" && route.placeId !== null) {
      if (!window.InbarFeed.filterByPlace(route.placeId)) {
        setActivePage("Feed", false);
        showToast("Este local não está mais disponível no catálogo.");
      }
    }
  };
  window.addEventListener("popstate", syncNavigation);
  window.addEventListener("hashchange", syncNavigation);
  document.getElementById("profileButton").addEventListener("click", toggleProfileMenu);
  document.getElementById("signOutButton").addEventListener("click", () => {
    try {
      window.InbarAuth.logout();
      window.location.replace("login.html");
    } catch (error) {
      console.error("Não foi possível encerrar a sessão do InBar.", error);
      showToast("Não foi possível sair. Verifique o armazenamento do navegador e tente novamente.");
    }
  });
  document.getElementById("editPreferences").addEventListener("click", () => {
    closeProfileMenu();
    window.location.assign("./onboarding.html?mode=edit");
  });
  document.getElementById("openProfile").addEventListener("click", () => {
    closeProfileMenu();
    setActivePage("Perfil");
  });
  document.getElementById("openCoupons").addEventListener("click", () => {
    closeProfileMenu();
    setActivePage("Perfil");
    window.InbarProfile.selectTab("coupons");
  });
  document.getElementById("goToCoupons").addEventListener("click", event => {
    event.preventDefault();
    setActivePage("Perfil");
    window.InbarProfile.selectTab("coupons");
  });
  document.getElementById("openRewardsFromCoupons").addEventListener("click", () => {
    setActivePage("Missões");
    window.InbarRewards.scrollToStore();
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

window.InbarNavigation = {
  navigateTo: setActivePage,
  openPlaceFeed(id) {
    if (!places.some(place => place.id === id)) return;
    setActivePage("Feed", false);
    if (!window.InbarFeed.filterByPlace(id)) {
      showToast("Não foi possível carregar o Feed deste local.");
      return;
    }
    window.history.pushState({ page: "Feed", placeId: id }, "", `#feed/local/${encodeURIComponent(id)}`);
  },
  openPlace(id) {
    if (!places.some(place => place.id === id)) return;
    setActivePage("Mapa");
    let selected = false;
    const selectAfterReveal = () => {
      if (selected || activePage !== "Mapa") return;
      selected = true;
      window.InbarMap.invalidateSize();
      selectPlace(id, true);
    };
    window.requestAnimationFrame(selectAfterReveal);
    window.setTimeout(selectAfterReveal, 100);
  }
};

setupProfile();
window.InbarMap.init({
  onPlaceSelect: selectPlace,
  onError: showToast
});
setupEvents();
renderMarkers();
if (window.location.hash) {
  const route = routeFromHash();
  setActivePage(route.page, false);
  if (route.page === "Feed" && route.placeId !== null && !window.InbarFeed.filterByPlace(route.placeId)) {
    showToast("Este local não está mais disponível no catálogo.");
  }
}