<?php
require_once __DIR__ . "/../config.php";
require_once __DIR__ . "/../deezer_api.php";

// Top Global = ranking de popularidade do Deezer (chart oficial "geral",
// que é MUNDIAL — não filtrado por país), não depende das avaliações
// salvas no seu banco.
// Exemplos:
// GET /api/top.php                    -> top músicas, álbuns E artistas juntos
// GET /api/top.php?tipo=musica         -> só o top de músicas
// GET /api/top.php?tipo=album          -> só o top de álbuns
// GET /api/top.php?tipo=artista        -> só o top de artistas
// GET /api/top.php?limite=10           -> quantidade de resultados (padrão 25)

$tipo = $_GET["tipo"] ?? null;
$limite = (int) ($_GET["limite"] ?? 25);

if ($limite < 1 || $limite > 100) {
    $limite = 25;
}

if ($tipo !== null && !in_array($tipo, ["musica", "album", "artista"])) {
    responder(["erro" => "tipo precisa ser 'musica', 'album' ou 'artista'"], 400);
}

// adiciona um campo "tipo" e "posicao" (ranking 1, 2, 3...) em cada item,
// pra ficar no mesmo padrão que a gente já usa em avaliar.php e diario.php
// (musica/album) e pra mostrar a posição no ranking mundial
function marcarTipo($lista, $tipo) {
    $posicao = 0;
    return array_map(function ($item) use ($tipo, &$posicao) {
        $posicao++;
        $item["tipo"] = $tipo;
        $item["posicao"] = $posicao;
        return $item;
    }, $lista);
}

if ($tipo === "musica") {
    $top = marcarTipo(deezerChartMusicas($limite), "musica");
    responder(["top" => $top]);
}

if ($tipo === "album") {
    $top = marcarTipo(deezerChartAlbuns($limite), "album");
    responder(["top" => $top]);
}

if ($tipo === "artista") {
    $top = marcarTipo(deezerChartArtistas($limite), "artista");
    responder(["top" => $top]);
}

// sem filtro: manda os três rankings separados
$topMusicas = marcarTipo(deezerChartMusicas($limite), "musica");
$topAlbuns = marcarTipo(deezerChartAlbuns($limite), "album");
$topArtistas = marcarTipo(deezerChartArtistas($limite), "artista");

responder([
    "top_musicas" => $topMusicas,
    "top_albuns" => $topAlbuns,
    "top_artistas" => $topArtistas,
]);
