# Inbar — Tela HOME

Projeto front-end em HTML, CSS e JavaScript. O mapa usa Leaflet e tiles cartográficos reais do OpenStreetMap, sem chave de API.

## Organização dos arquivos
- `login.html`: tela inicial de login e cadastro, com CSS e JavaScript em seus diretórios dedicados.
- `index.html`: HOME integrada; em primeiro acesso, encaminha à tela de onboarding até que as preferências sejam concluídas.
- `onboarding.html`: seleção e personalização de interesses.
- `js/places.js`: dados demonstrativos dos locais.
- `js/map.js`: criação do mapa, marcadores, navegação e geolocalização.
- `js/place-card.js`: conteúdo e expansão do cartão de detalhes na HOME.
- `js/app.js`: filtros, busca e eventos da interface.
- `js/interests.js`: catálogo de interesses, persistência de preferências e pontuação de compatibilidade para recomendações.
- `js/auth.js`: sessão de teste por aba e perfis locais usados para identificar cada usuário.
- `js/login.js`: validação de login/cadastro em modo de teste e navegação para a HOME.
- `js/onboarding.js`, `onboarding.html` e `css/onboarding.css`: fluxo responsivo de seleção e edição das preferências.
- `assets/icons.svg`: coleção local de ícones SVG Lucide, reutilizada pela HOME sem API ou CDN.
- `assets/LICENSE`: avisos de licença dos ícones.
- `css/style.css`: estilos globais, cabeçalho, mapa e filtros.
- `css/login.css`: estilos isolados da tela de autenticação.
- `css/place-card.css`: cartão compacto e expandido dos locais.
- `css/map-controls.css`: legenda, controles do mapa, notificações e marcadores.
- `css/profile-menu.css`: menu de perfil da HOME.
- `css/responsive.css`: ajustes para tablets e celulares.
- `css/missions.css`: estilos isolados da tela de Missões.
- `js/missions.js`: filtros, busca, detalhes e progresso demonstrativo das missões.
- `css/feed.css` e `js/feed.js`: estilos e interações do Feed integrado, com filtros, publicações, curtidas, comentários e descoberta de locais.
- `../feed/Inbar/data.js`: conteúdo de exemplo recebido para o Feed; são exibidas somente publicações que correspondem a locais existentes em `js/places.js`.
- `missions.html`: atalho que abre a tela integrada em `index.html#missions`; `missoes/index.html` mantém o caminho antigo como redirecionamento.

## Fluxo inicial
Abra `index.html` na raiz do projeto para iniciar no login. Após enviar credenciais válidas no modo de teste, o fluxo segue para `Tela_home/index.html`. Se as preferências ainda não tiverem sido concluídas, a HOME encaminha ao onboarding antes de exibir o mapa.

## Como executar
1. Extraia o ZIP para uma pasta.
2. Abra a pasta no VS Code.
3. Execute `index.html` da raiz com a extensão **Live Server** (recomendado), ou sirva a pasta por um servidor local.
4. O mapa precisa de conexão com a internet para carregar a biblioteca Leaflet e os mapas do OpenStreetMap. Fontes e fotos de demonstração também carregam de serviços externos.

## Recursos implementados
- Mapa cartográfico real e interativo, centrado no Plano Piloto e enquadrado para mostrar as Asas Norte e Sul, com tratamento escuro em tons de cinza inspirado em mapas de navegação. Arraste para navegar e use a roda do mouse ou os botões +/− para aproximar.
- Marcadores clicáveis com cores de status. Os detalhes do lugar só aparecem ao selecionar um marcador.
- O cartão do local pode ser expandido na própria tela HOME para mostrar fotos, status, destaques e publicações demonstrativas; use "Como chegar" para abrir a rota no OpenStreetMap.
- Filtros por bares, boates, música ao vivo, eventos, happy hour e hobbies; a busca sugere lugares e aceita nomes, regiões e termos relacionados, sem diferenciar acentos.
- Marcadores com ícones SVG Lucide distintos para bares, boates, música ao vivo, eventos, boliche e karaokê; o mapa enquadra os pontos cadastrados e ancora cada pin na coordenada do local.
- Menu visual de perfil com acesso à edição de preferências; as demais opções continuam demonstrativas.
- Onboarding de interesses no primeiro acesso, com edição pelo menu de perfil e armazenamento versionado em `localStorage`. As preferências ficam separadas pelo identificador do perfil autenticado no protótipo; o modo anônimo permanece apenas como fallback para páginas sem sessão.
- A autenticação de demonstração fica em `login.html`, com estilos em `css/login.css`, lógica de formulário em `js/login.js` e sessão/perfis em `js/auth.js`. Qualquer e-mail válido e senha não vazia são aceitos para teste. Os perfis registrados e as preferências são separados por usuário; a sessão é removida ao sair. Não há servidor nem verificação segura de credenciais, e senhas não são armazenadas.
- Metadados de recomendação nos locais existentes no formato `interests: { categoryIds, tags }`. `InbarInterests.getCompatibilityScore()` retorna uma pontuação de 0 a 100; `rankEntities()` retorna pares `{ entity, score }` para preparar recomendações no Feed e em Explorar, sem reordenar nem filtrar os marcadores do mapa. Categorias têm peso 1 e tags específicas peso 2.
- Tela de Missões integrada à navegação: use "Missões" no cabeçalho; retorne pelo botão "Mapa", pela marca ou pelo histórico do navegador. A busca global filtra missões enquanto essa tela está aberta.
- Feed integrado à navegação compartilhada: use "Feed", filtre por categoria ou autor, curta, comente, compartilhe ou crie publicações associadas a um local do catálogo. No protótipo, publicações e interações são armazenadas no `localStorage` deste navegador e associadas à sessão de teste; ainda não há sincronização por servidor. O conteúdo de exemplo fornecido na pasta `feed/` é identificado na tela e não representa atividade real.
- Explorar integrado à navegação: os cartões são gerados a partir dos locais do mapa e permitem abrir os detalhes do estabelecimento no mapa.
- Geolocalização do navegador (requer permissão; em geral funciona em localhost ou HTTPS) posicionada sobre o mapa real.
- Layout adaptável para desktop e celular.

## Como reutilizar os ícones
- Use um símbolo existente de `assets/icons.svg` com `<svg class="icon" aria-hidden="true"><use href="assets/icons.svg#nome-do-icone"></use></svg>`.
- Para conteúdo criado por JavaScript, crie o elemento SVG e o `<use>` com `document.createElementNS`, seguindo o exemplo em `js/place-card.js`.
- Os ícones ficam no projeto: não adicione dependências de ícones por API ou CDN. Ao incluir ícones Lucide, atualize os símbolos e os avisos de licença em `assets/LICENSE`.

## Como adicionar imagens aos locais
- Coloque os arquivos de imagem dentro de `assets/places/`, por exemplo `Tela_home/assets/places/up-and-down.jpg`.
- No registro do local em `js/places.js`, defina `image: "assets/places/up-and-down.jpg"`. O caminho é relativo ao `index.html`.
- Para uma galeria própria, use também `images: ["assets/places/up-and-down.jpg", "assets/places/up-and-down-2.jpg"]`. A primeira imagem será a capa; as demais aparecem como miniaturas quando os detalhes forem expandidos.
- Formatos comuns como JPG, PNG e WebP são aceitos pelo navegador. Use nomes simples, sem espaços, e mantenha os arquivos no projeto para não depender de links externos.

## Observações
- Os bares, boates, atividades, eventos, avaliações, ofertas, números de ocupação, fotos, perfis e publicações são dados fictícios de demonstração; nomes e regiões de alguns locais foram informados pelo usuário ou conferidos em listagens públicas. As coordenadas continuam aproximadas e não representam endereços exatos nem movimento real. Trem Bão está indicado em Lago Norte; os pontos da orla ficam em terra, perto do Lago Paranoá, nunca sobre a água.
- Feed e Explorar usam o cabeçalho, perfil e navegação existentes; em telas pequenas, a própria navegação compartilhada fica acessível na base da tela quando uma dessas seções ou Missões está ativa.
- Os dados cartográficos são do OpenStreetMap; a disponibilidade dos tiles depende do serviço e de suas políticas de uso. Consulte a atribuição exibida no mapa e [a política oficial de tiles](https://operations.osmfoundation.org/policies/tiles/).
