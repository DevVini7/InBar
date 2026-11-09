# Guia das funcionalidades

## Mapa e estabelecimentos

O catálogo compartilhado está em `data/places.js`. `assets/js/features/map.js` inicializa Leaflet e OpenStreetMap; `assets/js/shared/place-card.js` apresenta os detalhes selecionados no mapa. Os campos e coordenadas do catálogo são usados diretamente pelo mapa.

## Explorar e recomendações

`assets/js/features/explore.js` oferece busca, filtros, ordenação, prateleiras de descoberta e detalhes com a rota `#explorar/local/<id>`. A tela reutiliza os IDs do catálogo para abrir o Feed do lugar e selecionar seu marcador no mapa. `data/place-metadata.js` guarda informações adicionais sem reescrever o cadastro original.

As classificações são conservadoras: “Muito conhecido” requer uma fonte e evidência verificáveis; “Novo no InBar” considera a data de inclusão no catálogo, não a abertura do estabelecimento; “Vale conhecer” depende da compatibilidade com interesses ou vibe. Sem dados suficientes, a interface informa que a popularidade ainda não foi avaliada. Avaliações demonstrativas do catálogo não são tratadas como avaliações verificadas.

## Feed

O Feed da aplicação fica em `assets/js/features/feed.js` e `assets/css/app/feed.css`. Publicações são associadas a um ID de local e o Feed de cada estabelecimento filtra essa mesma lista. `data/feed-demo.js` contém o conteúdo inicial demonstrativo. O protótipo independente fica em `pages/prototypes/feed/` e usa `assets/js/prototypes/feed.js` e `assets/css/prototypes/feed.css`; não substitui o Feed integrado.

## Missões, recompensas e cupons

`assets/js/features/missions.js` controla missões, pontos, loja e cupons na interface. O progresso demonstrativo é persistido localmente por perfil. Abrir a página de detalhes de Explorar não é prova de visita física nem contabiliza uma visita.

## Perfil, interesses e favoritos

`assets/js/features/profile.js` renderiza as áreas do perfil; `profile-appearance.js` gerencia a apresentação visual, e `favorites.js` mantém os lugares salvos por perfil neste navegador. Interesses permanentes são administrados em `assets/js/shared/interests.js`; a vibe é temporária e fica em `assets/js/features/vibe.js`.

## Limitações

Login, favoritos, preferências, publicações, progresso, saldo e cupons são dados locais de demonstração e não sincronizam entre dispositivos. O protótipo não tem backend, segurança de servidor, avaliações verificadas para o catálogo ou confirmação de visita física. Confira os canais oficiais dos estabelecimentos antes de planejar uma visita.
