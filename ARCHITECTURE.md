# 🏗️ Arquitetura - CopaCards

## 📐 Estrutura do Projeto

```
copacards/
├── public/                          # Arquivos estáticos públicos
│
├── src/
│   ├── components/                  # Componentes React
│   │   ├── ui/                     # Componentes Shadcn/ui
│   │   │   ├── avatar.tsx          # Avatar do usuário
│   │   │   ├── button.tsx          # Botões
│   │   │   ├── card.tsx            # Cards
│   │   │   ├── dialog.tsx          # Modals/Dialogs
│   │   │   ├── dropdown-menu.tsx   # Menus dropdown
│   │   │   ├── input.tsx           # Inputs de texto
│   │   │   ├── label.tsx           # Labels de formulário
│   │   │   ├── tabs.tsx            # Abas/Tabs
│   │   │   └── textarea.tsx        # Text areas
│   │   │
│   │   ├── CommentsDialog.tsx      # Modal de comentários
│   │   ├── Layout.tsx              # Layout principal (header/nav)
│   │   ├── StickerCard.tsx         # Card de figurinha
│   │   └── StickerForm.tsx         # Formulário criar/editar
│   │
│   ├── contexts/                    # React Contexts
│   │   ├── AuthContext.tsx         # Contexto de autenticação
│   │   └── ThemeContext.tsx        # Contexto de tema (light/dark)
│   │
│   ├── lib/                        # Configurações e utilitários
│   │   └── supabase.ts             # Cliente Supabase + Types
│   │
│   ├── pages/                      # Páginas da aplicação
│   │   ├── AuthPage.tsx            # Login/Cadastro
│   │   ├── CollectionPage.tsx      # Coleção do usuário
│   │   ├── FeedPage.tsx            # Feed principal
│   │   ├── MessagesPage.tsx        # Chat/Mensagens
│   │   └── ProfilePage.tsx         # Perfil do usuário
│   │
│   ├── utils/                      # Funções utilitárias
│   │   └── cn.ts                   # Merge de classes CSS
│   │
│   ├── App.tsx                     # Componente raiz
│   ├── index.css                   # Estilos globais + tema
│   ├── main.tsx                    # Entry point
│   └── vite-env.d.ts              # Types do Vite
│
├── .env                            # Variáveis de ambiente (local)
├── .env.example                    # Template de variáveis
├── .gitignore                      # Arquivos ignorados pelo Git
├── index.html                      # HTML principal
├── package.json                    # Dependências e scripts
├── tsconfig.json                   # Configuração TypeScript
├── vite.config.ts                  # Configuração Vite
│
├── README.md                       # Documentação principal
├── QUICKSTART.md                   # Início rápido
├── DEPLOYMENT.md                   # Guia de deploy
├── FEATURES.md                     # Lista de funcionalidades
├── EXAMPLE_DATA.md                 # Dados de exemplo
├── ARCHITECTURE.md                 # Este arquivo
├── supabase-setup.sql             # Script de setup do banco
└── LICENSE                         # Licença MIT
```

## 🔄 Fluxo de Dados

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ├─► React Components
       │   ├─► UI Components (Shadcn/ui)
       │   ├─► Feature Components
       │   └─► Pages
       │
       ├─► Contexts (Global State)
       │   ├─► AuthContext (usuário, login, logout)
       │   └─► ThemeContext (light/dark)
       │
       ├─► Supabase Client
       │   ├─► Auth (autenticação)
       │   ├─► Database (queries)
       │   ├─► Storage (arquivos)
       │   └─► Realtime (subscriptions)
       │
       └─► Supabase Backend
           ├─► PostgreSQL Database
           ├─► Row Level Security
           ├─► Storage Buckets
           └─► Realtime Server
```

## 🗄️ Esquema do Banco de Dados

```sql
┌─────────────────┐
│  auth.users     │ (Supabase Auth)
│  - id (UUID)    │
│  - email        │
│  - password     │
└────────┬────────┘
         │
         │ 1:1
         ▼
┌─────────────────┐
│   profiles      │
│  - id (PK)      │
│  - user_id (FK) │
│  - username     │
│  - full_name    │
│  - avatar_url   │
│  - bio          │
│  - favorite_team│
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐      ┌──────────────┐
│   stickers      │◄────►│    likes     │
│  - id (PK)      │ 1:N  │ - id (PK)    │
│  - user_id (FK) │      │ - user_id    │
│  - athlete_name │      │ - sticker_id │
│  - team         │      └──────────────┘
│  - position     │
│  - number       │      ┌──────────────┐
│  - image_url    │◄────►│  comments    │
│  - status       │ 1:N  │ - id (PK)    │
│  - description  │      │ - user_id    │
└─────────────────┘      │ - sticker_id │
                         │ - content    │
                         └──────────────┘

┌─────────────────┐
│   followers     │ (Many-to-Many)
│  - id (PK)      │
│  - follower_id  │ ──► users (quem segue)
│  - following_id │ ──► users (quem é seguido)
└─────────────────┘

┌─────────────────┐
│   messages      │
│  - id (PK)      │
│  - sender_id    │ ──► users
│  - receiver_id  │ ──► users
│  - content      │
│  - read         │
│  - created_at   │
└─────────────────┘
```

## 🎨 Sistema de Temas

```css
/* CSS Variables - Light Mode */
:root {
  --primary: #009739        /* Verde Brasil */
  --accent: #FEDD00         /* Amarelo */
  --secondary: #012169      /* Azul */
  --background: #FFFFFF
  --foreground: #0F172A
}

/* CSS Variables - Dark Mode */
.dark {
  --primary: #009739        /* Verde Brasil (mantém) */
  --accent: #FEDD00         /* Amarelo (mantém) */
  --secondary: #012169      /* Azul (mantém) */
  --background: #0F172A
  --foreground: #FFFFFF
}
```

## 🔐 Políticas de Segurança (RLS)

### Profiles
```sql
SELECT: Todos podem ver perfis públicos
INSERT: Apenas o próprio usuário pode criar seu perfil
UPDATE: Apenas o dono pode atualizar
```

### Stickers
```sql
SELECT: Todos podem ver figurinhas
INSERT: Usuários autenticados podem criar
UPDATE: Apenas o dono pode atualizar
DELETE: Apenas o dono pode deletar
```

### Likes
```sql
SELECT: Todos podem ver curtidas
INSERT: Usuários autenticados podem curtir
DELETE: Apenas o dono pode remover sua curtida
```

### Comments
```sql
SELECT: Todos podem ver comentários
INSERT: Usuários autenticados podem comentar
DELETE: Apenas o dono pode deletar seu comentário
```

### Followers
```sql
SELECT: Todos podem ver seguidores
INSERT/DELETE: Apenas o seguidor pode gerenciar
```

### Messages
```sql
SELECT: Apenas remetente e destinatário
INSERT: Apenas o remetente
UPDATE: Apenas o destinatário (marcar como lido)
```

## 🚀 Fluxo de Autenticação

```
1. Usuário acessa /
   └─► AuthContext verifica sessão
       ├─► Se autenticado: Feed
       └─► Se não: AuthPage

2. Login/Cadastro
   └─► Supabase Auth
       ├─► Criar/Verificar usuário
       ├─► Gerar JWT token
       ├─► Criar perfil (se cadastro)
       └─► Armazenar sessão

3. Navegação
   └─► Todas as páginas verificam sessão
       └─► Queries incluem user_id automaticamente

4. Logout
   └─► Supabase Auth.signOut()
       └─► Limpa sessão e redireciona
```

## 📡 Realtime Subscriptions

```javascript
// Feed - Novas figurinhas
supabase
  .channel('stickers_changes')
  .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'stickers' },
      () => reloadFeed())
  .subscribe()

// Chat - Novas mensagens
supabase
  .channel('messages_changes')
  .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => addMessage(payload.new))
  .subscribe()
```

## 📱 Responsividade

```
Desktop (≥768px)
┌─────────────────────────────┐
│  Header (Logo + Nav + Actions)
├─────────────────────────────┤
│                             │
│        Main Content         │
│                             │
└─────────────────────────────┘

Mobile (<768px)
┌─────────────────────────────┐
│      Header (Logo + Actions)
├─────────────────────────────┤
│                             │
│        Main Content         │
│                             │
├─────────────────────────────┤
│   Bottom Nav (Feed|Col|Msg|Profile)
└─────────────────────────────┘
```

## 🎯 Componentes Chave

### Layout.tsx
- Header fixo
- Navegação responsiva
- Botão de nova figurinha
- Toggle de tema
- Logout

### StickerCard.tsx
- Exibição da figurinha
- Botões de curtir/comentar
- Ações de editar/deletar (se dono)
- Avatar do autor
- Status badge

### CommentsDialog.tsx
- Modal de comentários
- Lista de comentários
- Formulário de novo comentário
- Scroll infinito

### StickerForm.tsx
- Formulário de criar/editar
- Validação de campos
- Preview de status
- Upload de imagem via URL

### AuthPage.tsx
- Tabs de Login/Cadastro
- Formulários separados
- Recuperação de senha
- Feedback de erros

## 🔧 Configuração de Variáveis

```env
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Prefixo VITE_ é obrigatório para Vite expor no cliente
```

## 📦 Build e Deploy

```bash
# Desenvolvimento
npm run dev          # Vite dev server com HMR

# Produção
npm run build        # Build otimizado
npm run preview      # Preview do build

# Deploy
vercel              # Deploy na Vercel
netlify deploy      # Deploy na Netlify
```

## 🎨 Design System

### Cores Primárias
- **Verde Brasil** (#009739): Primária, botões principais
- **Amarelo** (#FEDD00): Destaques, ações importantes
- **Azul** (#012169): Secundário, links

### Tipografia
- **Font:** System fonts (sans-serif)
- **Tamanhos:** 
  - xs: 0.75rem
  - sm: 0.875rem
  - base: 1rem
  - lg: 1.125rem
  - xl-3xl: Headers

### Espaçamento
- **Base:** 0.25rem (4px)
- **Múltiplos:** 1, 2, 3, 4, 6, 8, 12, 16, 24

### Componentes UI
- Baseados em Shadcn/ui
- Radix UI primitives
- Acessibilidade WCAG AA
- Keyboard navigation

## 🧪 Testes Sugeridos

1. **Fluxo de cadastro** → Login → Criar figurinha
2. **Feed** → Curtir → Comentar → Ver perfil
3. **Coleção** → Filtrar → Editar → Deletar
4. **Chat** → Seguir usuário → Enviar mensagem
5. **Tema** → Alternar light/dark → Verificar cores
6. **Responsivo** → Desktop → Tablet → Mobile

---

Esta arquitetura foi projetada para:
- ✅ Escalabilidade (fácil adicionar features)
- ✅ Manutenibilidade (código organizado)
- ✅ Performance (otimizado para produção)
- ✅ Segurança (RLS e autenticação robusta)
- ✅ UX (responsivo e intuitivo)
