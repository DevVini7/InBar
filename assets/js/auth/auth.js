window.InbarAuth = (() => {
  const ACCOUNTS_KEY = "inbar:accounts:v1";
  const SESSION_KEY = "inbar:session:v1";
  const DEFAULT_PROFILE_APPEARANCE = {
    accent: "#b20cff",
    secondary: "#f04dff",
    frame: "none",
    avatar: "",
    avatarPreset: "user-round"
  };
  const AVATAR_PRESETS = ["user-round", "beer", "music-2", "images", "map-pin", "gamepad-2"];

  function normalizeEmail(email) {
    return email.trim().toLocaleLowerCase("pt-BR");
  }

  function userIdFor(email) {
    return `email-${encodeURIComponent(normalizeEmail(email))}`;
  }

  function displayNameFor(user) {
    return [user.nickname, user.username, user.fullName]
      .find(name => typeof name === "string" && name.trim())?.trim() || "Usuário";
  }

  function normalizeNickname(value) {
    return String(value || "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  }

  function nicknameFor(user) {
    return [user.nickname, user.username]
      .find(name => typeof name === "string" && name.trim())?.trim() || "";
  }

  function validateNickname(nickname) {
    return typeof nickname === "string" && /^[\p{L}\p{N}_.-]{3,24}$/u.test(nickname.trim());
  }

  function ensureUniqueNickname(nickname, accounts, exceptEmail = "") {
    const normalized = normalizeNickname(nickname);
    const duplicate = Object.entries(accounts).find(([email, account]) =>
      email !== exceptEmail && normalizeNickname(nicknameFor(account)) === normalized
    );
    if (duplicate) throw new Error("Este apelido já está sendo usado. Escolha outro.");
  }

  function readAccounts() {
    const storedAccounts = window.localStorage.getItem(ACCOUNTS_KEY);
    if (!storedAccounts) return {};
    const accounts = JSON.parse(storedAccounts);
    if (!accounts || Array.isArray(accounts) || typeof accounts !== "object") {
      throw new Error("Os dados de contas salvos neste navegador são inválidos.");
    }
    return accounts;
  }

  function getCurrentUser() {
    const storedSession = window.sessionStorage.getItem(SESSION_KEY);
    if (!storedSession) return null;

    try {
      const sessionUser = JSON.parse(storedSession);
      if (sessionUser && typeof sessionUser.id === "string" && typeof sessionUser.email === "string") {
        const account = readAccounts()[normalizeEmail(sessionUser.email)];
        const user = account && account.id === sessionUser.id
          ? { ...sessionUser, ...account }
          : sessionUser;
        return {
          ...user,
          nickname: nicknameFor(user),
          displayName: displayNameFor(user)
        };
      }
      throw new Error("Os dados da sessão atual são inválidos.");
    } catch (error) {
      console.error("Não foi possível ler a sessão do InBar.", error);
      window.sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  function createTestUser(email) {
    const normalizedEmail = normalizeEmail(email);
    const accounts = readAccounts();
    const user = accounts[normalizedEmail] || {
      id: userIdFor(normalizedEmail),
      fullName: "Usuário",
      email: normalizedEmail
    };
    const normalizedUser = {
      ...user,
      nickname: nicknameFor(user),
      displayName: displayNameFor(user)
    };
    if (!accounts[normalizedEmail]) {
      accounts[normalizedEmail] = normalizedUser;
      window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    }
    return normalizedUser;
  }

  function login(email, password) {
    if (!email || !password.trim()) {
      throw new Error("Informe seu e-mail e sua senha.");
    }
    const user = createTestUser(email);
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    window.sessionStorage.removeItem("inbar:vibe:v1");
    window.sessionStorage.removeItem("inbar:vibe:prompted:v1");
    return user;
  }

  function register({ fullName, nickname, username, email, ageConfirmed }) {
    const normalizedEmail = normalizeEmail(email);
    const accounts = readAccounts();
    if (accounts[normalizedEmail]) {
      throw new Error("Já existe um cadastro de teste com este e-mail.");
    }
    const publicNickname = typeof nickname === "string" ? nickname.trim() : String(username || "").trim();
    if (!validateNickname(publicNickname)) {
      throw new Error("O apelido deve ter entre 3 e 24 letras, números, pontos, hífens ou sublinhados.");
    }
    ensureUniqueNickname(publicNickname, accounts);
    const user = {
      id: userIdFor(normalizedEmail),
      fullName: fullName.trim(),
      nickname: publicNickname,
      displayName: publicNickname,
      email: normalizedEmail,
      ageConfirmed: Boolean(ageConfirmed),
      ageConfirmedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      bio: "",
      avatarPreset: "user-round"
    };
    accounts[normalizedEmail] = user;
    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    return user;
  }

  function logout() {
    window.sessionStorage.removeItem(SESSION_KEY);
    window.sessionStorage.removeItem("inbar:vibe:v1");
    window.sessionStorage.removeItem("inbar:vibe:prompted:v1");
  }

  function getProfileAppearance() {
    const user = getCurrentUser();
    if (!user || !user.profileAppearance) return { ...DEFAULT_PROFILE_APPEARANCE };
    const appearance = user.profileAppearance;
    if (!isValidProfileAppearance(appearance)) {
      throw new Error("As opções de aparência salvas para este perfil são inválidas.");
    }
    return { ...DEFAULT_PROFILE_APPEARANCE, ...appearance };
  }

  function isValidProfileAppearance(appearance) {
    return appearance && typeof appearance === "object"
      && /^#[\da-f]{6}$/i.test(appearance.accent)
      && /^#[\da-f]{6}$/i.test(appearance.secondary)
      && ["none", "soft", "double"].includes(appearance.frame)
      && (appearance.avatarPreset === undefined || AVATAR_PRESETS.includes(appearance.avatarPreset))
      && typeof appearance.avatar === "string"
      && (appearance.avatar === "" || (
        appearance.avatar.length <= 500_000
        && /^data:image\/jpeg;base64,[\da-z+/]+=*$/i.test(appearance.avatar)
      ));
  }

  function saveProfileAppearance(appearance) {
    const user = getCurrentUser();
    if (!user) throw new Error("Entre na sua conta para personalizar o perfil.");
    if (!isValidProfileAppearance(appearance)) {
      throw new Error("As opções de aparência do perfil são inválidas.");
    }

    const normalizedEmail = normalizeEmail(user.email);
    const accounts = readAccounts();
    const account = accounts[normalizedEmail];
    if (!account || account.id !== user.id) {
      throw new Error("Não foi possível localizar a conta atual para salvar o perfil.");
    }

    const profileAppearance = {
      accent: appearance.accent,
      secondary: appearance.secondary,
      frame: appearance.frame,
      avatar: appearance.avatar,
      avatarPreset: appearance.avatarPreset || "user-round"
    };
    const updatedUser = { ...account, profileAppearance };
    accounts[normalizedEmail] = updatedUser;
    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  }

  function updateCurrentProfile({ nickname, fullName, bio, avatarPreset, avatar = "" }) {
    const user = getCurrentUser();
    if (!user) throw new Error("Entre na sua conta para editar o perfil.");
    if (!validateNickname(nickname)) {
      throw new Error("O apelido deve ter entre 3 e 24 letras, números, pontos, hífens ou sublinhados.");
    }
    if (typeof fullName !== "string" || fullName.trim().length > 100) {
      throw new Error("O nome completo deve ter no máximo 100 caracteres.");
    }
    if (typeof bio !== "string" || bio.trim().length > 240) {
      throw new Error("A biografia deve ter no máximo 240 caracteres.");
    }
    if (!AVATAR_PRESETS.includes(avatarPreset)) {
      throw new Error("Escolha um avatar disponível.");
    }
    if (typeof avatar !== "string" || (avatar !== "" && (
      avatar.length > 500_000 || !/^data:image\/jpeg;base64,[\da-z+/]+=*$/i.test(avatar)
    ))) {
      throw new Error("A foto de perfil preparada é inválida. Escolha outra imagem.");
    }

    const normalizedEmail = normalizeEmail(user.email);
    const accounts = readAccounts();
    const account = accounts[normalizedEmail];
    if (!account || account.id !== user.id) {
      throw new Error("Não foi possível localizar a conta atual para salvar o perfil.");
    }
    ensureUniqueNickname(nickname, accounts, normalizedEmail);

    const profileAppearance = {
      ...DEFAULT_PROFILE_APPEARANCE,
      ...(account.profileAppearance || {}),
      ...(user.profileAppearance || {}),
      avatarPreset,
      avatar
    };
    const updatedUser = {
      ...account,
      nickname: nickname.trim(),
      displayName: nickname.trim(),
      fullName: fullName.trim(),
      bio: bio.trim(),
      avatarPreset,
      profileAppearance
    };
    accounts[normalizedEmail] = updatedUser;
    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
    return { ...updatedUser, displayName: displayNameFor(updatedUser) };
  }

  return {
    getCurrentUser,
    getProfileAppearance,
    login,
    register,
    saveProfileAppearance,
    updateCurrentProfile,
    validateNickname,
    logout
  };
})();
