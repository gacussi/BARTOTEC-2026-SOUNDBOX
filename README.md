# Letterbox Musical — Backend (PHP + Deezer API)

Backend simples em PHP puro para um "Letterboxd de música": você busca músicas/álbuns
na API do Deezer, avalia com nota + resenha, registra num diário de escutas e monta
uma lista de "quero ouvir".

## Estrutura

```
letterbox-backend/
├── config.php          -> conexão com o banco + funções auxiliares
├── deezer_api.php       -> funções que conversam com api.deezer.com
├── db.sql               -> script para criar as tabelas
└── api/
    ├── registrar.php     POST   -> criar conta
    ├── login.php          POST   -> logar (cria sessão)
    ├── logout.php         POST   -> deslogar
    ├── buscar.php         GET    -> busca no Deezer (proxy)
    ├── avaliar.php        POST   -> criar/editar avaliação (nota + resenha)
    ├── avaliacoes.php     GET    -> listar avaliações
    ├── diario.php         GET/POST/DELETE -> diário de escutas
    ├── quero_ouvir.php    GET/POST/DELETE -> lista "quero ouvir"
    ├── perfil.php         GET    -> perfil + estatísticas do usuário
    ├── top.php            GET    -> top MUNDIAL de músicas, álbuns e artistas (chart do Deezer)
    └── recentes.php       GET    -> lançamentos novos MUNDIAIS (Deezer)
```

## Passo a passo pra rodar

1. Suba os arquivos no seu hospedeiro (InfinityFree, por exemplo).
2. Crie um banco MySQL no painel e rode o `db.sql` no phpMyAdmin.
3. Rode também o `atualizacao_perfil.sql` (adiciona a coluna `foto_url`,
   usada na função de trocar a foto de perfil — o `db.sql` é um dump feito
   antes dessa coluna existir, por isso são dois arquivos separados).
4. Edite o `config.php` com o host, nome do banco, usuário e senha do MySQL.
5. Pronto — as rotas ficam em `seusite.com/api/nome_da_rota.php`.

A API do Deezer (`api.deezer.com`) é **pública** e não pede chave de acesso para
busca e detalhes, então não precisa configurar nada nesse lado.

## Checklist específico pro InfinityFree

Algumas coisas do InfinityFree que costumam pegar gente desprevenida:

- **Credenciais do banco não são "localhost"/"adm"/"123456"** (isso é só um
  exemplo no `config.php`). No painel do InfinityFree, vá em **MySQL
  Databases** e copie exatamente o que aparece lá: o host geralmente é algo
  tipo `sqlXXX.infinityfree.com` (não `localhost`), e o usuário/banco vêm com
  um prefixo tipo `epiz_12345678_nomedobanco`.
- **A pasta `uploads/` precisa ter permissão de escrita.** Pelo Gerenciador de
  Arquivos (File Manager) do painel, clica com o botão direito na pasta
  `uploads` → Change Permissions → deixa em **755** (se der erro de
  "permissão negada" ao trocar a foto de perfil, tenta **777**).
- **Cache agressivo:** depois de subir uma atualização, o InfinityFree (e o
  próprio navegador) pode continuar servindo a versão antiga dos arquivos
  `.css`/`.js` por um tempo. Pra forçar a atualização, os arquivos aqui já
  vêm com `?v=8` no final (ex: `css/style.css?v=8`) — da próxima vez que você
  atualizar o site, troca esse número em todos os `.html` (ex: pra `?v=9`)
  pra garantir que todo mundo carregue a versão nova.
- **Erros do PHP não aparecem mais na tela** (isso é de propósito, veja
  `config.php`) — se alguma rota da API não estiver funcionando, olha o
  **Error Log** do painel do InfinityFree em vez de esperar ver o erro no
  navegador.
- Depois de subir, teste **pelo celular de verdade** (ou pelo modo
  responsivo do navegador com menos de 760px de largura) — é só nessa
  largura que a barra de navegação de baixo aparece; ela fica escondida em
  telas maiores de propósito, porque nelas já tem o menu no topo.

## Como usar cada rota (exemplos)

### Criar conta
```
POST /api/registrar.php
{ "nome": "Ana", "email": "ana@email.com", "senha": "123456" }
```

### Login
```
POST /api/login.php
{ "email": "ana@email.com", "senha": "123456" }
```

### Buscar música ou álbum no Deezer
```
GET /api/buscar.php?q=coldplay&tipo=track
GET /api/buscar.php?q=coldplay&tipo=album
```
(o `tipo` aceita: `track`, `album` ou `artist`)

### Avaliar uma música/álbum (precisa estar logado)
```
POST /api/avaliar.php
{
  "deezer_id": "3135556",
  "tipo": "musica",
  "titulo": "Yellow",
  "capa_url": "https://...",
  "nota": 4.5,
  "resenha": "Clássico, ouço até hoje"
}
```
`nota` vai de 0.5 a 5, em passos de meia estrela (0.5, 1, 1.5, 2 ... 4.5, 5) — igual no Letterboxd.

Se você já tinha o banco criado com a coluna `nota` como número inteiro (tinyint)
e quer passar a aceitar meia estrela sem perder as avaliações que já existem,
rode isso no phpMyAdmin (não precisa recriar a tabela):
```sql
ALTER TABLE avaliacoes MODIFY COLUMN nota DECIMAL(2,1) NOT NULL;
```

### Ver avaliações de um usuário
```
GET /api/avaliacoes.php?usuario_id=1
```

### Ver avaliações de uma música específica (de todo mundo)
```
GET /api/avaliacoes.php?deezer_id=3135556&tipo=musica
```

### Registrar no diário
```
POST /api/diario.php
{
  "deezer_id": "3135556",
  "tipo": "musica",
  "titulo": "Yellow",
  "data_escuta": "2026-08-03"
}
```

### Adicionar em "quero ouvir"
```
POST /api/quero_ouvir.php
{ "deezer_id": "302127", "tipo": "album", "titulo": "A Rush of Blood to the Head" }
```

### Ver perfil de um usuário
```
GET /api/perfil.php?usuario_id=1
```

### Top mundial (músicas, álbuns e artistas mais ouvidos do momento)
```
GET /api/top.php                    -> top músicas + álbuns + artistas juntos
GET /api/top.php?tipo=musica         -> só o top de músicas
GET /api/top.php?tipo=album          -> só o top de álbuns
GET /api/top.php?tipo=artista        -> só o top de artistas
GET /api/top.php?limite=10           -> quantidade de resultados (padrão 25)
```
Usa o chart "geral" do Deezer (`/chart/0/...`), que é **mundial** — não é filtrado
por país nem depende de onde o servidor está hospedado.

### Lançamentos novos (hits recentes, também mundiais)
```
GET /api/recentes.php                    -> todos os lançamentos novos
GET /api/recentes.php?tipo=album          -> só álbuns
GET /api/recentes.php?tipo=musica         -> só singles/EPs
GET /api/recentes.php?limite=10           -> quantidade de resultados (padrão 20)
```

## Observações importantes

- Toda rota que precisa de login usa a sessão do PHP — o navegador guarda o cookie
  de sessão automaticamente depois do login, então nas próximas chamadas (avaliar,
  diário, quero ouvir) você não precisa mandar o usuario_id de novo, o próprio
  `config.php` já sabe quem está logado.
- Os campos `deezer_id`, `titulo` e `capa_url` que você manda ao criar uma avaliação
  ou entrada no diário vêm direto da resposta da busca (`buscar.php`) — assim o
  banco fica com os dados guardados sem precisar chamar o Deezer de novo toda hora.
- Isso ainda não tem CORS liberado por padrão (pensando em front-end e backend no
  mesmo domínio, como no InfinityFree). Se for separar em domínios diferentes,
  é só descomentar a linha do `Access-Control-Allow-Origin` no `config.php`.

## Ideias pra evoluir depois

- Curtidas em resenhas de outros usuários
- Seguir outros usuários / feed de atividades
- Listas personalizadas (tipo "Top 5 álbuns de 2026")
- Upload de foto de perfil
