<?php
require_once __DIR__ . "/../config.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responder(["erro" => "Método não permitido"], 405);
}

$usuarioId = exigirLogin();

$dados = json_decode(file_get_contents("php://input"), true);

$deezerId = trim($dados["deezer_id"] ?? "");
$tipo = $dados["tipo"] ?? "";
$titulo = trim($dados["titulo"] ?? "");
$capaUrl = $dados["capa_url"] ?? null;
$nota = (float) ($dados["nota"] ?? 0);
$resenha = trim($dados["resenha"] ?? "");

if ($deezerId === "" || !in_array($tipo, ["musica", "album"]) || $titulo === "") {
    responder(["erro" => "Envie deezer_id, tipo (musica ou album) e titulo"], 400);
}

// Nota de 0.5 a 5 estrelas, podendo usar meia estrela (0.5, 1, 1.5, 2 ... 4.5, 5),
// igual no Letterboxd. O "round" evita problema de arredondamento de ponto
// flutuante (ex: 2.5 virar 2.4999999) na hora de checar o múltiplo de 5.
$notaValida = $nota >= 0.5 && $nota <= 5 && round($nota * 10) % 5 === 0;

if (!$notaValida) {
    responder(["erro" => "A nota precisa ser de 0.5 a 5 estrelas, em passos de meia estrela"], 400);
}

// INSERT ... ON DUPLICATE KEY UPDATE: se o usuário já avaliou esse item,
// a avaliação é atualizada em vez de criar uma duplicada
$stmt = mysqli_prepare($conexao, "
    INSERT INTO avaliacoes (usuario_id, deezer_id, tipo, titulo, capa_url, nota, resenha)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
        nota = VALUES(nota),
        resenha = VALUES(resenha),
        titulo = VALUES(titulo),
        capa_url = VALUES(capa_url)
");

mysqli_stmt_bind_param($stmt, "issssds", $usuarioId, $deezerId, $tipo, $titulo, $capaUrl, $nota, $resenha);
mysqli_stmt_execute($stmt);

responder(["mensagem" => "Avaliação salva com sucesso"], 201);
