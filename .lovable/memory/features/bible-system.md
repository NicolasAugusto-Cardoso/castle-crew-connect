---
name: Bible System
description: Local JSON Bible reading (NVI/ARA/ACF complete), persistence, and immersive highlighting UX
type: feature
---
- Conteúdo das 3 traduções (NVI, ARA, ACF) servido 100% via arquivos estáticos em `public/bible/{version}/{abbrev}/{chapter}.json` — sem chamadas externas.
- O hook `useBibleData` lê apenas localmente (sem fallback `bible-proxy`); React Query mantém cache infinito em memória para navegação instantânea.
- Posição de leitura (versão/livro/capítulo) persistida em `localStorage` chave `bible:last-position`.
- Re-download/atualização: `node scripts/download-bible-version.mjs <nvi|ara|acf>` (idempotente; pula arquivos existentes). `download-bible.mjs` cobre as três versões sequencialmente.
- Grifos/notas/marcações continuam no Supabase, referenciando `version + book_abbrev + chapter + verse`.
- UI de grifo: toolbar flutuante (`BibleVerseToolbar`) com aplicação imediata da cor — sem cards amarelos nem tooltips de seleção.
