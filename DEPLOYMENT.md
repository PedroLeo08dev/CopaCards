# 🚀 Guia de Deploy - CopaCards

## Pré-requisitos

1. ✅ Conta no [Supabase](https://supabase.com)
2. ✅ Node.js 18+ instalado
3. ✅ Git configurado

## 📋 Passo a Passo

### 1. Configurar Supabase

#### 1.1 Criar Projeto
1. Acesse https://app.supabase.com
2. Clique em "New Project"
3. Escolha um nome (ex: copacards)
4. Defina uma senha forte para o banco de dados
5. Escolha a região mais próxima

#### 1.2 Configurar Banco de Dados
1. No painel do Supabase, vá em "SQL Editor"
2. Copie todo o conteúdo do arquivo `supabase-setup.sql`
3. Cole no editor SQL
4. Clique em "Run" para executar

#### 1.3 Configurar Storage
1. Vá em "Storage" no menu lateral
2. Crie dois buckets públicos:
   - Nome: `avatars` (público)
   - Nome: `stickers` (público)

#### 1.4 Obter Credenciais
1. Vá em "Settings" → "API"
2. Copie:
   - **Project URL** (ex: https://xxxx.supabase.co)
   - **anon/public key** (chave pública)

### 2. Configurar Aplicação

#### 2.1 Clonar/Baixar Projeto
```bash
# Se estiver usando git
git clone seu-repositorio
cd copacards

# Ou extraia o ZIP do projeto
```

#### 2.2 Instalar Dependências
```bash
npm install
```

#### 2.3 Configurar Variáveis de Ambiente
1. Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

2. Edite o arquivo `.env` com suas credenciais:
```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA-CHAVE-PUBLICA-AQUI
```

### 3. Testar Localmente

```bash
# Executar em modo desenvolvimento
npm run dev

# Acessar em http://localhost:5173
```

### 4. Build para Produção

```bash
npm run build
```

Os arquivos otimizados estarão na pasta `dist/`.

### 5. Deploy

#### Opção A: Vercel (Recomendado)

1. Instale Vercel CLI:
```bash
npm i -g vercel
```

2. Execute deploy:
```bash
vercel
```

3. Configure as variáveis de ambiente no painel da Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

#### Opção B: Netlify

1. Instale Netlify CLI:
```bash
npm i -g netlify-cli
```

2. Execute deploy:
```bash
netlify deploy --prod
```

3. Configure as variáveis de ambiente no painel da Netlify.

#### Opção C: GitHub Pages

1. Instale gh-pages:
```bash
npm install --save-dev gh-pages
```

2. Adicione ao `package.json`:
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  },
  "homepage": "https://seu-usuario.github.io/copacards"
}
```

3. Execute:
```bash
npm run deploy
```

**Nota:** Para GitHub Pages, você precisará configurar as variáveis de ambiente antes do build.

#### Opção D: Supabase Hosting

1. No projeto Supabase, vá em "Hosting"
2. Faça upload da pasta `dist`
3. Configure o domínio

## 🔐 Segurança

### Configurar URL de Redirecionamento

No Supabase, vá em:
1. Authentication → URL Configuration
2. Adicione sua URL de produção em "Site URL"
3. Adicione em "Redirect URLs":
   - `https://seu-dominio.com`
   - `http://localhost:5173` (para desenvolvimento)

### Configurar Email Templates

1. Vá em Authentication → Email Templates
2. Personalize os templates de:
   - Confirmação de email
   - Recuperação de senha
   - Mudança de email

## 📊 Monitoramento

### Logs do Supabase
- Vá em "Logs" para ver erros e atividades
- Configure alertas para problemas

### Analytics
- Use Supabase Analytics para monitorar uso
- Configure Google Analytics se necessário

## 🛠️ Manutenção

### Backup do Banco de Dados
1. Vá em "Database" → "Backups"
2. Configure backups automáticos
3. Faça backups manuais antes de grandes mudanças

### Atualizações
```bash
# Atualizar dependências
npm update

# Verificar segurança
npm audit
npm audit fix
```

## 🐛 Solução de Problemas

### Erro: "Invalid API key"
- Verifique se as variáveis de ambiente estão corretas
- Confirme que copiou a chave `anon/public` (não a `service_role`)

### Erro: "Row Level Security"
- Certifique-se de que executou todo o script SQL
- Verifique se as políticas RLS estão habilitadas

### Erro: "CORS"
- Configure as URLs permitidas no Supabase
- Verifique Authentication → URL Configuration

### Erro ao fazer upload de imagens
- Verifique se os buckets foram criados
- Confirme que são públicos
- Verifique as políticas de storage

## 📝 Checklist de Deploy

- [ ] Projeto Supabase criado
- [ ] Script SQL executado
- [ ] Buckets de storage criados
- [ ] Variáveis de ambiente configuradas
- [ ] Teste local funcionando
- [ ] Build de produção gerado
- [ ] Deploy realizado
- [ ] URLs de redirecionamento configuradas
- [ ] Email templates personalizados
- [ ] Backup configurado
- [ ] Domínio customizado (opcional)

## 🎉 Pronto!

Sua aplicação CopaCards está no ar! 

Acesse e teste:
1. Criar uma conta
2. Publicar uma figurinha
3. Curtir e comentar
4. Seguir outros usuários
5. Trocar mensagens

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do Supabase
2. Consulte a documentação do Supabase
3. Revise o arquivo README.md
4. Verifique o console do navegador para erros

---

Boa sorte com seu projeto CopaCards! ⚽🏆
