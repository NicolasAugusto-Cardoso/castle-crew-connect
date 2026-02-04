
# Plano: Toggle de Habilitação da Aba Doações

## Resumo

Adicionar uma opção no painel do administrador para ligar/desligar a aba Doações. Quando desligada, a aba não aparece para nenhum usuário (nem na navegação, nem nas rotas). Quando ligada, segue a lógica de permissões existente (admin e user).

---

## 1. Criar Tabela de Configurações do App

**Arquivo:** Nova migração SQL

Criar uma tabela genérica `app_settings` para armazenar configurações globais do aplicativo. Isso permitirá adicionar mais configurações no futuro sem precisar criar novas tabelas.

```sql
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- RLS: Apenas admins podem gerenciar, todos podem ler
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage app settings"
ON public.app_settings FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can read app settings"
ON public.app_settings FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Inserir configuração inicial (doações desabilitadas por padrão)
INSERT INTO public.app_settings (key, value)
VALUES ('donations_enabled', 'false'::jsonb);
```

---

## 2. Criar Hook para Configurações do App

**Novo arquivo:** `src/hooks/useAppSettings.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAppSettings() {
  return useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*');
      
      if (error) throw error;
      
      // Converter array para objeto key-value
      const settings: Record<string, any> = {};
      data?.forEach(item => {
        settings[item.key] = item.value;
      });
      return settings;
    },
  });
}

export function useDonationsEnabled() {
  const { data: settings, isLoading } = useAppSettings();
  return {
    isDonationsEnabled: settings?.donations_enabled === true,
    isLoading,
  };
}

export function useUpdateAppSetting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
    },
  });
}
```

---

## 3. Adicionar Toggle no Painel do Administrador

**Arquivo:** `src/pages/Users.tsx`

Adicionar uma seção "Configurações do App" acima da lista de usuários com um toggle para habilitar/desabilitar doações:

```text
+------------------------+
| Configurações do App   |
+------------------------+
| Aba Doações            |
| [Toggle ON/OFF]        |
| Quando ligada, aparece |
| para admins e usuários |
+------------------------+
```

Estrutura do código a adicionar:
- Importar `useDonationsEnabled` e `useUpdateAppSetting`
- Card com Switch para alternar a configuração
- Label explicativo sobre o funcionamento

---

## 4. Atualizar Layout.tsx para Respeitar a Configuração

**Arquivo:** `src/components/Layout.tsx`

Modificar a lógica de `navItems` para incluir a condição `showWhen` no item de Doações:

```typescript
// Importar o hook
import { useDonationsEnabled } from '@/hooks/useAppSettings';

// Dentro do componente
const { isDonationsEnabled } = useDonationsEnabled();

// Atualizar navItems
{ 
  icon: Heart, 
  label: 'Doações', 
  path: '/donations', 
  roles: ['admin', 'user'],
  showWhen: isDonationsEnabled  // Nova propriedade
}
```

A lógica de `visibleNavItems` já suporta `showWhen`, então a aba será filtrada automaticamente quando `isDonationsEnabled` for `false`.

---

## 5. Atualizar App.tsx para Proteger a Rota

**Arquivo:** `src/App.tsx`

Criar um componente wrapper que verifica se doações está habilitado antes de renderizar a página:

```typescript
// Componente wrapper
const DonationsGuard = ({ children }) => {
  const { isDonationsEnabled, isLoading } = useDonationsEnabled();
  
  if (isLoading) return <Loading />;
  if (!isDonationsEnabled) return <Navigate to="/" replace />;
  
  return children;
};

// Na rota
<Route path="/donations" element={
  <ProtectedRoute allowedRoles={['admin', 'user']}>
    <DonationsGuard>
      <Donations />
    </DonationsGuard>
  </ProtectedRoute>
} />
```

Isso garante que mesmo acessando diretamente a URL `/donations`, o usuário será redirecionado se a funcionalidade estiver desabilitada.

---

## 6. Resumo dos Arquivos

| Arquivo | Ação |
|---------|------|
| Nova migração SQL | Criar tabela `app_settings` |
| `src/hooks/useAppSettings.ts` | **Criar** - Hook para ler/atualizar configurações |
| `src/pages/Users.tsx` | Adicionar seção de configurações com toggle |
| `src/components/Layout.tsx` | Adicionar `showWhen` no item de Doações |
| `src/App.tsx` | Adicionar guard na rota de doações |

---

## Fluxo de Funcionamento

```text
Administrador acessa /users
        |
        v
Vê seção "Configurações do App"
        |
        v
Toggle "Aba Doações" = OFF (padrão)
        |
        v
Liga o toggle
        |
        v
Salva no Supabase: donations_enabled = true
        |
        v
Layout.tsx lê a configuração
        |
        v
Aba "Doações" aparece na navegação para admin e user
```
