

# Remoção Completa: Estúdio, Editor de Vídeo, Editor de Foto e Tarefas SM

Vou apagar todo o código, rotas, navegação, hooks, edge functions e objetos de banco relacionados a essas quatro funcionalidades. Após a remoção, o projeto continuará compilando sem referências órfãs.

## 1. Arquivos a deletar

**Páginas (`src/pages/`)**
- `Studio.tsx`
- `PhotoEditor.tsx`
- `VideoEditor.tsx`
- `SocialMediaTasks.tsx`

**Componentes (`src/components/`)**
- `studio/` (pasta inteira: `ProjectCard.tsx`, `UploadDropzone.tsx`, `photo/*`, `video/*`)
- `tasks/` (pasta inteira: `TaskCard.tsx`, `TaskFormDialog.tsx`, `TaskDetailDialog.tsx`)

**Hooks (`src/hooks/`)**
- `useMediaProjects.ts`
- `usePhotoExport.ts`
- `useVideoExport.ts`
- `useSilenceDetection.ts`
- `useAudioWaveform.ts`
- `useStickyState.ts`
- `useSocialMediaTasks.ts`

**Bibliotecas e tipos**
- `src/lib/photoFilters.ts`
- `src/types/studio.ts`

**Edge Functions** (deletar do código + via `supabase--delete_edge_functions`)
- `supabase/functions/studio-ai-assistant/`
- `supabase/functions/studio-transcribe/`

## 2. Limpeza em `src/App.tsx`

- Remover imports: `SocialMediaTasks`, `Studio`, `PhotoEditor`, `VideoEditor`
- Remover 4 rotas: `/social-media-tasks`, `/studio`, `/studio/photo/:projectId?`, `/studio/video/:projectId?`

## 3. Limpeza em `src/components/Layout.tsx`

- Remover dos `navItems`:
  - `{ icon: ClipboardList, label: 'Tarefas SM', path: '/social-media-tasks', ... }`
  - `{ icon: Clapperboard, label: 'Estúdio', path: '/studio', ... }`
- Remover `ClipboardList` e `Clapperboard` da importação `lucide-react`

## 4. Limpeza em `supabase/config.toml`

Remover os blocos:
```toml
[functions.studio-ai-assistant]
verify_jwt = false

[functions.studio-transcribe]
verify_jwt = false
```

## 5. Migration SQL (drop banco + storage)

Nova migration `drop_studio_and_tasks.sql`:
```sql
-- Studio
DROP TABLE IF EXISTS public.media_projects CASCADE;
DELETE FROM storage.objects WHERE bucket_id = 'media-projects';
DELETE FROM storage.buckets WHERE id = 'media-projects';
DROP POLICY IF EXISTS "Public read media projects" ON storage.objects;
DROP POLICY IF EXISTS "Users upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own files" ON storage.objects;

-- Tarefas SM
DROP TABLE IF EXISTS public.social_media_tasks CASCADE;
DROP TYPE IF EXISTS public.task_status;
DELETE FROM storage.objects WHERE bucket_id = 'task-references';
DELETE FROM storage.buckets WHERE id = 'task-references';
DROP POLICY IF EXISTS "Task references publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Admin and volunteer can upload task references" ON storage.objects;
DROP POLICY IF EXISTS "Admin and volunteer can delete task references" ON storage.objects;
```

> O arquivo `src/integrations/supabase/types.ts` é regenerado automaticamente após a migration — não preciso editá-lo manualmente.

## 6. Memória do projeto

Remover `mem://features/social-media-tasks` (não há memória do Estúdio listada).

## 7. Verificação final

Após as mudanças:
- Buscar por `studio`, `MediaProject`, `SocialMediaTasks`, `useSocialMediaTasks`, `Clapperboard`, `ClipboardList`, `task-references`, `media_projects` para confirmar zero referências órfãs.
- Rodar `tsc --noEmit` para garantir compilação limpa.

## Resumo

| Item | Quantidade |
|---|---|
| Páginas removidas | 4 |
| Pastas de componentes removidas | 2 (studio, tasks) |
| Hooks removidos | 7 |
| Edge functions removidas | 2 |
| Tabelas/tipos/buckets dropados | 2 tabelas, 1 enum, 2 buckets |
| Rotas removidas em `App.tsx` | 4 |
| Itens de navegação removidos | 2 |

