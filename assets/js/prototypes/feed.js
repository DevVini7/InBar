// Controla as interações da página. Os dados permanecem no navegador durante esta sessão.
(() => {
  const data = window.INBAR_DATA;
  const state = {
    posts: data.posts.map((post) => ({ ...post, comments: [...post.comments] })),
    filter: 'todos',
    search: '',
    pendingImage: '',
    joinedMissions: new Set()
  };

  const app = document.querySelector('#app-view');
  const searchInput = document.querySelector('#search-input');
  const publishDialog = document.querySelector('#publish-dialog');
  const commentsDialog = document.querySelector('#comments-dialog');
  const publishForm = document.querySelector('#publish-form');
  const commentForm = document.querySelector('#comment-form');
  const venueSelect = document.querySelector('#venue-select');
  const imageInput = document.querySelector('#post-image');
  const imagePreview = document.querySelector('#image-preview');
  let activeCommentPost = null;
  let toastTimer;

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
  const slugify = (value) => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const venueFor = (id) => data.venues.find((venue) => venue.id === id);
  const routeParts = () => decodeURIComponent(location.hash.replace(/^#\/?/, '') || 'feed').split('/');
  const currentRoute = () => routeParts()[0] || 'feed';

  function showToast(message) {
    const toast = document.querySelector('#toast');
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 2800);
  }

  function postCard(post, index) {
    const venue = venueFor(post.venueId);
    const authorPath = `pages/prototypes/feed/index.html#/perfil/${encodeURIComponent(slugify(post.author))}`;
    const venuePath = `pages/prototypes/feed/index.html#/estabelecimento/${encodeURIComponent(post.venueId)}`;
    const searchText = `${post.author} ${venue?.name || ''} ${venue?.category || ''} ${post.message}`.toLocaleLowerCase('pt-BR');
    return `<article class="post-card" data-post-card="${escapeHtml(post.id)}" data-type="${escapeHtml(post.type)}" data-search="${escapeHtml(searchText)}" style="animation-delay:${Math.min(index, 8) * 35}ms">
      <div class="post-main">
        <div class="post-head">
          <a class="author-link" href="${authorPath}" aria-label="Abrir perfil de ${escapeHtml(post.author)}">
            <img class="avatar" src="${escapeHtml(post.avatar)}" alt="Foto de ${escapeHtml(post.author)}" loading="lazy">
            <span class="author-meta"><strong class="author-name">${escapeHtml(post.author)}</strong><span class="post-time">${escapeHtml(post.time)} · ${escapeHtml(venue?.name || '')}</span></span>
          </a>
          <details class="options"><summary aria-label="Opções da publicação"><i class="fa-solid fa-ellipsis"></i></summary>
            <div class="options-menu">
              <button type="button" data-action="visit-venue" data-venue="${escapeHtml(post.venueId)}"><i class="fa-solid fa-location-dot"></i> Ver estabelecimento</button>
              <button type="button" data-action="report-post" data-post="${escapeHtml(post.id)}"><i class="fa-regular fa-flag"></i> Sinalizar publicação</button>
            </div>
          </details>
        </div>
        <a class="post-image-wrap" href="${venuePath}" aria-label="Ver ${escapeHtml(venue?.name || 'estabelecimento')}">
          <img class="post-image" src="${escapeHtml(post.image || venue?.image || '')}" alt="Ambiente de ${escapeHtml(venue?.name || 'estabelecimento')}" loading="lazy">
        </a>
        <p class="post-message">${escapeHtml(post.message)}</p>
        <a class="venue-link" href="${venuePath}"><i class="fa-solid fa-location-dot"></i><span>${escapeHtml(venue?.name || 'Estabelecimento')}</span></a>
      </div>
      <footer class="post-actions">
        <div class="action-group">
          <button type="button" class="action-button like-button ${post.liked ? 'is-liked' : ''}" data-action="like" data-post="${escapeHtml(post.id)}" aria-pressed="${post.liked}" aria-label="Curtir publicação">
            <i class="${post.liked ? 'fa-solid' : 'fa-regular'} fa-heart"></i><span>${post.likes}</span>
          </button>
          <button type="button" class="action-button" data-action="comments" data-post="${escapeHtml(post.id)}" aria-label="Abrir comentários">
            <i class="fa-regular fa-comment"></i><span>${post.comments.length}</span>
          </button>
        </div>
        <button type="button" class="action-button" data-action="share" data-post="${escapeHtml(post.id)}" aria-label="Compartilhar publicação">
          <i class="fa-solid fa-share-nodes"></i><span class="share-label">Compartilhar</span>
        </button>
      </footer>
    </article>`;
  }

  function applyPostFilters() {
    const container = document.querySelector('#posts-container');
    if (!container) return;
    const selectedType = { pessoas: 'user', estabelecimentos: 'establishment' }[state.filter];
    const filteredPosts = state.posts.filter((post) => {
      const typeMatches = !selectedType || post.type === selectedType;
      const venue = venueFor(post.venueId);
      const searchText = `${post.author} ${venue?.name || ''} ${venue?.category || ''} ${post.message}`.toLocaleLowerCase('pt-BR');
      return typeMatches && (!state.search || searchText.includes(state.search));
    });
    const emptyMessage = state.search
      ? 'Nenhuma publicação encontrada. Tente outro filtro ou termo de busca.'
      : state.filter === 'pessoas'
        ? 'Ainda não existem publicações de pessoas nesta categoria.'
        : state.filter === 'estabelecimentos'
          ? 'Ainda não existem publicações de estabelecimentos nesta categoria.'
          : 'Ainda não existem publicações no feed.';
    container.innerHTML = filteredPosts.map(postCard).join('') + `<div class="empty-state" id="empty-posts"${filteredPosts.length ? ' hidden' : ''}>${emptyMessage}</div>`;
    document.querySelectorAll('[data-filter]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.filter === state.filter));
    });
  }

  function renderPosts() {
    const container = document.querySelector('#posts-container');
    if (!container) return;
    applyPostFilters();
  }

  function renderPeople(people = data.nearby) {
    return people.map((person) => {
      const venue = venueFor(person.venueId);
      return `<button type="button" class="person-row" data-action="open-profile" data-person="${escapeHtml(person.id)}">
        <img class="avatar" src="${escapeHtml(person.avatar)}" alt="Foto de ${escapeHtml(person.name)}" loading="lazy">
        <span class="person-info"><strong>${escapeHtml(person.name)}</strong><span>${escapeHtml(person.activity)} · ${escapeHtml(venue?.name || '')}</span></span>
        <span class="person-distance">${escapeHtml(person.distance)}</span>
      </button>`;
    }).join('');
  }

  function renderVenueDiscovery() {
    return data.venues.slice(0, 4).map((venue) => `<a class="discovery-venue" href="pages/prototypes/feed/index.html#/estabelecimento/${encodeURIComponent(venue.id)}">
      <img src="${escapeHtml(venue.image)}" alt="" loading="lazy"><div><strong>${escapeHtml(venue.name)}</strong><span>${escapeHtml(venue.category)} · ${escapeHtml(venue.area)}</span></div>
    </a>`).join('');
  }

  function renderFeed() {
    app.innerHTML = `<section class="page-heading">
      <div><p class="eyebrow">Brasília, agora</p><h1>Feed ao Vivo</h1><p>Veja o que está acontecendo agora nos lugares mais próximos.</p></div>
      <button class="button button-primary" type="button" data-action="publish"><i class="fa-regular fa-image"></i><span>Publicar</span></button>
    </section>
    <div class="filters" role="group" aria-label="Filtrar publicações">
      <button class="filter-button" type="button" data-filter="todos" aria-pressed="true">Todos</button>
      <button class="filter-button" type="button" data-filter="pessoas" aria-pressed="false">Pessoas</button>
      <button class="filter-button" type="button" data-filter="estabelecimentos" aria-pressed="false">Estabelecimentos</button>
    </div>
    <div class="feed-layout">
      <section id="posts-container" class="posts-grid" aria-label="Publicações"></section>
      <aside class="sidebar" aria-label="Descobertas">
        <section class="side-panel">
          <div class="panel-heading"><h2>Pessoas próximas</h2><span class="live-label"><i class="live-dot"></i> Demonstração</span></div>
          <div class="people-list">${renderPeople()}</div>
          <div class="panel-foot"><a class="text-button" href="pages/prototypes/feed/index.html#/pessoas">Ver todos <i class="fa-solid fa-arrow-right"></i></a></div>
          <p class="privacy-note">Atividade e distâncias fictícias para demonstração. O Inbar não rastreia a localização de pessoas.</p>
        </section>
        <section class="side-panel discovery-panel"><h2>Descubra lugares</h2>${renderVenueDiscovery()}<div class="panel-foot"><a class="text-button" href="pages/prototypes/feed/index.html#/explorar">Explorar estabelecimentos <i class="fa-solid fa-arrow-right"></i></a></div></section>
      </aside>
    </div>`;
    renderPosts();
  }

  function renderVenuePage(id) {
    const venue = venueFor(id);
    if (!venue) return renderNotFound();
    const venuePosts = state.posts.filter((post) => post.venueId === venue.id);
    app.innerHTML = `<section class="destination-heading"><p class="eyebrow">${escapeHtml(venue.category)} · ${escapeHtml(venue.area)}</p><h1>${escapeHtml(venue.name)}</h1><p>${escapeHtml(venue.description)}</p><p style="margin-top:10px;color:#827a90;font-size:10px">Estabelecimento demonstrativo. Informações e publicações são fictícias.</p></section>
      <div class="destination-grid" style="margin-bottom:22px"><article class="destination-card"><img src="${escapeHtml(venue.image)}" alt="Ambiente de ${escapeHtml(venue.name)}"><div class="destination-card-body"><h2>Sobre o lugar</h2><p>${escapeHtml(venue.description)} · ${escapeHtml(venue.area)}</p></div></article></div>
      <h2 style="font:700 15px Manrope,sans-serif;margin:0 0 14px">Publicações neste lugar</h2>
      <section class="posts-grid">${venuePosts.length ? venuePosts.map(postCard).join('') : '<p class="empty-state">Ainda não há publicações neste lugar.</p>'}</section>`;
  }

  function renderExplore() {
    const query = state.search;
    const venues = data.venues.filter((venue) => `${venue.name} ${venue.category} ${venue.area} ${venue.description}`.toLocaleLowerCase('pt-BR').includes(query));
    app.innerHTML = `<section class="destination-heading"><p class="eyebrow">Encontre seu próximo lugar</p><h1>Explorar</h1><p>Bares, lounges, restaurantes e música ao vivo em Brasília.</p></section>
      <section class="destination-grid">${venues.map((venue) => `<a class="destination-card" href="pages/prototypes/feed/index.html#/estabelecimento/${encodeURIComponent(venue.id)}"><img src="${escapeHtml(venue.image)}" alt="Ambiente de ${escapeHtml(venue.name)}" loading="lazy"><div class="destination-card-body"><h2>${escapeHtml(venue.name)}</h2><p>${escapeHtml(venue.category)} · ${escapeHtml(venue.area)}<br>${escapeHtml(venue.description)}</p></div></a>`).join('') || '<p class="empty-state">Nenhum estabelecimento encontrado.</p>'}</section>`;
  }

  function renderMap() {
    app.innerHTML = `<section class="destination-heading"><p class="eyebrow">Locais demonstrativos</p><h1>Mapa</h1><p>Explore os estabelecimentos cadastrados. Esta demonstração não utiliza GPS nem apresenta localização em tempo real.</p></section>
      <section class="destination-grid">${data.venues.map((venue) => `<a class="destination-card" href="pages/prototypes/feed/index.html#/estabelecimento/${encodeURIComponent(venue.id)}"><img src="${escapeHtml(venue.image)}" alt="Ambiente de ${escapeHtml(venue.name)}" loading="lazy"><div class="destination-card-body"><h2><i class="fa-solid fa-location-dot" style="color:#c68afa;margin-right:5px"></i>${escapeHtml(venue.name)}</h2><p>${escapeHtml(venue.category)} · ${escapeHtml(venue.area)}</p></div></a>`).join('')}</section>`;
  }

  function renderMissions() {
    const missions = [
      { id: 'descoberta', title: 'Rota de descobertas', text: 'Conheça três lugares diferentes esta semana.', icon: 'fa-compass' },
      { id: 'noite-musical', title: 'Noite musical', text: 'Descubra uma casa com música ao vivo.', icon: 'fa-music' },
      { id: 'novo-sabor', title: 'Novo sabor', text: 'Explore um restaurante que ainda não conhece.', icon: 'fa-utensils' }
    ];
    app.innerHTML = `<section class="destination-heading"><p class="eyebrow">Planos para sair</p><h1>Missões</h1><p>Desafios fictícios para explorar a cidade. O progresso fica apenas nesta sessão de demonstração.</p></section>
      <section class="destination-grid">${missions.map((mission) => `<article class="destination-card"><div class="destination-card-body" style="padding:18px"><p style="color:#ca91fc;font-size:20px;margin-bottom:12px"><i class="fa-solid ${mission.icon}"></i></p><h2>${mission.title}</h2><p>${mission.text}</p><button class="button button-${state.joinedMissions.has(mission.id) ? 'quiet' : 'primary'}" style="margin-top:16px" type="button" data-action="join-mission" data-mission="${mission.id}">${state.joinedMissions.has(mission.id) ? 'Participando' : 'Participar'}</button></div></article>`).join('')}</section>`;
  }

  function renderPeoplePage() {
    app.innerHTML = `<section class="destination-heading"><p class="eyebrow">Comunidade</p><h1>Pessoas próximas</h1><p>Perfis e atividades ilustrativos, sem rastreamento de localização real.</p></section>
      <section class="destination-list">${data.nearby.map((person) => `<article class="destination-person"><img class="avatar" src="${escapeHtml(person.avatar)}" alt="Foto de ${escapeHtml(person.name)}"><span class="person-info"><strong>${escapeHtml(person.name)}</strong><span>${escapeHtml(person.activity)} · ${escapeHtml(venueFor(person.venueId)?.name || '')} · ${escapeHtml(person.distance)}</span></span><button class="button button-quiet" type="button" data-action="open-profile" data-person="${escapeHtml(person.id)}">Perfil</button></article>`).join('')}</section>`;
  }

  function renderProfile(id) {
    const isAdmin = id === 'inbar-adm';
    const person = data.nearby.find((item) => item.id === id);
    const posts = state.posts.filter((post) => slugify(post.author) === id);
    const author = isAdmin ? 'ADM INBAR' : person?.name || posts[0]?.author || (id === 'voce' ? 'Você' : null);
    if (!author) return renderNotFound();
    const avatar = isAdmin ? 'assets/images/prototypes/adm-inbar-perfil.jpg' : person?.avatar || posts[0]?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=85';
    app.innerHTML = `<section class="destination-heading"><p class="eyebrow">${isAdmin ? 'Conta administrativa' : 'Perfil demonstrativo'}</p><div style="display:flex;align-items:center;gap:14px;margin-bottom:12px"><img class="avatar" style="width:58px;height:58px" src="${escapeHtml(avatar)}" alt="Foto de ${escapeHtml(author)}"><h1 style="margin:0">${escapeHtml(author)}</h1></div><p>${isAdmin ? 'Perfil administrativo da plataforma INBAR.' : 'Perfil de demonstração do Inbar. As publicações abaixo são conteúdo fictício.'}</p></section>
      <h2 style="font:700 15px Manrope,sans-serif;margin:0 0 14px">Publicações</h2><section class="posts-grid">${posts.length ? posts.map(postCard).join('') : '<p class="empty-state">Este perfil ainda não tem publicações demonstrativas.</p>'}</section>`;
  }

  function renderHome() {
    app.innerHTML = `<section class="destination-heading"><p class="eyebrow">Descubra Brasília</p><h1>inbar</h1><p>Seu próximo lugar favorito começa aqui. Explore o feed e encontre o que está acontecendo.</p><a class="button button-primary" style="margin-top:16px" href="pages/prototypes/feed/index.html#/feed"><i class="fa-solid fa-bolt"></i>Ir para o Feed</a></section><section class="destination-grid">${data.venues.slice(0, 3).map((venue) => `<a class="destination-card" href="pages/prototypes/feed/index.html#/estabelecimento/${encodeURIComponent(venue.id)}"><img src="${escapeHtml(venue.image)}" alt="Ambiente de ${escapeHtml(venue.name)}"><div class="destination-card-body"><h2>${escapeHtml(venue.name)}</h2><p>${escapeHtml(venue.category)} · ${escapeHtml(venue.area)}</p></div></a>`).join('')}</section>`;
  }

  function renderNotFound() {
    app.innerHTML = '<section class="destination-heading"><p class="eyebrow">Página não encontrada</p><h1>Esse caminho não existe</h1><p>Volte ao feed para continuar explorando.</p><a class="button button-primary" style="margin-top:16px" href="pages/prototypes/feed/index.html#/feed">Abrir Feed</a></section>';
  }

  function renderRoute() {
    const [route, parameter] = routeParts();
    document.querySelectorAll('.nav-link[data-nav]').forEach((link) => {
      const active = (route === 'estabelecimento' || route === 'explorar') ? link.dataset.nav === 'explorar'
        : (route === 'perfil' || route === 'pessoas') ? link.dataset.nav === 'feed'
          : link.dataset.nav === route;
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    if (route === 'feed') renderFeed();
    else if (route === 'inicio') renderHome();
    else if (route === 'mapa') renderMap();
    else if (route === 'explorar') renderExplore();
    else if (route === 'missoes') renderMissions();
    else if (route === 'pessoas') renderPeoplePage();
    else if (route === 'perfil') renderProfile(parameter);
    else if (route === 'estabelecimento') renderVenuePage(parameter);
    else renderNotFound();
  }

  function populateVenues() {
    venueSelect.innerHTML = data.venues.map((venue) => `<option value="${escapeHtml(venue.id)}">${escapeHtml(venue.name)}</option>`).join('');
  }

  function openComments(postId) {
    const post = state.posts.find((item) => item.id === postId);
    if (!post) return;
    activeCommentPost = postId;
    const venue = venueFor(post.venueId);
    document.querySelector('#comments-title').textContent = `Comentários · ${venue?.name || 'Publicação'}`;
    renderComments(post);
    commentsDialog.showModal();
  }

  function renderComments(post) {
    const list = document.querySelector('#comments-list');
    list.innerHTML = post.comments.length ? post.comments.map((comment) => `<article class="comment-item"><img class="avatar" src="${escapeHtml(comment.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80')}" alt=""><div class="comment-content"><strong>${escapeHtml(comment.author)}</strong><p>${escapeHtml(comment.text)}</p></div></article>`).join('') : '<p class="empty-state">Ainda não há comentários. Comece a conversa.</p>';
  }

  async function sharePost(postId) {
    const post = state.posts.find((item) => item.id === postId);
    if (!post) return;
    const shareUrl = `${location.href.split('#')[0]}#/feed`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Publicação de ${post.author}`, text: post.message, url: shareUrl });
        showToast('Publicação compartilhada.');
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${post.message} ${shareUrl}`);
        showToast('Link da publicação copiado.');
      } else {
        showToast('Compartilhamento não está disponível neste navegador.');
      }
    } catch (error) {
      if (error.name !== 'AbortError') showToast('Não foi possível compartilhar agora.');
    }
  }

  document.addEventListener('click', (event) => {
    const filterButton = event.target.closest('[data-filter]');
    if (filterButton) {
      state.filter = filterButton.dataset.filter;
      applyPostFilters();
      return;
    }

    const action = event.target.closest('[data-action]');
    if (!action) return;
    const { action: actionName, post: postId, venue: venueId, person: personId, mission: missionId } = action.dataset;
    if (actionName === 'publish') publishDialog.showModal();
    if (actionName === 'like') {
      const post = state.posts.find((item) => item.id === postId);
      if (!post) return;
      post.liked = !post.liked;
      post.likes += post.liked ? 1 : -1;
      renderPosts();
    }
    if (actionName === 'comments') openComments(postId);
    if (actionName === 'share') sharePost(postId);
    if (actionName === 'visit-venue') {
      action.closest('details')?.removeAttribute('open');
      location.hash = `#/estabelecimento/${encodeURIComponent(venueId)}`;
    }
    if (actionName === 'report-post') {
      action.closest('details')?.removeAttribute('open');
      showToast('Obrigado. Sua sinalização foi registrada nesta sessão de demonstração.');
    }
    if (actionName === 'open-profile') {
      const person = data.nearby.find((item) => item.id === personId);
      location.hash = `#/perfil/${encodeURIComponent(person ? slugify(person.name) : personId)}`;
    }
    if (actionName === 'join-mission') {
      if (state.joinedMissions.has(missionId)) state.joinedMissions.delete(missionId);
      else state.joinedMissions.add(missionId);
      renderMissions();
      showToast(state.joinedMissions.has(missionId) ? 'Missão adicionada à sua lista.' : 'Missão removida da sua lista.');
    }
  });

  searchInput.addEventListener('input', () => {
    state.search = searchInput.value.trim().toLocaleLowerCase('pt-BR');
    if (currentRoute() === 'feed') applyPostFilters();
    if (currentRoute() === 'explorar') renderExplore();
  });

  publishForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = document.querySelector('#post-message-input').value.trim();
    const venueId = venueSelect.value;
    const venue = venueFor(venueId);
    if (!message || !venue) return;
    state.posts.unshift({
      id: `post-${Date.now()}`,
      type: 'user',
      author: 'Você',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=85',
      venueId,
      image: state.pendingImage || venue.image,
      message,
      time: 'agora',
      likes: 0,
      liked: false,
      comments: []
    });
    state.filter = 'todos';
    state.search = '';
    searchInput.value = '';
    publishForm.reset();
    state.pendingImage = '';
    imagePreview.removeAttribute('src');
    imagePreview.classList.remove('is-visible');
    publishDialog.close();
    location.hash = '#/feed';
    renderRoute();
    showToast('Publicação adicionada ao feed desta sessão.');
  });

  imageInput.addEventListener('change', () => {
    const file = imageInput.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      imageInput.value = '';
      showToast('Escolha um arquivo de imagem.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      imageInput.value = '';
      showToast('A imagem deve ter no máximo 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      state.pendingImage = String(reader.result);
      imagePreview.src = state.pendingImage;
      imagePreview.classList.add('is-visible');
    });
    reader.readAsDataURL(file);
  });

  commentForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = document.querySelector('#comment-input');
    const text = input.value.trim();
    const post = state.posts.find((item) => item.id === activeCommentPost);
    if (!post || !text) return;
    post.comments.push({ author: 'Você', text });
    input.value = '';
    renderComments(post);
    const card = document.querySelector(`[data-post-card="${CSS.escape(post.id)}"]`);
    const commentsButton = card?.querySelector('[data-action="comments"] span');
    if (commentsButton) commentsButton.textContent = String(post.comments.length);
    showToast('Comentário adicionado.');
  });

  document.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => button.closest('dialog').close());
  });
  [publishDialog, commentsDialog].forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  });
  window.addEventListener('hashchange', renderRoute);
  populateVenues();
  renderRoute();
})();
