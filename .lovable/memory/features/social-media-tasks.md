---
name: Social Media Tasks Workflow
description: Sistema de tarefas onde admin/volunteer atribuem demandas ao social_media (Kanban + upload de referências)
type: feature
---

## Workflow de Tarefas — Social Media

**Tabela**: `social_media_tasks` (status enum `task_status`: pending | in_production | completed)

**Permissões (RLS)**:
- **admin**: gerencia tudo
- **volunteer**: cria, vê e edita as próprias tarefas (`created_by = auth.uid()`)
- **social_media**: vê tarefas atribuídas a ele (ou sem assignee) e pode atualizar status

**Storage**: bucket público `task-references` (upload restrito a admin/volunteer)

**Página**: `/social-media-tasks` — Kanban 3 colunas no desktop, Tabs no mobile.

**Componentes**:
- `src/pages/SocialMediaTasks.tsx`
- `src/components/tasks/TaskCard.tsx` (mudança rápida de status + delete)
- `src/components/tasks/TaskFormDialog.tsx` (upload múltiplo de imagens/vídeos, prazo, assignee)
- `src/components/tasks/TaskDetailDialog.tsx`

**Hooks**: `src/hooks/useSocialMediaTasks.ts` (`useSocialMediaTasks`, `useCreateTask`, `useUpdateTaskStatus`, `useDeleteTask`, `useSocialMediaUsers`, `uploadTaskReference`).

**Navegação**: ícone `ClipboardList` "Tarefas SM" exibido no Layout para admin, volunteer e social_media.
