window.InbarPlaceCard = (() => {
  const card = document.getElementById("placeCard");
  const photosElement = document.getElementById("detailGallery");
  const featureList = document.getElementById("featureList");
  const postList = document.getElementById("postList");
  let expanded = false;

  function createIcon(name) {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    icon.classList.add("icon");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");
    use.setAttribute("href", `assets/icons/inbar.svg#${name}`);
    icon.append(use);
    return icon;
  }

  function render(place, onMessage) {
    document.getElementById("placeName").textContent = place.name;
    document.getElementById("placeDescription").textContent = place.desc || "";
    document.getElementById("placeDescription").hidden = !place.desc;
    document.getElementById("placeScore").textContent = place.rating || "";
    document.getElementById("placeReviews").textContent = Number.isFinite(place.reviews) ? `(${place.reviews} avaliações)` : "";
    document.getElementById("placeRating").classList.toggle("hidden", !place.rating || !Number.isFinite(place.reviews));
    document.getElementById("placeDistance").textContent = place.distance;
    document.getElementById("placeStatus").textContent = place.status || "Informações não disponíveis";
    document.getElementById("statusDot").style.borderColor = placeColors[place.level] || placeColors.purple;
    document.getElementById("placeStatus").style.color = placeColors[place.level] || placeColors.purple;
    const occupancyStat = document.getElementById("placeOccupancyStat");
    const hasOccupancy = Number.isFinite(place.occupancy);
    occupancyStat.classList.toggle("hidden", !hasOccupancy);
    if (hasOccupancy) document.getElementById("placeOccupancy").textContent = `${place.occupancy}%`;
    const localPosts = window.InbarFeed ? window.InbarFeed.getPostsByPlace(place.id) : [];
    document.getElementById("placePosts").textContent = String(localPosts.length);
    document.getElementById("placePostsStat").classList.toggle("hidden", localPosts.length === 0);
    const primaryImage = window.InbarPlaceMedia.getCoverImage(place);
    const placeImage = document.getElementById("placeImage");
    placeImage.src = primaryImage;
    placeImage.alt = window.InbarPlaceMedia.isIllustrative(place)
      ? `Imagem ilustrativa de ${place.name}; foto não disponível`
      : `Ambiente de ${place.name}`;
    placeImage.addEventListener("error", () => window.InbarPlaceMedia.applyFallback(placeImage, place), { once: true });

    renderPhotos(place, onMessage);
    renderFeatures(place);
    renderPosts(place, localPosts);
    document.querySelector(".promotion").hidden = true;
    configureDirections(place);
  }

  function configureDirections(place) {
    const directionsButton = document.getElementById("directionsButton");
    const navigationOptions = document.getElementById("navigationOptions");
    const coordinates = [place.lat, place.lng];
    const hasCoordinates = coordinates.every(Number.isFinite) &&
      place.lat >= -90 && place.lat <= 90 &&
      place.lng >= -180 && place.lng <= 180;

    navigationOptions.classList.add("hidden");
    directionsButton.setAttribute("aria-expanded", "false");
    directionsButton.disabled = !hasCoordinates;
    if (!hasCoordinates) {
      directionsButton.title = "Não há coordenadas disponíveis para este local.";
      document.getElementById("googleMapsLink").removeAttribute("href");
      document.getElementById("wazeLink").removeAttribute("href");
      return;
    }

    directionsButton.removeAttribute("title");
    const destination = `${place.lat},${place.lng}`;
    document.getElementById("googleMapsLink").href =
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    document.getElementById("wazeLink").href =
      `https://waze.com/ul?ll=${encodeURIComponent(destination)}&navigate=yes`;
  }

  const placeColors = {
    green: "#00e7b0",
    yellow: "#ffcf35",
    red: "#ff4d52",
    purple: "#d1a2e8"
  };

  function getThumbnailSource(source, width, height) {
    return source.replace("w=900&h=600", `w=${width}&h=${height}`)
      .replace("w=900&h=560", `w=${width}&h=${height}`);
  }

  function renderPhotos(place, onMessage) {
    photosElement.replaceChildren();
    const cover = window.InbarPlaceMedia.getCoverImage(place);
    const photos = Array.isArray(place.gallery) && place.gallery.length
      ? place.gallery
      : Array.isArray(place.images) && place.images.length
        ? place.images
        : [cover];
    photos.forEach((source, index) => {
      const button = document.createElement("button");
      button.className = `gallery-thumb${index === 0 ? " active" : ""}`;
      button.type = "button";
      button.setAttribute("aria-label", `Mostrar foto ${index + 1}`);
      const image = document.createElement("img");
      image.src = getThumbnailSource(source, 120, 100);
      image.alt = "";
      image.addEventListener("error", () => window.InbarPlaceMedia.applyFallback(image, place), { once: true });
      button.append(image);
      button.addEventListener("click", () => {
        document.getElementById("placeImage").src = source;
        document.getElementById("placeImage").alt = `Ambiente de ${document.getElementById("placeName").textContent}`;
        photosElement.querySelectorAll(".gallery-thumb").forEach(thumb => thumb.classList.remove("active"));
        button.classList.add("active");
      });
      photosElement.append(button);
    });

  }

  function renderFeatures(place) {
    featureList.replaceChildren();
    place.types.slice(0, 3).forEach(type => {
      const feature = document.createElement("div");
      feature.className = "feature-chip";
      const icon = document.createElement("span");
      icon.className = "feature-icon";
      icon.append(createIcon(place.icon || "map-pin"));
      const text = document.createElement("span");
      text.append(document.createTextNode(type));
      const label = document.createElement("small");
      label.textContent = "Categoria cadastrada";
      text.append(label);
      feature.append(icon, text);
      featureList.append(feature);
    });
  }

  function renderPosts(place, posts) {
    postList.replaceChildren();
    if (!posts.length) {
      const empty = document.createElement("p");
      empty.className = "place-posts-empty";
      empty.textContent = "Este local ainda não tem publicações no Feed.";
      postList.append(empty);
      return;
    }
    posts.forEach(post => {
      const postCard = document.createElement("article");
      postCard.className = "post-card";
      const author = document.createElement("div");
      author.className = "post-author";
      const avatar = document.createElement("span");
      avatar.className = "author-avatar";
      const authorName = post.authorName || "Usuário";
      avatar.textContent = authorName.slice(0, 1).toUpperCase();
      const authorInfo = document.createElement("span");
      authorInfo.className = "author-info";
      authorInfo.append(document.createTextNode(authorName));
      const time = document.createElement("small");
      time.textContent = post.isExample ? "Publicação demonstrativa" : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(post.createdAt));
      authorInfo.append(time);
      author.append(avatar, authorInfo);
      const caption = document.createElement("p");
      caption.textContent = post.content;
      if (post.image) {
        const image = document.createElement("img");
        image.className = "post-image";
        image.src = getThumbnailSource(post.image, 360, 180);
        image.alt = `Imagem da publicação de ${authorName}`;
        postCard.append(author, image, caption);
      } else {
        postCard.append(author, caption);
      }
      postList.append(postCard);
    });
  }

  function setExpanded(value) {
    expanded = value;
    card.classList.toggle("expanded", expanded);
    document.getElementById("expandedDetails").classList.toggle("hidden", !expanded);
    document.getElementById("detailHighlights").classList.toggle("hidden", !expanded);
    photosElement.classList.toggle("hidden", !expanded);
    document.getElementById("placeRating").classList.toggle("hidden", !expanded);
    const button = document.getElementById("detailsButton");
    button.textContent = expanded ? "Ver menos" : "Ver detalhes";
    button.setAttribute("aria-expanded", String(expanded));
  }

  function show() {
    card.classList.remove("hidden");
  }

  function hide() {
    setExpanded(false);
    card.classList.add("hidden");
  }

  function isExpanded() {
    return expanded;
  }

  function toggleNavigationOptions() {
    const button = document.getElementById("directionsButton");
    const options = document.getElementById("navigationOptions");
    if (button.disabled) return;
    const isExpanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!isExpanded));
    options.classList.toggle("hidden", isExpanded);
  }

  function closeNavigationOptions() {
    document.getElementById("directionsButton").setAttribute("aria-expanded", "false");
    document.getElementById("navigationOptions").classList.add("hidden");
  }

  return {
    render,
    setExpanded,
    show,
    hide,
    isExpanded,
    toggleNavigationOptions,
    closeNavigationOptions
  };
})();