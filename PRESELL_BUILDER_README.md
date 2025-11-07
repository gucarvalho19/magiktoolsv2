# Presell Builder (Dev Preview)

## 📋 Visão Geral

A tela "Presell Builder (Dev Preview)" permite que administradores em ambientes de desenvolvimento ou preview gerem páginas HTML estáticas de presell através de um formulário interativo.

## 🔑 Características

- ✅ Geração de HTML estático com CSS inline
- ✅ Preview em tempo real via iframe
- ✅ Código HTML copiável
- ✅ Salvamento automático de rascunho (localStorage)
- ✅ Controle de acesso por feature flag e admin
- ✅ Interface responsiva
- ✅ Zero dependências de backend

## 🔒 Controle de Acesso

A tela é protegida por três camadas de segurança:

### 1. Detecção de Ambiente
- **Produção**: Bloqueado (hostname === 'app.magik.tools')
- **Dev/Preview**: Liberado

### 2. Feature Flag
```bash
VITE_FEATURE_PRESELL_BUILDER_DEV=1
```

### 3. Lista de Admins
```bash
VITE_ADMIN_EMAILS=guuh2358@gmail.com,outro@exemplo.com
```

## 📂 Estrutura de Arquivos

```
frontend/
├── lib/
│   ├── featureFlags.ts          # Detecção de ambiente e flags
│   ├── auth.ts                  # Hook useIsAdmin()
│   └── devPreviewGate.ts        # Lógica de controle de acesso
├── components/
│   ├── dev/
│   │   ├── DevPreviewBanner.tsx # Banner de alerta Dev Preview
│   │   └── PresellPage.tsx      # Componente principal
│   └── ui/
│       ├── alert.tsx
│       ├── badge.tsx
│       ├── separator.tsx
│       ├── switch.tsx
│       ├── tabs.tsx
│       └── tooltip.tsx
└── App.tsx                      # Rota /dev/presell adicionada
```

## 🚀 Configuração

### 1. Variáveis de Ambiente

Crie ou edite os arquivos de ambiente:

**.env.development**
```bash
VITE_FEATURE_PRESELL_BUILDER_DEV=1
VITE_ADMIN_EMAILS=guuh2358@gmail.com,outro@exemplo.com
```

**.env.preview**
```bash
VITE_FEATURE_PRESELL_BUILDER_DEV=1
VITE_ADMIN_EMAILS=guuh2358@gmail.com,outro@exemplo.com
```

**.env.production**
```bash
VITE_FEATURE_PRESELL_BUILDER_DEV=0
```

### 2. Acessar a Tela

Navegue para: `/dev/presell`

## 🖼️ Funcionalidades da Interface

### Formulário (Coluna Esquerda)
- **Produto** * (obrigatório)
- **Promessa** * (obrigatório)
- **Benefícios** * (um por linha, obrigatório)
- **Texto do CTA** (customizável)
- **Switches:**
  - Exibir Cupom de Desconto
  - Exibir Frete Grátis
  - Verificação de Idade (+18)

### Preview (Coluna Direita)
- **Tab Preview**: Visualização iframe do HTML gerado
- **Tab HTML**: Código fonte copiável

### Ações
- **Gerar Preview**: Valida e gera o HTML
- **Resetar**: Limpa formulário e preview
- **Copiar HTML**: Copia código para área de transferência

## 🛡️ Comportamento de Bloqueio

Se o acesso for negado, a tela exibe:

```
┌─────────────────────────────┐
│      🔒 Acesso Restrito      │
├─────────────────────────────┤
│                             │
│  [Motivo específico aqui]   │
│                             │
│    [ Voltar ]               │
└─────────────────────────────┘
```

Possíveis motivos:
- "Esta funcionalidade não está disponível em produção."
- "Feature flag VITE_FEATURE_PRESELL_BUILDER_DEV não está ativada."
- "Acesso restrito a administradores."

## 💾 Salvamento Automático

O formulário salva automaticamente no `localStorage` com a chave `presellDraft`:
- Salva ao alterar qualquer campo
- Restaura ao recarregar a página
- Remove ao clicar em "Resetar"

## 📋 Exemplo de HTML Gerado

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Óleo de Cannabis — Presell</title>
  <style>
    /* Estilos inline completos */
  </style>
</head>
<body>
  <div class="container">
    <h1>Óleo de Cannabis: Alívio Natural e Eficaz</h1>
    <ul>
      <li>Reduz ansiedade e estresse</li>
      <li>100% natural e orgânico</li>
    </ul>
    <!-- Cupom, frete, modal de idade se ativados -->
    <button class="cta">Quero Aproveitar Agora</button>
  </div>
  <script>
    console.log('Dev Preview – Presell Builder');
  </script>
</body>
</html>
```

## ✅ Critérios de Aceite

- [x] Rota `/dev/presell` acessível apenas em (dev/preview) && (flag=1) && (admin)
- [x] Página de bloqueio mostra motivo exato
- [x] Formulário gera e renderiza HTML inline corretamente
- [x] "Copiar HTML" copia conteúdo exibido
- [x] "Resetar" limpa estado e preview
- [x] Layout responsivo (2 colunas desktop / 1 coluna mobile)
- [x] Nenhuma chamada backend
- [x] Componentes shadcn/ui utilizados
- [x] Validação de campos obrigatórios com toast

## 🔧 Manutenção

### Adicionar novo admin
Edite a variável de ambiente:
```bash
VITE_ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

### Desativar feature
```bash
VITE_FEATURE_PRESELL_BUILDER_DEV=0
```

### Centralizar lista de admins
Atualmente a lista está em dois lugares:
1. `frontend/lib/featureFlags.ts` (via env)
2. `frontend/components/membership/MembershipGate.tsx:13-16` (hardcoded)

Recomenda-se centralizar em um único arquivo de configuração.

## 📝 Notas Técnicas

- React Router DOM v7.6.3
- Clerk React v5.35.2
- Vite v6.2.5
- Tailwind CSS v4
- shadcn/ui components
- lucide-react icons
