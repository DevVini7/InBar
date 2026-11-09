(() => {
  const toast = document.getElementById("missionsToast");
  const searchInput = document.getElementById("searchInput");
  const missionCards = [...document.querySelectorAll(".mission-card")];
  const categoryFilters = [...document.querySelectorAll(".mission-filter")];
  const selectedCategory = { value: "Todas" };
  const modal = document.getElementById("missionModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalDescription = document.getElementById("modalDescription");
  const modalIcon = document.getElementById("modalIcon");
  const modalCategory = document.getElementById("modalCategory");
  const modalAction = document.getElementById("modalAction");
  let toastTimer;
  let activeCard = null;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
  }

  function normalizeText(value) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  }

  function filterMissions() {
    const term = normalizeText(searchInput.value.trim());
    let visibleCount = 0;

    missionCards.forEach(card => {
      const categories = card.dataset.categories.split(" ");
      const matchesCategory = selectedCategory.value === "Todas" || categories.includes(selectedCategory.value);
      const searchable = normalizeText(`${card.dataset.search} ${card.innerText}`);
      const matchesSearch = !term || searchable.includes(term);
      card.hidden = !matchesCategory || !matchesSearch;
      if (!card.hidden) visibleCount += 1;
    });

    document.getElementById("missionsEmpty").hidden = visibleCount > 0;
    document.getElementById("missionCount").textContent =
      `${visibleCount} ${visibleCount === 1 ? "prévia" : "prévias"}`;
    document.getElementById("missionsList").setAttribute(
      "aria-label",
      selectedCategory.value === "Todas"
        ? "Desafios de demonstração"
        : `Desafios de demonstração: ${selectedCategory.value}`
    );
    document.getElementById("missionsSectionTitle").textContent =
      selectedCategory.value === "Todas" ? "Desafios em prévia" : `Desafios · ${selectedCategory.value}`;
  }

  function closeModal() {
    if (!modal.classList.contains("open")) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    if (activeCard) activeCard.focus();
    activeCard = null;
  }

  function openMission(card, button) {
    activeCard = button;
    modalTitle.textContent = card.querySelector("h3").textContent;
    modalDescription.textContent = card.querySelector(".mission-description").textContent;
    modalCategory.textContent = card.querySelector(".mission-category").textContent;
    modalIcon.replaceChildren(card.querySelector(".mission-icon .icon").cloneNode(true));
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    modalAction.focus();
  }

  categoryFilters.forEach(button => {
    button.addEventListener("click", () => {
      selectedCategory.value = button.dataset.category;
      categoryFilters.forEach(filter => {
        const selected = filter === button;
        filter.classList.toggle("selected", selected);
        filter.setAttribute("aria-pressed", String(selected));
      });
      filterMissions();
      showToast(selectedCategory.value === "Todas"
        ? "Exibindo todas as prévias."
        : `Exibindo prévias de ${selectedCategory.value}.`);
    });
  });

  missionCards.forEach(card => {
    const button = card.querySelector(".mission-open");
    button.addEventListener("click", () => openMission(card, button));
  });

  searchInput.addEventListener("input", filterMissions);
  document.getElementById("modalClose").addEventListener("click", closeModal);
  modalAction.addEventListener("click", closeModal);
  modal.addEventListener("click", event => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeModal();
  });

  const currentUser = window.InbarAuth && window.InbarAuth.getCurrentUser();
  const displayName = currentUser
    ? currentUser.displayName || currentUser.nickname || currentUser.username || currentUser.fullName || "Usuário"
    : "Usuário";
  document.getElementById("missionsUserName").textContent = displayName;

  filterMissions();
})();
