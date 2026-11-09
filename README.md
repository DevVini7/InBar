# InBar

InBar é um protótipo web para descobrir lugares em Brasília e acompanhar experiências em um mapa, no Explorar e no Feed. A aplicação também reúne interesses, recomendações, missões, pontos, recompensas, favoritos e perfil.

## Tecnologias e execução

- HTML, CSS e JavaScript sem framework ou etapa de compilação.
- Leaflet e tiles do OpenStreetMap para o mapa.
- Fontes e algumas imagens de demonstração carregadas de serviços externos.
- `localStorage` e `sessionStorage` para dados locais de demonstração.

Para executar, abra a pasta do repositório no VS Code e inicie um servidor estático, como a extensão **Live Server**. Acesse `/index.html`; ele encaminha ao login. Após entrar, contas sem preferências salvas seguem para o onboarding e depois para a aplicação em `pages/app/index.html`. O mapa e alguns recursos externos precisam de conexão à internet. Abrir os arquivos diretamente por `file://` pode limitar recursos do navegador.

Não há backend, sincronização entre dispositivos, autenticação segura, nem integração de produção. Missões, saldos, cupons, Feed e contas são demonstrações locais.

## Estrutura

```text
.
├── assets/
│   ├── css/
│   │   ├── app/               # Estilos da aplicação principal, por funcionalidade
│   │   ├── auth/              # Login e onboarding
│   │   └── prototypes/        # Protótipo independente do Feed
│   ├── icons/                 # Símbolos SVG e licença
│   ├── images/                # Marca e imagens do protótipo
│   └── js/
│       ├── auth/              # Autenticação e onboarding
│       ├── features/          # Mapa, Explorar, Feed, missões e perfil
│       ├── prototypes/        # JavaScript do Feed legado
│       └── shared/            # Lógica compartilhada
├── data/                      # Catálogo e conteúdo de demonstração
├── docs/                      # Arquitetura e guia das funcionalidades
├── pages/
│   ├── app/                   # Aplicação principal
│   ├── auth/                  # Login e onboarding
│   └── prototypes/feed/       # Feed independente de demonstração
├── Tela_home/                 # Redirecionadores de compatibilidade
├── feed/Inbar/inbar.html      # Redirecionador do protótipo antigo
├── missoes/index.html         # Redirecionador da rota antiga de Missões
├── index.html                 # Entrada: encaminha ao login
└── login.html                 # Alias antigo do login
```

### Arquivos principais por responsabilidade

| Área | Arquivos |
|---|---|
| Entrada, rotas e layout compartilhado | `pages/app/index.html`, `assets/js/app.js`, `assets/css/app/app.css`, `assets/css/app/responsive.css` |
| Login e cadastro | `pages/auth/login.html`, `assets/js/auth/auth.js`, `assets/js/auth/login.js`, `assets/css/auth/login.css` |
| Interesses e onboarding | `pages/auth/onboarding.html`, `assets/js/shared/interests.js`, `assets/js/auth/onboarding.js`, `assets/css/auth/onboarding.css` |
| Catálogo e mapa | `data/places.js`, `assets/js/features/map.js`, `assets/js/shared/place-card.js`, `assets/css/app/map-controls.css`, `assets/css/app/place-card.css` |
| Explorar e detalhes | `assets/js/features/explore.js`, `data/place-metadata.js`, `assets/css/app/explore.css` |
| Feed integrado | `assets/js/features/feed.js`, `data/feed-demo.js`, `assets/css/app/feed.css` |
| Missões e recompensas | `assets/js/features/missions.js`, `assets/css/app/missions.css`, `assets/css/app/loyalty.css` |
| Perfil, aparência e favoritos | `assets/js/features/profile.js`, `assets/js/features/profile-appearance.js`, `assets/js/features/favorites.js`, `assets/css/app/profile.css`, `assets/css/app/profile-menu.css` |
| Vibe e recomendações | `assets/js/features/vibe.js`, `assets/css/app/vibe.css` |
| Ícones e marca | `assets/icons/inbar.svg`, `assets/icons/LICENSE`, `assets/images/branding/` |

Os estilos têm arquivos distintos porque atendem páginas e interfaces diferentes; o protótipo autônomo do Feed não é uma cópia do Feed integrado. Os redirecionadores antigos são mantidos para não quebrar links existentes.

## Fluxo e convenções

A aplicação usa scripts JavaScript clássicos, carregados em ordem no HTML: autenticação e interesses, catálogo, recursos compartilhados, funcionalidades e, por fim, o controlador `assets/js/app.js`. As páginas usam `<base>` para resolver caminhos locais desde a raiz; mantenha esse elemento se alterar sua profundidade.

### Adicionar uma página

1. Crie o HTML em `pages/` na área apropriada.
2. Crie estilos em `assets/css/<área>/` e scripts em `assets/js/<área>/`.
3. Use caminhos locais a partir da raiz do projeto e inclua `<base href="...">` de acordo com a profundidade da página.
4. Se a tela fizer parte da aplicação principal, conecte-a à navegação e às rotas em `pages/app/index.html` e `assets/js/app.js`. Preserve a ordem dos scripts globais.
5. Se o endereço antigo for usado por links ou favoritos, mantenha um redirecionador de compatibilidade.

### Adicionar ou editar estabelecimentos

- Edite o catálogo em `data/places.js`. Preserve os IDs: Feed, mapa, favoritos, preferências e progresso podem referenciá-los. Mantenha nomes, coordenadas, endereços, imagens e descrições existentes quando não houver uma alteração confirmada.
- Adicione informações complementares e fontes por ID em `data/place-metadata.js`; evite sobrescrever os dados do catálogo.
- Os mapas usam Leaflet e OpenStreetMap. Não é necessário adicionar uma API ou uma chave de mapas.

### Alterar estilos ou funcionalidades

Encontre o CSS e o JavaScript da área na tabela acima. O shell principal, navegação e interpretação das rotas ficam em `pages/app/index.html` e `assets/js/app.js`; os recursos específicos ficam em `assets/js/features/`. Helpers compartilhados ficam em `assets/js/shared/`.

## Documentação adicional

- [Visão da arquitetura e fluxo de carregamento](docs/architecture.md)
- [Guia das funcionalidades e limitações do protótipo](docs/features.md)
