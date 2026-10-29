window.InbarInterests = (() => {
  const STORAGE_PREFIX = "inbar:preferences:v1:";
  const ANONYMOUS_ID_KEY = "inbar:anonymous-user-id:v1";
  const categories = [
    {
      id: "musica",
      label: "Música",
      icon: "music-2",
      interests: [
        ["rock", "Rock"], ["pop", "Pop"], ["sertanejo", "Sertanejo"], ["pagode", "Pagode"],
        ["samba", "Samba"], ["eletronica", "Eletrônica"], ["funk", "Funk"],
        ["hip-hop-rap", "Hip Hop / Rap"], ["jazz-blues", "Jazz / Blues"], ["mpb", "MPB"],
        ["musica-ao-vivo", "Música ao vivo"]
      ]
    },
    {
      id: "gastronomia-bares",
      label: "Gastronomia e bares",
      icon: "beer",
      interests: [
        ["bares-tradicionais", "Bares tradicionais"], ["cervejarias", "Cervejarias"],
        ["drinks-coqueteis", "Drinks e coquetéis"], ["botecos", "Botecos"],
        ["restaurantes", "Restaurantes"], ["gastronomia-internacional", "Gastronomia internacional"],
        ["cafeterias", "Cafeterias"], ["happy-hour", "Happy Hour"]
      ]
    },
    {
      id: "esportes",
      label: "Esportes",
      icon: "locate-fixed",
      interests: [
        ["futebol", "Futebol"], ["basquete", "Basquete"], ["volei", "Vôlei"],
        ["corrida", "Corrida"], ["academia", "Academia"], ["ciclismo", "Ciclismo"],
        ["skate", "Skate"], ["artes-marciais", "Artes marciais"]
      ]
    },
    {
      id: "games-jogos",
      label: "Games e jogos",
      icon: "gamepad-2",
      interests: [
        ["videogames", "Videogames"], ["jogos-tabuleiro", "Jogos de tabuleiro"],
        ["sinuca", "Sinuca"], ["boliche", "Boliche"], ["e-sports", "E-sports"],
        ["jogos-cartas", "Jogos de cartas"]
      ]
    },
    {
      id: "ar-livre-natureza",
      label: "Ar livre e natureza",
      icon: "map",
      interests: [
        ["trilhas", "Trilhas"], ["camping", "Camping"], ["parques", "Parques"],
        ["cachoeiras", "Cachoeiras"], ["passeios-bicicleta", "Passeios de bicicleta"],
        ["pesca", "Pesca"], ["atividades-ar-livre", "Atividades ao ar livre"]
      ]
    },
    {
      id: "arte-cultura",
      label: "Arte e cultura",
      icon: "images",
      interests: [
        ["cinema", "Cinema"], ["teatro", "Teatro"], ["fotografia", "Fotografia"],
        ["exposicoes", "Exposições"], ["museus", "Museus"], ["shows-culturais", "Shows culturais"],
        ["literatura", "Literatura"]
      ]
    },
    {
      id: "vida-noturna-festas",
      label: "Vida noturna e festas",
      icon: "disco",
      interests: [
        ["baladas", "Baladas"], ["festas-universitarias", "Festas universitárias"],
        ["festivais", "Festivais"], ["festas-tematicas", "Festas temáticas"],
        ["danca", "Dança"], ["festas-eletronicas", "Festas eletrônicas"]
      ]
    },
    {
      id: "aventura-experiencias",
      label: "Aventura e experiências",
      icon: "navigation",
      interests: [
        ["kart", "Kart"], ["paintball", "Paintball"], ["escalada", "Escalada"],
        ["arvorismo", "Arvorismo"], ["escape-rooms", "Escape rooms"],
        ["tirolesa", "Tirolesa"], ["experiencias-diferentes", "Experiências diferentes"]
      ]
    },
    {
      id: "social-convivencia",
      label: "Social e convivência",
      icon: "users-round",
      interests: [
        ["conhecer-pessoas", "Conhecer pessoas"], ["encontrar-amigos", "Encontrar amigos"],
        ["cafes-encontros", "Cafés e encontros"], ["networking", "Networking"],
        ["eventos-sociais", "Eventos sociais"]
      ]
    },
    {
      id: "outros-hobbies",
      label: "Outros hobbies",
      icon: "ellipsis",
      interests: [
        ["leitura", "Leitura"], ["pets", "Pets"], ["artesanato", "Artesanato"],
        ["colecionismo", "Colecionismo"], ["culinaria", "Culinária"], ["tecnologia", "Tecnologia"]
      ]
    }
  ];

  const categoriesById = new Map(categories.map(category => [category.id, category]));
  const categoryByInterestId = new Map(
    categories.flatMap(category => category.interests.map(([id]) => [id, category.id]))
  );
  const placesById = {
    1: { categoryIds: ["musica", "gastronomia-bares"], interestIds: ["drinks-coqueteis", "musica-ao-vivo"] },
    2: { categoryIds: ["gastronomia-bares"], interestIds: ["drinks-coqueteis", "happy-hour"] },
    3: { categoryIds: ["musica", "vida-noturna-festas"], interestIds: ["baladas", "musica-ao-vivo"] },
    4: { categoryIds: ["gastronomia-bares"], interestIds: ["botecos", "happy-hour"] },
    5: { categoryIds: ["gastronomia-bares", "social-convivencia"], interestIds: ["bares-tradicionais", "happy-hour", "encontrar-amigos"] },
    6: { categoryIds: ["musica", "vida-noturna-festas"], interestIds: ["festivais", "musica-ao-vivo"] },
    7: { categoryIds: ["gastronomia-bares"], interestIds: ["drinks-coqueteis", "happy-hour"] },
    8: { categoryIds: ["musica"], interestIds: ["samba", "musica-ao-vivo"] },
    9: { categoryIds: ["gastronomia-bares"], interestIds: ["drinks-coqueteis"] },
    10: { categoryIds: ["musica", "vida-noturna-festas"], interestIds: ["baladas", "musica-ao-vivo"] },
    11: { categoryIds: ["musica"], interestIds: ["rock", "musica-ao-vivo"] },
    12: { categoryIds: ["vida-noturna-festas"], interestIds: ["baladas", "festas-tematicas"] },
    13: { categoryIds: ["gastronomia-bares"], interestIds: ["cafeterias", "happy-hour"] },
    14: { categoryIds: ["musica", "gastronomia-bares"], interestIds: ["samba", "musica-ao-vivo"] },
    15: { categoryIds: ["games-jogos"], interestIds: ["boliche"] },
    16: { categoryIds: ["games-jogos"], interestIds: ["jogos-tabuleiro"] },
    17: { categoryIds: ["social-convivencia"], interestIds: ["encontrar-amigos"] },
    18: { categoryIds: ["musica", "vida-noturna-festas", "ar-livre-natureza"], interestIds: ["festivais", "musica-ao-vivo", "atividades-ar-livre"] },
    19: { categoryIds: ["musica", "vida-noturna-festas"], interestIds: ["baladas", "musica-ao-vivo", "happy-hour"] },
    20: { categoryIds: ["musica", "gastronomia-bares"], interestIds: ["drinks-coqueteis", "musica-ao-vivo", "happy-hour"] },
    21: { categoryIds: ["gastronomia-bares"], interestIds: ["restaurantes"] },
    22: { categoryIds: ["gastronomia-bares"], interestIds: [] },
    23: { categoryIds: ["musica", "gastronomia-bares"], interestIds: ["botecos", "musica-ao-vivo", "happy-hour"] },
    24: { categoryIds: ["gastronomia-bares"], interestIds: ["drinks-coqueteis", "happy-hour"] },
    25: { categoryIds: ["games-jogos"], interestIds: ["boliche"] },
    26: { categoryIds: ["social-convivencia"], interestIds: ["encontrar-amigos"] }
  };

  function getIdentity() {
    const currentUser = window.InbarAuth && typeof window.InbarAuth.getCurrentUser === "function"
      ? window.InbarAuth.getCurrentUser()
      : null;
    let anonymousId = window.localStorage.getItem(ANONYMOUS_ID_KEY);
    if (!anonymousId) {
      const randomId = window.crypto && typeof window.crypto.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      anonymousId = `guest-${randomId}`;
      window.localStorage.setItem(ANONYMOUS_ID_KEY, anonymousId);
    }
    return {
      userId: currentUser && typeof currentUser.id === "string" ? currentUser.id : null,
      anonymousId
    };
  }

  function storageKey(identity) {
    return `${STORAGE_PREFIX}${identity.userId || identity.anonymousId}`;
  }

  function createEmptyPreferences(identity) {
    return {
      schemaVersion: 1,
      userId: identity.userId,
      anonymousId: identity.anonymousId,
      categoryIds: [],
      interestIds: [],
      completed: false,
      completedAt: null,
      updatedAt: null
    };
  }

  function validatePreferences(preferences) {
    if (!preferences || preferences.schemaVersion !== 1 ||
        typeof preferences.completed !== "boolean" ||
        !Array.isArray(preferences.categoryIds) ||
        !Array.isArray(preferences.interestIds) ||
        !preferences.categoryIds.every(id => categoriesById.has(id)) ||
        !preferences.interestIds.every(id => categoryByInterestId.has(id)) ||
        !preferences.interestIds.every(id => preferences.categoryIds.includes(categoryByInterestId.get(id)))) {
      throw new Error("Os dados de personalização salvos são inválidos ou incompatíveis.");
    }
    return preferences;
  }

  function loadPreferences() {
    const identity = getIdentity();
    const serialized = window.localStorage.getItem(storageKey(identity));
    if (!serialized) return createEmptyPreferences(identity);
    return validatePreferences(JSON.parse(serialized));
  }

  function savePreferences(categoryIds, interestIds) {
    if (!Array.isArray(categoryIds) || !Array.isArray(interestIds)) {
      throw new TypeError("Categorias e interesses devem ser informados como listas.");
    }
    const identity = getIdentity();
    const selectedCategories = [...new Set(categoryIds)];
    const selectedInterests = [...new Set(interestIds)];
    if (!selectedCategories.every(id => categoriesById.has(id)) ||
        !selectedInterests.every(id => categoryByInterestId.has(id)) ||
        !selectedInterests.every(id => selectedCategories.includes(categoryByInterestId.get(id)))) {
      throw new Error("Não foi possível salvar interesses que não correspondem às categorias selecionadas.");
    }
    const existing = loadPreferences();
    const now = new Date().toISOString();
    const preferences = {
      schemaVersion: 1,
      userId: identity.userId,
      anonymousId: identity.anonymousId,
      categoryIds: selectedCategories,
      interestIds: selectedInterests,
      completed: true,
      completedAt: existing.completedAt || now,
      updatedAt: now
    };
    window.localStorage.setItem(storageKey(identity), JSON.stringify(preferences));
    return preferences;
  }

  function attachPlaceMetadata(places) {
    places.forEach(place => {
      const metadata = placesById[place.id] || { categoryIds: [], interestIds: [] };
      place.interests = {
        categoryIds: [...metadata.categoryIds],
        tags: [...metadata.interestIds]
      };
    });
  }

  function getCompatibilityScore(entity, preferences = loadPreferences()) {
    if (!preferences.categoryIds.length && !preferences.interestIds.length) return 0;
    const entityInterests = entity.interests || { categoryIds: [], tags: [] };
    const matchingCategories = preferences.categoryIds.filter(id => entityInterests.categoryIds.includes(id)).length;
    const matchingInterests = preferences.interestIds.filter(id => entityInterests.tags.includes(id)).length;
    const possibleScore = preferences.categoryIds.length + preferences.interestIds.length * 2;
    return Math.round((matchingCategories + matchingInterests * 2) / possibleScore * 100);
  }

  function rankEntities(entities, preferences = loadPreferences()) {
    return entities
      .map((entity, index) => ({ entity, score: getCompatibilityScore(entity, preferences), index }))
      .sort((first, second) => second.score - first.score || first.index - second.index)
      .map(({ entity, score }) => ({ entity, score }));
  }

  function requiresOnboarding() {
    return !loadPreferences().completed;
  }

  return {
    categories,
    loadPreferences,
    savePreferences,
    attachPlaceMetadata,
    getCompatibilityScore,
    rankEntities,
    requiresOnboarding
  };
})();
