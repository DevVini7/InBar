(() => {
  const VIBE_KEY = "inbar:vibe:v1";
  const PROMPTED_KEY = "inbar:vibe:prompted:v1";
  const vibeDefinitions = {
    bares: {
      label: "Bares e resenha",
      categoryIds: ["gastronomia-bares"],
      interestIds: ["bares-tradicionais", "botecos", "drinks-coqueteis", "happy-hour"]
    },
    musica: {
      label: "Música e shows",
      categoryIds: ["musica"],
      interestIds: ["musica-ao-vivo", "shows-culturais", "rock", "samba"]
    },
    festas: {
      label: "Festa e balada",
      categoryIds: ["vida-noturna-festas"],
      interestIds: ["baladas", "festivais", "danca"]
    },
    "ar-livre": {
      label: "Ar livre",
      categoryIds: ["ar-livre-natureza"],
      interestIds: ["parques", "trilhas", "atividades-ar-livre"]
    },
    jogos: {
      label: "Jogos e diversão",
      categoryIds: ["games-jogos", "aventura-experiencias"],
      interestIds: ["boliche", "jogos-tabuleiro", "kart", "experiencias-diferentes"]
    },
    esportes: {
      label: "Esportes e atividades",
      categoryIds: ["esportes"],
      interestIds: ["futebol", "corrida", "ciclismo", "atividades-ar-livre"]
    },
    cultura: {
      label: "Arte e cultura",
      categoryIds: ["arte-cultura"],
      interestIds: ["cinema", "teatro", "exposicoes", "shows-culturais"]
    },
    social: {
      label: "Socializar",
      categoryIds: ["social-convivencia"],
      interestIds: ["conhecer-pessoas", "encontrar-amigos", "eventos-sociais"]
    },
    surpresa: {
      label: "Surpreenda-me",
      categoryIds: [],
      interestIds: []
    }
  };
  const dialog = document.getElementById("vibeDialog");
  const status = document.getElementById("vibeStatus");
  const selected = new Set();

  function readStoredVibe() {
    const raw = window.sessionStorage.getItem(VIBE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.schemaVersion !== 1 || !Array.isArray(parsed.ids)
      || !parsed.ids.every(id => Object.hasOwn(vibeDefinitions, id))) {
      throw new Error("A vibe desta sessão não está em um formato válido.");
    }
    return parsed;
  }

  function currentPreferences() {
    const stored = readStoredVibe();
    if (!stored || !stored.ids.length || stored.ids.includes("surpresa")) return null;
    const definitions = stored.ids.map(id => vibeDefinitions[id]);
    return {
      ids: stored.ids,
      label: definitions.map(vibe => vibe.label).join(" + "),
      categoryIds: [...new Set(definitions.flatMap(vibe => vibe.categoryIds))],
      interestIds: [...new Set(definitions.flatMap(vibe => vibe.interestIds))]
    };
  }

  function saveVibe(ids) {
    const validIds = [...new Set(ids)].filter(id => Object.hasOwn(vibeDefinitions, id));
    if (!validIds.length) throw new Error("Selecione ao menos uma vibe ou escolha “Agora não”.");
    const labels = validIds.map(id => vibeDefinitions[id].label);
    window.sessionStorage.setItem(VIBE_KEY, JSON.stringify({
      schemaVersion: 1,
      ids: validIds,
      label: labels.join(" + "),
      savedAt: new Date().toISOString()
    }));
    window.sessionStorage.setItem(PROMPTED_KEY, "true");
    window.dispatchEvent(new CustomEvent("inbar:vibe-updated"));
  }

  function dismissPrompt() {
    window.sessionStorage.removeItem(VIBE_KEY);
    window.sessionStorage.setItem(PROMPTED_KEY, "true");
    window.dispatchEvent(new CustomEvent("inbar:vibe-updated"));
    dialog.close();
  }

  function openPromptIfNeeded() {
    if (!window.InbarAuth.getCurrentUser() || window.InbarInterests.requiresOnboarding()
      || window.sessionStorage.getItem(PROMPTED_KEY) === "true") return;
    try {
      const current = readStoredVibe();
      if (current) current.ids.forEach(id => selected.add(id));
      renderSelection();
      dialog.showModal();
    } catch (error) {
      console.error("Não foi possível carregar a vibe desta sessão.", error);
      status.textContent = "Não foi possível carregar a seleção. Você pode continuar sem escolher uma vibe.";
      dialog.showModal();
    }
  }

  function renderSelection() {
    dialog.querySelectorAll("[data-vibe]").forEach(button => {
      button.setAttribute("aria-pressed", String(selected.has(button.dataset.vibe)));
    });
  }

  function rankPlaces(places) {
    return window.InbarInterests.rankEntities(places);
  }

  function renderHomeRecommendations() {
    const panel = document.getElementById("homeRecommendations");
    const list = document.getElementById("homeRecommendationsList");
    const empty = document.getElementById("homeRecommendationsEmpty");
    const vibe = currentPreferences();
    const interests = window.InbarInterests.loadPreferences();
    const hasPermanentInterests = interests.categoryIds.length || interests.interestIds.length;
    const stored = readStoredVibe();
    const hasAnyPersonalization = Boolean(vibe || (stored && stored.ids.includes("surpresa")) || hasPermanentInterests);
    panel.classList.toggle("hidden", !hasAnyPersonalization);
    if (!hasAnyPersonalization) return;

    document.getElementById("homeRecommendationsKicker").textContent =
      vibe ? "PARA SUA VIBE DE HOJE" : "BASEADO NOS SEUS INTERESSES";
    document.getElementById("homeRecommendationsTitle").textContent =
      vibe ? vibe.label : stored?.ids.includes("surpresa") ? "Uma descoberta para você" : "Sugestões para você";

    let ranked = rankPlaces(window.inbarPlaces);
    if (vibe) ranked = ranked.filter(item => item.score > 0);
    else if (!hasPermanentInterests && stored?.ids.includes("surpresa")) ranked = ranked.slice(0, 3);
    else ranked = ranked.filter(item => item.score > 0);
    const recommendations = ranked.slice(0, 3).map(item => item.entity);
    list.innerHTML = recommendations.map(place => `
      <button type="button" class="home-recommendation-item" data-open-place="${place.id}">
        <svg class="icon" aria-hidden="true"><use href="assets/icons/inbar.svg#${escapeHtml(place.icon || "map-pin")}"></use></svg>
        <span><strong>${escapeHtml(place.name)}</strong><small>${escapeHtml(place.category)} · ${escapeHtml(place.distance)}</small></span>
      </button>`).join("");
    empty.hidden = recommendations.length > 0;
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

  dialog.addEventListener("click", event => {
    const button = event.target.closest("[data-vibe]");
    if (!button) return;
    const id = button.dataset.vibe;
    if (id === "surpresa") {
      selected.clear();
      selected.add(id);
    } else {
      selected.delete("surpresa");
      if (selected.has(id)) selected.delete(id);
      else selected.add(id);
    }
    status.textContent = "";
    renderSelection();
  });
  document.getElementById("vibeForm").addEventListener("submit", event => {
    event.preventDefault();
    try {
      if (selected.has("surpresa") && selected.size > 1) {
        selected.delete("surpresa");
        renderSelection();
      }
      saveVibe([...selected]);
      dialog.classList.add("is-confirming");
      window.setTimeout(() => {
        dialog.classList.remove("is-confirming");
        dialog.close();
      }, 220);
    } catch (error) {
      status.textContent = error.message || "Não foi possível salvar sua vibe.";
    }
  });
  document.getElementById("skipVibe").addEventListener("click", dismissPrompt);
  dialog.addEventListener("cancel", event => {
    event.preventDefault();
    dismissPrompt();
  });
  window.addEventListener("inbar:vibe-updated", renderHomeRecommendations);
  window.addEventListener("inbar:preferences-updated", renderHomeRecommendations);
  window.InbarVibe = {
    getCurrent: currentPreferences,
    getDefinitions() { return { ...vibeDefinitions }; },
    rankPlaces
  };
  window.InbarRecommendations = { rankPlaces, renderHome: renderHomeRecommendations };
  window.dispatchEvent(new CustomEvent("inbar:vibe-updated"));
  openPromptIfNeeded();
})();
