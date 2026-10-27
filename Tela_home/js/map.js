window.InbarMap = (() => {
  const mapElement = document.getElementById("map");
  const colors = {
    green: "#00e7b0",
    yellow: "#ffcf35",
    red: "#ff4d52",
    purple: "#d1d5db"
  };
  let leafletMap;
  let markersLayer;
  let userLocationMarker = null;
  let tileErrorShown = false;
  let onPlaceSelect;
  let onError;

  function init(handlers) {
    onPlaceSelect = handlers.onPlaceSelect;
    onError = handlers.onError;

    if (!window.L) {
      onError("Não foi possível iniciar o mapa. Confira sua conexão com a internet.");
      throw new Error("Leaflet failed to load; the interactive map cannot be initialized.");
    }

    leafletMap = window.L.map(mapElement, {
      zoomControl: false,
      minZoom: 10,
      maxZoom: 19,
      zoomSnap: .25,
      scrollWheelZoom: true,
      tap: true
    });
    markersLayer = window.L.layerGroup().addTo(leafletMap);
    const tileLayer = window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      updateWhenIdle: true,
      keepBuffer: 2
    }).addTo(leafletMap);
    tileLayer.on("tileerror", () => {
      if (tileErrorShown) return;
      tileErrorShown = true;
      document.getElementById("mapStatus").textContent = "Não foi possível carregar parte do mapa. Verifique a conexão com a internet.";
      onError("Não foi possível carregar o mapa. Verifique a conexão com a internet.");
    });
    resetView();
    window.addEventListener("resize", () => invalidateSize());
    window.setTimeout(invalidateSize, 0);
  }

  function resetView() {
    if (!leafletMap) return;
    const zoom = window.matchMedia("(max-width: 760px)").matches ? 12.25 : 13;
    leafletMap.setView([-15.7885, -47.89], zoom);
  }

  function invalidateSize() {
    if (leafletMap) leafletMap.invalidateSize({
      debounceMoveend: true
    });
  }

  function panTo(place) {
    const zoom = Math.max(leafletMap.getZoom(), 14);
    const point = leafletMap.project([place.lat, place.lng], zoom);
    const center = leafletMap.unproject(point.subtract([0, Math.min(140, mapElement.clientHeight * .18)]), zoom);
    leafletMap.flyTo(center, zoom, {
      duration: .6
    });
  }

  function renderMarkers(visiblePlaces, selectedId) {
    markersLayer.clearLayers();
    visiblePlaces.forEach(place => {
      const selected = place.id === selectedId;
      const marker = document.createElement("span");
      marker.className = `map-marker ${selected ? "selected" : ""}`;
      marker.style.setProperty("--marker", selected ? colors.purple : colors[place.level]);
      marker.setAttribute("aria-hidden", "true");
      marker.innerHTML = '<span class="marker-pin"><svg class="icon" aria-hidden="true"><use href="assets/icons.svg#map-pin"></use></svg></span>';
      const icon = window.L.divIcon({
        className: "inbar-marker-host",
        html: marker,
        iconSize: [48, 54],
        iconAnchor: [24, 48]
      });
      window.L.marker([place.lat, place.lng], {
          icon,
          title: place.name,
          alt: `Lugar: ${place.name}`
        })
        .addTo(markersLayer)
        .on("click", () => onPlaceSelect(place.id, true));
    });
  }

  function locateUser() {
    if (!navigator.geolocation) {
      onError("Seu navegador não oferece suporte à localização.");
      return;
    }
    onError("Solicitando acesso à sua localização…");
    navigator.geolocation.getCurrentPosition(
      position => {
        const {
          latitude,
          longitude
        } = position.coords;
        if (userLocationMarker) leafletMap.removeLayer(userLocationMarker);
        userLocationMarker = window.L.circleMarker([latitude, longitude], {
          radius: 9,
          color: "#ffffff",
          weight: 3,
          fillColor: "#a20cff",
          fillOpacity: 1
        }).bindTooltip("Sua localização").addTo(leafletMap);
        leafletMap.flyTo([latitude, longitude], Math.max(leafletMap.getZoom(), 14), {
          duration: .8
        });
        onError("Sua localização foi exibida no mapa.");
      },
      error => {
        const messages = {
          1: "Permita o acesso à localização nas configurações do navegador.",
          2: "Não foi possível determinar sua localização.",
          3: "A solicitação de localização demorou demais."
        };
        onError(messages[error.code] || "Não foi possível acessar a localização.");
      }, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }

  function zoomIn() {
    leafletMap.zoomIn();
  }

  function zoomOut() {
    leafletMap.zoomOut();
  }

  return {
    init,
    resetView,
    panTo,
    renderMarkers,
    locateUser,
    zoomIn,
    zoomOut,
    invalidateSize
  };
})();