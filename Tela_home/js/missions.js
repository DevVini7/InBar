(function () {
const toast = document.getElementById("missionsToast");
let toastTimer;
let selectedCategory = "Todos";
let selectedCard = null;
let selectedIndex = -1;
const searchInput = document.getElementById("searchInput");
const missionCards = [...document.querySelectorAll(".mission-card")];
const categoryMap = {
  "Todos": [0, 1, 2, 3, 4],
  "Bares": [0, 2],
  "Eventos": [3],
  "Música ao vivo": [3],
  "Happy Hour": [2],
  "Outros": [1, 4]
};

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
  const visibleIndexes = categoryMap[selectedCategory] || categoryMap.Todos;
  document.getElementById("clearSearch").style.display = searchInput.value ? "block" : "none";

  missionCards.forEach((card, index) => {
    const searchable = normalizeText(`${card.dataset.search} ${card.innerText}`);
    card.hidden = !visibleIndexes.includes(index) || Boolean(term && !searchable.includes(term));
  });

  const heading = document.querySelector(".section-title h2");
  heading.textContent = selectedCategory === "Todos" ? "Missões Ativas" : selectedCategory;
  document.getElementById("missionsList").setAttribute(
    "aria-label",
    selectedCategory === "Todos" ? "Todas as missões" : `Missões da categoria ${selectedCategory}`
  );
}

searchInput.addEventListener("input", filterMissions);
document.querySelectorAll(".mission-filter").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".mission-filter").forEach(item => item.classList.remove("selected"));
    button.classList.add("selected");
    selectedCategory = button.dataset.category;
    filterMissions();
    showToast(selectedCategory === "Todos"
      ? "Exibindo todas as missões."
      : `Exibindo missões relacionadas a: ${selectedCategory}.`);
  });
});

const missionData = [
  { progress: 1, goal: 3 },
  { progress: 0, goal: 1 },
  { progress: 0, goal: 1 },
  { progress: 0, goal: 1 },
  { progress: 0, goal: 2 }
];

const modal = document.getElementById("missionModal");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");
const modalIcon = document.getElementById("modalIcon");
const modalRewards = document.getElementById("modalRewards");
const modalProgressBar = document.getElementById("modalProgressBar");
const modalCount = document.getElementById("modalCount");
const modalAction = document.getElementById("modalAction");

function updateCard(index) {
  const card = missionCards[index];
  const data = missionData[index];
  const count = card.querySelector(".count");
  const bar = card.querySelector(".mission-progress span");
  count.textContent = `${data.progress}/${data.goal}`;
  bar.style.width = `${(data.progress / data.goal) * 100}%`;
}

function refreshModal() {
  const data = missionData[selectedIndex];
  modalProgressBar.style.width = `${(data.progress / data.goal) * 100}%`;
  modalCount.textContent = `${data.progress}/${data.goal} concluído(s)`;
  modalAction.disabled = data.progress >= data.goal;
  modalAction.textContent = data.progress >= data.goal ? "Missão concluída ✓" : "Registrar progresso";
}

function openMission(card, index) {
  selectedCard = card;
  selectedIndex = index;
  modalTitle.textContent = card.querySelector("h3").textContent;
  modalDescription.textContent = card.querySelector(".mission-description p").innerText.replace(/\n/g, " ");
  modalIcon.textContent = card.querySelector(".mission-icon").textContent.trim();
  const reward = card.querySelector(".mission-reward");
  const experience = document.createElement("strong");
  const points = document.createElement("span");
  experience.textContent = reward.querySelector("b").innerText.trim();
  points.textContent = reward.querySelector("p").innerText.trim();
  modalRewards.replaceChildren(experience, points);
  refreshModal();
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

missionCards.forEach((card, index) => {
  card.setAttribute("tabindex", "0");
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Ver detalhes: ${card.querySelector("h3").textContent}`);
  card.addEventListener("click", () => openMission(card, index));
  card.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMission(card, index);
    }
  });
});

modalAction.addEventListener("click", () => {
  if (selectedIndex < 0) return;
  const data = missionData[selectedIndex];
  if (data.progress < data.goal) {
    data.progress += 1;
    updateCard(selectedIndex);
    refreshModal();
    if (data.progress >= data.goal) showToast("Missão concluída! Recompensa demonstrativa liberada.");
    else showToast("Progresso atualizado!");
  }
});

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  selectedIndex = -1;
  if (selectedCard) selectedCard.focus();
  selectedCard = null;
}
document.getElementById("modalClose").addEventListener("click", closeModal);
modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
document.addEventListener("keydown", event => { if (event.key === "Escape") closeModal(); });

filterMissions();
})();
