window.InbarAuth = (() => {
  const ACCOUNTS_KEY = "inbar:accounts:v1";
  const SESSION_KEY = "inbar:session:v1";

  function normalizeEmail(email) {
    return email.trim().toLocaleLowerCase("pt-BR");
  }

  function userIdFor(email) {
    return `email-${encodeURIComponent(normalizeEmail(email))}`;
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
      const user = JSON.parse(storedSession);
      if (user && typeof user.id === "string" && typeof user.email === "string") return user;
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
    if (!accounts[normalizedEmail]) {
      accounts[normalizedEmail] = user;
      window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    }
    return user;
  }

  function login(email, password) {
    if (!email || !password.trim()) {
      throw new Error("Informe seu e-mail e sua senha.");
    }
    const user = createTestUser(email);
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  }

  function register({ fullName, email, ageConfirmed }) {
    const normalizedEmail = normalizeEmail(email);
    const accounts = readAccounts();
    if (accounts[normalizedEmail]) {
      throw new Error("Já existe um cadastro de teste com este e-mail.");
    }
    const user = {
      id: userIdFor(normalizedEmail),
      fullName: fullName.trim(),
      email: normalizedEmail,
      ageConfirmed: Boolean(ageConfirmed),
      ageConfirmedAt: new Date().toISOString()
    };
    accounts[normalizedEmail] = user;
    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    return user;
  }

  function logout() {
    window.sessionStorage.removeItem(SESSION_KEY);
  }

  return {
    getCurrentUser,
    login,
    register,
    logout
  };
})();
