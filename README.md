# Churrasco LAB Brasília 2026 · site oficial

Página única, feita para celular primeiro, com a mesma estética do flyer oficial:
fundo escuro, tudo centralizado, um destaque em laranja. Seções: abertura (com vídeo real
de brasas ao fundo), o evento em um olhar, as 6 aulas-show, inscrição, local e régua de marcas.

## Onde mexer

| O que | Arquivo |
|---|---|
| Datas, local, programação, profissionais e textos | `src/config/evento.ts` |
| Inscrições (banco, e-mail obrigatório ou não, regiões) | `src/config/inscricao.ts` |
| Cores, fontes e botões | `src/app/globals.css` e `src/app/fonts.ts` |
| Logo, régua de marcas, fotos e vídeo | `public/brand`, `public/fotos`, `public/profissionais`, `public/video` |
| Refazer as imagens a partir dos materiais oficiais | `node scripts/preparar-imagens.mjs "<pasta dos materiais>"` |
| Logo animada (camadas oficiais) | `src/components/LogoAnimada.tsx`, animações em `src/app/globals.css`, camadas em `public/brand/logo` |
| Faíscas que sobem por todo o site | `src/components/Faiscas.tsx` (quantidade e tamanho) e `src/app/globals.css` |
| Refazer as camadas da logo | `node scripts/preparar-logo.mjs "<pasta LOGO PARA ANIMAR>"` |
| Imagem de prévia do WhatsApp e ícones | `scripts/og.html` e `scripts/icone.html` |

Regra do projeto: só entra informação confirmada pela organização. Sem foto oficial, o cartão do
profissional mostra a inicial do nome. Sem currículo, não há perfil.

## Inscrições

O formulário grava direto no Supabase (projeto "COGNUS FINANCE", tabela `churrascolab_inscricoes`).
O site só consegue inserir. Para ver os inscritos, abra o painel do Supabase, Table Editor:

- `churrascolab_inscritos`: lista sem repetição (última inscrição de cada WhatsApp)
- `churrascolab_resumo_por_aula`: total de inscritos por aula
- `churrascolab_inscricoes`: tudo o que chegou

## Área restrita (/admin)

`https://churrascolabbsb.com.br/admin` mostra os inscritos, com busca, filtro por aula e exportação em
Excel, CSV e PDF (pela impressão do navegador). O login e a senha são conferidos no banco, onde a senha
fica só como hash; 8 erros em 15 minutos bloqueiam novas tentativas. Para trocar a senha, rode no
SQL Editor do Supabase:

```sql
update public.churrascolab_admin
set senha_hash = extensions.crypt('NOVA_SENHA', extensions.gen_salt('bf', 10)), atualizado_em = now()
where login = 'admin';
```

## Créditos de mídia

- Som ambiente de brasa: Mixkit, "Campfire crackles" (sfx 1330), Mixkit Sound Effects Free License. Volume e comportamento em `src/components/Som.tsx`.
- Vídeo de brasas da abertura: Mixkit, "Embers glowing and flames" (id 7090), Mixkit Stock Video Free License.
- Logo animada: camadas oficiais da pasta "LOGO PARA ANIMAR" (fogo, vapores, palavras, facas e pontos), reduzidas e aparadas só na borda transparente. Tudo é animado no lugar, sem deslocar peças.
- Carne na grelha e régua de marcas: recortes das artes oficiais guardadas em `materiais/`.

## Rodar e publicar

```bash
npm install
npm run dev      # abre em http://localhost:3000
npm run build    # gera a pasta out/ (site estático)
```

Na Vercel: importe o repositório, mantenha as opções padrão e aponte o domínio `churrascolabbsb.com.br`.
Analytics é opcional: preencha `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID` ou `NEXT_PUBLIC_META_PIXEL_ID`
nas variáveis de ambiente (veja `.env.example`). Sem isso, nenhum script de terceiros é carregado.

## Credenciamento de expositores (desde 27/11/2026)

- Página: `/expositores` (`src/components/Credenciamento.tsx`). Textos e opções: `src/config/expositores.ts`.
- Banco (Supabase, projeto "COGNUS FINANCE"): tabela `churrascolab_expositores`. A chave pública só insere; ninguém lê por ela. Limite de 3 envios por WhatsApp.
- Arquivos (fotos, catálogo, portfólio): bucket **privado** `churrascolab-expositores`, só imagem e PDF, até 5 MB. O visitante só envia.
- Área restrita (`/admin`, aba "Expositores"): lista pela função `churrascolab_admin_expositores` e abre cada arquivo pela Edge Function `churrascolab-arquivo`, que confere login e senha e devolve um link válido por 10 minutos.
- A planta do evento usada no mapa 3D está em `materiais/planta` e as posições em `src/components/imersivo/cena3d.ts`.
