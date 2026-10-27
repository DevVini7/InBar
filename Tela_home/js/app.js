const places = window.inbarPlaces;

const colors = { green:"#00e7b0", yellow:"#ffcf35", red:"#ff4d52", purple:"#d1d5db" };
const map = document.getElementById("map");
let selectedId = null;
let activeFilter = "Todos";
let toastTimer;
let tileErrorShown = false;
let userLocationMarker = null;

if (!window.L) {
  showToast("Não foi possível iniciar o mapa. Confira sua conexão com a internet.");
  throw new Error("Leaflet failed to load; the interactive map cannot be initialized.");
}

const leafletMap = L.map(map, {
  zoomControl:false,
  minZoom:10,
  maxZoom:19,
  zoomSnap:.25,
  scrollWheelZoom:true,
  tap:true
});
const markersLayer = L.layerGroup().addTo(leafletMap);
const tileLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom:19,
  updateWhenIdle:true,
  keepBuffer:2
}).addTo(leafletMap);
tileLayer.on("tileerror", () => {
  if (tileErrorShown) return;
  tileErrorShown = true;
  document.getElementById("mapStatus").textContent = "Não foi possível carregar parte do mapa. Verifique a conexão com a internet.";
  showToast("Não foi possível carregar o mapa. Verifique a conexão com a internet.");
});
function resetMapView() {
  if (window.matchMedia("(max-width: 760px)").matches) {
    leafletMap.setView([-15.7885,-47.89],12.25);
  } else {
    leafletMap.setView([-15.7885,-47.89],13);
  }
}
resetMapView();
window.addEventListener("resize", () => leafletMap.invalidateSize({debounceMoveend:true}));

function panTo(place) {
  const zoom = Math.max(leafletMap.getZoom(),14);
  const point = leafletMap.project([place.lat,place.lng],zoom);
  const center = leafletMap.unproject(point.subtract([0,Math.min(140,map.clientHeight*.18)]),zoom);
  leafletMap.flyTo(center,zoom,{duration:.6});
}
function getVisiblePlaces() {
  const query = document.getElementById("searchInput").value.trim().toLocaleLowerCase("pt-BR");
  return places.filter(p => {
    const matchesFilter = activeFilter === "Todos" || p.types.includes(activeFilter) || p.category === activeFilter;
    const matchesQuery = !query || `${p.name} ${p.distance} ${p.desc} ${p.types.join(" ")}`.toLocaleLowerCase("pt-BR").includes(query);
    return matchesFilter && matchesQuery;
  });
}
function renderMarkers() {
  markersLayer.clearLayers();
  getVisiblePlaces().forEach(place => {
    const color = place.id === selectedId ? colors.purple : colors[place.level];
    const marker = document.createElement("span");
    marker.className = `map-marker ${place.id === selectedId ? "selected" : ""}`;
    marker.style.setProperty("--marker", color);
    marker.setAttribute("aria-hidden", "true");
    marker.innerHTML = '<span class="marker-pin"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14l-7 9-7-9Zm7 9v6m-4 0h8M9 22h6"/></svg></span>';
    const icon = L.divIcon({
      className:"inbar-marker-host",
      html:marker,
      iconSize:[48,54],
      iconAnchor:[24,48]
    });
    L.marker([place.lat,place.lng], {icon,title:place.name,alt:`Lugar: ${place.name}`})
      .addTo(markersLayer)
      .on("click", () => selectPlace(place.id,true));
  });
}
function selectPlace(id, pan=false) {
  const place = places.find(p => p.id === id);
  if (!place) return;
  if (selectedId !== id) collapsePlaceDetails();
  selectedId = id;
  document.getElementById("placeName").textContent = place.name;
  document.getElementById("placeScore").textContent = place.rating;
  document.getElementById("placeReviews").textContent = `(${place.reviews} avaliações)`;
  document.getElementById("placeDistance").textContent = place.distance;
  document.getElementById("placeStatus").textContent = place.status;
  document.getElementById("placeOccupancy").textContent = `${place.occupancy}%`;
  document.getElementById("placePosts").textContent = place.posts;
  document.getElementById("placeImage").src = place.image;
  document.getElementById("placeImage").alt = `Ambiente de ${place.name}`;
  document.getElementById("statusDot").style.borderColor = colors[place.level];
  document.getElementById("placeStatus").style.color = colors[place.level];
  renderPlaceDetails(place);
  document.getElementById("placeCard").classList.remove("hidden");
  renderMarkers();
  if (pan) panTo(place);
}
function collapsePlaceDetails() {
  const card = document.getElementById("placeCard");
  card.classList.remove("expanded");
  document.getElementById("expandedDetails").classList.add("hidden");
  document.getElementById("detailHighlights").classList.add("hidden");
  document.getElementById("detailGallery").classList.add("hidden");
  document.getElementById("placeRating").classList.add("hidden");
  document.getElementById("detailsButton").textContent = "Ver detalhes";
  document.getElementById("detailsButton").setAttribute("aria-expanded","false");
}
function renderPlaceDetails(place) {
  const photos = [
    place.image.replace("w=900&h=560","w=900&h=600"),
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=900&h=600&fit=crop",
    "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=900&h=600&fit=crop"
  ];
  const gallery = document.getElementById("detailGallery");
  gallery.replaceChildren();
  photos.forEach((source,index) => {
    const button = document.createElement("button");
    button.className = `gallery-thumb${index === 0 ? " active" : ""}`;
    button.type = "button";
    button.setAttribute("aria-label",`Mostrar foto ${index + 1}`);
    const image = document.createElement("img");
    image.src = source.replace("w=900&h=600","w=120&h=100");
    image.alt = "";
    button.append(image);
    button.addEventListener("click",() => {
      document.getElementById("placeImage").src = source;
      gallery.querySelectorAll(".gallery-thumb").forEach(thumb => thumb.classList.remove("active"));
      button.classList.add("active");
    });
    gallery.append(button);
  });
  const morePhotos = document.createElement("button");
  morePhotos.className = "gallery-thumb gallery-more";
  morePhotos.type = "button";
  morePhotos.textContent = "+8 fotos";
  morePhotos.addEventListener("click",() => showToast("Galeria de fotos demonstrativa."));
  gallery.append(morePhotos);

  const icons = {"Música ao vivo":"♫","Happy Hour":"🍸","Eventos":"✦","Outros":"◇"};
  const featureList = document.getElementById("featureList");
  featureList.replaceChildren();
  place.types.filter(type => type !== "Bares").slice(0,2).forEach(type => {
    const feature = document.createElement("div");
    feature.className = "feature-chip";
    const icon = document.createElement("span");
    icon.className = "feature-icon";
    icon.setAttribute("aria-hidden","true");
    icon.textContent = icons[type] || "◇";
    const text = document.createElement("span");
    text.append(document.createTextNode(type));
    const time = document.createElement("small");
    time.textContent = "Hoje à noite";
    text.append(time);
    feature.append(icon,text);
    featureList.append(feature);
  });
  document.getElementById("promotionText").textContent = "Condições demonstrativas";

  const posts = [
    {user:"joaosilva",time:"há 12 min",text:`${place.status.replace(" agora","")} por aqui! 🔥`,image:photos[0]},
    {user:"mariana.r",time:"há 28 min",text:"Happy hour imperdível! 🍹",image:photos[2]},
    {user:"villaficial",time:"há 1 h",text:`${place.desc} 🎶`,image:photos[1]}
  ];
  const postList = document.getElementById("postList");
  postList.replaceChildren();
  posts.forEach(post => {
    const card = document.createElement("article");
    card.className = "post-card";
    const author = document.createElement("div");
    author.className = "post-author";
    const avatar = document.createElement("span");
    avatar.className = "author-avatar";
    avatar.textContent = post.user.slice(0,1).toUpperCase();
    const authorInfo = document.createElement("span");
    authorInfo.className = "author-info";
    authorInfo.append(document.createTextNode(post.user));
    const time = document.createElement("small");
    time.textContent = post.time;
    authorInfo.append(time);
    author.append(avatar,authorInfo);
    const image = document.createElement("img");
    image.className = "post-image";
    image.src = post.image.replace("w=900&h=600","w=360&h=180");
    image.alt = `Publicação demonstrativa de ${post.user}`;
    const caption = document.createElement("p");
    caption.textContent = post.text;
    card.append(author,image,caption);
    postList.append(card);
  });
  document.getElementById("directionsLink").href = `https://www.openstreetmap.org/directions?to=${place.lat}%2C${place.lng}`;
}
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    const visiblePlaces = getVisiblePlaces();
    if (!visiblePlaces.some(place => place.id === selectedId)) {
      selectedId = null;
      collapsePlaceDetails();
      document.getElementById("placeCard").classList.add("hidden");
    }
    renderMarkers();
    if (!visiblePlaces.length) {
      showToast("Nenhum lugar encontrado para este filtro.");
    }
  });
});
document.getElementById("searchForm").addEventListener("submit", event => {
  event.preventDefault();
  const q = document.getElementById("searchInput").value.trim();
  const firstVisible = getVisiblePlaces()[0];
  if (firstVisible) {
    if (selectedId !== null && !getVisiblePlaces().some(place => place.id === selectedId)) {
      selectedId = null;
      collapsePlaceDetails();
      document.getElementById("placeCard").classList.add("hidden");
    }
    renderMarkers();
    panTo(firstVisible);
  } else {
    selectedId = null;
    renderMarkers();
    collapsePlaceDetails();
    document.getElementById("placeCard").classList.add("hidden");
    showToast(q ? `Nenhum resultado para “${q}”.` : "Digite um lugar ou bairro para buscar.");
  }
});
document.getElementById("searchInput").addEventListener("input", () => {
  const query = document.getElementById("searchInput").value;
  document.getElementById("clearSearch").style.display = query ? "block" : "none";
  const firstVisible = getVisiblePlaces()[0];
  if (!firstVisible || !getVisiblePlaces().some(place => place.id === selectedId)) {
    selectedId = null;
    collapsePlaceDetails();
    document.getElementById("placeCard").classList.add("hidden");
  }
  renderMarkers();
});
document.getElementById("clearSearch").addEventListener("click", () => {
  document.getElementById("searchInput").value = "";
  document.getElementById("clearSearch").style.display = "none";
  renderMarkers();
  document.getElementById("searchInput").focus();
});
document.getElementById("zoomIn").addEventListener("click", () => leafletMap.zoomIn());
document.getElementById("zoomOut").addEventListener("click", () => leafletMap.zoomOut());

function locateUser() {
  if (!navigator.geolocation) {
    showToast("Seu navegador não oferece suporte à localização.");
    return;
  }
  showToast("Solicitando acesso à sua localização…");
  navigator.geolocation.getCurrentPosition(
    position => {
      const {latitude, longitude} = position.coords;
      if (userLocationMarker) leafletMap.removeLayer(userLocationMarker);
      userLocationMarker = L.circleMarker([latitude,longitude], {
        radius:9,
        color:"#ffffff",
        weight:3,
        fillColor:"#a20cff",
        fillOpacity:1
      }).bindTooltip("Sua localização").addTo(leafletMap);
      leafletMap.flyTo([latitude,longitude], Math.max(leafletMap.getZoom(),14), {duration:.8});
      showToast("Sua localização foi exibida no mapa.");
    },
    error => {
      const messages = {
        1:"Permita o acesso à localização nas configurações do navegador.",
        2:"Não foi possível determinar sua localização.",
        3:"A solicitação de localização demorou demais."
      };
      showToast(messages[error.code] || "Não foi possível acessar a localização.");
    },
    {enableHighAccuracy:true, timeout:10000, maximumAge:60000}
  );
}
document.getElementById("locateButton").addEventListener("click", locateUser);
document.getElementById("myLocation").addEventListener("click", locateUser);
document.getElementById("nextPlace").addEventListener("click", () => {
  const visiblePlaces = getVisiblePlaces();
  if (!visiblePlaces.length) return;
  const index = visiblePlaces.findIndex(place => place.id === selectedId);
  selectPlace(visiblePlaces[(index + 1) % visiblePlaces.length].id, true);
});
document.getElementById("closeCard").addEventListener("click", () => {
  document.getElementById("placeCard").classList.add("hidden");
  selectedId = null;
  renderMarkers();
});
document.getElementById("detailsButton").addEventListener("click", event => {
  const expanded = !document.getElementById("placeCard").classList.contains("expanded");
  document.getElementById("placeCard").classList.toggle("expanded",expanded);
  document.getElementById("expandedDetails").classList.toggle("hidden",!expanded);
  document.getElementById("detailHighlights").classList.toggle("hidden",!expanded);
  document.getElementById("detailGallery").classList.toggle("hidden",!expanded);
  document.getElementById("placeRating").classList.toggle("hidden",!expanded);
  event.currentTarget.textContent = expanded ? "Ver menos" : "Ver detalhes";
  event.currentTarget.setAttribute("aria-expanded",String(expanded));
});
document.getElementById("allPosts").addEventListener("click",() => showToast("Feed de publicações demonstrativo."));
document.getElementById("feedButton").addEventListener("click",() => {
  const place = places.find(item => item.id === selectedId);
  if (place) showToast(`Feed de ${place.name} — demonstração.`);
});
document.querySelectorAll(".nav-link").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach(b => b.classList.remove("active"));
    button.classList.add("active");
    const page = button.dataset.page;
    if (page !== "Mapa") showToast(`${page}: seção demonstrativa. A navegação pode ser conectada à página correspondente.`);
    else resetMapView();
  });
});
document.getElementById("profileButton").addEventListener("click", () => showToast("Perfil do usuário — conecte aqui a tela de perfil."));
renderMarkers();
window.setTimeout(() => leafletMap.invalidateSize(),0);
