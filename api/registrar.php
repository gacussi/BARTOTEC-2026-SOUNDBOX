<?php
require_once __DIR__ . "/../config.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responder(["erro" => "Método não permitido"], 405);
}

$dados = json_decode(file_get_contents("php://input"), true);

$nome = trim($dados["nome"] ?? "");
$email = trim($dados["email"] ?? "");
$senha = $dados["senha"] ?? "";

if ($nome === "" || $email === "" || $senha === "") {
    responder(["erro" => "Preencha nome, email e senha"], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responder(["erro" => "Email inválido"], 400);
}

if (strlen($senha) < 6) {
    responder(["erro" => "A senha precisa ter no mínimo 6 caracteres"], 400);
}

// Verifica se o email já existe
$stmt = mysqli_prepare($conexao, "SELECT id FROM usuarios WHERE email = ?");
mysqli_stmt_bind_param($stmt, "s", $email);
mysqli_stmt_execute($stmt);
if (mysqli_fetch_assoc(mysqli_stmt_get_result($stmt))) {
    responder(["erro" => "Já existe uma conta com esse email"], 409);
}

$senhaHash = password_hash($senha, PASSWORD_DEFAULT);

$stmt = mysqli_prepare($conexao, "INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)");
mysqli_stmt_bind_param($stmt, "sss", $nome, $email, $senhaHash);
mysqli_stmt_execute($stmt);

$usuarioId = mysqli_insert_id($conexao);

// já loga o usuário automaticamente depois do cadastro
$_SESSION["usuario_id"] = $usuarioId;
$_SESSION["usuario_nome"] = $nome;

responder(["mensagem" => "Conta criada com sucesso", "usuario_id" => $usuarioId], 201);
