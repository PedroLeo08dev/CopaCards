# ⚽ CopaCards - Rede Social de Figurinhas Digitais

Uma aplicação web moderna para colecionadores de figurinhas digitais de atletas da Copa do Mundo.

## 🚀 Tecnologias

- **Frontend:** React 19 + Vite + TypeScript
- **Styling:** Tailwind CSS 4 + Shadcn/ui
- **Backend:** Supabase (Auth, Database, Storage, Realtime)
- **Ícones:** Lucide React
- **Datas:** date-fns

## 🎨 Paleta de Cores (Brasil)

- **Verde Primário:** #009739
- **Amarelo (Destaques):** #FEDD00
- **Azul Secundário:** #012169
- **Branco:** #FFFFFF
- **Escuro:** #0F172A

## 📋 Funcionalidades

### Autenticação
- ✅ Cadastro de usuários
- ✅ Login
- ✅ Recuperação de senha
- ✅ Gestão de sessão com Supabase Auth

### Feed Social
- ✅ Feed cronológico de figurinhas
- ✅ Curtidas em tempo real
- ✅ Comentários
- ✅ Atualizações em tempo real com Supabase Realtime

### Gestão de Coleção
- ✅ CRUD completo de figurinhas
- ✅ Upload de imagens
- ✅ Status: Tenho, Quero, Repetida
- ✅ Filtros por categoria

### Perfil de Usuário
- ✅ Avatar personalizável
- ✅ Biografia
- ✅ Seleção favorita
- ✅ Estatísticas (figurinhas, seguidores, seguindo)

### Sistema Social
- ✅ Seguir/Deixar de seguir usuários
- ✅ Chat privado em tempo real
- ✅ Mensagens diretas

### Interface
- ✅ Modo claro/escuro
- ✅ Design responsivo (mobile e desktop)
- ✅ Componentes reutilizáveis com Shadcn/ui

## 🔧 Configuração do Supabase

### 1. Criar Projeto no Supabase

Acesse [supabase.com](https://supabase.com) e crie um novo projeto.

### 2. Configurar Banco de Dados

Execute os seguintes scripts SQL no Editor SQL do Supabase:

#### Tabela de Perfis
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  favorite_team TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

#### Tabela de Figurinhas
```sql
CREATE TABLE stickers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  athlete_name TEXT NOT NULL,
  team TEXT NOT NULL,
  position TEXT NOT NULL,
  number INTEGER NOT NULL CHECK (number > 0 AND number < 100),
  image_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('have', 'want', 'duplicate')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stickers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stickers are viewable by everyone"
  ON stickers FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own stickers"
  ON stickers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stickers"
  ON stickers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stickers"
  ON stickers FOR DELETE
  USING (auth.uid() = user_id);
```

#### Tabela de Curtidas
```sql
CREATE TABLE likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  sticker_id UUID REFERENCES stickers ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sticker_id)
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by everyone"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own likes"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);
```

#### Tabela de Comentários
```sql
CREATE TABLE comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  sticker_id UUID REFERENCES stickers ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);
```

#### Tabela de Seguidores
```sql
CREATE TABLE followers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Followers are viewable by everyone"
  ON followers FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own follows"
  ON followers FOR ALL
  USING (auth.uid() = follower_id);
```

#### Tabela de Mensagens
```sql
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received messages"
  ON messages FOR UPDATE
  USING (auth.uid() = receiver_id);
```

### 3. Configurar Storage

No painel do Supabase, crie dois buckets:

1. **avatars** (público)
   - Para armazenar fotos de perfil dos usuários

2. **stickers** (público)
   - Para armazenar imagens das figurinhas

### 4. Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Preencha com suas credenciais do Supabase:
   - `VITE_SUPABASE_URL`: URL do seu projeto
   - `VITE_SUPABASE_ANON_KEY`: Chave anônima pública

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais do Supabase

# Executar em modo de desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🎯 Estrutura do Projeto

```
src/
├── components/           # Componentes reutilizáveis
│   ├── ui/              # Componentes Shadcn/ui
│   ├── Layout.tsx       # Layout principal
│   ├── StickerCard.tsx  # Card de figurinha
│   ├── StickerForm.tsx  # Formulário de figurinha
│   └── CommentsDialog.tsx # Modal de comentários
├── contexts/            # Contextos React
│   ├── AuthContext.tsx  # Autenticação
│   └── ThemeContext.tsx # Tema claro/escuro
├── lib/                 # Configurações
│   └── supabase.ts      # Cliente Supabase
├── pages/               # Páginas da aplicação
│   ├── AuthPage.tsx     # Login/Cadastro
│   ├── FeedPage.tsx     # Feed principal
│   ├── CollectionPage.tsx # Coleção do usuário
│   ├── MessagesPage.tsx # Chat/Mensagens
│   └── ProfilePage.tsx  # Perfil do usuário
├── utils/               # Utilitários
│   └── cn.ts           # Merge de classes CSS
├── App.tsx              # Componente principal
└── main.tsx            # Entry point
```

## 🔐 Segurança

- ✅ Row Level Security (RLS) habilitado em todas as tabelas
- ✅ Políticas de acesso granulares
- ✅ Autenticação via Supabase Auth
- ✅ Validação de dados no backend

## 📱 Responsividade

- Desktop: Layout com sidebar e navegação superior
- Mobile: Navegação inferior (bottom navigation)
- Breakpoint: 768px (md)

## 🌙 Temas

A aplicação suporta modo claro e escuro, utilizando as cores oficiais do Brasil adaptadas para cada tema.

## 📄 Licença

Este projeto é de código aberto e está disponível para fins educacionais.

---

Desenvolvido com ⚽ para colecionadores de figurinhas da Copa do Mundo
