<?php
require_once __DIR__ . "/../config.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responder(["erro" => "Método não permitido"], 405);
}

$dados = json_decode(file_get_contents("php://input"), true);

$email = trim($dados["email"] ?? "");
$senha = $dados["senha"] ?? "";

if ($email === "" || $senha === "") {
    responder(["erro" => "Preencha email e senha"], 400);
}

$stmt = mysqli_prepare($conexao, "SELECT id, nome, foto_url, senha_hash FROM usuarios WHERE email = ?");
mysqli_stmt_bind_param($stmt, "s", $email);
mysqli_stmt_execute($stmt);
$resultado = mysqli_stmt_get_result($stmt);
$usuario = mysqli_fetch_assoc($resultado);

if (!$usuario || !password_verify($senha, $usuario["senha_hash"])) {
    responder(["erro" => "Email ou senha incorretos"], 401);
}

$_SESSION["usuario_id"] = $usuario["id"];
$_SESSION["usuario_nome"] = $usuario["nome"];

responder([
    "mensagem" => "Login realizado com sucesso",
    "usuario" => ["id" => $usuario["id"], "nome" => $usuario["nome"], "foto_url" => $usuario["foto_url"]]
]);
