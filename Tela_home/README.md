# Inbar — Tela HOME

Projeto front-end em HTML, CSS e JavaScript. O mapa usa Leaflet e tiles cartográficos reais do OpenStreetMap, sem chave de API.

## Organização dos arquivos
- `js/places.js`: dados demonstrativos dos locais.
- `js/map.js`: criação do mapa, marcadores, navegação e geolocalização.
- `js/place-card.js`: conteúdo e expansão do cartão de detalhes na HOME.
- `js/app.js`: filtros, busca e eventos da interface.
- `js/interests.js`: catálogo de interesses, persistência de preferências e pontuação de compatibilidade para recomendações.
- `js/onboarding.js`, `onboarding.html` e `css/onboarding.css`: fluxo responsivo de seleção e edição das preferências.
- `assets/icons.svg`: coleção local de ícones SVG Lucide, reutilizada pela HOME sem API ou CDN.
- `assets/LICENSE`: avisos de licença dos ícones.
- `css/style.css`: estilos globais, cabeçalho, mapa e filtros.
- `css/place-card.css`: cartão compacto e expandido dos locais.
- `css/map-controls.css`: legenda, controles do mapa, notificações e marcadores.
- `css/profile-menu.css`: menu de perfil da HOME.
- `css/responsive.css`: ajustes para tablets e celulares.
- `css/missions.css`: estilos isolados da tela de Missões.
- `js/missions.js`: filtros, busca, detalhes e progresso demonstrativo das missões.
- `missions.html`: atalho que abre a tela integrada em `index.html#missions`; `missoes/index.html` mantém o caminho antigo como redirecionamento.

## Como executar
1. Extraia o ZIP para uma pasta.
2. Abra a pasta no VS Code.
3. Execute `index.html` com a extensão **Live Server** (recomendado), ou sirva a pasta por um servidor local.
4. O mapa precisa de conexão com a internet para carregar a biblioteca Leaflet e os mapas do OpenStreetMap. Fontes e fotos de demonstração também carregam de serviços externos.

## Recursos implementados
- Mapa cartográfico real e interativo, centrado no Plano Piloto e enquadrado para mostrar as Asas Norte e Sul, com tratamento escuro em tons de cinza inspirado em mapas de navegação. Arraste para navegar e use a roda do mouse ou os botões +/− para aproximar.
- Marcadores clicáveis com cores de status. Os detalhes do lugar só aparecem ao selecionar um marcador.
- O cartão do local pode ser expandido na própria tela HOME para mostrar fotos, status, destaques e publicações demonstrativas; use "Como chegar" para abrir a rota no OpenStreetMap.
- Filtros por bares, boates, música ao vivo, eventos, happy hour e hobbies; a busca sugere lugares e aceita nomes, regiões e termos relacionados, sem diferenciar acentos.
- Marcadores com ícones SVG Lucide distintos para bares, boates, música ao vivo, eventos, boliche e karaokê; o mapa enquadra os pontos cadastrados e ancora cada pin na coordenada do local.
- Menu visual de perfil com acesso à edição de preferências; as demais opções continuam demonstrativas.
- Onboarding de interesses no primeiro acesso, com edição pelo menu de perfil e armazenamento versionado em `localStorage`. O projeto não possui autenticação ou backend; neste protótipo, as preferências são associadas a um identificador anônimo persistente no navegador.
- Metadados de recomendação nos locais existentes no formato `interests: { categoryIds, tags }`. `InbarInterests.getCompatibilityScore()` retorna uma pontuação de 0 a 100; `rankEntities()` retorna pares `{ entity, score }` para preparar recomendações no Feed e em Explorar, sem reordenar nem filtrar os marcadores do mapa. Categorias têm peso 1 e tags específicas peso 2.
- Tela de Missões integrada à navegação: use "Missões" no cabeçalho; retorne pelo botão "Mapa", pela marca ou pelo histórico do navegador. A busca global filtra missões enquanto essa tela está aberta.
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
- As abas Explorar e Feed ainda têm interação visual demonstrativa. Missões é exibida no mesmo layout compartilhado da HOME, sem repetir o cabeçalho, o perfil ou os controles do mapa.
- Os dados cartográficos são do OpenStreetMap; a disponibilidade dos tiles depende do serviço e de suas políticas de uso. Consulte a atribuição exibida no mapa e [a política oficial de tiles](https://operations.osmfoundation.org/policies/tiles/).
