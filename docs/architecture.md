# Arquitetura

## Aplicações e páginas

O repositório contém a aplicação principal e uma demonstração autônoma antiga do Feed:

- `index.html` encaminha à autenticação em `pages/auth/login.html`.
- Login e cadastro usam a sessão local. O login escolhe entre onboarding e aplicação.
- `pages/auth/onboarding.html` salva interesses e retorna a `pages/app/index.html`.
- `pages/app/index.html` é o shell da aplicação. Mapa, Explorar, Feed, Missões e Perfil são áreas da mesma página, alternadas pela navegação e pela rota hash.
- `pages/prototypes/feed/index.html` é uma demonstração independente. Ela compartilha o arquivo de dados de exemplo, mas mantém seu próprio HTML, CSS, JavaScript e rotas.
- Os arquivos em `Tela_home/`, `feed/Inbar/inbar.html` e `missoes/index.html` são redirecionadores para manter endereços antigos funcionando.

## Carregamento da aplicação principal

Os scripts são globais e dependem da ordem explícita em `pages/app/index.html`; não são módulos ES. Em linhas gerais, a página carrega:

1. Autenticação e catálogo de interesses, necessários à verificação inicial.
2. Catálogo de estabelecimentos.
3. Helpers compartilhados, metadados e funcionalidades (mapa, cartão, Feed, missões, perfil, vibe e Explorar).
4. `assets/js/app.js`, que conecta eventos, troca de seções e interpreta as rotas.

O HTML usa `<base href="../../">` para que arquivos e links locais sejam resolvidos desde a raiz do projeto. Páginas em outros níveis precisam de uma base correspondente. Caminhos de imagens definidos nos dados também são relativos a essa raiz.

Como a base aponta para a raiz, a navegação por hash usa o caminho canônico da página no `history` (por exemplo, `pages/app/index.html#feed`). Ao adicionar rotas, preserve o caminho do documento para que recarregar ou compartilhar a URL reabra a mesma tela.

## Dados e persistência

- `data/places.js` define `window.inbarPlaces`; IDs numéricos identificam os mesmos estabelecimentos em mapa, Feed, favoritos e missões.
- `data/place-metadata.js` mantém informações adicionais indexadas pelo ID, separadas dos registros principais.
- `data/feed-demo.js` fornece conteúdo demonstrativo ao Feed integrado e ao protótipo autônomo.
- Sessão, contas, interesses, vibe, publicações, progresso, recompensas e favoritos usam armazenamento do navegador. O código de autenticação demonstra o fluxo de interface, mas não protege dados como faria um servidor.

Ao organizar ou alterar dados, preserve IDs e o armazenamento existente. Não suponha que a quantidade de objetos cadastrados represente popularidade ou avaliações verificadas.

## Recursos externos

- Leaflet é carregado pela CDN configurada no HTML.
- Os tiles e dados cartográficos vêm do OpenStreetMap; a atribuição permanece visível no mapa.
- Fontes e alguns recursos da demonstração independente usam serviços externos. As imagens locais de marca e do protótipo permanecem em `assets/images/`.

Não há gerenciador de pacotes, compilação ou testes automatizados configurados no repositório.
