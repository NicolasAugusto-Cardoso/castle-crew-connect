# Sistema de Versículo do Dia

## Visão Geral

Sistema automatizado que busca e exibe um versículo diferente da Bíblia todos os dias na página Home, usando a API ABíbliaDigital.

## Características

- ✅ **API Real**: Usa ABíbliaDigital API (versão NVI - Nova Versão Internacional)
- ✅ **Atualização Automática**: Cron job executa diariamente às 00:05 (America/Sao_Paulo)
- ✅ **Cache Inteligente**: Verifica se já existe versículo para o dia antes de buscar novo
- ✅ **Sem Repetição**: Evita repetir versículos dos últimos 30 dias
- ✅ **Fallback Robusto**: Em caso de erro, mantém o versículo do dia anterior
- ✅ **Carregamento Assíncrono**: Não bloqueia o carregamento do feed da Home
- ✅ **Responsivo**: Design otimizado para mobile e desktop
- ✅ **Acessível**: Fonte legível, quebra de linha correta, sem truncamento

## Arquitetura

### 1. Edge Function: `fetch-verse-of-the-day`

Localização: `supabase/functions/fetch-verse-of-the-day/index.ts`

**Responsabilidades:**
- Buscar versículo aleatório da API ABíbliaDigital
- Verificar se já existe versículo para a data atual
- Verificar se versículo não foi usado nos últimos 30 dias
- Salvar versículo no banco de dados
- Implementar fallback em caso de erro da API

**Endpoint:**
```
POST https://tcvtgzubarrsppppazfo.supabase.co/functions/v1/fetch-verse-of-the-day
```

**Configuração:**
- JWT verificação desabilitada (público para permitir chamadas do cron)
- Usa versão NVI (Nova Versão Internacional) da Bíblia
- Máximo de 5 tentativas para encontrar versículo único

### 2. Cron Job

**Configuração:** 
- Agendamento: `5 3 * * *` (03:05 UTC = 00:05 America/Sao_Paulo)
- Usa extensões `pg_cron` e `pg_net`
- Chamada automática via `net.http_post`

**SQL:**
```sql
SELECT cron.schedule(
  'fetch-verse-of-the-day',
  '5 3 * * *',
  $$
  SELECT net.http_post(
    url:=concat(current_setting('app.settings.supabase_url'), '/functions/v1/fetch-verse-of-the-day'),
    headers:=jsonb_build_object('Content-Type', 'application/json', 'Authorization', concat('Bearer ', current_setting('app.settings.supabase_anon_key'))),
    body:=jsonb_build_object('scheduled', true, 'timestamp', now())
  ) as request_id;
  $$
);
```

### 3. Tabela: `verse_of_the_day`

**Campos:**
- `id` (uuid, primary key)
- `date` (date, unique) - Data do versículo
- `reference` (text) - Referência bíblica (ex: "João 3:16")
- `text` (text) - Texto completo do versículo
- `created_at` (timestamp)

**Políticas RLS:**
- SELECT: Público (todos podem ler)
- INSERT/UPDATE/DELETE: Apenas admins

### 4. Hook: `useVerseOfTheDay`

Localização: `src/hooks/useVerseOfTheDay.ts`

**Funcionalidade:**
- Busca versículo do dia atual
- Fallback para versículo mais recente se não houver para hoje
- Cache de 1 hora
- Refetch automático a cada hora
- Tratamento de erros

### 5. UI: Página Home

Localização: `src/pages/Home.tsx`

**Características:**
- Card destacado no topo do feed
- Gradiente visual (from-primary-light to-primary)
- Ícone de livro aberto
- Texto do versículo com quebra de linha correta
- Referência em destaque
- Loading state suave
- Não bloqueia carregamento do feed

## API Externa: ABíbliaDigital

**URL Base:** `https://www.abibliadigital.com.br/api`

**Endpoint Usado:**
```
GET /verses/nvi/random
```

**Resposta:**
```json
{
  "book": {
    "name": "João",
    "abbrev": {"pt":"jo","en":"jn"},
    "author": "João",
    "group": "Evangelhos",
    "version": "nvi"
  },
  "chapter": 3,
  "number": 16,
  "text": "Porque Deus tanto amou o mundo que deu o seu Filho Unigênito..."
}
```

**Rate Limits:**
- Sem autenticação: 20 requisições/hora/IP
- Com token: Ilimitado
- Nossa função usa sem autenticação (suficiente para 1 chamada diária)

## Fluxo de Execução

### Diário (Automático)

1. **00:05 AM (America/Sao_Paulo)** - Cron job dispara
2. Edge function verifica se já existe versículo para hoje
3. Se não existe:
   - Busca versículos dos últimos 30 dias
   - Tenta buscar versículo único da API (máx 5 tentativas)
   - Salva novo versículo no banco
4. Se erro:
   - Mantém versículo anterior
   - Log de erro para debug

### Cliente (Browser)

1. Hook `useVerseOfTheDay` busca versículo atual
2. Se encontra versículo de hoje: exibe
3. Se não encontra: busca mais recente como fallback
4. UI renderiza com loading state suave
5. Refetch automático a cada hora

## Testes Manuais

### Testar Edge Function

```bash
# Via Supabase CLI
supabase functions invoke fetch-verse-of-the-day

# Via curl
curl -X POST \
  https://tcvtgzubarrsppppazfo.supabase.co/functions/v1/fetch-verse-of-the-day \
  -H "Content-Type: application/json"
```

### Verificar Cron Job

```sql
-- Listar cron jobs
SELECT * FROM cron.job;

-- Ver execuções recentes
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;

-- Desabilitar temporariamente
SELECT cron.unschedule('fetch-verse-of-the-day');

-- Reabilitar
SELECT cron.schedule(
  'fetch-verse-of-the-day',
  '5 3 * * *',
  $$ ... $$
);
```

### Verificar Dados

```sql
-- Ver versículos recentes
SELECT * FROM verse_of_the_day 
ORDER BY date DESC 
LIMIT 30;

-- Verificar duplicatas
SELECT reference, COUNT(*) 
FROM verse_of_the_day 
GROUP BY reference 
HAVING COUNT(*) > 1;

-- Verificar cobertura
SELECT date 
FROM generate_series(
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE,
  '1 day'::interval
) date
LEFT JOIN verse_of_the_day v ON date::date = v.date
WHERE v.id IS NULL;
```

## Manutenção

### Adicionar Versículo Manualmente

```sql
INSERT INTO verse_of_the_day (date, reference, text)
VALUES (
  '2025-10-31',
  'Salmos 23:1',
  'O Senhor é o meu pastor; de nada terei falta.'
);
```

### Limpar Versículos Antigos

```sql
-- Manter apenas últimos 90 dias
DELETE FROM verse_of_the_day
WHERE date < CURRENT_DATE - INTERVAL '90 days';
```

### Forçar Novo Versículo

```sql
-- Deletar versículo de hoje para forçar novo fetch
DELETE FROM verse_of_the_day 
WHERE date = CURRENT_DATE;
```

## Troubleshooting

### Versículo não atualiza

1. Verificar logs da Edge Function
2. Verificar se cron job está ativo
3. Verificar rate limit da API
4. Verificar conexão com ABíbliaDigital

### Versículo repetido

1. Verificar lógica de deduplicação
2. Verificar se há versículos suficientes no banco
3. Aumentar janela de verificação (atualmente 30 dias)

### API ABíbliaDigital offline

1. Sistema usa fallback automático
2. Mantém versículo anterior
3. Registra erro nos logs
4. Retenta na próxima execução

## Melhorias Futuras

- [ ] Notificação admin se API falhar por mais de 3 dias
- [ ] Opção de escolher tradução da Bíblia (NVI, ARC, etc)
- [ ] Histórico de versículos favoritos
- [ ] Compartilhamento social do versículo
- [ ] Estatísticas de versículos mais populares
- [ ] Widget de versículo para embed externo
- [ ] Push notification com versículo diário
- [ ] Áudio do versículo (text-to-speech)

## Links Úteis

- [ABíbliaDigital API](https://www.abibliadigital.com.br/)
- [Documentação ABíbliaDigital](https://github.com/omarciovsena/abibliadigital)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Cron Jobs](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [pg_net Extension](https://supabase.com/docs/guides/database/extensions/pg_net)
