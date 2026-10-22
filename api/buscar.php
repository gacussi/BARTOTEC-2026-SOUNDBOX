<?php
require_once __DIR__ . "/../config.php";
require_once __DIR__ . "/../deezer_api.php";

// Exemplo de uso:
// GET /api/buscar.php?q=coldplay&tipo=track
// GET /api/buscar.php?q=coldplay&tipo=album

$termo = trim($_GET["q"] ?? "");
$tipo = $_GET["tipo"] ?? "track";

if ($termo === "") {
    responder(["erro" => "Informe o parâmetro 'q' com o que quer buscar"], 400);
}

$resultados = deezerBuscar($termo, $tipo);

responder(["resultados" => $resultados]);
