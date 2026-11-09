(() => {
  const view = document.getElementById("profileView");
  const editDialog = document.getElementById("profileEditDialog");
  const editForm = document.getElementById("profileEditForm");
  const editStatus = document.getElementById("profileEditStatus");
  const avatarPreview = document.getElementById("profileEditAvatarPreview");
  const photoInput = document.getElementById("editProfilePhoto");
  const postsContainer = document.getElementById("profilePosts");
  let pendingAvatar = "";
  let activeTab = "overview";

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function displayDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("pt-BR", {
      month: "short",
      year: "numeric"
    }).format(date);
  }

  function displayPostDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Data indisponível" : new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(date);
  }

  function createPresetIcon(preset) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    svg.setAttribute("class", "icon");
    svg.setAttribute("aria-hidden", "true");
    use.setAttribute("href", `assets/icons.svg#${preset}`);
    svg.append(use);
    return svg;
  }

  function setAvatar(element, appearance) {
    const image = appearance.avatar
      ? Object.assign(document.createElement("img"), { src: appearance.avatar, alt: "" })
      : null;
    element.replaceChildren(image || createPresetIcon(appearance.avatarPreset || "user-round"));
    element.style.setProperty("--profile-accent", appearance.accent);
    element.style.setProperty("--profile-secondary", appearance.secondary);
    element.classList.toggle("is-frame-soft", appearance.frame === "soft");
    element.classList.toggle("is-frame-double", appearance.frame === "double");
  }

  function profilePosts() {
    return window.InbarFeed ? window.InbarFeed.getOwnPosts() : [];
  }

  function renderPosts(posts) {
    document.getElementById("profilePostCount").textContent = String(posts.length);
    document.getElementById("profilePostsCountLabel").textContent =
      `${posts.length} ${posts.length === 1 ? "publicação" : "publicações"}`;
    document.getElementById("profileActivitySummary").textContent = posts.length
      ? `Você compartilhou ${posts.length} ${posts.length === 1 ? "experiência" : "experiências"} com a comunidade.`
      : "Você ainda não publicou experiências.";
    document.getElementById("profilePostsEmpty").hidden = posts.length > 0;
    postsContainer.innerHTML = posts.map(post => {
      const place = window.inbarPlaces.find(item => item.id === post.placeId);
      const date = displayPostDate(post.createdAt);
      return `<article class="profile-post-item">
        <header><span>${escapeHtml(post.category)}</span><time>${escapeHtml(date)}</time></header>
        <p>${escapeHtml(post.content)}</p>
        ${post.image ? `<img src="${escapeHtml(post.image)}" alt="Imagem da sua publicação" loading="lazy">` : ""}
        ${place ? `<p class="profile-post-location">${escapeHtml(place.name)} · ${escapeHtml(place.distance)}</p>` : ""}
      </article>`;
    }).join("");
  }

  function renderInterests() {
    const preferences = window.InbarInterests.loadPreferences();
    const groups = document.getElementById("profileInterestGroups");
    const overview = document.getElementById("profileOverviewInterests");
    const selectedCategories = window.InbarInterests.categories.filter(category =>
      preferences.categoryIds.includes(category.id)
    );
    const tags = selectedCategories.flatMap(category => {
      const selectedInterests = category.interests
        .filter(([id]) => preferences.interestIds.includes(id))
        .map(([, label]) => label);
      return selectedInterests.length ? selectedInterests : [category.label];
    });

    document.getElementById("profileInterestCount").textContent = String(tags.length);
    document.getElementById("profileNoInterests").hidden = tags.length > 0;
    document.getElementById("profileInterestsEmpty").hidden = tags.length > 0;
    overview.innerHTML = tags.slice(0, 8).map(tag =>
      `<span class="profile-interest-chip">${escapeHtml(tag)}</span>`
    ).join("");

    groups.innerHTML = selectedCategories.map(category => {
      const selected = category.interests
        .filter(([id]) => preferences.interestIds.includes(id))
        .map(([, label]) => label);
      const values = selected.length ? selected : [category.label];
      return `<article class="profile-interest-group">
        <h3>${escapeHtml(category.label)}</h3>
        <div class="profile-interest-tags">${values.map(value =>
          `<span class="profile-interest-chip">${escapeHtml(value)}</span>`
        ).join("")}</div>
      </article>`;
    }).join("");
    if (!selectedCategories.length) {
      groups.replaceChildren();
    }
  }

  function render() {
    const user = window.InbarAuth.getCurrentUser();
    if (!user) {
      window.location.replace("login.html");
      return;
    }
    const nickname = user.displayName || user.nickname || user.username || user.fullName || "Usuário";
    const appearance = window.InbarAuth.getProfileAppearance();
    document.getElementById("profileNickname").textContent = `@${nickname}`;
    document.getElementById("profileFullNameView").textContent = user.fullName || "";
    document.getElementById("profileFullNameView").hidden = !user.fullName;
    document.getElementById("profileBio").textContent = user.bio || "Adicione uma biografia para contar um pouco sobre você.";
    document.getElementById("profilePrivateEmail").textContent = user.email;
    document.getElementById("profileJoinedDate").textContent = displayDate(user.createdAt || user.ageConfirmedAt);
    document.getElementById("profileTriggerName").textContent = nickname;
    document.getElementById("profileFullName").textContent = nickname;
    document.getElementById("profileButton").setAttribute("aria-label", `Abrir menu do perfil de ${nickname}`);
    document.getElementById("profileAppearancePreviewName").textContent = nickname;
    const email = document.getElementById("profileEmail");
    email.textContent = user.email;
    email.hidden = !user.email;
    setAvatar(document.getElementById("profilePageAvatar"), appearance);
    if (window.InbarProfileAppearance) window.InbarProfileAppearance.applySavedAppearance(appearance);
    if (window.InbarRewards) {
      document.getElementById("profilePointsBalance").textContent =
        new Intl.NumberFormat("pt-BR").format(window.InbarRewards.getBalance());
      document.getElementById("profileCompletedMissions").textContent =
        String(Object.keys(window.InbarRewards.getState().completedMissions).length);
    }
    renderPosts(profilePosts());
    renderInterests();
    document.getElementById("profileHero").style.setProperty("--profile-accent", appearance.accent);
    document.getElementById("profileHero").style.setProperty("--profile-secondary", appearance.secondary);
    document.querySelectorAll(".profile-panel").forEach(panel => {
      panel.style.setProperty("--profile-accent", appearance.accent);
      panel.style.setProperty("--profile-secondary", appearance.secondary);
    });
  }

  function selectTab(tab) {
    activeTab = tab;
    document.querySelectorAll("[data-profile-tab]").forEach(button => {
      const selected = button.dataset.profileTab === tab;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    document.querySelectorAll("[data-profile-panel]").forEach(panel => {
      panel.hidden = panel.dataset.profilePanel !== tab;
    });
    if (tab === "posts") renderPosts(profilePosts());
    if (tab === "coupons" && window.InbarRewards) window.InbarRewards.renderCoupons();
  }

  function previewEditAvatar() {
    const appearance = window.InbarAuth.getProfileAppearance();
    setAvatar(avatarPreview, {
      ...appearance,
      avatar: pendingAvatar,
      avatarPreset: document.getElementById("editAvatarPreset").value
    });
  }

  function openEditDialog() {
    const user = window.InbarAuth.getCurrentUser();
    if (!user) return;
    document.getElementById("editNickname").value = user.nickname || user.username || user.fullName || "";
    document.getElementById("editFullName").value = user.fullName || "";
    document.getElementById("editBio").value = user.bio || "";
    const appearance = window.InbarAuth.getProfileAppearance();
    document.getElementById("editAvatarPreset").value = appearance.avatarPreset || "user-round";
    pendingAvatar = appearance.avatar || "";
    photoInput.value = "";
    editStatus.textContent = "";
    previewEditAvatar();
    editDialog.showModal();
  }

  async function readAvatar(file) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      throw new Error("Escolha uma foto JPG, PNG ou WebP.");
    }
    if (file.size > 5 * 1024 * 1024) throw new Error("A foto precisa ter no máximo 5 MB.");
    return window.InbarProfileAppearance.loadCompressedAvatar(file);
  }

  view.addEventListener("click", event => {
    const tabButton = event.target.closest("[data-profile-tab]");
    if (tabButton) selectTab(tabButton.dataset.profileTab);
    const tabLink = event.target.closest("[data-profile-tab-link]");
    if (tabLink) selectTab(tabLink.dataset.profileTabLink);
  });
  document.querySelector(".profile-tabs").addEventListener("keydown", event => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const tabs = [...document.querySelectorAll("[data-profile-tab]")];
    let index = tabs.findIndex(tab => tab.dataset.profileTab === activeTab);
    if (event.key === "Home") index = 0;
    else if (event.key === "End") index = tabs.length - 1;
    else index = (index + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
    tabs[index].focus();
    selectTab(tabs[index].dataset.profileTab);
  });

  document.getElementById("editProfile").addEventListener("click", openEditDialog);
  document.getElementById("closeProfileEdit").addEventListener("click", () => editDialog.close());
  document.getElementById("cancelProfileEdit").addEventListener("click", () => editDialog.close());
  document.getElementById("editAvatarPreset").addEventListener("change", () => {
    pendingAvatar = "";
    photoInput.value = "";
    previewEditAvatar();
  });
  photoInput.addEventListener("change", async () => {
    const file = photoInput.files?.[0];
    if (!file) return;
    try {
      pendingAvatar = await readAvatar(file);
      previewEditAvatar();
      editStatus.textContent = "Prévia da foto atualizada.";
    } catch (error) {
      console.error("Não foi possível preparar a foto do perfil.", error);
      photoInput.value = "";
      editStatus.textContent = error.message || "Não foi possível carregar a foto.";
    }
  });
  document.getElementById("removeProfilePhoto").addEventListener("click", () => {
    pendingAvatar = "";
    photoInput.value = "";
    document.getElementById("editAvatarPreset").value = "user-round";
    previewEditAvatar();
    editStatus.textContent = "Avatar pronto selecionado.";
  });
  editForm.addEventListener("submit", event => {
    event.preventDefault();
    if (!editForm.reportValidity()) return;
    try {
      const updated = window.InbarAuth.updateCurrentProfile({
        nickname: document.getElementById("editNickname").value,
        fullName: document.getElementById("editFullName").value,
        bio: document.getElementById("editBio").value,
        avatarPreset: document.getElementById("editAvatarPreset").value,
        avatar: pendingAvatar
      });
      window.InbarProfileAppearance.applySavedAppearance(updated.profileAppearance);
      render();
      window.dispatchEvent(new CustomEvent("inbar:profile-updated"));
      editDialog.close();
      document.getElementById("profileEditStatus").textContent = "";
    } catch (error) {
      console.error("Não foi possível salvar as alterações do perfil.", error);
      editStatus.textContent = error.message || "Não foi possível salvar o perfil.";
    }
  });

  document.getElementById("openFeedFromProfile").addEventListener("click", () => window.InbarNavigation.navigateTo("Feed"));
  document.getElementById("editProfileInterests").addEventListener("click", () => {
    window.location.assign("./onboarding.html?mode=edit");
  });
  document.getElementById("openMissionsFromProfile").addEventListener("click", () => window.InbarNavigation.navigateTo("Missões"));
  document.getElementById("openProfileAppearance").addEventListener("click", () => window.InbarProfileAppearance.openEditor());
  window.addEventListener("inbar:feed-updated", () => {
    if (view.classList.contains("hidden")) return;
    renderPosts(profilePosts());
  });
  window.addEventListener("inbar:profile-updated", render);
  window.addEventListener("inbar:rewards-updated", () => {
    if (window.InbarRewards) {
      document.getElementById("profilePointsBalance").textContent =
        new Intl.NumberFormat("pt-BR").format(window.InbarRewards.getBalance());
      document.getElementById("profileCompletedMissions").textContent =
        String(Object.keys(window.InbarRewards.getState().completedMissions).length);
      if (activeTab === "coupons") window.InbarRewards.renderCoupons();
    }
  });
  window.addEventListener("inbar:preferences-updated", () => {
    if (!view.classList.contains("hidden")) renderInterests();
  });
  window.addEventListener("storage", event => {
    if (event.key === "inbar:accounts:v1") window.dispatchEvent(new CustomEvent("inbar:profile-updated"));
    if (event.key?.startsWith("inbar:preferences:v1:")) {
      window.dispatchEvent(new CustomEvent("inbar:preferences-updated"));
    }
  });

  window.InbarProfile = { refresh: render, selectTab };
  selectTab("overview");
  render();
})();
