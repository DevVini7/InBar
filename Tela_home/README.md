# Inbar — Tela HOME

Projeto front-end em HTML, CSS e JavaScript. O mapa usa Leaflet e tiles cartográficos reais do OpenStreetMap, sem chave de API.

## Organização dos arquivos
- `login.html`: tela inicial de login e cadastro, com CSS e JavaScript em seus diretórios dedicados.
- `index.html`: HOME integrada; em primeiro acesso, encaminha à tela de onboarding até que as preferências sejam concluídas.
- `onboarding.html`: seleção e personalização de interesses.
- `js/places.js`: dados demonstrativos dos locais.
- `js/place-media.js`: capas locais ilustrativas para registros sem foto e para evitar reutilizar a mesma imagem em locais diferentes.
- `js/place-metadata.js`: metadados adicionais por ID, com data de cadastro e referências verificadas, sem reescrever o catálogo.
- `js/favorites.js`: favoritos persistidos por perfil neste navegador.
- `js/explore.js` e `css/explore.css`: busca, filtros, descoberta, classificação cautelosa, detalhes completos, galeria e ações integradas de Explorar.
- `js/map.js`: criação do mapa, marcadores, navegação e geolocalização.
- `js/place-card.js`: cartão de detalhes e publicações recentes obtidas do Feed compartilhado.
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
- `js/profile-appearance.js` e `css/profile-menu.css`: editor de aparência do perfil, com cores, molduras e foto de avatar salvas na conta local.
- `js/profile.js` e `css/profile.css`: perfil com abas, edição de apelido/biografia/avatar, interesses, publicações próprias e dados privados da conta.
- `js/missions.js` e `css/loyalty.css`: missões acompanhadas por ações no protótipo, saldo individual, histórico, loja demonstrativa e carteira de cupons.
- `js/vibe.js` e `css/vibe.css`: escolha da vibe da sessão e priorização de lugares usando a vibe e os interesses permanentes.
- `css/responsive.css`: ajustes para tablets e celulares.
- `css/missions.css` e `css/loyalty.css`: estilos isolados da tela de Missões e da loja.
- `css/feed.css` e `js/feed.js`: Feed geral e Feed por local em uma única estrutura; publicações relacionadas usam o ID do local e o mesmo armazenamento.
- `../feed/Inbar/data.js`: conteúdo de exemplo recebido para o Feed; são exibidas somente publicações que correspondem a locais existentes em `js/places.js`.
- `missions.html`: atalho que abre a tela integrada em `index.html#missions`; `missoes/index.html` mantém o caminho antigo como redirecionamento.

## Locais, imagens e dados demonstrativos
- Os 26 registros anteriores de `js/places.js` foram mantidos sem alteração. Foram acrescentados três locais públicos de Brasília (Centro Cultural Banco do Brasil Brasília, Cine Brasília e Parque da Cidade Dona Sarah Kubitschek), com coordenadas consultadas no OpenStreetMap e links para as respectivas referências de mapa.
- Os mapas do InBar continuam usando Leaflet e tiles do OpenStreetMap; não foi adicionada API de mapas. O projeto deve atribuir dados cartográficos ao OpenStreetMap, conforme a licença ODbL.
- Quando locais diferentes apontam para a mesma imagem, ou quando uma imagem não está cadastrada, a interface usa uma capa SVG ilustrativa única, com nome/categoria do local. Ela não é uma fotografia do estabelecimento. Os campos originais de imagem dos 26 registros não são substituídos.
- Explorar usa os mesmos IDs dos 29 locais e oferece busca por nome/região/categoria/características, filtros que têm resultados, ordenação, seções não vazias, detalhes por rota `#explorar/local/<id>`, Feed local e seleção do marcador no mapa. Os favoritos usam `inbar:favorites:v1:<userId>` e aparecem na aba Favoritos do perfil.
- A classificação “Muito conhecido” requer evidência e fonte verificáveis; “Novo no InBar” usa a data de inclusão no catálogo (não a abertura do estabelecimento); “Vale conhecer” só aparece quando há compatibilidade positiva com interesses/vibe. Sem dados suficientes, a interface mostra “Popularidade ainda não avaliada”. Nenhuma classificação de fama ou avaliação dos registros demonstrativos foi presumida.
- Apenas o CCBB Brasília e o Cine Brasília têm link de site oficial e descrição complementar conferida nos respectivos canais oficiais. Horários, preços, contatos, acessibilidade e serviços desconhecidos não são inventados. Os campos de avaliação existentes no catálogo são demonstrativos e não são usados para classificar ou ordenar como “mais bem avaliado”.
- O feed dos locais utiliza as mesmas publicações armazenadas no Feed geral, filtradas por `placeId`. Um local sem publicações mostra estado vazio; a interface não inventa eventos, horários, cardápios ou promoções.

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
- O cartão do local pode ser expandido na própria tela HOME para mostrar informações cadastradas e publicações existentes; use "Ver feed do local" para abrir a página compartilhada do local ou "Como chegar" para abrir a rota.
- Explore lugares em Explorar, refine os resultados por categoria/região, ordene por novidade ou compatibilidade, salve favoritos e abra uma página de detalhes integrada ao Feed e ao mapa. Abrir os detalhes de Explorar não registra visita nem avança missão.
- Filtros por bares, boates, música ao vivo, eventos, happy hour e hobbies; a busca sugere lugares e aceita nomes, regiões e termos relacionados, sem diferenciar acentos.
- Marcadores com ícones SVG Lucide distintos para bares, boates, música ao vivo, eventos, boliche e karaokê; o mapa enquadra os pontos cadastrados e ancora cada pin na coordenada do local.
- Menu de perfil com acesso ao Perfil e à carteira de cupons.
- Aparência personalizável por conta no menu de perfil: combinações de cores, cores individuais, molduras e foto quadrada comprimida; a prévia é isolada ao perfil, salva junto ao usuário neste navegador e pode ser restaurada ao padrão.
- Perfil próprio com apelido público, nome completo, e-mail privado, biografia, interesses, publicações, progresso de missões e cupons demonstrativos; edição de perfil e avatar pronto/foto ficam vinculados à conta local.
- Vibe da sessão perguntada após login, em cards com seleção múltipla ou opção de pular. A escolha usa `sessionStorage`, é apagada ao sair e não altera as preferências permanentes do onboarding.
- Onboarding de interesses no primeiro acesso, com edição pelo menu de perfil e armazenamento versionado em `localStorage`. As preferências ficam separadas pelo identificador do perfil autenticado no protótipo; o modo anônimo permanece apenas como fallback para páginas sem sessão.
- A autenticação de demonstração fica em `login.html`, com estilos em `css/login.css`, lógica de formulário em `js/login.js` e sessão/perfis em `js/auth.js`. Qualquer e-mail válido e senha não vazia são aceitos para teste. Os perfis registrados e as preferências são separados por usuário; a sessão é removida ao sair. Não há servidor nem verificação segura de credenciais, e senhas não são armazenadas.
- Metadados de recomendação nos locais existentes no formato `interests: { categoryIds, tags }`. `InbarInterests.getCompatibilityScore()` retorna uma pontuação de 0 a 100; `rankEntities()` combina interesses permanentes com a vibe da sessão (70% vibe, 30% interesses quando ambos existem), priorizando lugares reais do catálogo em Explorar e nas sugestões da HOME/Feed, sem reordenar nem filtrar os marcadores do mapa. Categorias têm peso 1 e tags específicas peso 2.
- Missões integradas à navegação: abrir detalhes de locais, consultar feeds distintos e publicar no Feed atualiza progresso persistido por conta. As recompensas de missão creditam pontos uma única vez; saldo e histórico não são compartilhados entre contas do navegador.
- Loja de recompensas e Meus Cupons integrados: resgate exige saldo suficiente, confirmação, código demonstrativo persistido e movimentação negativa no histórico. Cupons podem ser marcados como utilizados; validade e estados ficam salvos localmente.
- Feed integrado à navegação: use "Feed" para a linha do tempo geral ou "Ver feed do local" para abrir `#feed/local/<id>`. Ambos usam a mesma lista de publicações, com categorias, filtros, curtidas, comentários, compartilhamento e publicação associada a um `placeId`. O conteúdo de exemplo fornecido na pasta `feed/` é identificado na tela.
- Apelidos são únicos no protótipo local e usados como nome público. Contas antigas com `username` continuam compatíveis. O Feed permite excluir somente posts do autor da sessão, com confirmação; exclusões e interações continuam restritas ao armazenamento local.
- Explorar integrado à navegação: os cartões são gerados a partir dos locais do mapa e permitem abrir os detalhes do estabelecimento no mapa.
- Geolocalização do navegador (requer permissão; em geral funciona em localhost ou HTTPS) posicionada sobre o mapa real.
- Layout adaptável para desktop e celular.

Missões, pontos, loja e cupons são simulações locais e não têm valor comercial; nenhuma recompensa está autorizada por parceiros. A contagem de "exploração" acompanha abertura de detalhes no site, não comprova visita física. Autenticação, saldo e permissões não são seguros sem backend e não sincronizam entre dispositivos.

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
- A autenticação, os apelidos, o perfil, a vibe, as publicações e as interações são um protótipo local, sem serviço de backend. A validação de autoria no navegador não substitui autorização de servidor; contas locais não garantem apelidos únicos nem privacidade entre dispositivos/usuários do mesmo navegador.
- Feed e Explorar usam o cabeçalho, perfil e navegação existentes; em telas pequenas, a própria navegação compartilhada fica acessível na base da tela quando uma dessas seções ou Missões está ativa.
- Os dados cartográficos são do OpenStreetMap; a disponibilidade dos tiles depende do serviço e de suas políticas de uso. Consulte a atribuição exibida no mapa e [a política oficial de tiles](https://operations.osmfoundation.org/policies/tiles/).
