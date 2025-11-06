# Contributing to MagikTools

Obrigado pelo interesse em contribuir com o MagikTools! Este documento contém guidelines para contribuir com o projeto.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Posso Contribuir?](#como-posso-contribuir)
- [Workflow de Desenvolvimento](#workflow-de-desenvolvimento)
- [Padrões de Código](#padrões-de-código)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Configuração do Ambiente](#configuração-do-ambiente)

---

## 🤝 Código de Conduta

Este projeto segue um código de conduta de respeito e inclusão:

- ✅ Seja respeitoso com todos os contribuidores
- ✅ Aceite críticas construtivas
- ✅ Foque no que é melhor para a comunidade
- ✅ Mostre empatia com outros membros

## 💡 Como Posso Contribuir?

### **Reportar Bugs**

Se encontrou um bug:

1. **Verifique** se já existe uma issue aberta
2. **Abra uma nova issue** com:
   - Título claro e descritivo
   - Passos para reproduzir
   - Comportamento esperado vs atual
   - Screenshots (se aplicável)
   - Ambiente (browser, OS, etc.)

### **Sugerir Melhorias**

Para sugerir novas features:

1. **Abra uma issue** com o label `enhancement`
2. **Descreva** o problema que a feature resolve
3. **Explique** como deveria funcionar
4. **Justifique** por que é útil para o projeto

### **Contribuir com Código**

1. **Escolha** uma issue existente ou crie uma nova
2. **Comente** na issue que você quer trabalhar nela
3. **Fork** o repositório
4. **Crie** uma branch a partir de `develop`
5. **Desenvolva** seguindo os padrões do projeto
6. **Teste** suas alterações
7. **Abra** um Pull Request

---

## 🔄 Workflow de Desenvolvimento

### **Estrutura de Branches**

```
main (produção)
└── develop (staging/preview)
    └── feature/sua-feature
    └── fix/seu-bug-fix
    └── refactor/seu-refactor
```

### **Passo a Passo**

```bash
# 1. Clone o repositório
git clone https://github.com/gucarvalho19/magiktoolsv2.git
cd magiktoolsv2

# 2. Checkout na branch develop
git checkout develop
git pull origin develop

# 3. Crie sua branch
git checkout -b feature/minha-nova-feature
# ou
git checkout -b fix/corrigir-bug-xyz

# 4. Faça suas alterações
# ... desenvolva ...

# 5. Commit seguindo o padrão
git add .
git commit -m "feat: adiciona nova funcionalidade X"

# 6. Push para seu fork
git push origin feature/minha-nova-feature

# 7. Abra um Pull Request para develop (não para main!)
```

---

## 📝 Padrões de Código

### **TypeScript/JavaScript**

```typescript
// ✅ GOOD - Usar tipos explícitos
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ BAD - Evitar any
function getUser(id: any): any {
  // ...
}
```

### **React Components**

```tsx
// ✅ GOOD - Componente funcional com tipos
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

// ❌ BAD - Sem tipos
export function Button({ label, onClick, disabled }) {
  // ...
}
```

### **Estilo e Formatação**

- **Indentação:** 2 espaços (não tabs)
- **Aspas:** Simples para strings (`'texto'`)
- **Ponto e vírgula:** Obrigatório
- **Trailing comma:** Sempre usar em arrays/objetos multiline
- **Naming:**
  - Componentes: `PascalCase` (ex: `UserProfile`)
  - Funções/variáveis: `camelCase` (ex: `getUserData`)
  - Constantes: `UPPER_SNAKE_CASE` (ex: `MAX_RETRIES`)
  - Arquivos: `kebab-case.tsx` ou `PascalCase.tsx` (componentes)

### **Imports**

```typescript
// ✅ GOOD - Ordem organizada
// 1. React/External
import { useState } from 'react';
import { api } from 'encore.dev/api';

// 2. Absolute imports
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/useAuth';

// 3. Relative imports
import { formatDate } from './utils';
import type { User } from './types';
```

---

## 💬 Commit Messages

Seguimos o padrão **Conventional Commits**:

### **Formato**

```
<tipo>: <descrição curta>

[corpo opcional]

[footer opcional]
```

### **Tipos**

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| `feat` | Nova funcionalidade | `feat: add presell builder tool` |
| `fix` | Correção de bug | `fix: resolve auth token expiration` |
| `docs` | Documentação | `docs: update README with setup steps` |
| `style` | Formatação (não afeta código) | `style: format code with prettier` |
| `refactor` | Refatoração | `refactor: simplify user validation logic` |
| `test` | Testes | `test: add unit tests for auth module` |
| `chore` | Manutenção | `chore: update dependencies` |
| `perf` | Performance | `perf: optimize database queries` |

### **Exemplos**

```bash
# ✅ GOOD
git commit -m "feat: add exit intent popup tool"
git commit -m "fix: correct Clerk token validation"
git commit -m "docs: add contributing guidelines"

# ❌ BAD
git commit -m "update"
git commit -m "fix bug"
git commit -m "changes"
```

### **Descrições**

- ✅ Use modo imperativo: "add" não "added"
- ✅ Não capitalize a primeira letra
- ✅ Sem ponto final
- ✅ Máximo 72 caracteres
- ✅ Descreva **o que** e **por que**, não **como**

---

## 🎯 Pull Requests

### **Antes de Abrir um PR**

- [ ] Seu código funciona localmente?
- [ ] Você testou manualmente as mudanças?
- [ ] Não há console.logs/debuggers esquecidos?
- [ ] O código segue os padrões do projeto?
- [ ] Você revisou o [SECURITY.md](SECURITY.md)?
- [ ] A branch está atualizada com `develop`?

### **Título do PR**

Use o mesmo formato de commit:

```
feat: adiciona gerador de marquee
fix: corrige validação de email no signup
docs: atualiza instruções de deploy
```

### **Descrição do PR**

Use o template automático que aparece. Inclua:

1. **O que mudou?** - Resumo das alterações
2. **Por que?** - Motivo da mudança
3. **Como testar?** - Passos para validar
4. **Screenshots** - Se houver mudanças visuais
5. **Checklist** - Marque os itens concluídos

### **Review Process**

1. **Automated checks** rodam automaticamente
2. **Code review** por um maintainer
3. **Solicitações de mudança** podem ser feitas
4. **Aprovação** necessária para merge
5. **Merge** será feito por um maintainer

---

## ⚙️ Configuração do Ambiente

### **Pré-requisitos**

- Node.js 20+
- Bun (gerenciador de pacotes)
- Encore CLI (`brew install encore` ou via npm)
- Git

### **Setup**

```bash
# 1. Clone o repositório
git clone https://github.com/gucarvalho19/magiktoolsv2.git
cd magiktoolsv2

# 2. Instale dependências
bun install

# 3. Configure variáveis de ambiente
cd frontend
cp .env.example .env.local

# Edite .env.local com suas chaves:
# - Clerk: https://dashboard.clerk.com
# - OpenAI: https://platform.openai.com

# 4. Configure Encore Secrets (backend)
encore secret set --type dev ClerkSecretKey
# Cole sua secret key quando solicitado

encore secret set --type dev OpenAIKey
# Cole sua OpenAI key quando solicitado

# 5. Rode o projeto
encore run
```

### **Desenvolvimento Frontend Standalone**

```bash
cd frontend
bun run dev
# Acesse: http://localhost:5173
```

### **Comandos Úteis**

```bash
# Rodar backend + frontend
encore run

# Build production
cd backend && bun run build

# Verificar erros TypeScript
cd frontend && npx tsc --noEmit

# Ver logs do banco de dados
encore db shell db
```

---

## 🧪 Testes

### **Antes de Submeter PR**

```bash
# 1. Testes manuais
# - Teste todas as funcionalidades afetadas
# - Teste em diferentes navegadores (Chrome, Firefox, Safari)
# - Teste responsividade (mobile, tablet, desktop)

# 2. Verificação de tipos
cd frontend && npx tsc --noEmit

# 3. Build
cd backend && bun run build
```

### **Casos de Teste**

Sempre teste:

- ✅ Usuário autenticado e não autenticado
- ✅ Admin e usuário regular
- ✅ Campos vazios e inválidos
- ✅ Casos limite (valores máximos/mínimos)
- ✅ Mobile e desktop

---

## 🐛 Debugging

### **Frontend**

```javascript
// Use React DevTools
// Verifique Network tab para APIs
// Use console.log moderadamente (remova antes do commit)
```

### **Backend**

```bash
# Logs automáticos do Encore
# Aparecem no terminal durante `encore run`

# Logs customizados
import log from "encore.dev/log";
log.info("mensagem", { dados: valor });
log.error("erro", { error });
```

---

## 📚 Recursos Úteis

- [Encore Documentation](https://encore.dev/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [React Documentation](https://react.dev)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## 📞 Precisa de Ajuda?

- **Issues:** Use GitHub Issues para dúvidas técnicas
- **Discussions:** Use GitHub Discussions para discussões gerais
- **Email:** guuh2358@gmail.com para questões privadas

---

## 🎉 Agradecimentos

Obrigado por contribuir com o MagikTools! Cada contribuição, por menor que seja, é muito valiosa.

---

**Happy Coding!** 🚀
