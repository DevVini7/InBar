(() => {
  const DEFAULT_APPEARANCE = {
    accent: "#b20cff",
    secondary: "#f04dff",
    frame: "none",
    avatar: ""
  };
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  const dialog = document.getElementById("profileAppearanceDialog");
  const form = document.getElementById("profileAppearanceForm");
  const status = document.getElementById("profileAppearanceStatus");
  const accentInput = document.getElementById("profileAccentColor");
  const secondaryInput = document.getElementById("profileSecondaryColor");
  const frameSelect = document.getElementById("profileAvatarFrame");
  const avatarInput = document.getElementById("profileAvatarInput");
  const themeOptions = document.getElementById("profileThemeOptions");
  const profileAvatars = [
    document.querySelector(".profile-trigger-avatar"),
    document.querySelector(".profile-menu-avatar")
  ];
  const previewAvatar = document.getElementById("profileAppearancePreviewAvatar");
  let draft = { ...DEFAULT_APPEARANCE };

  function setStatus(message, state = "") {
    status.textContent = message;
    if (state) status.dataset.state = state;
    else delete status.dataset.state;
  }

  function createDefaultAvatar(preset = "user-round") {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    svg.setAttribute("class", "icon");
    svg.setAttribute("aria-hidden", "true");
    use.setAttribute("href", `assets/icons.svg#${preset}`);
    svg.append(use);
    return svg;
  }

  function applyAvatar(element, appearance) {
    element.replaceChildren();
    element.append(appearance.avatar ? Object.assign(document.createElement("img"), {
      src: appearance.avatar,
      alt: ""
    })     : createDefaultAvatar(appearance.avatarPreset || "user-round"));
    element.style.setProperty("--profile-accent", appearance.accent);
    element.style.setProperty("--profile-secondary", appearance.secondary);
    element.classList.toggle("is-frame-soft", appearance.frame === "soft");
    element.classList.toggle("is-frame-double", appearance.frame === "double");
  }

  function renderPreview() {
    accentInput.value = draft.accent;
    secondaryInput.value = draft.secondary;
    frameSelect.value = draft.frame;
    const preview = document.getElementById("profileAppearancePreview");
    preview.style.setProperty("--profile-accent", draft.accent);
    preview.style.setProperty("--profile-secondary", draft.secondary);
    document.querySelectorAll(".profile-theme-option").forEach(button => {
      const selected = button.dataset.accent === draft.accent
        && button.dataset.secondary === draft.secondary;
      button.setAttribute("aria-pressed", String(selected));
      button.style.setProperty("--profile-accent", draft.accent);
    });
    applyAvatar(previewAvatar, draft);
  }

  function applySavedAppearance(appearance) {
    profileAvatars.forEach(avatar => applyAvatar(avatar, appearance));
    const menu = document.getElementById("profileMenu");
    menu.style.setProperty("--profile-accent", appearance.accent);
    menu.style.setProperty("--profile-secondary", appearance.secondary);
  }

  function updateDraft(changes) {
    draft = { ...draft, ...changes };
    renderPreview();
    setStatus("");
  }

  function openEditor() {
    try {
      const user = window.InbarAuth.getCurrentUser();
      if (!user) throw new Error("Entre na sua conta para personalizar o perfil.");
      draft = { ...window.InbarAuth.getProfileAppearance() };
      document.getElementById("profileAppearancePreviewName").textContent = user.fullName || "Usuário";
      avatarInput.value = "";
      renderPreview();
      setStatus("");
      dialog.showModal();
    } catch (error) {
      console.error("Não foi possível abrir a personalização do perfil.", error);
      setStatus(error.message || "Não foi possível carregar as opções do perfil.", "error");
    }
  }

  function loadCompressedAvatar(file) {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const side = 320;
        const cropSide = Math.min(image.naturalWidth, image.naturalHeight);
        const cropX = (image.naturalWidth - cropSide) / 2;
        const cropY = (image.naturalHeight - cropSide) / 2;
        const canvas = document.createElement("canvas");
        try {
          canvas.width = side;
          canvas.height = side;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Não foi possível preparar a imagem neste navegador.");
          context.drawImage(image, cropX, cropY, cropSide, cropSide, 0, 0, side, side);
          resolve(canvas.toDataURL("image/jpeg", 0.78));
        } catch (error) {
          reject(error);
        }
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Não foi possível abrir esta imagem."));
      };
      image.src = objectUrl;
    });
  }

  themeOptions.addEventListener("click", event => {
    const button = event.target.closest(".profile-theme-option");
    if (!button) return;
    updateDraft({
      accent: button.dataset.accent,
      secondary: button.dataset.secondary
    });
  });

  accentInput.addEventListener("input", () => updateDraft({ accent: accentInput.value }));
  secondaryInput.addEventListener("input", () => updateDraft({ secondary: secondaryInput.value }));
  frameSelect.addEventListener("change", () => updateDraft({ frame: frameSelect.value }));

  avatarInput.addEventListener("change", async () => {
    const [file] = avatarInput.files || [];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      avatarInput.value = "";
      setStatus("Escolha uma imagem JPG, PNG ou WebP.", "error");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      avatarInput.value = "";
      setStatus("A imagem precisa ter no máximo 5 MB.", "error");
      return;
    }
    try {
      const avatar = await loadCompressedAvatar(file);
      updateDraft({ avatar });
      setStatus("Prévia atualizada. Salve para aplicar ao seu perfil.");
    } catch (error) {
      console.error("Não foi possível preparar a foto de perfil.", error);
      setStatus(error.message || "Não foi possível preparar esta imagem.", "error");
    }
  });

  document.getElementById("resetProfileAppearance").addEventListener("click", () => {
    draft = { ...DEFAULT_APPEARANCE };
    avatarInput.value = "";
    renderPreview();
    setStatus("Visual padrão na prévia. Salve para confirmar.");
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    try {
      window.InbarAuth.saveProfileAppearance(draft);
      applySavedAppearance(draft);
      window.dispatchEvent(new CustomEvent("inbar:profile-updated"));
      setStatus("Aparência salva na sua conta.", "success");
      dialog.close();
    } catch (error) {
      console.error("Não foi possível salvar a aparência do perfil.", error);
      setStatus(error.message || "Não foi possível salvar. Tente novamente.", "error");
    }
  });

  function closeEditor() {
    dialog.close();
  }

  document.getElementById("editProfileAppearance").addEventListener("click", () => {
    document.getElementById("profileMenu").classList.add("hidden");
    document.getElementById("profileButton").setAttribute("aria-expanded", "false");
    openEditor();
  });
  document.getElementById("closeProfileAppearance").addEventListener("click", closeEditor);
  document.getElementById("cancelProfileAppearance").addEventListener("click", closeEditor);
  dialog.addEventListener("click", event => {
    if (event.target === dialog) closeEditor();
  });

  try {
    const user = window.InbarAuth.getCurrentUser();
    draft = window.InbarAuth.getProfileAppearance();
    if (user) document.getElementById("profileAppearancePreviewName").textContent = user.fullName || "Usuário";
    applySavedAppearance(draft);
  } catch (error) {
    console.error("Não foi possível carregar a aparência do perfil.", error);
  }
  renderPreview();
  window.InbarProfileAppearance = {
    openEditor,
    loadCompressedAvatar,
    applySavedAppearance
  };
})();
