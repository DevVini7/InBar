(() => {
  const user = window.InbarAuth.getCurrentUser();
  const toast = document.getElementById("missionsToast");
  if (!user || !toast) return;

  const STORAGE_PREFIX = "inbar:rewards:v1:";
  const STORAGE_KEY = `${STORAGE_PREFIX}${encodeURIComponent(user.id)}`;
  const missions = [
    {
      id: "explore-places",
      title: "Explorador de Brasília",
      description: "Abra os detalhes de 3 estabelecimentos diferentes no mapa ou em Explorar.",
      category: "Exploração",
      target: 3,
      reward: 150,
      metric: "places",
      icon: "map-pin",
      progressLabel: count => `${count} de 3 locais vistos`,
      note: "Conta quando você abre os detalhes no InBar; não confirma uma visita presencial."
    },
    {
      id: "follow-place-feeds",
      title: "Vida Noturna",
      description: "Confira o Feed de 3 locais diferentes.",
      category: "Feed local",
      target: 3,
      reward: 100,
      metric: "localFeeds",
      icon: "images",
      progressLabel: count => `${count} de 3 feeds consultados`,
      note: "Cada estabelecimento diferente conta uma vez."
    },
    {
      id: "first-post",
      title: "Compartilhe sua experiência",
      description: "Faça sua primeira publicação própria no Feed.",
      category: "Comunidade",
      target: 1,
      reward: 200,
      metric: "posts",
      icon: "message-circle",
      progressLabel: count => `${Math.min(count, 1)} de 1 publicação`,
      note: "Publicações demonstrativas de outros perfis não contam."
    },
    {
      id: "discover-categories",
      title: "Descobridor",
      description: "Abra detalhes de locais em 5 categorias diferentes.",
      category: "Exploração",
      target: 5,
      reward: 250,
      metric: "categories",
      icon: "compass",
      progressLabel: count => `${count} de 5 categorias`,
      note: "As categorias vêm dos tipos cadastrados no catálogo de locais."
    }
  ];
  const rewards = [
    {
      id: "demo-discount-10",
      name: "Cupom demonstrativo de 10% OFF",
      category: "Desconto",
      cost: 300,
      description: "Exemplo de benefício para mostrar o fluxo de resgate.",
      icon: "ticket-percent"
    },
    {
      id: "demo-drink-voucher",
      name: "Voucher demonstrativo de bebida",
      category: "Voucher",
      cost: 600,
      description: "Não representa bebida gratuita nem oferta de um estabelecimento real.",
      icon: "martini"
    },
    {
      id: "demo-special-benefit",
      name: "Benefício demonstrativo",
      category: "Experiências",
      cost: 450,
      description: "Cartão de exemplo, sem parceiro confirmado ou uso comercial.",
      icon: "sparkles"
    },
    {
      id: "demo-exclusive-experience",
      name: "Experiência exclusiva demonstrativa",
      category: "Experiências",
      cost: 1000,
      description: "Exemplo de recompensa; não dá acesso a evento ou local real.",
      icon: "star"
    }
  ];
  const rewardCategories = ["Todas", ...new Set(rewards.map(reward => reward.category))];
  const viewState = { missionFilter: "all", rewardFilter: "Todas", pendingRewardId: "" };
  let state;
  let toastTimer = 0;

  function emptyState() {
    return {
      schemaVersion: 1,
      exploredPlaceIds: [],
      localFeedPlaceIds: [],
      exploredCategoryIds: [],
      completedMissions: {},
      ledger: [],
      coupons: []
    };
  }

  function isStringArray(value) {
    return Array.isArray(value) && value.every(item => typeof item === "string");
  }

  function isValidState(value) {
    return value && value.schemaVersion === 1
      && isStringArray(value.exploredPlaceIds)
      && isStringArray(value.localFeedPlaceIds)
      && isStringArray(value.exploredCategoryIds)
      && value.completedMissions && typeof value.completedMissions === "object"
      && !Array.isArray(value.completedMissions)
      && Array.isArray(value.ledger)
      && value.ledger.every(entry => entry && typeof entry.id === "string"
        && typeof entry.label === "string" && Number.isInteger(entry.amount)
        && typeof entry.createdAt === "string")
      && Array.isArray(value.coupons)
      && value.coupons.every(coupon => coupon && typeof coupon.id === "string"
        && typeof coupon.rewardId === "string" && typeof coupon.code === "string"
        && typeof coupon.createdAt === "string" && typeof coupon.expiresAt === "string"
        && ["available", "used", "expired", "cancelled"].includes(coupon.status));
  }

  function readStoredState() {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error("Os dados salvos de pontos e cupons não são um JSON válido.", { cause: error });
    }
    if (!isValidState(parsed)) {
      throw new Error("Os dados salvos de pontos e cupons não correspondem ao formato esperado.");
    }
    return parsed;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function displayPoints(value) {
    return new Intl.NumberFormat("pt-BR").format(value);
  }

  function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "Data indisponível"
      : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2800);
  }

  function balanceOf(data = state) {
    return data.ledger.reduce((balance, entry) => balance + entry.amount, 0);
  }

  function earnedOf(data = state) {
    return data.ledger.reduce((sum, entry) => sum + Math.max(0, entry.amount), 0);
  }

  function spentOf(data = state) {
    return data.ledger.reduce((sum, entry) => sum + Math.max(0, -entry.amount), 0);
  }

  function progressFor(mission, data = state) {
    if (mission.metric === "places") return data.exploredPlaceIds.length;
    if (mission.metric === "localFeeds") return data.localFeedPlaceIds.length;
    if (mission.metric === "categories") return data.exploredCategoryIds.length;
    if (mission.metric === "posts") {
      return window.InbarFeed ? window.InbarFeed.getOwnPosts().length : 0;
    }
    return 0;
  }

  function completeEligibleMissions(data) {
    const completedNow = [];
    missions.forEach(mission => {
      if (progressFor(mission, data) < mission.target || data.completedMissions[mission.id]) return;
      const timestamp = new Date().toISOString();
      data.completedMissions[mission.id] = timestamp;
      const ledgerId = `mission:${mission.id}`;
      if (!data.ledger.some(entry => entry.id === ledgerId)) {
        data.ledger.push({
          id: ledgerId,
          label: `Missão concluída: ${mission.title}`,
          amount: mission.reward,
          createdAt: timestamp
        });
      }
      completedNow.push(mission);
    });
    return completedNow;
  }

  function persist(candidate, successMessage = "") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(candidate));
    } catch (error) {
      console.error("Não foi possível salvar pontos, missões ou cupons neste navegador.", error);
      showToast("Não foi possível salvar. Verifique o espaço disponível no navegador e tente novamente.");
      return false;
    }
    state = candidate;
    window.dispatchEvent(new CustomEvent("inbar:rewards-updated"));
    renderAll();
    if (successMessage) showToast(successMessage);
    return true;
  }

  function recordProgress(action, successMessage) {
    const candidate = clone(state);
    const added = action(candidate);
    if (!added) return;
    const completedNow = completeEligibleMissions(candidate);
    const completionMessage = completedNow.map(mission =>
      `${mission.title}: +${displayPoints(mission.reward)} pontos`
    ).join(" · ");
    persist(candidate, completionMessage || successMessage);
  }

  function totalOwnPosts() {
    return window.InbarFeed ? window.InbarFeed.getOwnPosts().length : 0;
  }

  function addUnique(values, item) {
    if (values.includes(item)) return false;
    values.push(item);
    return true;
  }

  function expireCoupons(candidate) {
    let changed = false;
    const now = Date.now();
    candidate.coupons.forEach(coupon => {
      if (coupon.status !== "available" || new Date(coupon.expiresAt).getTime() > now) return;
      coupon.status = "expired";
      changed = true;
    });
    return changed;
  }

  function loadAndNormalize() {
    state = readStoredState();
    if (expireCoupons(state)) persist(state);
    const candidate = clone(state);
    const completedNow = completeEligibleMissions(candidate);
    if (completedNow.length) {
      const summary = completedNow.map(mission =>
        `${mission.title}: +${displayPoints(mission.reward)} pontos`
      ).join(" · ");
      persist(candidate, summary);
    }
  }

  function renderPoints() {
    const balance = balanceOf();
    document.getElementById("pointsBalance").textContent = displayPoints(balance);
    document.getElementById("pointsEarned").textContent = displayPoints(earnedOf());
    document.getElementById("pointsSpent").textContent = displayPoints(spentOf());
    document.getElementById("profilePointsBalance").textContent = displayPoints(balance);
    document.getElementById("profileCompletedMissions").textContent =
      String(Object.keys(state.completedMissions).length);

    const nextReward = rewards.filter(reward => reward.cost > balance)
      .sort((a, b) => a.cost - b.cost)[0];
    const progress = nextReward ? Math.min(100, Math.floor(balance / nextReward.cost * 100)) : 100;
    document.getElementById("nextRewardLabel").textContent =
      nextReward ? `${nextReward.name} · ${displayPoints(nextReward.cost)} pts` : "Todas as recompensas estão ao alcance";
    document.getElementById("nextRewardProgressLabel").textContent =
      nextReward ? `Faltam ${displayPoints(nextReward.cost - balance)} pontos` : "Confira a loja demonstrativa";
    const progressElement = document.getElementById("nextRewardProgress");
    progressElement.value = progress;
    progressElement.setAttribute("aria-label", `${progress}% do caminho até a próxima recompensa`);
  }

  function currentMissionStatus(mission) {
    if (state.completedMissions[mission.id]) return "completed";
    return progressFor(mission) > 0 ? "in-progress" : "available";
  }

  function renderMissions() {
    const searchTerm = normalizeText(document.getElementById("searchInput").value.trim());
    const matching = missions.filter(mission => {
      const status = currentMissionStatus(mission);
      const statusMatches = viewState.missionFilter === "all" || status === viewState.missionFilter;
      const searchMatches = !searchTerm || normalizeText(`${mission.title} ${mission.description} ${mission.category}`).includes(searchTerm);
      return statusMatches && searchMatches;
    });
    document.getElementById("missionsList").innerHTML = matching.map(mission => {
      const count = progressFor(mission);
      const progress = Math.min(mission.target, count);
      const percent = Math.floor(progress / mission.target * 100);
      const status = currentMissionStatus(mission);
      const statusLabel = status === "completed" ? "Concluída"
        : status === "in-progress" ? "Em andamento" : "Disponível";
      return `<article class="loyalty-mission-card" data-mission-id="${mission.id}">
        <div class="mission-card-topline"><p class="mission-category">${escapeHtml(mission.category)}</p><span class="mission-status is-${status}">${statusLabel}</span></div>
        <h3>${escapeHtml(mission.title)}</h3>
        <p>${escapeHtml(mission.description)}</p>
        <div class="mission-progress">
          <div class="mission-progress-label"><span>${escapeHtml(mission.progressLabel(progress))}</span><span>${percent}%</span></div>
          <progress max="${mission.target}" value="${progress}" aria-label="${percent}% concluído">${progress}/${mission.target}</progress>
          <small>${escapeHtml(mission.note)}</small>
        </div>
        <div class="mission-reward"><span>Recompensa</span><strong>+${displayPoints(mission.reward)} pontos</strong></div>
      </article>`;
    }).join("");
    document.getElementById("missionsEmpty").hidden = matching.length > 0;
    document.getElementById("missionCount").textContent =
      `${matching.length} ${matching.length === 1 ? "missão" : "missões"}`;
  }

  function hasActiveCoupon(rewardId, data = state) {
    return data.coupons.some(coupon => coupon.rewardId === rewardId && coupon.status === "available");
  }

  function renderRewardFilters() {
    const container = document.getElementById("rewardFilters");
    container.innerHTML = rewardCategories.map(category => `
      <button type="button" data-reward-filter="${escapeHtml(category)}" aria-pressed="${category === viewState.rewardFilter}">
        ${escapeHtml(category)}
      </button>`).join("");
  }

  function renderStore() {
    const balance = balanceOf();
    const visibleRewards = rewards.filter(reward =>
      viewState.rewardFilter === "Todas" || reward.category === viewState.rewardFilter
    );
    document.getElementById("rewardCatalog").innerHTML = visibleRewards.map(reward => {
      const alreadyClaimed = hasActiveCoupon(reward.id);
      const enoughPoints = balance >= reward.cost;
      const disabled = !enoughPoints || alreadyClaimed;
      const buttonText = alreadyClaimed ? "Já resgatado"
        : enoughPoints ? "Resgatar demonstração" : `Faltam ${displayPoints(reward.cost - balance)} pontos`;
      return `<article class="reward-card" data-reward-id="${reward.id}">
        <div class="reward-illustration" aria-hidden="true"><span><svg class="icon"><use href="assets/icons.svg#${escapeHtml(reward.icon)}"></use></svg><small>IMAGEM ILUSTRATIVA</small></span></div>
        <div class="reward-card-heading"><p class="reward-category">${escapeHtml(reward.category)}</p><span class="mission-status">Demonstração</span></div>
        <h3>${escapeHtml(reward.name)}</h3>
        <p>${escapeHtml(reward.description)}</p>
        <div class="reward-cost">${displayPoints(reward.cost)} <small>pontos</small></div>
        <p class="reward-demo-note">Sem estabelecimento parceiro confirmado. Não é um benefício comercial válido.</p>
        <button type="button" data-redeem="${reward.id}" ${disabled ? "disabled" : ""}>${buttonText}</button>
      </article>`;
    }).join("");
    document.getElementById("rewardsEmpty").hidden = visibleRewards.length > 0;
  }

  function renderHistory() {
    const entries = [...state.ledger].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const container = document.getElementById("pointsHistory");
    container.innerHTML = entries.length ? entries.map(entry => `
      <div class="points-history-entry">
        <span>${escapeHtml(entry.label)} · ${formatDate(entry.createdAt)}</span>
        <strong class="${entry.amount < 0 ? "is-debit" : ""}">${entry.amount > 0 ? "+" : ""}${displayPoints(entry.amount)} pts</strong>
      </div>`).join("") : '<p class="coupon-empty">Nenhuma movimentação ainda.</p>';
  }

  function couponDetails(coupon) {
    const reward = rewards.find(item => item.id === coupon.rewardId);
    return reward || {
      name: "Recompensa indisponível",
      category: "Demonstração",
      description: "Este item não está mais no catálogo."
    };
  }

  function couponCard(coupon) {
    const reward = couponDetails(coupon);
    const status = coupon.status === "available" ? "Disponível"
      : coupon.status === "used" ? "Utilizado"
        : coupon.status === "expired" ? "Expirado" : "Cancelado";
    const action = coupon.status === "available"
      ? `<button type="button" data-use-coupon="${escapeHtml(coupon.id)}">Marcar como utilizado</button>` : "";
    return `<article class="coupon-card">
      <div class="coupon-card-header"><span class="mission-category">${escapeHtml(reward.category)}</span><span class="coupon-status">${status}</span></div>
      <h4>${escapeHtml(reward.name)}</h4>
      <p>${escapeHtml(reward.description)}</p>
      <details><summary>Ver detalhes do cupom</summary>
        <span class="coupon-code">${escapeHtml(coupon.code)}</span>
        <p class="coupon-expiry">Código demonstrativo · válido até ${formatDate(coupon.expiresAt)}</p>
        <p class="coupon-expiry">Não válido para uso em estabelecimentos.</p>
        ${action}
      </details>
    </article>`;
  }

  function renderCouponSection(elementId, coupons, emptyMessage) {
    const element = document.getElementById(elementId);
    element.innerHTML = coupons.length
      ? coupons.map(couponCard).join("")
      : `<p class="coupon-empty">${escapeHtml(emptyMessage)}</p>`;
  }

  function renderCoupons() {
    const balance = balanceOf();
    const available = state.coupons.filter(coupon => coupon.status === "available");
    const history = state.coupons.filter(coupon => coupon.status !== "available");
    const nearRewards = rewards.filter(reward => reward.cost > balance && !hasActiveCoupon(reward.id));
    renderCouponSection("availableCoupons", available, "Você ainda não resgatou cupons demonstrativos.");
    renderCouponSection("couponHistory", history, "Seu histórico de cupons utilizados ou expirados aparecerá aqui.");
    document.getElementById("almostCoupons").innerHTML = nearRewards.length
      ? nearRewards.map(reward => {
        const progress = Math.floor(balance / reward.cost * 100);
        const remaining = reward.cost - balance;
        return `<article class="coupon-card near-reward">
          <div class="coupon-card-header"><span class="mission-category">${escapeHtml(reward.category)}</span><span class="coupon-status">Em breve</span></div>
          <h4>${escapeHtml(reward.name)}</h4>
          <p>Necessário: ${displayPoints(reward.cost)} pontos · Você tem: ${displayPoints(balance)} · Faltam: ${displayPoints(remaining)}.</p>
          <progress max="${reward.cost}" value="${Math.min(balance, reward.cost)}" aria-label="${progress}% do caminho até esta recompensa">${progress}%</progress>
          <p class="reward-demo-note">Benefício demonstrativo, sem parceiro confirmado.</p>
        </article>`;
      }).join("")
      : '<p class="coupon-empty">Você já tem pontos suficientes para todas as recompensas demonstrativas disponíveis.</p>';
  }

  function renderAll() {
    renderPoints();
    renderMissions();
    renderStore();
    renderHistory();
    renderCoupons();
  }

  function createVoucherCode() {
    const suffix = window.crypto?.randomUUID
      ? window.crypto.randomUUID().replace(/-/g, "").slice(0, 10)
      : Math.random().toString(36).slice(2, 12);
    return `INBAR-DEMO-${suffix.toLocaleUpperCase("pt-BR")}`;
  }

  function openRedeemDialog(rewardId) {
    const reward = rewards.find(item => item.id === rewardId);
    if (!reward) {
      showToast("Esta recompensa não está disponível.");
      return;
    }
    state = readStoredState();
    if (expireCoupons(state) && !persist(state)) return;
    if (!reward || balanceOf() < reward.cost) {
      renderAll();
      showToast("Você ainda não tem pontos suficientes para este resgate.");
      return;
    }
    if (hasActiveCoupon(rewardId)) {
      renderAll();
      showToast("Você já tem um cupom demonstrativo ativo desta recompensa.");
      return;
    }
    viewState.pendingRewardId = rewardId;
    document.getElementById("redeemDialogTitle").textContent = `Resgatar ${reward.name}?`;
    document.getElementById("redeemDialogDescription").textContent =
      `Serão descontados ${displayPoints(reward.cost)} pontos. O código gerado é demonstrativo e não pode ser usado em um estabelecimento.`;
    document.getElementById("redeemDialog").showModal();
  }

  function redeemPendingReward() {
    const reward = rewards.find(item => item.id === viewState.pendingRewardId);
    if (!reward) {
      showToast("Esta recompensa não está disponível.");
      return;
    }
    const freshState = readStoredState();
    if (expireCoupons(freshState) && !persist(freshState)) {
      document.getElementById("redeemDialog").close();
      return;
    }
    if (balanceOf(freshState) < reward.cost) {
      state = freshState;
      document.getElementById("redeemDialog").close();
      renderAll();
      showToast("Saldo insuficiente. Nenhum ponto foi descontado.");
      return;
    }
    if (hasActiveCoupon(reward.id, freshState)) {
      state = freshState;
      document.getElementById("redeemDialog").close();
      renderAll();
      showToast("Esta recompensa já possui um cupom demonstrativo ativo.");
      return;
    }

    const timestamp = new Date();
    const expiresAt = new Date(timestamp);
    expiresAt.setDate(expiresAt.getDate() + 90);
    const couponId = `coupon-${window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
    const coupon = {
      id: couponId,
      rewardId: reward.id,
      code: createVoucherCode(),
      createdAt: timestamp.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: "available"
    };
    const candidate = clone(freshState);
    candidate.coupons.push(coupon);
    candidate.ledger.push({
      id: `redemption:${coupon.id}`,
      label: `Resgate demonstrativo: ${reward.name}`,
      amount: -reward.cost,
      createdAt: timestamp.toISOString()
    });
    viewState.pendingRewardId = "";
    if (persist(candidate, `Resgate demonstrativo concluído. Código ${coupon.code}.`)) {
      document.getElementById("redeemDialog").close();
    }
  }

  function markCouponUsed(couponId) {
    const candidate = clone(readStoredState());
    const expiredCoupons = expireCoupons(candidate);
    const coupon = candidate.coupons.find(item => item.id === couponId);
    if (!coupon || coupon.status !== "available") {
      if (expiredCoupons) {
        persist(candidate, "Cupom expirado movido para o histórico.");
        return;
      }
      showToast("Este cupom não está mais disponível para alteração.");
      state = candidate;
      renderAll();
      return;
    }
    coupon.status = "used";
    coupon.usedAt = new Date().toISOString();
    if (persist(candidate, "Cupom demonstrativo marcado como utilizado.")) {
      window.dispatchEvent(new CustomEvent("inbar:coupon-used", { detail: { couponId } }));
    }
  }

  function normalizeText(value) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  }

  function setupEvents() {
    document.querySelectorAll("[data-mission-filter]").forEach(button => {
      button.addEventListener("click", () => {
        viewState.missionFilter = button.dataset.missionFilter;
        document.querySelectorAll("[data-mission-filter]").forEach(filter => {
          filter.setAttribute("aria-pressed", String(filter === button));
        });
        renderMissions();
      });
    });
    document.getElementById("rewardFilters").addEventListener("click", event => {
      const button = event.target.closest("[data-reward-filter]");
      if (!button) return;
      viewState.rewardFilter = button.dataset.rewardFilter;
      document.querySelectorAll("[data-reward-filter]").forEach(filter => {
        filter.setAttribute("aria-pressed", String(filter === button));
      });
      renderStore();
    });
    document.getElementById("rewardCatalog").addEventListener("click", event => {
      const button = event.target.closest("[data-redeem]");
      if (button && !button.disabled) openRedeemDialog(button.dataset.redeem);
    });
    document.getElementById("availableCoupons").addEventListener("click", event => {
      const button = event.target.closest("[data-use-coupon]");
      if (button) markCouponUsed(button.dataset.useCoupon);
    });
    document.getElementById("confirmRedeem").addEventListener("click", redeemPendingReward);
    document.getElementById("cancelRedeem").addEventListener("click", () => {
      viewState.pendingRewardId = "";
      document.getElementById("redeemDialog").close();
    });
    document.getElementById("redeemDialog").addEventListener("cancel", () => {
      viewState.pendingRewardId = "";
    });
    document.getElementById("rewardCatalog").addEventListener("error", event => {
      if (event.target instanceof HTMLImageElement) event.target.hidden = true;
    }, true);
    document.getElementById("searchInput").addEventListener("input", renderMissions);
    window.addEventListener("inbar:place-viewed", event => {
      const place = (window.inbarPlaces || []).find(item => String(item.id) === String(event.detail?.placeId));
      if (!place) return;
      recordProgress(candidate => {
        let changed = addUnique(candidate.exploredPlaceIds, String(place.id));
        place.types.forEach(type => { changed = addUnique(candidate.exploredCategoryIds, type) || changed; });
        return changed;
      }, "Progresso da missão atualizado.");
    });
    window.addEventListener("inbar:place-feed-viewed", event => {
      const placeId = String(event.detail?.placeId || "");
      if (!(window.inbarPlaces || []).some(place => String(place.id) === placeId)) return;
      recordProgress(candidate => addUnique(candidate.localFeedPlaceIds, placeId),
        "Progresso da missão atualizado.");
    });
    window.addEventListener("inbar:feed-post-created", () => {
      recordProgress(candidate => totalOwnPosts() > 0 && !candidate.completedMissions["first-post"],
        "Sua primeira publicação contou para a missão.");
    });
    window.addEventListener("storage", event => {
      if (event.key !== STORAGE_KEY) return;
      try {
        state = readStoredState();
        if (expireCoupons(state)) persist(state);
        else renderAll();
      } catch (error) {
        console.error("Não foi possível sincronizar pontos e cupons entre abas.", error);
        showToast("Não foi possível atualizar o saldo salvo neste navegador.");
      }
    });
  }

  function renderCouponsPublic() {
    renderCoupons();
  }

  try {
    loadAndNormalize();
    renderRewardFilters();
    setupEvents();
    renderAll();
    window.InbarRewards = {
      getBalance: () => balanceOf(),
      getState: () => clone(state),
      renderCoupons: renderCouponsPublic,
      trackPlaceOpened(placeId) {
        const place = (window.inbarPlaces || []).find(item => String(item.id) === String(placeId));
        if (!place) return;
        window.dispatchEvent(new CustomEvent("inbar:place-viewed", { detail: { placeId: place.id } }));
      },
      trackLocalFeedViewed(placeId) {
        window.dispatchEvent(new CustomEvent("inbar:place-feed-viewed", { detail: { placeId } }));
      },
      scrollToStore() {
        document.getElementById("rewardsStore").scrollIntoView({ behavior: "smooth" });
      }
    };
  } catch (error) {
    console.error("Não foi possível iniciar missões e recompensas.", error);
    showToast(error.message || "Não foi possível carregar missões e recompensas.");
  }
})();
