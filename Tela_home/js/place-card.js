window.InbarPlaceCard = (() => {
  const card = document.getElementById("placeCard");
  const photosElement = document.getElementById("detailGallery");
  const featureList = document.getElementById("featureList");
  const postList = document.getElementById("postList");
  let expanded = false;

  function render(place, onMessage) {
    document.getElementById("placeName").textContent = place.name;
    document.getElementById("placeScore").textContent = place.rating;
    document.getElementById("placeReviews").textContent = `(${place.reviews} avaliações)`;
    document.getElementById("placeDistance").textContent = place.distance;
    document.getElementById("placeStatus").textContent = place.status;
    document.getElementById("placeOccupancy").textContent = `${place.occupancy}%`;
    document.getElementById("placePosts").textContent = place.posts;
    document.getElementById("placeImage").src = place.image;
    document.getElementById("placeImage").alt = `Ambiente de ${place.name}`;
    document.getElementById("statusDot").style.borderColor = placeColors[place.level];
    document.getElementById("placeStatus").style.color = placeColors[place.level];

    const photos = [
      place.image.replace("w=900&h=560", "w=900&h=600"),
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=900&h=600&fit=crop",
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=900&h=600&fit=crop"
    ];
    renderPhotos(photos, onMessage);
    renderFeatures(place);
    renderPosts(place, photos);
    document.getElementById("promotionText").textContent = "Condições demonstrativas";
    document.getElementById("directionsLink").href = `https://www.openstreetmap.org/directions?to=${place.lat}%2C${place.lng}`;
  }

  const placeColors = {
    green: "#00e7b0",
    yellow: "#ffcf35",
    red: "#ff4d52"
  };

  function renderPhotos(photos, onMessage) {
    photosElement.replaceChildren();
    photos.forEach((source, index) => {
      const button = document.createElement("button");
      button.className = `gallery-thumb${index === 0 ? " active" : ""}`;
      button.type = "button";
      button.setAttribute("aria-label", `Mostrar foto ${index + 1}`);
      const image = document.createElement("img");
      image.src = source.replace("w=900&h=600", "w=120&h=100");
      image.alt = "";
      button.append(image);
      button.addEventListener("click", () => {
        document.getElementById("placeImage").src = source;
        photosElement.querySelectorAll(".gallery-thumb").forEach(thumb => thumb.classList.remove("active"));
        button.classList.add("active");
      });
      photosElement.append(button);
    });

    const morePhotos = document.createElement("button");
    morePhotos.className = "gallery-thumb gallery-more";
    morePhotos.type = "button";
    morePhotos.textContent = "+8 fotos";
    morePhotos.addEventListener("click", () => onMessage("Galeria de fotos demonstrativa."));
    photosElement.append(morePhotos);
  }

  function renderFeatures(place) {
    const icons = {
      "Música ao vivo": "♫",
      "Happy Hour": "🍸",
      "Eventos": "✦",
      "Outros": "◇"
    };
    featureList.replaceChildren();
    place.types.filter(type => type !== "Bares").slice(0, 2).forEach(type => {
      const feature = document.createElement("div");
      feature.className = "feature-chip";
      const icon = document.createElement("span");
      icon.className = "feature-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = icons[type] || "◇";
      const text = document.createElement("span");
      text.append(document.createTextNode(type));
      const time = document.createElement("small");
      time.textContent = "Hoje à noite";
      text.append(time);
      feature.append(icon, text);
      featureList.append(feature);
    });
  }

  function renderPosts(place, photos) {
    const posts = [{
      user: "joaosilva",
      time: "há 12 min",
      text: `${place.status.replace(" agora","")} por aqui! 🔥`,
      image: photos[0]
    }, {
      user: "mariana.r",
      time: "há 28 min",
      text: "Happy hour imperdível! 🍹",
      image: photos[2]
    }, {
      user: "villaficial",
      time: "há 1 h",
      text: `${place.desc} 🎶`,
      image: photos[1]
    }];
    postList.replaceChildren();
    posts.forEach(post => {
      const postCard = document.createElement("article");
      postCard.className = "post-card";
      const author = document.createElement("div");
      author.className = "post-author";
      const avatar = document.createElement("span");
      avatar.className = "author-avatar";
      avatar.textContent = post.user.slice(0, 1).toUpperCase();
      const authorInfo = document.createElement("span");
      authorInfo.className = "author-info";
      authorInfo.append(document.createTextNode(post.user));
      const time = document.createElement("small");
      time.textContent = post.time;
      authorInfo.append(time);
      author.append(avatar, authorInfo);
      const image = document.createElement("img");
      image.className = "post-image";
      image.src = post.image.replace("w=900&h=600", "w=360&h=180");
      image.alt = `Publicação demonstrativa de ${post.user}`;
      const caption = document.createElement("p");
      caption.textContent = post.text;
      postCard.append(author, image, caption);
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

  return {
    render,
    setExpanded,
    show,
    hide,
    isExpanded
  };
})();