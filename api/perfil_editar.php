<?php
require_once __DIR__ . "/../config.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responder(["erro" => "Método não permitido"], 405);
}

$usuarioId = exigirLogin();

$bio = trim($_POST["bio"] ?? "");

if (mb_strlen($bio, "UTF-8") > 280) {
    responder([
        "erro" => "A bio precisa ter no máximo 280 caracteres"
    ], 400);
}

$fotoUrl = null;

if (isset($_FILES["foto"]) && $_FILES["foto"]["error"] !== UPLOAD_ERR_NO_FILE) {
    $foto = $_FILES["foto"];

    if ($foto["error"] !== UPLOAD_ERR_OK) {
        $mensagens = [
            UPLOAD_ERR_INI_SIZE => "A imagem é maior do que o limite de upload configurado no servidor (upload_max_filesize). Tenta uma imagem menor.",
            UPLOAD_ERR_FORM_SIZE => "A imagem é maior do que o limite permitido pelo formulário.",
            UPLOAD_ERR_PARTIAL => "O upload foi interrompido no meio. Tenta de novo.",
            UPLOAD_ERR_NO_TMP_DIR => "O servidor não tem uma pasta temporária configurada (fala com o suporte do host).",
            UPLOAD_ERR_CANT_WRITE => "O servidor não conseguiu gravar o arquivo em disco.",
            UPLOAD_ERR_EXTENSION => "Uma extensão do PHP no servidor bloqueou esse upload.",
        ];
        responder([
            "erro" => $mensagens[$foto["error"]] ?? "Falha ao enviar a imagem",
            "codigo" => $foto["error"]
        ], 400);
    }

    if ($foto["size"] > 2 * 1024 * 1024) {
        responder([
            "erro" => "A imagem precisa ter no máximo 2 MB"
        ], 400);
    }

    $tipo = @getimagesize($foto["tmp_name"]);

    $permitidos = [
        IMAGETYPE_JPEG => "jpg",
        IMAGETYPE_PNG  => "png",
        IMAGETYPE_GIF  => "gif",
        IMAGETYPE_WEBP => "webp",
    ];

    if (!$tipo || !isset($permitidos[$tipo[2]])) {
        responder([
            "erro" => "Envie uma imagem JPG, PNG, GIF ou WEBP"
        ], 400);
    }

    $pasta = __DIR__ . "/../uploads";

    if (!is_dir($pasta) && !@mkdir($pasta, 0755, true) && !is_dir($pasta)) {
        responder([
            "erro" => "Não consegui criar a pasta de uploads. Crie manualmente uma pasta 'uploads' na raiz do site com permissão de escrita (755)."
        ], 500);
    }

    if (!is_writable($pasta)) {
        responder([
            "erro" => "A pasta de uploads não tem permissão de escrita. No InfinityFree, deixe a permissão dela como 755 (ou 777, se 755 não funcionar) pelo Gerenciador de Arquivos."
        ], 500);
    }

    $extensao = $permitidos[$tipo[2]];

    $nomeArquivo = "usuario" . $usuarioId . "-" . time() . "-" . bin2hex(random_bytes(3)) . "." . $extensao;
    $destino = $pasta . "/" . $nomeArquivo;

    if (!move_uploaded_file($foto["tmp_name"], $destino)) {
        responder([
            "erro" => "Não consegui salvar a imagem no servidor"
        ], 500);
    }

    // apaga a foto antiga (se tinha uma) pra não acumular arquivo órfão
    $stmt = mysqli_prepare($conexao, "SELECT foto_url FROM usuarios WHERE id = ?");
    mysqli_stmt_bind_param($stmt, "i", $usuarioId);
    mysqli_stmt_execute($stmt);
    $linha = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
    $fotoAntiga = $linha ? $linha["foto_url"] : null;
    if ($fotoAntiga) {
        $caminhoAntigo = __DIR__ . "/../" . $fotoAntiga;
        // só apaga se o caminho realmente aponta pra dentro da pasta de uploads
        // (proteção básica contra apagar arquivo errado)
        if (strpos(realpath($caminhoAntigo) ?: "", realpath($pasta)) === 0 && is_file($caminhoAntigo)) {
            @unlink($caminhoAntigo);
        }
    }

    $fotoUrl = "uploads/" . $nomeArquivo;
}

if ($fotoUrl !== null) {
    $stmt = mysqli_prepare(
        $conexao,
        "UPDATE usuarios SET bio = ?, foto_url = ? WHERE id = ?"
    );

    $bioFinal = $bio !== "" ? $bio : null;
    mysqli_stmt_bind_param($stmt, "ssi", $bioFinal, $fotoUrl, $usuarioId);
    mysqli_stmt_execute($stmt);
} else {
    $stmt = mysqli_prepare(
        $conexao,
        "UPDATE usuarios SET bio = ? WHERE id = ?"
    );

    $bioFinal = $bio !== "" ? $bio : null;
    mysqli_stmt_bind_param($stmt, "si", $bioFinal, $usuarioId);
    mysqli_stmt_execute($stmt);
}

$stmt = mysqli_prepare(
    $conexao,
    "SELECT id, nome, bio, foto_url
     FROM usuarios
     WHERE id = ?"
);

mysqli_stmt_bind_param($stmt, "i", $usuarioId);
mysqli_stmt_execute($stmt);

$usuario = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));

responder([
    "mensagem" => "Perfil atualizado",
    "usuario" => $usuario
]);
