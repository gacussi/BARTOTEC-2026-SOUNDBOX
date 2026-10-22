<?php
require_once __DIR__ . "/../config.php";
require_once __DIR__ . "/../deezer_api.php";

// Lançamentos novos direto do Deezer (não é do nosso banco, é da API deles).
// São lançamentos MUNDIAIS: não são filtrados por país, vêm dos artistas
// mais ouvidos no chart geral do Deezer.
// Exemplos:
// GET /api/recentes.php                    -> todos os lançamentos novos
// GET /api/recentes.php?tipo=album          -> só álbuns
// GET /api/recentes.php?tipo=musica         -> só singles/EPs
// GET /api/recentes.php?limite=10           -> quantidade de resultados (padrão 20)

$tipo = $_GET["tipo"] ?? null;
$limite = (int) ($_GET["limite"] ?? 20);

if ($limite < 1 || $limite > 100) {
    $limite = 20;
}

if ($tipo !== null && !in_array($tipo, ["musica", "album"])) {
    responder(["erro" => "tipo precisa ser 'musica' ou 'album'"], 400);
}

$lancamentos = deezerNovosLancamentos();

// O Deezer manda "record_type" em cada álbum ("album", "single", "ep", "compile").
// A gente usa isso pra filtrar entre música/single e álbum de verdade.
if ($tipo === "album") {
    $lancamentos = array_values(array_filter($lancamentos, function ($item) {
        return ($item["record_type"] ?? "") === "album";
    }));
} elseif ($tipo === "musica") {
    $lancamentos = array_values(array_filter($lancamentos, function ($item) {
        return in_array($item["record_type"] ?? "", ["single", "ep"]);
    }));
}

$lancamentos = array_slice($lancamentos, 0, $limite);

responder(["recentes" => $lancamentos]);
