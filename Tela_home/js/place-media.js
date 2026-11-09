window.InbarPlaceMedia = (() => {
  const fallbackById = new Map();
  const duplicateImageUrls = new Set();
  const imageCounts = new Map();

  (window.inbarPlaces || []).forEach(place => {
    const source = place.coverImage || place.image || "";
    if (!source) return;
    imageCounts.set(source, (imageCounts.get(source) || 0) + 1);
  });
  imageCounts.forEach((count, source) => {
    if (count > 1) duplicateImageUrls.add(source);
  });

  function escapeXml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;"
    })[character]);
  }

  function fallback(place) {
    if (fallbackById.has(place.id)) return fallbackById.get(place.id);
    const category = escapeXml(place.category || "Local");
    const name = escapeXml(place.name || "InBar");
    const hue = (Number(place.id) * 47) % 360;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="hsl(${hue} 50% 18%)"/><stop offset="1" stop-color="#080a18"/></linearGradient><pattern id="grid" width="42" height="42" patternUnits="userSpaceOnUse"><path d="M42 0H0V42" fill="none" stroke="#fff" stroke-opacity=".04"/></pattern></defs><rect width="900" height="560" rx="28" fill="url(#bg)"/><rect width="900" height="560" rx="28" fill="url(#grid)"/><circle cx="760" cy="120" r="160" fill="hsl(${hue} 75% 55%)" opacity=".12"/><path d="M0 460Q250 350 470 440T900 410V560H0Z" fill="#060815" opacity=".55"/><text x="54" y="390" fill="#d58aff" font-family="Arial,sans-serif" font-size="22" font-weight="700" letter-spacing="3">${category.toLocaleUpperCase("pt-BR")}</text><text x="54" y="442" fill="#f7f4ff" font-family="Arial,sans-serif" font-size="34" font-weight="700">${name}</text><text x="54" y="488" fill="#b9bfd2" font-family="Arial,sans-serif" font-size="17">Imagem ilustrativa · foto não disponível</text></svg>`;
    const source = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    fallbackById.set(place.id, source);
    return source;
  }

  function getCoverImage(place) {
    const source = place.coverImage || place.image || "";
    return source && !duplicateImageUrls.has(source) ? source : fallback(place);
  }

  function isIllustrative(place) {
    const source = place.coverImage || place.image || "";
    return Boolean(place.imageIsIllustrative || !source || duplicateImageUrls.has(source));
  }

  function applyFallback(image, place) {
    if (image.dataset.inbarFallbackApplied === "true") return;
    image.dataset.inbarFallbackApplied = "true";
    image.src = fallback(place);
    image.alt = `Imagem ilustrativa de ${place.name}; foto não disponível`;
  }

  return { getCoverImage, isIllustrative, applyFallback };
})();
