# InBar
O Inbar não mostra apenas lugares — ele mostra experiências acontecendo em tempo real.

## Iniciar o projeto
Abra `index.html` na raiz do repositório, de preferência com o Live Server do VS Code. O fluxo começa no login de teste; após entrar, usuários sem preferências salvas passam pelo onboarding de interesses antes de chegar à HOME em `Tela_home/index.html`. A HOME oferece mapa, Explorar, Feed, Missões e o perfil próprio. A vibe é temporária por sessão; interesses e perfil são preferências locais da conta.

Login, cadastro e dados de perfil/feed/favoritos usam armazenamento local para demonstração; não existe backend, sincronização entre dispositivos, recuperação real de senha ou autorização segura no servidor. Em Explorar, filtros, recomendações, detalhes por ID, Feed local e navegação ao mapa reutilizam o catálogo compartilhado.
