<?php
require_once __DIR__ . "/../config.php";

$metodo = $_SERVER["REQUEST_METHOD"];

if ($metodo === "POST") {
    $usuarioId = exigirLogin();
    $dados = json_decode(file_get_contents("php://input"), true);

    $deezerId = trim($dados["deezer_id"] ?? "");
    $tipo = $dados["tipo"] ?? "";
    $titulo = trim($dados["titulo"] ?? "");
    $capaUrl = $dados["capa_url"] ?? null;

    if ($deezerId === "" || !in_array($tipo, ["musica", "album"]) || $titulo === "") {
        responder(["erro" => "Envie deezer_id, tipo (musica ou album) e titulo"], 400);
    }

    $stmt = mysqli_prepare($conexao, "
        INSERT IGNORE INTO quero_ouvir (usuario_id, deezer_id, tipo, titulo, capa_url)
        VALUES (?, ?, ?, ?, ?)
    ");
    mysqli_stmt_bind_param($stmt, "issss", $usuarioId, $deezerId, $tipo, $titulo, $capaUrl);
    mysqli_stmt_execute($stmt);

    responder(["mensagem" => "Adicionado à lista de quero ouvir"], 201);
}

if ($metodo === "GET") {
    $usuarioId = $_GET["usuario_id"] ?? null;

    if (!$usuarioId) {
        responder(["erro" => "Informe usuario_id"], 400);
    }

    $stmt = mysqli_prepare($conexao, "SELECT * FROM quero_ouvir WHERE usuario_id = ? ORDER BY criado_em DESC");
    mysqli_stmt_bind_param($stmt, "i", $usuarioId);
    mysqli_stmt_execute($stmt);
    $resultado = mysqli_stmt_get_result($stmt);

    responder(["quero_ouvir" => mysqli_fetch_all($resultado, MYSQLI_ASSOC)]);
}

if ($metodo === "DELETE") {
    $usuarioId = exigirLogin();
    $dados = json_decode(file_get_contents("php://input"), true);
    $deezerId = trim($dados["deezer_id"] ?? "");
    $tipo = $dados["tipo"] ?? "";

    $stmt = mysqli_prepare($conexao, "DELETE FROM quero_ouvir WHERE usuario_id = ? AND deezer_id = ? AND tipo = ?");
    mysqli_stmt_bind_param($stmt, "iss", $usuarioId, $deezerId, $tipo);
    mysqli_stmt_execute($stmt);

    responder(["mensagem" => "Removido da lista"]);
}

responder(["erro" => "Método não permitido"], 405);
