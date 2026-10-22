/* ==========================================================
   api.js — conversa com o back-end PHP (mesmo domínio)
   ========================================================== */

// Descobre o caminho da pasta /api/ automaticamente, a partir do endereço
// real desse próprio arquivo <script src="js/api.js">. Isso funciona não
// importa em que pasta o site for hospedado (raiz do domínio, subpasta,
// subdomínio do InfinityFree, etc.) — muito mais robusto do que tentar
// adivinhar pelo caminho da página.
var API = (function () {
  try {
    var script = document.currentScript;
    if (!script) {
      // navegadores bem antigos sem suporte a document.currentScript:
      // pega o último <script> da página (é este arquivo, já que ele
      // roda no momento em que é carregado)
      var scripts = document.getElementsByTagName("script");
      script = scripts[scripts.length - 1];
    }
    if (script && script.src) {
      // troca ".../js/api.js" por ".../api" (endereço absoluto, sempre certo)
      return script.src.replace(/\/js\/api\.js(\?.*)?(#.*)?$/, "/api");
    }
  } catch (e) {
    /* segue pro valor padrão abaixo */
  }
  return "api"; // caminho relativo simples, funciona quando a página está na raiz
})();

async function pedir(rota, opcoes) {
  opcoes = opcoes || {};
  var config = {
    method: opcoes.metodo || "GET",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
  };
  if (opcoes.corpo) config.body = JSON.stringify(opcoes.corpo);

  var resposta;
  try {
    resposta = await fetch(API + "/" + rota, config);
  } catch (e) {
    throw new Error("Não consegui falar com o servidor. Ele está no ar?");
  }

  var dados;
  try {
    dados = await resposta.json();
  } catch (e) {
    throw new Error("O servidor respondeu algo que não é JSON.");
  }

  if (!resposta.ok) throw new Error(dados.erro || "Deu ruim na requisição.");
  return dados;
}

var api = {
  registrar: function (nome, email, senha) {
    return pedir("registrar.php", { metodo: "POST", corpo: { nome: nome, email: email, senha: senha } });
  },
  login: function (email, senha) {
    return pedir("login.php", { metodo: "POST", corpo: { email: email, senha: senha } });
  },
  logout: function () {
    return pedir("logout.php", { metodo: "POST" });
  },
  buscar: function (termo, tipo) {
    return pedir("buscar.php?q=" + encodeURIComponent(termo) + "&tipo=" + tipo);
  },
  detalhesItem: function (deezerId, tipo) {
    return pedir("item.php?deezer_id=" + encodeURIComponent(deezerId) + "&tipo=" + tipo);
  },
  top: function (tipo, limite) {
    return pedir("top.php?tipo=" + (tipo || "") + "&limite=" + (limite || 12));
  },
  recentes: function (tipo, limite) {
    return pedir("recentes.php?tipo=" + (tipo || "") + "&limite=" + (limite || 12));
  },
  avaliar: function (dados) {
    return pedir("avaliar.php", { metodo: "POST", corpo: dados });
  },
  avaliacoesDoUsuario: function (id) {
    return pedir("avaliacoes.php?usuario_id=" + id);
  },
  avaliacoesDoItem: function (deezerId, tipo) {
    return pedir("avaliacoes.php?deezer_id=" + encodeURIComponent(deezerId) + "&tipo=" + tipo);
  },
  diario: function (id) {
    return pedir("diario.php?usuario_id=" + id);
  },
  addDiario: function (dados) {
    return pedir("diario.php", { metodo: "POST", corpo: dados });
  },
  removerDiario: function (id) {
    return pedir("diario.php", { metodo: "DELETE", corpo: { id: id } });
  },
  queroOuvir: function (id) {
    return pedir("quero_ouvir.php?usuario_id=" + id);
  },
  addQueroOuvir: function (dados) {
    return pedir("quero_ouvir.php", { metodo: "POST", corpo: dados });
  },
  removerQueroOuvir: function (deezerId, tipo) {
    return pedir("quero_ouvir.php", { metodo: "DELETE", corpo: { deezer_id: deezerId, tipo: tipo } });
  },
  perfil: function (id) {
    return pedir("perfil.php?usuario_id=" + id);
  },
  atualizarPerfil: function (formData) {
    return enviarFormulario("perfil_editar.php", formData);
  },
};

// Envio com arquivo (foto de perfil) — não usa JSON
async function enviarFormulario(rota, formData) {
  var resposta;
  try {
    resposta = await fetch(API + "/" + rota, {
      method: "POST",
      credentials: "same-origin",
      body: formData,
    });
  } catch (e) {
    throw new Error("Não consegui falar com o servidor. Ele está no ar?");
  }
  var dados;
  try {
    dados = await resposta.json();
  } catch (e) {
    throw new Error("O servidor respondeu algo que não é JSON.");
  }
  if (!resposta.ok) throw new Error(dados.erro || "Deu ruim ao salvar o perfil.");
  return dados;
}
