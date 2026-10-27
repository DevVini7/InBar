const places = window.inbarPlaces;
let selectedId = null;
let activeFilter = "Todos";
let toastTimer;

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function getVisiblePlaces() {
  const query = document.getElementById("searchInput").value.trim().toLocaleLowerCase("pt-BR");
  return places.filter(place => {
    const matchesFilter = activeFilter === "Todos" || place.types.includes(activeFilter) || place.category === activeFilter;
    const matchesQuery = !query || `${place.name} ${place.distance} ${place.desc} ${place.types.join(" ")}`.toLocaleLowerCase("pt-BR").includes(query);
    return matchesFilter && matchesQuery;
  });
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
  if (!visiblePlaces.length) showToast("Nenhum lugar encontrado para este filtro.");
}

function submitSearch(event) {
  event.preventDefault();
  const query = document.getElementById("searchInput").value.trim();
  const firstPlace = getVisiblePlaces()[0];
  if (!firstPlace) {
    hideSelectedPlace();
    showToast(query ? `Nenhum resultado para “${query}”.` : "Digite um lugar ou bairro para buscar.");
    return;
  }
  if (!getVisiblePlaces().some(place => place.id === selectedId)) hideSelectedPlace();
  renderMarkers();
  window.InbarMap.panTo(firstPlace);
}

function updateSearchResults() {
  const query = document.getElementById("searchInput").value;
  document.getElementById("clearSearch").style.display = query ? "block" : "none";
  const visiblePlaces = getVisiblePlaces();
  if (!visiblePlaces.length || !visiblePlaces.some(place => place.id === selectedId)) hideSelectedPlace();
  else renderMarkers();
}

function clearSearch() {
  document.getElementById("searchInput").value = "";
  document.getElementById("clearSearch").style.display = "none";
  renderMarkers();
  document.getElementById("searchInput").focus();
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
  document.querySelectorAll(".nav-link").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
      button.classList.add("active");
      const page = button.dataset.page;
      if (page !== "Mapa") showToast(`${page}: seção demonstrativa. A navegação pode ser conectada à página correspondente.`);
      else window.InbarMap.resetView();
    });
  });
  document.getElementById("profileButton").addEventListener("click", () => showToast("Perfil do usuário — conecte aqui a tela de perfil."));
}

window.InbarMap.init({
  onPlaceSelect: selectPlace,
  onError: showToast
});
setupEvents();
renderMarkers();