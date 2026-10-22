<?php

error_reporting(E_ALL);
ini_set("display_errors", "0");
ini_set("log_errors", "1");

function respostaErroFatal($mensagem) {
    if (!headers_sent()) {
        header("Content-Type: application/json; charset=utf-8");
        http_response_code(500);
    }
    echo json_encode(["erro" => "Erro interno no servidor. Tenta de novo em instantes."], JSON_UNESCAPED_UNICODE);
    exit;
}

// Qualquer exceção que ninguém pegou (ex: erro de banco inesperado) vira
// JSON em vez de derrubar a página com uma tela branca/HTML de erro.
set_exception_handler(function ($erro) {
    error_log("Exceção não tratada: " . $erro->getMessage());
    respostaErroFatal($erro->getMessage());
});

// Erros fatais (ex: função que não existe, versão de PHP mais velha no host)
// também viram JSON em vez de um HTML quebrado pela metade.
register_shutdown_function(function () {
    $erro = error_get_last();
    if ($erro && in_array($erro["type"], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        error_log("Erro fatal: " . $erro["message"]);
        respostaErroFatal($erro["message"]);
    }
});

$DB_HOST = "sql101.infinityfree.com";
$DB_NOME = "if0_42596399_letterbox";
$DB_USUARIO = "if0_42596399";
$DB_SENHA = "Gui10dav";

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    $conexao = mysqli_connect($DB_HOST, $DB_USUARIO, $DB_SENHA, $DB_NOME);
    mysqli_set_charset($conexao, "utf8mb4");
} catch (mysqli_sql_exception $e) {
    error_log("Falha ao conectar no banco: " . $e->getMessage());
    http_response_code(500);
    die(json_encode(["erro" => "Falha ao conectar no banco de dados. Confira o DB_HOST/DB_NOME/DB_USUARIO/DB_SENHA no config.php."]));
}

// Sessão pra manter o usuário logado
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

header("Content-Type: application/json; charset=utf-8");

function responder($dados, $status = 200) {
    http_response_code($status);
    echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}

// Função que verifica se tem alguém logado, usada nas rotas protegidas
function exigirLogin() {
    if (!isset($_SESSION["usuario_id"])) {
        responder(["erro" => "Você precisa estar logado"], 401);
    }
    return $_SESSION["usuario_id"];
}
