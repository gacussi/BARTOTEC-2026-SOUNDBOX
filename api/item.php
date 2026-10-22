<?php
require_once __DIR__ . "/../config.php";
require_once __DIR__ . "/../deezer_api.php";

// Detalhes completos de uma música ou álbum, direto da API do Deezer
// (data de lançamento, duração, gênero, gravadora, artistas envolvidos, etc.)
// Exemplo de uso:
// GET /api/item.php?deezer_id=3157972&tipo=musica
// GET /api/item.php?deezer_id=302127&tipo=album

$deezerId = trim($_GET["deezer_id"] ?? "");
$tipo = $_GET["tipo"] ?? "musica";

if ($deezerId === "" || !in_array($tipo, ["musica", "album"])) {
    responder(["erro" => "Envie deezer_id e tipo (musica ou album)"], 400);
}

$bruto = $tipo === "album" ? deezerObterAlbum($deezerId) : deezerObterMusica($deezerId);

if (!$bruto || isset($bruto["error"])) {
    responder(["erro" => "Não encontrei esse item no Deezer"], 404);
}

// Monta uma ficha bem completa, já em português, com tudo que o Deezer manda.
// Cada campo só aparece se o Deezer realmente mandou aquela informação
// (nem toda música/álbum tem BPM, gravadora, gênero, etc. preenchido).
if ($tipo === "musica") {
    $ficha = [
        "titulo" => $bruto["title"] ?? null,
        "titulo_versao" => $bruto["title_version"] ?? null, // ex: "Remix", "Ao vivo"
        "artista" => $bruto["artist"]["name"] ?? null,
        "artista_id" => $bruto["artist"]["id"] ?? null,
        "artista_foto" => $bruto["artist"]["picture_medium"] ?? null,
        "album" => $bruto["album"]["title"] ?? null,
        "album_id" => $bruto["album"]["id"] ?? null,
        "capa" => $bruto["album"]["cover_xl"] ?? $bruto["album"]["cover_big"] ?? null,
        "data_lancamento" => $bruto["release_date"] ?? null,
        "duracao_segundos" => $bruto["duration"] ?? null,
        "numero_faixa" => $bruto["track_position"] ?? null,
        "numero_disco" => $bruto["disk_number"] ?? null,
        "bpm" => !empty($bruto["bpm"]) ? $bruto["bpm"] : null,
        "conteudo_explicito" => $bruto["explicit_lyrics"] ?? null,
        "preview_url" => $bruto["preview"] ?? null, // 30s de prévia, dá pra tocar direto
        "link_deezer" => $bruto["link"] ?? null,
        "contribuintes" => array_map(function ($c) {
            return ["id" => $c["id"] ?? null, "nome" => $c["name"] ?? null, "papel" => $c["role"] ?? null];
        }, $bruto["contributors"] ?? []),
    ];
} else {
    $ficha = [
        "titulo" => $bruto["title"] ?? null,
        "artista" => $bruto["artist"]["name"] ?? null,
        "artista_id" => $bruto["artist"]["id"] ?? null,
        "artista_foto" => $bruto["artist"]["picture_medium"] ?? null,
        "capa" => $bruto["cover_xl"] ?? $bruto["cover_big"] ?? null,
        "data_lancamento" => $bruto["release_date"] ?? null,
        "tipo_lancamento" => $bruto["record_type"] ?? null, // album, single, ep, compile
        "numero_faixas" => $bruto["nb_tracks"] ?? null,
        "duracao_segundos" => $bruto["duration"] ?? null,
        "gravadora" => $bruto["label"] ?? null,
        "generos" => array_map(function ($g) {
            return $g["name"] ?? null;
        }, $bruto["genres"]["data"] ?? []),
        "fas" => $bruto["fans"] ?? null,
        "conteudo_explicito" => $bruto["explicit_lyrics"] ?? null,
        "upc" => $bruto["upc"] ?? null, // código internacional do álbum
        "link_deezer" => $bruto["link"] ?? null,
        "faixas" => array_map(function ($f) {
            return [
                "id" => $f["id"] ?? null,
                "titulo" => $f["title"] ?? null,
                "duracao_segundos" => $f["duration"] ?? null,
                "numero_faixa" => $f["track_position"] ?? null,
            ];
        }, $bruto["tracks"]["data"] ?? []),
    ];
}

responder(["item" => $ficha]);
