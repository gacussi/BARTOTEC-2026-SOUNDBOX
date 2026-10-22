<?php
require_once __DIR__ . "/../config.php";

$metodo = $_SERVER["REQUEST_METHOD"];

if ($metodo === "POST") {
    // Adicionar um registro no diário ("ouvi isso em tal dia")
    $usuarioId = exigirLogin();
    $dados = json_decode(file_get_contents("php://input"), true);

    $deezerId = trim($dados["deezer_id"] ?? "");
    $tipo = $dados["tipo"] ?? "";
    $titulo = trim($dados["titulo"] ?? "");
    $capaUrl = $dados["capa_url"] ?? null;
    $dataEscuta = $dados["data_escuta"] ?? date("Y-m-d"); // se não vier, usa hoje

    if ($deezerId === "" || !in_array($tipo, ["musica", "album"]) || $titulo === "") {
        responder(["erro" => "Envie deezer_id, tipo (musica ou album) e titulo"], 400);
    }

    $stmt = mysqli_prepare($conexao, "
        INSERT INTO diario (usuario_id, deezer_id, tipo, titulo, capa_url, data_escuta)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    mysqli_stmt_bind_param($stmt, "isssss", $usuarioId, $deezerId, $tipo, $titulo, $capaUrl, $dataEscuta);
    mysqli_stmt_execute($stmt);

    responder(["mensagem" => "Registrado no diário"], 201);
}

if ($metodo === "GET") {
    // Listar o diário de um usuário
    $usuarioId = $_GET["usuario_id"] ?? null;

    if (!$usuarioId) {
        responder(["erro" => "Informe usuario_id"], 400);
    }

    $stmt = mysqli_prepare($conexao, "
        SELECT * FROM diario
        WHERE usuario_id = ?
        ORDER BY data_escuta DESC, criado_em DESC
    ");
    mysqli_stmt_bind_param($stmt, "i", $usuarioId);
    mysqli_stmt_execute($stmt);
    $resultado = mysqli_stmt_get_result($stmt);

    responder(["diario" => mysqli_fetch_all($resultado, MYSQLI_ASSOC)]);
}

if ($metodo === "DELETE") {
    // Remover um registro do diário
    $usuarioId = exigirLogin();
    $dados = json_decode(file_get_contents("php://input"), true);
    $id = (int) ($dados["id"] ?? 0);

    $stmt = mysqli_prepare($conexao, "DELETE FROM diario WHERE id = ? AND usuario_id = ?");
    mysqli_stmt_bind_param($stmt, "ii", $id, $usuarioId);
    mysqli_stmt_execute($stmt);

    responder(["mensagem" => "Removido do diário"]);
}

responder(["erro" => "Método não permitido"], 405);
