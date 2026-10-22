<?php
require_once __DIR__ . "/../config.php";

$usuarioId = $_GET["usuario_id"] ?? null;

if (!$usuarioId) {
    responder(["erro" => "Informe usuario_id"], 400);
}

$stmt = mysqli_prepare($conexao, "SELECT id, nome, bio, foto_url, criado_em FROM usuarios WHERE id = ?");
mysqli_stmt_bind_param($stmt, "i", $usuarioId);
mysqli_stmt_execute($stmt);
$usuario = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));

if (!$usuario) {
    responder(["erro" => "Usuário não encontrado"], 404);
}

// algumas estatísticas simples, tipo o perfil do Letterboxd
$stmt = mysqli_prepare($conexao, "SELECT COUNT(*) AS total FROM avaliacoes WHERE usuario_id = ?");
mysqli_stmt_bind_param($stmt, "i", $usuarioId);
mysqli_stmt_execute($stmt);
$totalAvaliacoes = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt))["total"];

$stmt = mysqli_prepare($conexao, "SELECT COUNT(*) AS total FROM diario WHERE usuario_id = ?");
mysqli_stmt_bind_param($stmt, "i", $usuarioId);
mysqli_stmt_execute($stmt);
$totalDiario = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt))["total"];

$stmt = mysqli_prepare($conexao, "SELECT ROUND(AVG(nota), 2) AS media FROM avaliacoes WHERE usuario_id = ?");
mysqli_stmt_bind_param($stmt, "i", $usuarioId);
mysqli_stmt_execute($stmt);
$mediaNotas = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt))["media"];

responder([
    "usuario" => $usuario,
    "estatisticas" => [
        "total_avaliacoes" => (int) $totalAvaliacoes,
        "total_diario" => (int) $totalDiario,
        "media_notas" => $mediaNotas !== null ? (float) $mediaNotas : null,
    ]
]);
