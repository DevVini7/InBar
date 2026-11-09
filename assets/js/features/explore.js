window.InbarExplore = (() => {
  const view = document.getElementById("exploreView");
  const places = window.inbarPlaces;
  const state = {
    detailId: null,
    category: "Todos",
    region: "",
    sort: "recommended"
  };
  const categoryFilters = [
    ["Bares", ["bares", "bar", "boteco"]],
    ["Restaurantes", ["restaurante", "gastronomia"]],
    ["Boates e baladas", ["boates", "baladas", "boate"]],
    ["Música ao vivo", ["música ao vivo"]],
    ["Eventos", ["eventos", "festival"]],
    ["Hobbies", ["hobbies", "hobby", "jogos"]],
    ["Esportes", ["esportes", "esporte"]],
    ["Cultura", ["cultura", "cinema", "exposições"]],
    ["Cafés", ["café", "cafeteria"]],
    ["Experiências", ["experiências", "experiência", "ar livre", "parques"]]
  ];

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function normalizeText(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
  }

  function metadataFor(place) {
    return window.InbarPlaceMetadata.get(place.id) || {};
  }

  function regionFor(place) {
    const location = String(place.distance || "");
    const regions = [
      "Asa Norte",
      "Asa Sul",
      "Lago Norte",
      "Lago Sul",
      "Paranoá",
      "Plano Piloto",
      "Setor Comercial Sul"
    ];
    return regions.find(region => normalizeText(location).includes(normalizeText(region))) || "";
  }

  function searchableText(place) {
    return normalizeText([
      place.name,
      place.category,
      place.distance,
      place.desc,
      ...(place.types || []),
      ...(place.searchTerms || [])
    ].join(" "));
  }

  function categoryMatches(place, category) {
    if (category === "Todos") return true;
    const labels = normalizeText(`${place.category || ""} ${(place.types || []).join(" ")}`);
    const searchable = searchableText(place);
    const definition = categoryFilters.find(([label]) => label === category);
    return definition ? definition[1].some(term => labels.includes(normalizeText(term))
      || (category === "Cafés" && searchable.includes("cafe"))) : false;
  }

  function scoreByPlace() {
    const ranked = window.InbarRecommendations
      ? window.InbarRecommendations.rankPlaces(places)
      : places.map((entity, index) => ({ entity, score: 0, index }));
    return new Map(ranked.map(item => [String(item.entity.id), item.score]));
  }

  function popularityFor(place, recommendationScore = 0) {
    const metadata = metadataFor(place);
    const popularity = metadata.popularity;
    if (popularity?.verified === true && popularity.sourceUrl && popularity.evidence) {
      return { kind: "known", label: "Muito conhecido", detail: popularity.evidence, sourceUrl: popularity.sourceUrl };
    }

    const addedAt = metadata.addedAt ? new Date(`${metadata.addedAt}T00:00:00`).getTime() : NaN;
    const ageDays = (Date.now() - addedAt) / 86_400_000;
    if (Number.isFinite(addedAt) && ageDays >= 0 && ageDays <= 30) {
      return { kind: "new", label: "Novo no InBar", detail: `Adicionado em ${formatDate(metadata.addedAt)}.` };
    }
    if (recommendationScore > 0) {
      return { kind: "discovery", label: "Vale conhecer", detail: "Sugestão baseada nos interesses e na vibe desta sessão." };
    }
    return { kind: "unknown", label: "Popularidade ainda não avaliada", detail: "" };
  }

  function formatDate(value) {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? "data não informada"
      : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
  }

  function verifiedRating(place) {
    const rating = metadataFor(place).verifiedRating;
    return rating?.verified === true && rating.sourceUrl && Number.isFinite(rating.value)
      && Number.isInteger(rating.reviewCount) && rating.reviewCount > 0 ? rating : null;
  }

  function verifiedPopularities() {
    return places.filter(place => {
      const popularity = metadataFor(place).popularity;
      return popularity?.verified === true && popularity.sourceUrl && popularity.evidence;
    });
  }

  function buildFilters() {
    const categories = ["Todos", ...categoryFilters
      .filter(([label]) => places.some(place => categoryMatches(place, label)))
      .map(([label]) => label)];
    const filterMarkup = categories.map(category => `
      <button type="button" class="explore-filter${state.category === category ? " is-active" : ""}"
        data-explore-category="${escapeHtml(category)}" aria-pressed="${state.category === category}">
        ${escapeHtml(category)}
      </button>`).join("");
    const regions = [...new Set(places.map(regionFor).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
    return `<div class="explore-controls">
      <div class="explore-filter-list" role="group" aria-label="Filtrar por categoria">${filterMarkup}</div>
      <div class="explore-sort-controls">
        <label>Região<select id="exploreRegion">
          <option value="">Todas as regiões</option>
          ${regions.map(region => `<option value="${escapeHtml(region)}" ${state.region === region ? "selected" : ""}>${escapeHtml(region)}</option>`).join("")}
        </select></label>
        <label>Ordenar<select id="exploreSort">
          <option value="recommended" ${state.sort === "recommended" ? "selected" : ""}>Recomendações para mim</option>
          <option value="popular" ${state.sort === "popular" ? "selected" : ""} ${verifiedPopularities().length ? "" : "disabled"}>Mais populares${verifiedPopularities().length ? "" : " · sem dados verificados"}</option>
          <option value="newest" ${state.sort === "newest" ? "selected" : ""}>Novidades</option>
          <option value="alphabetical" ${state.sort === "alphabetical" ? "selected" : ""}>Ordem alfabética</option>
          <option value="rating" ${state.sort === "rating" ? "selected" : ""} ${places.some(verifiedRating) ? "" : "disabled"}>Mais bem avaliados${places.some(verifiedRating) ? "" : " · sem avaliações verificadas"}</option>
        </select></label>
      </div>
    </div>`;
  }

  function sortPlaces(items) {
    const scores = scoreByPlace();
    return [...items].sort((first, second) => {
      if (state.sort === "popular") {
        const firstValue = metadataFor(first).popularity?.verified === true
          ? Number(metadataFor(first).popularity.score) || 0 : -1;
        const secondValue = metadataFor(second).popularity?.verified === true
          ? Number(metadataFor(second).popularity.score) || 0 : -1;
        return secondValue - firstValue || first.name.localeCompare(second.name, "pt-BR");
      }
      if (state.sort === "newest") {
        const firstDate = Date.parse(metadataFor(first).addedAt || "") || 0;
        const secondDate = Date.parse(metadataFor(second).addedAt || "") || 0;
        return secondDate - firstDate || first.name.localeCompare(second.name, "pt-BR");
      }
      if (state.sort === "alphabetical") return first.name.localeCompare(second.name, "pt-BR");
      if (state.sort === "rating") {
        const firstRating = verifiedRating(first)?.value || 0;
        const secondRating = verifiedRating(second)?.value || 0;
        return secondRating - firstRating || first.name.localeCompare(second.name, "pt-BR");
      }
      return (scores.get(String(second.id)) || 0) - (scores.get(String(first.id)) || 0)
        || first.name.localeCompare(second.name, "pt-BR");
    });
  }

  function favoriteButton(place) {
    const favorite = window.InbarFavorites.has(place.id);
    return `<button type="button" class="explore-favorite${favorite ? " is-favorite" : ""}"
      data-explore-favorite="${escapeHtml(place.id)}" aria-pressed="${favorite}"
      aria-label="${favorite ? "Remover" : "Adicionar"} ${escapeHtml(place.name)} ${favorite ? "dos" : "aos"} favoritos">
      <svg class="icon" aria-hidden="true"><use href="assets/icons/inbar.svg#heart"></use></svg>
    </button>`;
  }

  function placeCard(place, scores) {
    const score = scores.get(String(place.id)) || 0;
    const popularity = popularityFor(place, score);
    const illustrative = window.InbarPlaceMedia.isIllustrative(place);
    const cover = window.InbarPlaceMedia.getCoverImage(place);
    return `<article class="explore-card">
      <div class="explore-card-media">
        <img src="${escapeHtml(cover)}"
          alt="${illustrative ? `Imagem ilustrativa de ${escapeHtml(place.name)}; foto não disponível` : `Ambiente de ${escapeHtml(place.name)}`}"
          data-place-image="${escapeHtml(place.id)}" loading="lazy">
        <span class="explore-place-badge is-${popularity.kind}" title="${escapeHtml(popularity.detail || popularity.label)}">${escapeHtml(popularity.label)}</span>
        ${favoriteButton(place)}
      </div>
      <div class="explore-card-body">
        <div class="explore-card-title"><h3>${escapeHtml(place.name)}</h3><span>${escapeHtml(place.category)}</span></div>
        <p class="explore-place-region">${escapeHtml(regionFor(place) || place.distance || "Região não cadastrada")}</p>
        <p class="explore-place-description">${escapeHtml(place.desc || "Descrição ainda não cadastrada.")}</p>
        <div class="explore-tags">${(place.types || []).slice(0, 4).map(type => `<span>${escapeHtml(type)}</span>`).join("")}</div>
        <button type="button" class="explore-place-button" data-open-place-detail="${escapeHtml(place.id)}">Ver detalhes
          <svg class="icon" aria-hidden="true"><use href="assets/icons/inbar.svg#arrow-right"></use></svg>
        </button>
      </div>
    </article>`;
  }

  function shelf(title, items, scores, className = "") {
    if (!items.length) return "";
    return `<section class="explore-shelf ${className}" aria-label="${escapeHtml(title)}">
      <div class="explore-section-heading"><div><p class="explore-eyebrow">DESCUBRA</p><h2>${escapeHtml(title)}</h2></div>
        <span>${items.length} ${items.length === 1 ? "lugar" : "lugares"}</span></div>
      <div class="explore-grid">${items.map(place => placeCard(place, scores)).join("")}</div>
    </section>`;
  }

  function renderCatalog() {
    const search = normalizeText(document.getElementById("searchInput").value.trim());
    const filtered = places.filter(place => categoryMatches(place, state.category)
      && (!state.region || regionFor(place) === state.region)
      && (!search || searchableText(place).includes(search)));
    const ordered = sortPlaces(filtered);
    const scores = scoreByPlace();
    const recommendations = ordered.filter(place => (scores.get(String(place.id)) || 0) > 0);
    const popular = ordered.filter(place => metadataFor(place).popularity?.verified === true);
    const newPlaces = ordered.filter(place => popularityFor(place).kind === "new");
    const isFiltered = Boolean(search || state.category !== "Todos" || state.region);
    const countLabel = `${filtered.length} ${filtered.length === 1 ? "lugar encontrado" : "lugares encontrados"}`;
    const heading = `<header class="explore-heading">
      <div><p class="feed-kicker">ENCONTRE SEU PRÓXIMO ROLÊ</p><h1>Explore Brasília</h1>
      <p>Descubra lugares, experiências e novos rolês.</p></div><span class="explore-count">${countLabel}</span>
    </header>${buildFilters()}`;
    if (isFiltered) {
      view.innerHTML = `${heading}<section class="explore-shelf" aria-label="Resultados da busca">
        <div class="explore-section-heading"><div><p class="explore-eyebrow">RESULTADOS</p><h2>Lugares para conhecer</h2></div><span>${filtered.length}</span></div>
        ${ordered.length ? `<div class="explore-grid">${ordered.map(place => placeCard(place, scores)).join("")}</div>`
          : '<p class="explore-empty">Nenhum lugar encontrado. Tente outro nome, categoria ou região.</p>'}
      </section>`;
      return;
    }

    const discoveryPlaces = recommendations.filter(place => !popular.includes(place));
    const categorySections = [
      ["Música ao vivo", ["Música ao vivo"]],
      ["Bares e restaurantes", ["Bares", "Restaurantes"]],
      ["Festas e baladas", ["Boates e baladas", "Eventos"]],
      ["Hobbies e experiências", ["Hobbies", "Esportes", "Experiências"]],
      ["Cultura e passeios", ["Cultura", "Cafés"]]
    ];
    const seen = new Set();
    const categoryShelves = categorySections.map(([title, categories]) => {
      const items = ordered.filter(place => categories.some(category => categoryMatches(place, category))
        && !seen.has(String(place.id)));
      items.forEach(place => seen.add(String(place.id)));
      return shelf(title, items, scores);
    }).join("");
    const allPlaces = ordered.map(place => placeCard(place, scores)).join("");
    const note = places.some(place => !metadataFor(place).descriptionSource)
      ? '<p class="explore-data-note">Alguns cadastros e descrições são demonstrativos; horários, preços, avaliações e funcionamento não foram confirmados. Consulte os canais oficiais antes de ir.</p>'
      : "";
    view.innerHTML = `${heading}${note}
      ${shelf("Em destaque", popular, scores, "explore-featured")}
      ${shelf("Descobertas para você", discoveryPlaces, scores, "explore-discoveries")}
      ${shelf("Novidades no InBar", newPlaces, scores, "explore-new")}
      ${categoryShelves}
      <section class="explore-shelf" aria-label="Todos os lugares">
        <div class="explore-section-heading"><div><p class="explore-eyebrow">CATÁLOGO</p><h2>Lugares para conhecer</h2></div><span>${ordered.length}</span></div>
        <div class="explore-grid">${allPlaces}</div>
      </section>`;
  }

  function renderDetails(placeId) {
    const place = places.find(item => String(item.id) === String(placeId));
    if (!place) {
      state.detailId = null;
      renderCatalog();
      return false;
    }
    const metadata = metadataFor(place);
    const score = scoreByPlace().get(String(place.id)) || 0;
    const popularity = popularityFor(place, score);
    const images = window.InbarPlaceMedia.getGalleryImages(place);
    const illustrative = window.InbarPlaceMedia.isIllustrative(place);
    const location = place.distance || "Endereço não cadastrado";
    const verified = Boolean(metadata.descriptionSource);
    const rating = verifiedRating(place);
    view.innerHTML = `<article class="explore-detail" data-detail-place="${escapeHtml(place.id)}">
      <button type="button" class="explore-back-button" data-explore-action="back">
        <svg class="icon" aria-hidden="true"><use href="assets/icons/inbar.svg#arrow-left"></use></svg>Voltar aos lugares
      </button>
      <section class="explore-detail-hero">
        <div class="explore-detail-gallery">
          <img class="explore-detail-cover" id="exploreDetailCover" src="${escapeHtml(images[0])}"
            alt="${illustrative ? `Imagem ilustrativa de ${escapeHtml(place.name)}; foto não disponível` : `Foto de ${escapeHtml(place.name)}`}"
            data-place-image="${escapeHtml(place.id)}">
          ${images.length > 1 ? `<div class="explore-gallery-thumbnails" role="group" aria-label="Galeria de fotos">
            ${images.map((image, index) => `<button type="button" data-gallery-image="${escapeHtml(index)}" aria-label="Mostrar foto ${index + 1}" aria-pressed="${index === 0}">
              <img src="${escapeHtml(image)}" alt="" data-place-image="${escapeHtml(place.id)}" loading="lazy"></button>`).join("")}
          </div>` : ""}
        </div>
        <div class="explore-detail-intro">
          <span class="explore-place-badge is-${popularity.kind}" title="${escapeHtml(popularity.detail || popularity.label)}">${escapeHtml(popularity.label)}</span>
          <p class="explore-eyebrow">${escapeHtml(place.category || "Local")}</p>
          <h1>${escapeHtml(place.name)}</h1>
          <p class="explore-detail-location"><svg class="icon" aria-hidden="true"><use href="assets/icons/inbar.svg#map-pin"></use></svg>${escapeHtml(location)}</p>
          <p class="explore-detail-description">${escapeHtml(metadata.verifiedDescription || place.desc || "Descrição ainda não cadastrada.")}</p>
          ${!verified ? '<p class="explore-data-note">Descrição de cadastro demonstrativo; detalhes e funcionamento não foram confirmados.</p>' : ""}
          ${illustrative ? '<p class="explore-image-note">Imagem ilustrativa: foto própria deste local não disponível.</p>' : ""}
          ${rating ? `<p class="explore-verified-rating">★ ${escapeHtml(rating.value)} · ${escapeHtml(rating.reviewCount)} avaliações
            <a href="${escapeHtml(rating.sourceUrl)}" target="_blank" rel="noopener noreferrer">Fonte</a></p>` : ""}
          <div class="explore-detail-tags">${(place.types || []).map(type => `<span>${escapeHtml(type)}</span>`).join("")}</div>
          <div class="explore-detail-actions">
            ${favoriteButton(place)}
            <button type="button" class="feed-primary-button" data-open-place-feed="${escapeHtml(place.id)}">Ver feed do local</button>
            <button type="button" class="feed-secondary-button" data-open-place-map="${escapeHtml(place.id)}">Ver no mapa</button>
          </div>
        </div>
      </section>
      <div class="explore-detail-columns">
        <section class="explore-info-panel"><p class="explore-eyebrow">SOBRE O LOCAL</p><h2>Informações conhecidas</h2>
          <dl><div><dt>Categoria</dt><dd>${escapeHtml(place.category || "Não cadastrada")}</dd></div>
          <div><dt>Localização cadastrada</dt><dd>${escapeHtml(location)}</dd></div>
          <div><dt>Região</dt><dd>${escapeHtml(regionFor(place) || "Não informada")}</dd></div>
          <div><dt>Popularidade</dt><dd>${escapeHtml(popularity.label)}</dd></div>
          ${metadata.addedAt ? `<div><dt>No InBar desde</dt><dd>${escapeHtml(formatDate(metadata.addedAt))}</dd></div>` : ""}
          ${metadata.officialUrl ? `<div><dt>Site oficial</dt><dd><a href="${escapeHtml(metadata.officialUrl)}" target="_blank" rel="noopener noreferrer">Consultar site</a></dd></div>` : ""}
          <div><dt>Fonte de localização</dt><dd>${place.sourceUrl ? `<a href="${escapeHtml(place.sourceUrl)}" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>` : "Não informada"}</dd></div>
          </dl>
        </section>
        <section class="explore-info-panel"><p class="explore-eyebrow">TRANSPARÊNCIA</p><h2>Dados e recomendações</h2>
          <p>${escapeHtml(popularity.detail || "Popularidade ainda não foi avaliada com dados verificáveis.")}</p>
          ${metadata.descriptionSource ? `<p>Descrição conferida em fonte oficial: <a href="${escapeHtml(metadata.descriptionSource)}" target="_blank" rel="noopener noreferrer">ver fonte</a>.</p>` : ""}
          <p>Horários, preços, programação, acessibilidade e formas de pagamento não são exibidos sem confirmação. Recomendações personalizadas usam seus interesses e a vibe da sessão, não avaliações inventadas.</p>
        </section>
      </div>
    </article>`;
    return true;
  }

  function render() {
    if (!view.classList.contains("hidden")) {
      if (state.detailId !== null) renderDetails(state.detailId);
      else renderCatalog();
    }
  }

  function openDetails(placeId, updateHistory = true) {
    const place = places.find(item => String(item.id) === String(placeId));
    if (!place) return false;
    state.detailId = String(place.id);
    renderDetails(state.detailId);
    if (updateHistory) window.history.pushState({ page: "Explorar", placeId: place.id },
      "", `pages/app/index.html#explorar/local/${encodeURIComponent(place.id)}`);
    return true;
  }

  function showCatalog(updateHistory = true) {
    state.detailId = null;
    renderCatalog();
    if (updateHistory) window.history.replaceState({ page: "Explorar" }, "", "pages/app/index.html#explorar");
  }

  function setupEvents() {
    view.addEventListener("click", event => {
      const categoryButton = event.target.closest("[data-explore-category]");
      if (categoryButton) {
        state.category = categoryButton.dataset.exploreCategory;
        renderCatalog();
        return;
      }
      const favorite = event.target.closest("[data-explore-favorite]");
      if (favorite) {
        try {
          window.InbarFavorites.toggle(favorite.dataset.exploreFavorite);
        } catch (error) {
          console.error("Não foi possível atualizar os locais favoritos.", error);
          window.InbarApp.showToast(error.message || "Não foi possível atualizar os favoritos.");
        }
        return;
      }
      const galleryImage = event.target.closest("[data-gallery-image]");
      if (galleryImage) {
        const place = places.find(item => String(item.id) === state.detailId);
        if (!place) return;
        const image = window.InbarPlaceMedia.getGalleryImages(place)[Number(galleryImage.dataset.galleryImage)];
        if (!image) return;
        const cover = document.getElementById("exploreDetailCover");
        cover.src = image;
        cover.alt = window.InbarPlaceMedia.isIllustrative(place)
          ? `Imagem ilustrativa de ${place.name}; foto não disponível` : `Foto de ${place.name}`;
        view.querySelectorAll("[data-gallery-image]").forEach(button =>
          button.setAttribute("aria-pressed", String(button === galleryImage)));
        return;
      }
      if (event.target.closest("[data-explore-action='back']")) {
        showCatalog();
        return;
      }
      const detailButton = event.target.closest("[data-open-place-detail]");
      if (detailButton) {
        openDetails(detailButton.dataset.openPlaceDetail);
        return;
      }
      const feedButton = event.target.closest("[data-open-place-feed]");
      if (feedButton) window.InbarNavigation.openPlaceFeed(Number(feedButton.dataset.openPlaceFeed));
      const mapButton = event.target.closest("[data-open-place-map]");
      if (mapButton) window.InbarNavigation.openPlace(Number(mapButton.dataset.openPlaceMap));
    });
    view.addEventListener("change", event => {
      if (event.target.id === "exploreRegion") {
        state.region = event.target.value;
        renderCatalog();
      } else if (event.target.id === "exploreSort") {
        state.sort = event.target.value;
        renderCatalog();
      }
    });
    view.addEventListener("error", event => {
      const image = event.target.closest("[data-place-image]");
      if (!image) return;
      const place = places.find(item => String(item.id) === image.dataset.placeImage);
      if (place) window.InbarPlaceMedia.applyFallback(image, place);
    }, true);
    window.addEventListener("inbar:favorites-updated", render);
    window.addEventListener("inbar:vibe-updated", render);
    window.addEventListener("inbar:preferences-updated", render);
  }

  setupEvents();
  return {
    openDetails,
    render,
    showCatalog,
    getDetailId: () => state.detailId
  };
})();
