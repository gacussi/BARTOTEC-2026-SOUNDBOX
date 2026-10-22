# Letterbox Musical — Backend (PHP + Deezer API)

Um "Letterboxd de música": você busca músicas/álbuns
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

### Ver perfil de um usuario
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
