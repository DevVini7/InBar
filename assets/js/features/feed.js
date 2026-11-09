(() => {
  const STORAGE_KEY = "inbar:feed:v1";
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  const MAX_STORED_IMAGE_LENGTH = 1_500_000;
  const places = window.inbarPlaces || [];
  const sourceData = window.INBAR_DATA;
  const user = window.InbarAuth.getCurrentUser();
  const view = document.getElementById("feedView");
  const postsContainer = document.getElementById("feedPosts");
  const emptyState = document.getElementById("feedEmpty");
  const categoryFilters = document.getElementById("feedCategoryFilters");
  const categorySelect = document.getElementById("postCategory");
  const updateTypeSelect = document.getElementById("postUpdateType");
  const placeSelect = document.getElementById("postPlace");
  const publishDialog = document.getElementById("publishDialog");
  const commentsDialog = document.getElementById("commentsDialog");
  const deletePostDialog = document.getElementById("deletePostDialog");
  const publishForm = document.getElementById("publishForm");
  const commentForm = document.getElementById("commentForm");
  const imageInput = document.getElementById("postImage");
  const imagePreview = document.getElementById("postImagePreview");
  const toast = document.getElementById("feedToast");
  const UPDATE_TYPES = [
    "Experiências",
    "Novidades",
    "Eventos",
    "Música ao vivo",
    "Promoções",
    "Happy hour",
    "Cardápio",
    "Bebidas",
    "Avisos importantes"
  ];
  const state = {
    posts: [],
    category: "Todas",
    kind: "Todos",
    placeId: null,
    activePostId: null,
    pendingDeletePostId: null,
    pendingImage: "",
    toastTimer: 0
  };

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function populateUpdateTypeSelect() {
    updateTypeSelect.innerHTML = UPDATE_TYPES
      .map(type => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join("");
  }

  function normalizeText(value) {
    return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2800);
  }

  function placeById(id) {
    return places.find(place => place.id === id) || null;
  }

  function createDemoPosts() {
    if (!sourceData || !Array.isArray(sourceData.posts) || !Array.isArray(sourceData.venues)) {
      return [];
    }

    return sourceData.posts.flatMap(post => {
      const sourcePlace = sourceData.venues.find(venue => venue.id === post.venueId);
      if (!sourcePlace) return [];
      const matchingPlace = places.find(place => normalizeText(place.name) === normalizeText(sourcePlace.name));
      if (!matchingPlace) return [];

      return [{
        id: `example-${post.id}`,
        authorId: `example:${post.id}`,
        authorName: post.author,
        avatar: /^https:\/\//i.test(post.avatar || "") ? post.avatar : "",
        type: post.type === "establishment" ? "establishment" : "user",
        content: post.message,
        image: /^https:\/\//i.test(post.image || "") ? post.image : "",
        placeId: matchingPlace.id,
        category: matchingPlace.types[0] || matchingPlace.category,
        updateType: "Experiências",
        createdAt: "",
        baseLikes: Number.isInteger(post.likes) ? post.likes : 0,
        likes: [],
        comments: (Array.isArray(post.comments) ? post.comments : []).map((comment, index) => ({
          id: `example-comment-${post.id}-${index}`,
          authorId: `example:${post.id}:${index}`,
          authorName: comment.author,
          content: comment.text,
          createdAt: ""
        })),
        isExample: true
      }];
    });
  }

  function isValidComment(comment) {
    return comment && typeof comment.id === "string"
      && typeof comment.authorId === "string"
      && typeof comment.authorName === "string"
      && typeof comment.content === "string"
      && typeof comment.createdAt === "string";
  }

  function isValidPost(post) {
    return post && typeof post.id === "string"
      && typeof post.authorId === "string"
      && typeof post.authorName === "string"
      && typeof post.avatar === "string"
      && (post.avatar === "" || /^https:\/\//i.test(post.avatar))
      && (post.type === "user" || post.type === "establishment")
      && typeof post.content === "string"
      && typeof post.category === "string"
      && (post.updateType === undefined || UPDATE_TYPES.includes(post.updateType))
      && (post.placeId === null || Number.isInteger(post.placeId))
      && typeof post.image === "string"
      && (post.image === "" || /^https:\/\//i.test(post.image) || /^data:image\/jpeg;base64,/i.test(post.image))
      && typeof post.createdAt === "string"
      && Number.isInteger(post.baseLikes) && post.baseLikes >= 0
      && Array.isArray(post.likes)
      && post.likes.every(id => typeof id === "string")
      && Array.isArray(post.comments)
      && post.comments.every(isValidComment)
      && typeof post.isExample === "boolean";
  }

  function readStoredPosts() {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    let stored;
    try {
      stored = JSON.parse(raw);
    } catch (error) {
      throw new Error("Os dados salvos do Feed não são um JSON válido.", { cause: error });
    }
    if (!stored || stored.schemaVersion !== 1 || !Array.isArray(stored.posts)
      || !stored.posts.every(isValidPost)) {
      throw new Error("Os dados salvos do Feed não correspondem ao formato esperado.");
    }
    return stored.posts;
  }

  function persistPosts(posts) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      schemaVersion: 1,
      posts
    }));
  }

  function mergeExamplePosts(posts) {
    const existingIds = new Set(posts.map(post => post.id));
    const missingExamples = examplePosts.filter(post => !existingIds.has(post.id));
    return [...posts, ...missingExamples];
  }

  function commitPosts(posts, successMessage) {
    try {
      persistPosts(posts);
    } catch (error) {
      console.error("Não foi possível salvar as alterações do Feed neste navegador.", error);
      showToast("Não foi possível salvar. Verifique o espaço disponível no navegador e tente novamente.");
      return false;
    }
    state.posts = posts;
    renderPosts();
    window.dispatchEvent(new CustomEvent("inbar:feed-updated"));
    if (successMessage) showToast(successMessage);
    return true;
  }

  function categories() {
    const categoryLabels = [...UPDATE_TYPES, ...places.flatMap(place => place.types || [])];
    return [...new Map(categoryLabels.map(category => [normalizeText(category), category])).values()]
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
  }

  function populateCategoryFilters() {
    const availableCategories = categories().filter(category =>
      normalizeText(category) !== normalizeText("Experiências")
    );
    categoryFilters.innerHTML = [
      `<button type="button" class="feed-filter is-selected" data-feed-category="Todas" aria-pressed="true">Todos</button>`,
      ...["Experiências", ...availableCategories].map(category => `<button type="button" class="feed-filter" data-feed-category="${escapeHtml(category)}" aria-pressed="false">${escapeHtml(category)}</button>`)
    ].join("");

    categorySelect.innerHTML = [
      '<option value="Experiências">Experiências</option>',
      ...availableCategories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    ].join("");
  }

  function populatePlaceSelect() {
    placeSelect.innerHTML = [
      '<option value="">Sem local associado</option>',
      ...places.map(place => `<option value="${place.id}">${escapeHtml(place.name)} · ${escapeHtml(place.distance)}</option>`)
    ].join("");
  }

  function selectedFilterPosts() {
    const query = normalizeText(document.getElementById("searchInput").value.trim());
    return state.posts.filter(post => {
      const place = post.placeId === null ? null : placeById(post.placeId);
      const selectedCategory = normalizeText(state.category);
      const categoryMatches = state.category === "Todas" || normalizeText(post.category) === selectedCategory;
      const updateTypeMatches = state.category === "Todas"
        || normalizeText(post.updateType || "Experiências") === selectedCategory
        || (place?.types || []).some(type => normalizeText(type) === selectedCategory);
      const kindMatches = state.kind === "Todos"
        || (state.kind === "Pessoas" && post.type === "user")
        || (state.kind === "Estabelecimentos" && post.type === "establishment");
      const placeMatches = state.placeId === null || post.placeId === state.placeId;
      const currentUser = post.authorId === user.id ? window.InbarAuth.getCurrentUser() : null;
      const authorName = currentUser?.displayName || currentUser?.nickname || post.authorName;
      const searchable = normalizeText(`${authorName} ${post.authorName} ${post.content} ${post.category} ${post.updateType || ""} ${place?.name || ""} ${place?.distance || ""}`);
      return (categoryMatches || updateTypeMatches) && kindMatches && placeMatches && (!query || searchable.includes(query));
    });
  }

  function formatPostDate(post) {
    if (post.isExample) return "Publicação de exemplo";
    const date = new Date(post.createdAt);
    return Number.isNaN(date.getTime()) ? "Data indisponível" : new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(date);
  }

  function renderCommentsCount(post) {
    return post.comments.length === 1 ? "1 comentário" : `${post.comments.length} comentários`;
  }

  function postCard(post) {
    const place = post.placeId === null ? null : placeById(post.placeId);
    const liked = post.likes.includes(user.id);
    const ownsPost = post.authorId === user.id && !post.isExample;
    const currentUser = window.InbarAuth.getCurrentUser();
    const likeCount = post.baseLikes + post.likes.length;
    const placeMarkup = place
      ? `<button type="button" class="feed-place-link" data-feed-action="open-place" data-place-id="${place.id}">
          <svg class="icon" aria-hidden="true"><use href="assets/icons/inbar.svg#map-pin"></use></svg>
          ${escapeHtml(place.name)} <span>· ${escapeHtml(place.distance)}</span>
        </button>`
      : "";
    const mediaMarkup = post.image
      ? `<div class="feed-post-media"><img src="${escapeHtml(post.image)}" alt="${escapeHtml(place ? `Experiência em ${place.name}` : "Imagem da publicação")}" loading="lazy"></div>`
      : "";
    const avatarMarkup = ownsPost && currentUser?.profileAppearance?.avatar
      ? `<img class="feed-avatar" src="${escapeHtml(currentUser.profileAppearance.avatar)}" alt="" loading="lazy">`
      : post.isExample && post.avatar
      ? `<img class="feed-avatar" src="${escapeHtml(post.avatar)}" alt="" loading="lazy">`
      : `<span class="feed-avatar feed-avatar-placeholder" aria-hidden="true"><svg class="icon"><use href="assets/icons/inbar.svg#${ownsPost ? currentUser?.profileAppearance?.avatarPreset || "user-round" : "user-round"}"></use></svg></span>`;
    const authorName = ownsPost ? currentUser.displayName || currentUser.nickname || post.authorName : post.authorName;
    const menuMarkup = ownsPost
      ? `<details class="feed-post-menu">
          <summary aria-label="Opções da publicação"><svg class="icon" aria-hidden="true"><use href="assets/icons/inbar.svg#ellipsis"></use></svg></summary>
          <div class="feed-post-menu-popover"><button type="button" data-feed-action="delete" data-post-id="${escapeHtml(post.id)}">Excluir publicação</button></div>
        </details>`
      : "";

    return `<article class="feed-post" data-post-id="${escapeHtml(post.id)}">
      <header class="feed-post-header">
        ${avatarMarkup}
        <div class="feed-author-details">
          <strong>${escapeHtml(authorName)}</strong>
          <span>${escapeHtml(formatPostDate(post))}</span>
        </div>
        <div class="feed-post-badges">
          <span class="feed-category">${escapeHtml(post.updateType || "Experiências")}</span>
          ${place && place.category !== post.category ? `<span class="feed-category">${escapeHtml(place.category)}</span>` : ""}
          ${post.isExample ? '<span class="feed-example-badge">Exemplo</span>' : ""}
        </div>
        ${menuMarkup}
      </header>
      <p class="feed-post-content">${escapeHtml(post.content)}</p>
      ${mediaMarkup}
      ${placeMarkup}
      <footer class="feed-post-actions">
        <button type="button" class="feed-action-button${liked ? " is-liked" : ""}" data-feed-action="like" data-post-id="${escapeHtml(post.id)}" aria-pressed="${liked}">
          <svg class="icon" aria-hidden="true"><use href="assets/icons/inbar.svg#heart"></use></svg>
          <span>${likeCount}</span>
        </button>
        <button type="button" class="feed-action-button" data-feed-action="comments" data-post-id="${escapeHtml(post.id)}">
          <svg class="icon" aria-hidden="true"><use href="assets/icons/inbar.svg#message-circle"></use></svg>
          <span>${escapeHtml(renderCommentsCount(post))}</span>
        </button>
        <button type="button" class="feed-action-button" data-feed-action="share" data-post-id="${escapeHtml(post.id)}">
          <svg class="icon" aria-hidden="true"><use href="assets/icons/inbar.svg#share-2"></use></svg>
          <span>Compartilhar</span>
        </button>
      </footer>
    </article>`;
  }

  function renderPlaces() {
    const rankedPlaces = window.InbarRecommendations
      ? window.InbarRecommendations.rankPlaces(places)
      : places.map(entity => ({ entity, score: 0 }));
    const vibe = window.InbarVibe && window.InbarVibe.getCurrent();
    const featuredPlaces = rankedPlaces
      .filter(item => !vibe || item.score > 0)
      .slice(0, 5)
      .map(item => item.entity);
    if (!featuredPlaces.length) {
      document.getElementById("feedPlaceList").innerHTML =
        '<p class="feed-sidebar-note">Ainda não há lugares cadastrados que combinem com a vibe escolhida.</p>';
      return;
    }
    document.getElementById("feedPlaceList").innerHTML = featuredPlaces.map(place => `
      <article class="feed-place-item">
        <span class="feed-place-icon" aria-hidden="true"><svg class="icon"><use href="assets/icons/inbar.svg#${escapeHtml(place.icon || "map-pin")}"></use></svg></span>
        <div><strong>${escapeHtml(place.name)}</strong><span>${escapeHtml(place.category)} · ${escapeHtml(place.distance)}</span></div>
        <button type="button" data-feed-action="open-place-feed" data-place-id="${place.id}" aria-label="Abrir o Feed de ${escapeHtml(place.name)}">Feed</button>
      </article>`).join("");
  }

  function renderLocalFeedHeader() {
    const header = document.getElementById("localFeedHeader");
    const place = state.placeId === null ? null : placeById(state.placeId);
    const localHeading = document.getElementById("localFeedName");
    document.getElementById("generalFeedHeading").classList.toggle("hidden", Boolean(place));
    header.classList.toggle("hidden", !place);
    if (!place) return;

    localHeading.textContent = place.name;
    document.getElementById("localFeedCategory").textContent = place.types.join(" · ");
    document.getElementById("localFeedAddress").textContent = place.distance;
    document.getElementById("localFeedDescription").textContent = place.desc || "Informações adicionais ainda não cadastradas.";
    const source = document.getElementById("localFeedSource");
    source.hidden = !place.sourceUrl;
    if (place.sourceUrl) source.href = place.sourceUrl;
    const cover = document.getElementById("localFeedCover");
    cover.src = window.InbarPlaceMedia.getCoverImage(place);
    cover.alt = window.InbarPlaceMedia.isIllustrative(place)
      ? `Imagem ilustrativa de ${place.name}; foto não disponível`
      : `Capa de ${place.name}`;
    cover.addEventListener("error", () => window.InbarPlaceMedia.applyFallback(cover, place), { once: true });
  }

  function renderPosts() {
    renderLocalFeedHeader();
    const filteredPosts = selectedFilterPosts();
    postsContainer.innerHTML = filteredPosts.map(postCard).join("");
    emptyState.hidden = filteredPosts.length > 0;
    emptyState.textContent = state.placeId === null
      ? "Nenhuma publicação encontrada. Tente outro filtro ou busca."
      : "Este local ainda não tem publicações no Feed. Não há atualizações demonstrativas ou informações de eventos/ofertas sem confirmação.";
  }

  function renderComments(post) {
    const currentUser = window.InbarAuth.getCurrentUser();
    document.getElementById("feedCommentsList").innerHTML = post.comments.length
      ? post.comments.map(comment => `<article class="feed-comment">
          ${comment.authorId === currentUser.id && currentUser.profileAppearance?.avatar
            ? `<img class="feed-avatar" src="${escapeHtml(currentUser.profileAppearance.avatar)}" alt="" loading="lazy">`
            : `<span class="feed-avatar feed-avatar-placeholder" aria-hidden="true"><svg class="icon"><use href="assets/icons/inbar.svg#${comment.authorId === currentUser.id ? currentUser.profileAppearance?.avatarPreset || "user-round" : "user-round"}"></use></svg></span>`}
          <div><strong>${escapeHtml(comment.authorId === currentUser.id ? currentUser.displayName || currentUser.nickname || comment.authorName : comment.authorName)}</strong><p>${escapeHtml(comment.content)}</p></div>
        </article>`).join("")
      : '<p class="feed-comments-empty">Ainda não há comentários. Comece a conversa.</p>';
  }

  function openComments(postId) {
    const post = state.posts.find(item => item.id === postId);
    if (!post) return;
    state.activePostId = postId;
    document.getElementById("commentsTitle").textContent = `Comentários · ${post.authorName}`;
    renderComments(post);
    commentsDialog.showModal();
    document.getElementById("commentContent").focus();
  }

  function closeDialog(dialog) {
    if (dialog.open) dialog.close();
  }

  function openPublishDialog() {
    placeSelect.value = state.placeId === null ? "" : String(state.placeId);
    updatePostPlaceCategory(true);
    publishDialog.showModal();
    document.getElementById("postContent").focus();
  }

  function updatePostPlaceCategory(preferPlaceCategory = false) {
    const place = placeSelect.value ? placeById(Number(placeSelect.value)) : null;
    const choices = ["Experiências", ...(place?.types || categories())];
    const currentCategory = categorySelect.value;
    categorySelect.innerHTML = [...new Set(choices)].map(category =>
      `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`
    ).join("");
    categorySelect.value = preferPlaceCategory || !choices.includes(currentCategory)
      ? (place?.types[0] || "Experiências")
      : currentCategory;
  }

  function processImage(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        reject(new Error("Selecione um arquivo de imagem."));
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        reject(new Error("A imagem deve ter no máximo 5 MB."));
        return;
      }

      const reader = new FileReader();
      reader.addEventListener("error", () => reject(new Error("Não foi possível ler a imagem selecionada.")), { once: true });
      reader.addEventListener("load", () => {
        const image = new Image();
        image.addEventListener("error", () => reject(new Error("O arquivo selecionado não contém uma imagem válida.")), { once: true });
        image.addEventListener("load", () => {
          const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          const context = canvas.getContext("2d");
          if (!context) {
            reject(new Error("Este navegador não conseguiu processar a imagem."));
            return;
          }
          context.fillStyle = "#fff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          let dataUrl = canvas.toDataURL("image/jpeg", 0.78);
          for (const quality of [0.64, 0.5, 0.38]) {
            if (dataUrl.length <= MAX_STORED_IMAGE_LENGTH) break;
            dataUrl = canvas.toDataURL("image/jpeg", quality);
          }
          if (dataUrl.length > MAX_STORED_IMAGE_LENGTH) {
            reject(new Error("A imagem não pôde ser reduzida o suficiente para salvar neste navegador."));
            return;
          }
          resolve(dataUrl);
        }, { once: true });
        image.src = String(reader.result);
      }, { once: true });
      reader.readAsDataURL(file);
    });
  }

  async function sharePost(postId) {
    const post = state.posts.find(item => item.id === postId);
    if (!post) return;
    const shareUrl = `${window.location.href.split("#")[0]}#feed`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Experiência de ${post.authorName}`, text: post.content, url: shareUrl });
        showToast("Compartilhamento concluído.");
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${post.content} ${shareUrl}`);
        showToast("Texto e link copiados.");
      } else {
        showToast("O compartilhamento não está disponível neste navegador.");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Não foi possível compartilhar a publicação.", error);
        showToast("Não foi possível compartilhar agora.");
      }
    }
  }

  function handleFeedClick(event) {
    const categoryButton = event.target.closest("[data-feed-category]");
    if (categoryButton) {
      state.category = categoryButton.dataset.feedCategory;
      categoryFilters.querySelectorAll("[data-feed-category]").forEach(button => {
        const selected = button === categoryButton;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      renderPosts();
      return;
    }

    const kindButton = event.target.closest("[data-feed-kind]");
    if (kindButton) {
      state.kind = kindButton.dataset.feedKind;
      view.querySelectorAll("[data-feed-kind]").forEach(button => {
        const selected = button === kindButton;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      renderPosts();
      return;
    }

    const action = event.target.closest("[data-feed-action]");
    if (!action) return;
    const postId = action.dataset.postId;
    const placeId = Number(action.dataset.placeId);
    if (action.dataset.feedAction === "publish") openPublishDialog();
    if (action.dataset.feedAction === "close-publish") closeDialog(publishDialog);
    if (action.dataset.feedAction === "close-comments") closeDialog(commentsDialog);
    if (action.dataset.feedAction === "explore") window.InbarNavigation.navigateTo("Explorar");
    if (action.dataset.feedAction === "open-place") window.InbarNavigation.openPlace(placeId);
    if (action.dataset.feedAction === "open-place-feed") window.InbarNavigation.openPlaceFeed(placeId);
    if (action.dataset.feedAction === "back-to-general") window.InbarNavigation.navigateTo("Feed");
    if (action.dataset.feedAction === "view-place-details" && state.placeId !== null) {
      window.InbarNavigation.openPlace(state.placeId);
    }
    if (action.dataset.feedAction === "comments") openComments(postId);
    if (action.dataset.feedAction === "share") sharePost(postId);
    if (action.dataset.feedAction === "delete") {
      const post = state.posts.find(item => item.id === postId);
      if (!post || post.authorId !== user.id || post.isExample) {
        showToast("Você só pode excluir suas próprias publicações.");
        return;
      }
      state.pendingDeletePostId = postId;
      deletePostDialog.showModal();
    }
    if (action.dataset.feedAction === "confirm-delete") {
      const post = state.posts.find(item => item.id === state.pendingDeletePostId);
      if (!post || post.authorId !== window.InbarAuth.getCurrentUser()?.id || post.isExample) {
        showToast("Você só pode excluir suas próprias publicações.");
        closeDialog(deletePostDialog);
        state.pendingDeletePostId = null;
        return;
      }
      if (commitPosts(state.posts.filter(item => item.id !== post.id), "Publicação excluída.")) {
        closeDialog(deletePostDialog);
        state.pendingDeletePostId = null;
      }
    }
    if (action.dataset.feedAction === "like") {
      const post = state.posts.find(item => item.id === postId);
      if (!post) return;
      const liked = post.likes.includes(user.id);
      const updatedPost = {
        ...post,
        likes: liked ? post.likes.filter(id => id !== user.id) : [...post.likes, user.id]
      };
      commitPosts(state.posts.map(item => item.id === postId ? updatedPost : item));
    }
  }

  function setupEvents() {
    view.addEventListener("click", handleFeedClick);
    view.addEventListener("error", event => {
      if (event.target instanceof HTMLImageElement && event.target.closest(".feed-post-media")) {
        event.target.closest(".feed-post-media").classList.add("is-unavailable");
      }
    }, true);
    document.getElementById("searchInput").addEventListener("input", () => {
      if (!view.classList.contains("hidden")) renderPosts();
    });
    document.getElementById("searchForm").addEventListener("submit", event => {
      if (!view.classList.contains("hidden")) event.preventDefault();
    });
    placeSelect.addEventListener("change", () => updatePostPlaceCategory(true));
    imageInput.addEventListener("change", async () => {
      const file = imageInput.files?.[0];
      if (!file) return;
      try {
        state.pendingImage = await processImage(file);
        imagePreview.src = state.pendingImage;
        imagePreview.hidden = false;
      } catch (error) {
        console.error("Não foi possível preparar a imagem da publicação.", error);
        state.pendingImage = "";
        imageInput.value = "";
        imagePreview.removeAttribute("src");
        imagePreview.hidden = true;
        showToast(error.message);
      }
    });
    publishForm.addEventListener("submit", event => {
      event.preventDefault();
      if (!publishForm.reportValidity()) return;
      const content = document.getElementById("postContent").value.trim();
      const placeId = placeSelect.value ? Number(placeSelect.value) : null;
      if (!content || (placeId !== null && !placeById(placeId))) {
        showToast("Confira o texto e o estabelecimento selecionado.");
        return;
      }
      const newPost = {
        id: `post-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`}`,
        authorId: user.id,
        authorName: window.InbarAuth.getCurrentUser().displayName || user.nickname || "Usuário",
        avatar: "",
        type: "user",
        content,
        image: state.pendingImage,
        placeId,
        category: categorySelect.value,
        updateType: updateTypeSelect.value,
        createdAt: new Date().toISOString(),
        baseLikes: 0,
        likes: [],
        comments: [],
        isExample: false
      };
      const currentFeedPlaceId = state.placeId;
      if (!commitPosts([newPost, ...state.posts], "Publicação salva neste navegador (modo protótipo).")) return;
      state.category = "Todas";
      state.kind = "Todos";
      state.placeId = currentFeedPlaceId;
      document.getElementById("searchInput").value = "";
      publishForm.reset();
      placeSelect.value = currentFeedPlaceId === null ? "" : String(currentFeedPlaceId);
      state.pendingImage = "";
      imagePreview.removeAttribute("src");
      imagePreview.hidden = true;
      updatePostPlaceCategory();
      categoryFilters.querySelector('[data-feed-category="Todas"]').click();
      view.querySelector('[data-feed-kind="Todos"]').click();
      renderPosts();
      closeDialog(publishDialog);
      window.dispatchEvent(new CustomEvent("inbar:feed-post-created", { detail: { postId: newPost.id } }));
    });
    commentForm.addEventListener("submit", event => {
      event.preventDefault();
      const input = document.getElementById("commentContent");
      const content = input.value.trim();
      const post = state.posts.find(item => item.id === state.activePostId);
      if (!post || !content) return;
      const comment = {
        id: `comment-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`}`,
        authorId: user.id,
        authorName: window.InbarAuth.getCurrentUser().displayName || user.nickname || "Usuário",
        content,
        createdAt: new Date().toISOString()
      };
      const updatedPost = { ...post, comments: [...post.comments, comment] };
      if (commitPosts(state.posts.map(item => item.id === post.id ? updatedPost : item), "Comentário salvo neste navegador.")) {
        input.value = "";
        renderComments(updatedPost);
      }
    });
    [publishDialog, commentsDialog, deletePostDialog].forEach(dialog => dialog.addEventListener("click", event => {
      if (event.target === dialog) closeDialog(dialog);
    }));
    window.addEventListener("storage", event => {
      if (event.key !== STORAGE_KEY) return;
      try {
        state.posts = mergeExamplePosts(readStoredPosts());
        renderPosts();
        window.dispatchEvent(new CustomEvent("inbar:feed-updated"));
      } catch (error) {
        console.error("Não foi possível atualizar o Feed após uma alteração em outra aba.", error);
        showToast("Os dados do Feed em outra aba estão inválidos. Recarregue para verificar.");
      }
    });
    window.addEventListener("inbar:vibe-updated", renderPlaces);
    window.addEventListener("inbar:preferences-updated", renderPlaces);
    window.addEventListener("inbar:profile-updated", () => {
      renderPosts();
      if (commentsDialog.open) {
        const post = state.posts.find(item => item.id === state.activePostId);
        if (post) {
          document.getElementById("commentsTitle").textContent = `Comentários · ${window.InbarAuth.getCurrentUser().displayName || post.authorName}`;
          renderComments(post);
        }
      }
    });
  }

  const examplePosts = createDemoPosts();
  try {
    state.posts = mergeExamplePosts(readStoredPosts());
  } catch (error) {
    console.error("Não foi possível carregar as publicações salvas do Feed.", error);
    document.getElementById("feedEmpty").textContent = "Não foi possível carregar o Feed deste navegador. Confira o armazenamento local e recarregue.";
    document.getElementById("feedEmpty").hidden = false;
    return;
  }

  populateCategoryFilters();
  populatePlaceSelect();
  populateUpdateTypeSelect();
  updatePostPlaceCategory();
  renderPlaces();
  renderPosts();
  setupEvents();
  window.InbarFeed = {
    filterByPlace(placeId) {
      const place = placeById(placeId);
      if (!place) return false;
      state.placeId = place.id;
      state.category = "Todas";
      state.kind = "Todos";
      categoryFilters.querySelector('[data-feed-category="Todas"]').click();
      view.querySelector('[data-feed-kind="Todos"]').click();
      renderLocalFeedHeader();
      if (window.InbarRewards) window.InbarRewards.trackLocalFeedViewed(place.id);
      return true;
    },
    showGeneralFeed() {
      state.placeId = null;
      state.category = "Todas";
      state.kind = "Todos";
      renderLocalFeedHeader();
      categoryFilters.querySelector('[data-feed-category="Todas"]').click();
      view.querySelector('[data-feed-kind="Todos"]').click();
    },
    getPostsByPlace(placeId) {
      return state.posts.filter(post => post.placeId === placeId);
    },
    getPostsByAuthor(authorId) {
      return state.posts.filter(post => post.authorId === authorId && !post.isExample);
    },
    getOwnPosts() {
      return this.getPostsByAuthor(window.InbarAuth.getCurrentUser()?.id || "");
    }
  };
})();
