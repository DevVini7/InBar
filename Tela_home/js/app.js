const places = [
  { id:1, name:"Villa Lounge", category:"Bares", types:["Bares","Eventos","Música ao vivo"], lat:-15.80920, lng:-47.88529, distance:"CLS 402/403 • Asa Sul", status:"Movimentado agora", level:"yellow", occupancy:70, posts:12, image:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=360&h=420&fit=crop", desc:"Música, drinks e pista animada." },
  { id:2, name:"Bar Esquina 21", category:"Bares", types:["Bares","Happy Hour"], lat:-15.75767, lng:-47.88299, distance:"CLN 209 • Asa Norte", status:"Tranquilo agora", level:"green", occupancy:32, posts:5, image:"https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=360&h=420&fit=crop", desc:"Drinks autorais e happy hour." },
  { id:3, name:"Subsolo Club", category:"Eventos", types:["Bares","Eventos","Música ao vivo"], lat:-15.76328, lng:-47.89017, distance:"CLN 308 • Asa Norte", status:"Lotado agora", level:"red", occupancy:94, posts:28, image:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=360&h=420&fit=crop", desc:"DJ ao vivo e pista até tarde." },
  { id:4, name:"Boteco do Lago", category:"Bares", types:["Bares","Happy Hour"], lat:-15.78007, lng:-47.87487, distance:"CLN 402 • Asa Norte", status:"Movimentado agora", level:"yellow", occupancy:68, posts:9, image:"https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=360&h=420&fit=crop", desc:"Petiscos e happy hour na Asa Norte." },
  { id:5, name:"Quintal 61", category:"Happy Hour", types:["Bares","Happy Hour"], lat:-15.81913, lng:-47.89525, distance:"CLS 404/405 • Asa Sul", status:"Tranquilo agora", level:"green", occupancy:28, posts:4, image:"https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=360&h=420&fit=crop", desc:"Um espaço descontraído para encontrar amigos." },
  { id:6, name:"Festival Central", category:"Eventos", types:["Eventos","Música ao vivo"], lat:-15.81430, lng:-47.88991, distance:"CLS 404/405 • Asa Sul", status:"Lotado agora", level:"red", occupancy:97, posts:34, image:"https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=360&h=420&fit=crop", desc:"Festival com shows e experiências." },
  { id:7, name:"Terraço 404", category:"Bares", types:["Bares","Happy Hour"], lat:-15.77330, lng:-47.87552, distance:"CLN 404 • Asa Norte", status:"Movimentado agora", level:"yellow", occupancy:75, posts:16, image:"https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=360&h=420&fit=crop", desc:"Drinks e vista panorâmica." },
  { id:8, name:"Samba da Praça", category:"Música ao vivo", types:["Eventos","Música ao vivo"], lat:-15.81424, lng:-47.90734, distance:"CLS 308 • Asa Sul", status:"Tranquilo agora", level:"green", occupancy:40, posts:7, image:"https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=360&h=420&fit=crop", desc:"Samba ao vivo em ambiente aberto." },
  { id:9, name:"Neblina Bar", category:"Bares", types:["Bares","Happy Hour"], lat:-15.76335, lng:-47.88091, distance:"CLN 208 • Asa Norte", status:"Tranquilo agora", level:"green", occupancy:35, posts:6, image:"https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=360&h=420&fit=crop", desc:"Coquetelaria e ambiente intimista." },
  { id:10, name:"Noite Alta", category:"Bares", types:["Bares","Eventos","Música ao vivo"], lat:-15.79710, lng:-47.88949, distance:"Setor Comercial Sul", status:"Lotado agora", level:"red", occupancy:91, posts:21, image:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=360&h=420&fit=crop", desc:"Uma noite cheia de energia." }
];

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
  selectedId = id;
  document.getElementById("placeName").textContent = place.name;
  document.getElementById("placeDistance").textContent = place.distance;
  document.getElementById("placeStatus").textContent = place.status;
  document.getElementById("placeOccupancy").textContent = `${place.occupancy}%`;
  document.getElementById("placePosts").textContent = place.posts;
  document.getElementById("placeImage").src = place.image;
  document.getElementById("placeImage").alt = `Ambiente de ${place.name}`;
  document.getElementById("statusDot").style.borderColor = colors[place.level];
  document.getElementById("placeStatus").style.color = colors[place.level];
  document.getElementById("placeCard").classList.remove("hidden");
  renderMarkers();
  if (pan) panTo(place);
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
      document.getElementById("placeCard").classList.add("hidden");
    }
    renderMarkers();
    panTo(firstVisible);
  } else {
    selectedId = null;
    renderMarkers();
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
document.getElementById("detailsButton").addEventListener("click", () => {
  const place = places.find(p => p.id === selectedId);
  showToast(`${place.name} — ${place.desc}`);
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
