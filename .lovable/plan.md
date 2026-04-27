## Corrigir cabeçalho branco da aba Contato

A faixa branca atrás de "Contato" vem de `src/pages/Contact.tsx` linha 269:

```tsx
<div className="bg-white dark:bg-card py-4 xs:py-5 sm:py-6">
```

Como o app agora é Dark Mode permanente (sem a classe `.dark` no `<html>`), o `dark:bg-card` não está sendo aplicado e fica `bg-white` puro — daí o "quadradão branco".

### Correção

Trocar a div para usar a superfície escura do design system:

```tsx
{/* Cabeçalho — Dark Mode: usa card escuro com borda prata sutil */}
<div className="bg-card border-b border-white/[0.08] py-4 xs:py-5 sm:py-6">
```

Isso integra o cabeçalho ao restante da tela preta, mantendo o ícone azul/prata + título em gradiente prata e a descrição em `muted-foreground`.

### Arquivo modificado

- `src/pages/Contact.tsx` — uma única linha (269).