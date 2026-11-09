window.InbarFavorites = (() => {
  const STORAGE_PREFIX = "inbar:favorites:v1:";

  function currentUserId() {
    const user = window.InbarAuth.getCurrentUser();
    if (!user || typeof user.id !== "string" || !user.id) {
      throw new Error("Entre na sua conta para salvar lugares favoritos.");
    }
    return user.id;
  }

  function storageKey(userId = currentUserId()) {
    return `${STORAGE_PREFIX}${encodeURIComponent(userId)}`;
  }

  function readFavorites(userId = currentUserId()) {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return [];

    let favoriteIds;
    try {
      favoriteIds = JSON.parse(raw);
    } catch (error) {
      throw new Error("Os favoritos salvos neste navegador estão inválidos.", { cause: error });
    }
    if (!Array.isArray(favoriteIds) || !favoriteIds.every(id =>
      (typeof id === "string" || Number.isInteger(id))
      && window.inbarPlaces.some(place => String(place.id) === String(id))
    )) {
      throw new Error("A lista de favoritos não corresponde aos locais cadastrados.");
    }
    return [...new Set(favoriteIds.map(String))];
  }

  function getFavorites() {
    return readFavorites();
  }

  function has(placeId) {
    return readFavorites().includes(String(placeId));
  }

  function toggle(placeId) {
    const place = window.inbarPlaces.find(item => String(item.id) === String(placeId));
    if (!place) throw new Error("Este local não está mais disponível no catálogo.");

    const userId = currentUserId();
    const favorites = readFavorites(userId);
    const placeKey = String(place.id);
    const isFavorite = favorites.includes(placeKey);
    const updated = isFavorite
      ? favorites.filter(id => id !== placeKey)
      : [...favorites, placeKey];
    window.localStorage.setItem(storageKey(userId), JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("inbar:favorites-updated", {
      detail: { placeId: placeKey, isFavorite: !isFavorite, userId }
    }));
    return !isFavorite;
  }

  window.addEventListener("storage", event => {
    if (event.key?.startsWith(STORAGE_PREFIX)) {
      window.dispatchEvent(new CustomEvent("inbar:favorites-updated"));
    }
  });

  return { getFavorites, has, toggle };
})();
