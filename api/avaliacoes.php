<?php
require_once __DIR__ . "/../config.php";

// Duas formas de usar:
// GET /api/avaliacoes.php?usuario_id=3          -> todas as avaliações desse usuário
// GET /api/avaliacoes.php?deezer_id=123&tipo=musica -> todas as avaliações desse item (de todo mundo)

$usuarioId = $_GET["usuario_id"] ?? null;
$deezerId = $_GET["deezer_id"] ?? null;
$tipo = $_GET["tipo"] ?? null;

if ($usuarioId) {
    $stmt = mysqli_prepare($conexao, "
        SELECT a.*, u.nome AS usuario_nome
        FROM avaliacoes a
        JOIN usuarios u ON u.id = a.usuario_id
        WHERE a.usuario_id = ?
        ORDER BY a.criado_em DESC
    ");
    mysqli_stmt_bind_param($stmt, "i", $usuarioId);
    mysqli_stmt_execute($stmt);
} elseif ($deezerId && $tipo) {
    $stmt = mysqli_prepare($conexao, "
        SELECT a.*, u.nome AS usuario_nome
        FROM avaliacoes a
        JOIN usuarios u ON u.id = a.usuario_id
        WHERE a.deezer_id = ? AND a.tipo = ?
        ORDER BY a.criado_em DESC
    ");
    mysqli_stmt_bind_param($stmt, "ss", $deezerId, $tipo);
    mysqli_stmt_execute($stmt);
} else {
    responder(["erro" => "Informe usuario_id OU (deezer_id e tipo)"], 400);
}

$resultado = mysqli_stmt_get_result($stmt);
responder(["avaliacoes" => mysqli_fetch_all($resultado, MYSQLI_ASSOC)]);
