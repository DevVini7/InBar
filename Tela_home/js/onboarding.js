(() => {
  const categories = window.InbarInterests.categories;
  const categoryGrid = document.getElementById("categoryGrid");
  const subcategoryGroups = document.getElementById("subcategoryGroups");
  const preferenceSummary = document.getElementById("preferenceSummary");
  const status = document.getElementById("onboardingStatus");
  const count = document.getElementById("selectionCount");
  const backButton = document.getElementById("backButton");
  const nextButton = document.getElementById("nextButton");
  const finishButton = document.getElementById("finishButton");
  const skipButton = document.getElementById("skipButton");
  const editing = new URLSearchParams(window.location.search).get("mode") === "edit";
  let step = 1;
  let preferences;

  function showStorageError(error, message) {
    console.error(message, error);
    status.textContent = "Não foi possível acessar suas preferências neste dispositivo. Verifique o armazenamento do navegador e tente novamente.";
    [backButton, nextButton, finishButton, skipButton].forEach(button => {
      button.disabled = true;
    });
  }

  try {
    preferences = window.InbarInterests.loadPreferences();
  } catch (error) {
    showStorageError(error, "Falha ao carregar as preferências do InBar.");
    return;
  }

  const selectedCategories = new Set(preferences.categoryIds);
  const selectedInterests = new Set(preferences.interestIds);
  const firstSelectedCategory = categories.find(category => selectedCategories.has(category.id));
  const expandedCategoryIds = new Set(firstSelectedCategory ? [firstSelectedCategory.id] : []);

  if (editing) {
    document.getElementById("welcomeTitle").textContent = "Seus interesses, do seu jeito";
    document.getElementById("welcomeDescription").textContent = "Atualize suas escolhas para deixar as descobertas do InBar ainda mais alinhadas com você.";
    skipButton.textContent = "Cancelar edição";
  }

  function renderCategories() {
    categoryGrid.replaceChildren();
    categories.forEach(category => {
      const button = document.createElement("button");
      const selected = selectedCategories.has(category.id);
      button.type = "button";
      button.className = `category-card${selected ? " selected" : ""}`;
      button.dataset.categoryId = category.id;
      button.setAttribute("aria-pressed", String(selected));
      button.setAttribute("aria-label", `${category.label}${selected ? ", selecionada" : ""}`);
      const icon = document.createElement("span");
      icon.className = "category-icon";
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
      svg.setAttribute("aria-hidden", "true");
      use.setAttribute("href", `assets/icons.svg#${category.icon}`);
      svg.append(use);
      icon.append(svg);
      const label = document.createElement("strong");
      label.textContent = category.label;
      const check = document.createElement("span");
      check.className = "selected-check";
      check.setAttribute("aria-hidden", "true");
      check.textContent = "✓";
      button.append(icon, label, check);
      button.addEventListener("click", () => {
        if (selectedCategories.has(category.id)) {
          selectedCategories.delete(category.id);
          expandedCategoryIds.delete(category.id);
          category.interests.forEach(([id]) => selectedInterests.delete(id));
        } else {
          selectedCategories.add(category.id);
          expandedCategoryIds.add(category.id);
        }
        status.textContent = "";
        render();
        categoryGrid.querySelector(`[data-category-id="${category.id}"]`).focus();
      });
      categoryGrid.append(button);
    });
  }

  function renderSubcategories() {
    subcategoryGroups.replaceChildren();
    const selected = categories.filter(category => selectedCategories.has(category.id));
    if (!selected.length) {
      const empty = document.createElement("p");
      empty.className = "empty-interests";
      empty.textContent = "Nenhuma categoria selecionada. Você pode voltar e escolher algumas ou continuar sem adicionar interesses.";
      subcategoryGroups.append(empty);
      return;
    }

    selected.forEach(category => {
      const group = document.createElement("details");
      group.className = "interest-group";
      group.open = expandedCategoryIds.has(category.id);
      group.addEventListener("toggle", () => {
        if (group.open) expandedCategoryIds.add(category.id);
        else expandedCategoryIds.delete(category.id);
      });
      const heading = document.createElement("summary");
      heading.className = "interest-group-heading";
      const title = document.createElement("strong");
      title.textContent = category.label;
      const selectedCount = category.interests.filter(([id]) => selectedInterests.has(id)).length;
      const summary = document.createElement("span");
      summary.textContent = `${selectedCount} selecionado${selectedCount === 1 ? "" : "s"}`;
      heading.append(title, summary);
      const chips = document.createElement("div");
      chips.className = "interest-chips";
      category.interests.forEach(([id, label]) => {
        const chip = document.createElement("button");
        const isSelected = selectedInterests.has(id);
        chip.type = "button";
        chip.className = `interest-chip${isSelected ? " selected" : ""}`;
        chip.dataset.interestId = id;
        chip.setAttribute("aria-pressed", String(isSelected));
        chip.textContent = label;
        chip.addEventListener("click", () => {
          if (selectedInterests.has(id)) selectedInterests.delete(id);
          else selectedInterests.add(id);
          status.textContent = "";
          render();
          subcategoryGroups.querySelector(`[data-interest-id="${id}"]`).focus();
        });
        chips.append(chip);
      });
      group.append(heading, chips);
      subcategoryGroups.append(group);
    });
  }

  function renderSummary() {
    preferenceSummary.replaceChildren();
    const selected = categories.filter(category => selectedCategories.has(category.id));
    if (!selected.length) {
      const empty = document.createElement("p");
      empty.className = "empty-interests";
      empty.textContent = "Você escolheu seguir sem filtros de interesse. Pode adicionar preferências a qualquer momento pelo perfil.";
      preferenceSummary.append(empty);
      return;
    }

    selected.forEach(category => {
      const section = document.createElement("section");
      section.className = "summary-category";
      const title = document.createElement("h3");
      title.textContent = category.label;
      const tags = document.createElement("div");
      tags.className = "summary-tags";
      const interests = category.interests.filter(([id]) => selectedInterests.has(id));
      if (!interests.length) {
        const general = document.createElement("span");
        general.className = "summary-general";
        general.textContent = "Interesse geral na categoria";
        tags.append(general);
      } else {
        interests.forEach(([, label]) => {
          const tag = document.createElement("span");
          tag.textContent = label;
          tags.append(tag);
        });
      }
      section.append(title, tags);
      preferenceSummary.append(section);
    });
  }

  function render() {
    renderCategories();
    renderSubcategories();
    renderSummary();
    const categoryCount = selectedCategories.size;
    count.textContent = `${categoryCount} categoria${categoryCount === 1 ? "" : "s"} selecionada${categoryCount === 1 ? "" : "s"} · ${selectedInterests.size} interesse${selectedInterests.size === 1 ? "" : "s"}`;
    document.querySelectorAll("[data-step-panel]").forEach(panel => {
      panel.hidden = Number(panel.dataset.stepPanel) !== step;
    });
    document.querySelectorAll("[data-step-indicator]").forEach(indicator => {
      const indicatorStep = Number(indicator.dataset.stepIndicator);
      indicator.classList.toggle("active", indicatorStep === step);
      indicator.classList.toggle("completed", indicatorStep < step);
      if (indicatorStep === step) indicator.setAttribute("aria-current", "step");
      else indicator.removeAttribute("aria-current");
    });
    document.getElementById("stepEyebrow").textContent = `ETAPA ${step} DE 3`;
    document.getElementById("stepTitle").textContent = [
      "O que você curte?",
      "Explore seus interesses",
      "Seu resumo"
    ][step - 1];
    backButton.hidden = step === 1;
    nextButton.hidden = step === 3;
    finishButton.hidden = step !== 3;
  }

  function saveAndReturn(categoryIds, interestIds) {
    try {
      window.InbarInterests.savePreferences(categoryIds, interestIds);
      window.location.assign("./index.html");
    } catch (error) {
      console.error("Falha ao salvar as preferências do InBar.", error);
      status.textContent = "Não foi possível salvar suas escolhas. Verifique o armazenamento do navegador e tente novamente.";
    }
  }

  nextButton.addEventListener("click", () => {
    step = Math.min(3, step + 1);
    status.textContent = "";
    render();
    document.getElementById("stepTitle").focus();
  });

  backButton.addEventListener("click", () => {
    step = Math.max(1, step - 1);
    status.textContent = "";
    render();
    document.getElementById("stepTitle").focus();
  });

  finishButton.addEventListener("click", () => {
    saveAndReturn([...selectedCategories], [...selectedInterests]);
  });

  skipButton.addEventListener("click", () => {
    if (editing) {
      window.location.assign("./index.html");
      return;
    }
    saveAndReturn([], []);
  });

  render();
})();
