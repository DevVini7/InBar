(() => {
  const form = document.getElementById("authForm");
  const formTitle = document.getElementById("formTitle");
  const formDescription = document.getElementById("formDescription");
  const submitButton = document.getElementById("submitButton");
  const submitLabel = document.getElementById("submitLabel");
  const modePrompt = document.getElementById("modePrompt");
  const modeToggle = document.getElementById("modeToggle");
  const formStatus = document.getElementById("formStatus");
  const loginOptions = document.getElementById("loginOptions");
  const passwordHint = document.getElementById("passwordHint");
  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirmPassword");
  const registrationFields = [
    ["fullName", "fullNameGroup"],
    ["username", "usernameGroup"],
    ["phone", "phoneGroup"],
    ["confirmPassword", "confirmPasswordGroup"],
    ["ageConfirmation", "ageGroup"],
    ["termsConfirmation", "termsGroup"]
  ];
  const fieldMessages = {
    fullName: {
      valueMissing: "Informe seu nome completo.",
      tooShort: "Digite seu nome completo."
    },
    username: {
      valueMissing: "Informe um nome de usuário.",
      tooShort: "O nome de usuário deve ter pelo menos 3 caracteres."
    },
    phone: {
      valueMissing: "Informe seu telefone.",
      tooShort: "Digite os 10 ou 11 números do telefone, incluindo o DDD.",
      patternMismatch: "Digite apenas 10 ou 11 números, incluindo o DDD."
    },
    email: {
      valueMissing: "Informe seu e-mail.",
      typeMismatch: "Digite um e-mail válido."
    },
    password: {
      valueMissing: "Informe sua senha.",
      tooShort: "A senha deve ter pelo menos 8 caracteres.",
      patternMismatch: "Use pelo menos uma letra e um número na senha."
    },
    confirmPassword: {
      valueMissing: "Confirme sua senha."
    }
  };
  const errorIds = {
    ageConfirmation: "ageError",
    termsConfirmation: "termsError"
  };
  let isRegistration = false;

  function redirectAuthenticatedUser() {
    const currentUser = window.InbarAuth.getCurrentUser();
    if (!currentUser) return false;
    const destination = window.InbarInterests.requiresOnboarding() ? "onboarding.html" : "index.html";
    window.location.replace(destination);
    return true;
  }

  function setFieldError(name, message) {
    const input = form.elements.namedItem(name);
    const error = document.getElementById(errorIds[name] || `${name}Error`);
    if (!input || !error) return;
    input.setAttribute("aria-invalid", message ? "true" : "false");
    error.textContent = message;
  }

  function clearErrors() {
    form.querySelectorAll(".field-error").forEach(error => {
      error.textContent = "";
    });
    form.querySelectorAll("[aria-invalid]").forEach(input => {
      input.removeAttribute("aria-invalid");
    });
    formStatus.textContent = "";
    formStatus.removeAttribute("data-state");
  }

  function setMode(registration) {
    isRegistration = registration;
    form.reset();
    clearErrors();
    document.getElementById("fullNameGroup").hidden = !registration;
    document.getElementById("usernameGroup").hidden = !registration;
    document.getElementById("phoneGroup").hidden = !registration;
    document.getElementById("confirmPasswordGroup").hidden = !registration;
    document.getElementById("ageGroup").hidden = !registration;
    document.getElementById("termsGroup").hidden = !registration;
    loginOptions.hidden = registration;
    passwordHint.hidden = !registration;

    registrationFields.forEach(([name]) => {
      form.elements.namedItem(name).required = registration;
    });
    password.autocomplete = registration ? "new-password" : "current-password";
    password.minLength = registration ? 8 : 1;
    if (registration) password.setAttribute("pattern", "(?=.*[A-Za-z])(?=.*\\d).{8,}");
    else password.removeAttribute("pattern");
    confirmPassword.type = "password";
    document.querySelector('[data-password-toggle="confirmPassword"]').setAttribute("aria-pressed", "false");

    formTitle.textContent = registration ? "Crie sua conta" : "Bem-vindo ao InBar!";
    formDescription.textContent = registration
      ? "Preencha seus dados para fazer parte do InBar."
      : "Descubra lugares, experiências e tudo o que acontece ao seu redor.";
    submitLabel.textContent = registration ? "Criar minha conta" : "Entrar";
    modePrompt.textContent = registration ? "Já possui uma conta?" : "Ainda não tem uma conta?";
    modeToggle.textContent = registration ? "Entrar" : "Criar conta";
    modeToggle.href = registration ? "#login" : "#cadastro";
    modeToggle.setAttribute("aria-label", registration ? "Ir para login" : "Ir para cadastro");
    document.title = registration ? "Criar conta | InBar" : "Entrar | InBar";
  }

  function validateField(input) {
    if (input.type === "checkbox") {
      if (input.checked) return "";
      return input.name === "ageConfirmation"
        ? "É necessário confirmar que você tem 16 anos ou mais."
        : "É necessário aceitar os termos para continuar.";
    }

    if (input.required && !input.value.trim()) {
      return fieldMessages[input.name]?.valueMissing || "Este campo é obrigatório.";
    }
    if (input.validity.valid) return "";
    const messages = fieldMessages[input.name] || {};
    if (input.validity.valueMissing) return messages.valueMissing || "Este campo é obrigatório.";
    if (input.validity.typeMismatch) return messages.typeMismatch || "Confira o formato informado.";
    if (input.validity.tooShort) return messages.tooShort || "O valor informado é muito curto.";
    if (input.validity.patternMismatch) return messages.patternMismatch || "Confira os requisitos informados.";
    return "Confira o valor informado.";
  }

  function validateForm() {
    const invalidFields = [];
    const controls = [...form.querySelectorAll("input")].filter(input => !input.closest("[hidden]"));

    controls.forEach(input => {
      const error = validateField(input);
      setFieldError(input.name, error);
      if (error) invalidFields.push(input);
    });

    if (isRegistration && password.value && confirmPassword.value && password.value !== confirmPassword.value) {
      setFieldError("confirmPassword", "As senhas não coincidem.");
      invalidFields.push(confirmPassword);
    }

    return invalidFields;
  }

  modeToggle.addEventListener("click", event => {
    event.preventDefault();
    setMode(!isRegistration);
  });

  document.getElementById("forgotPassword").addEventListener("click", event => {
    event.preventDefault();
    formStatus.dataset.state = "info";
    formStatus.textContent = "A recuperação de senha ainda não está disponível porque o protótipo não possui autenticação conectada a um servidor.";
  });

  document.querySelectorAll("[data-password-toggle]").forEach(button => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.passwordToggle);
      const reveal = input.type === "password";
      input.type = reveal ? "text" : "password";
      button.setAttribute("aria-pressed", String(reveal));
      button.setAttribute("aria-label", reveal ? "Ocultar senha" : "Mostrar senha");
    });
  });

  form.addEventListener("input", event => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.name === "phone") {
      target.value = target.value.replace(/\D/g, "").slice(0, 11);
    }
    if (target.name) setFieldError(target.name, "");
    if (isRegistration && target.name === "password" && confirmPassword.value) {
      setFieldError("confirmPassword", password.value === confirmPassword.value ? "" : "As senhas não coincidem.");
    }
    if (target.name === "confirmPassword" && password.value) {
      setFieldError("confirmPassword", password.value === confirmPassword.value ? "" : "As senhas não coincidem.");
    }
    formStatus.textContent = "";
    formStatus.removeAttribute("data-state");
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    formStatus.textContent = "";
    formStatus.removeAttribute("data-state");

    const invalidFields = validateForm();
    if (invalidFields.length) {
      formStatus.dataset.state = "error";
      formStatus.textContent = "Revise os campos indicados para continuar.";
      invalidFields[0].focus();
      return;
    }

    if (isRegistration) {
      try {
        window.InbarAuth.register({
          fullName: form.elements.namedItem("fullName").value,
          email: form.elements.namedItem("email").value,
          ageConfirmed: form.elements.namedItem("ageConfirmation").checked
        });
        formStatus.dataset.state = "info";
        formStatus.textContent = "usuario cadastrado com sucesso.";
      } catch (error) {
        console.error("Não foi possível concluir o cadastro de teste do InBar.", error);
        formStatus.dataset.state = "error";
        formStatus.textContent = error.message || "Não foi possível concluir o cadastro.";
      }
      return;
    }

    try {
      window.InbarAuth.login(
        form.elements.namedItem("email").value,
        password.value
      );
      redirectAuthenticatedUser();
    } catch (error) {
      console.error("Não foi possível iniciar a sessão de teste do InBar.", error);
      formStatus.dataset.state = "error";
      formStatus.textContent = "Não foi possível entrar. Verifique o armazenamento do navegador e tente novamente.";
    }
  });

  setMode(false);
  try {
    redirectAuthenticatedUser();
  } catch (error) {
    console.error("Não foi possível verificar o fluxo de acesso do InBar.", error);
    formStatus.dataset.state = "error";
    formStatus.textContent = "Não foi possível verificar sua sessão. Verifique o armazenamento do navegador e tente novamente.";
  }
})();
