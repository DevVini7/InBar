# Inbar — Tela HOME

Projeto front-end em HTML, CSS e JavaScript. O mapa usa Leaflet e tiles cartográficos reais do OpenStreetMap, sem chave de API.

## Organização dos arquivos
- `js/places.js`: dados demonstrativos dos locais.
- `js/map.js`: criação do mapa, marcadores, navegação e geolocalização.
- `js/place-card.js`: conteúdo e expansão do cartão de detalhes na HOME.
- `js/app.js`: filtros, busca e eventos da interface.
- `css/style.css`: estilos da tela e dos componentes.

## Como executar
1. Extraia o ZIP para uma pasta.
2. Abra a pasta no VS Code.
3. Execute `index.html` com a extensão **Live Server** (recomendado), ou sirva a pasta por um servidor local.
4. O mapa precisa de conexão com a internet para carregar a biblioteca Leaflet e os mapas do OpenStreetMap. Fontes e fotos de demonstração também carregam de serviços externos.

## Recursos implementados
- Mapa cartográfico real e interativo, centrado no Plano Piloto e enquadrado para mostrar as Asas Norte e Sul, com tratamento escuro em tons de cinza inspirado em mapas de navegação. Arraste para navegar e use a roda do mouse ou os botões +/− para aproximar.
- Marcadores clicáveis com cores de status. Os detalhes do lugar só aparecem ao selecionar um marcador.
- O cartão do local pode ser expandido na própria tela HOME para mostrar fotos, status, destaques e publicações demonstrativas; use "Como chegar" para abrir a rota no OpenStreetMap.
- Filtros por categoria e busca por nome/bairro.
- Geolocalização do navegador (requer permissão; em geral funciona em localhost ou HTTPS) posicionada sobre o mapa real.
- Layout adaptável para desktop e celular.

## Observações
- Os bares, eventos, avaliações, ofertas, números de ocupação, fotos, perfis e publicações são dados fictícios de demonstração. Os pontos foram colocados em quadras comerciais indicadas no OpenStreetMap (CLN, CLS e Setor Comercial Sul); não representam endereços confirmados dos estabelecimentos fictícios.
- As abas Explorar, Feed e Missões têm interação visual inicial; conecte-as às páginas reais do projeto.
- Os dados cartográficos são do OpenStreetMap; a disponibilidade dos tiles depende do serviço e de suas políticas de uso. Consulte a atribuição exibida no mapa e [a política oficial de tiles](https://operations.osmfoundation.org/policies/tiles/).
