# 🚀 Quick Start - CopaCards

Comece a usar o CopaCards em 5 minutos!

## ⚡ Início Rápido

### 1️⃣ Configurar Supabase (2 minutos)

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto (escolha nome e região)
3. Vá em **SQL Editor** e execute o arquivo `supabase-setup.sql`
4. Vá em **Storage** e crie 2 buckets públicos:
   - `avatars`
   - `stickers`

### 2️⃣ Configurar Projeto (1 minuto)

```bash
# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env

# Editar .env com suas credenciais do Supabase
# (Encontre em: Supabase > Settings > API)
```

### 3️⃣ Executar (1 minuto)

```bash
# Desenvolvimento
npm run dev

# Abrir http://localhost:5173
```

### 4️⃣ Testar (1 minuto)

1. **Criar conta** - Use qualquer email (ex: teste@email.com)
2. **Publicar figurinha:**
   - Nome: Neymar Jr.
   - Seleção: Brasil
   - Posição: Atacante
   - Número: 10
   - Imagem: `https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400`
   - Status: Tenho
   - Descrição: O craque brasileiro!

3. **Explorar:** Curtir, comentar, seguir outros usuários

## 📋 Checklist Mínimo

- [ ] ✅ Projeto Supabase criado
- [ ] ✅ SQL executado no Supabase
- [ ] ✅ Buckets de storage criados
- [ ] ✅ Arquivo `.env` configurado
- [ ] ✅ `npm install` executado
- [ ] ✅ App rodando com `npm run dev`

## 🎯 Próximos Passos

Consulte os arquivos:
- **README.md** - Documentação completa
- **EXAMPLE_DATA.md** - Dados de exemplo para testar
- **DEPLOYMENT.md** - Como fazer deploy

## ❓ Problemas Comuns

**Erro ao fazer login?**
→ Verifique se o SQL foi executado completamente

**Erro "Invalid API key"?**
→ Confira as variáveis no arquivo `.env`

**Imagens não aparecem?**
→ Certifique-se que os buckets são públicos

## 💬 Suporte

Confira os logs:
- **Browser Console** (F12) - Erros frontend
- **Supabase > Logs** - Erros backend

---

Pronto! Você está no ar com o CopaCards! ⚽🏆
