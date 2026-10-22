montarTopo("perfil");
montarRodape();

var usuarioLogado = sessao.pegar();
var usuarioId = parametro("usuario_id") || (usuarioLogado && usuarioLogado.id);
var souEu = usuarioLogado && String(usuarioLogado.id) === String(usuarioId);

if (!usuarioId) {
  window.location.href = "entrar.html";
}

function avatarHtml(u) {
  if (u.foto_url) {
    return '<img class="perfil-foto" id="foto-atual" src="' + escapar(u.foto_url) + '" alt="Foto de ' + escapar(u.nome) + '" onerror="this.remove()">';
  }
  return '<div class="avatar" id="foto-atual">' + escapar((u.nome || "?").charAt(0).toUpperCase()) + "</div>";
}

async function carregarPerfil() {
  var caixa = el("#cabecalho-perfil");
  try {
    var dados = await api.perfil(usuarioId);
    var u = dados.usuario;
    var e = dados.estatisticas;

    if (souEu) {
      var atual = sessao.pegar() || {};
      atual.foto_url = u.foto_url || null;
      atual.bio = u.bio || null;
      sessao.salvar(atual);
      montarTopo("perfil");
    }

    caixa.innerHTML =
      '<div class="perfil-topo">' +
      (souEu
        ? '<div class="avatar-editavel">' + avatarHtml(u) +
          '<button class="trocar-foto" type="button" id="btn-trocar-foto" title="Trocar foto">✎</button></div>'
        : avatarHtml(u)) +
      '<div style="min-width:0">' +
      '<h1 style="font-size:26px">' + escapar(u.nome) + "</h1>" +
      '<p style="color:var(--texto-fraco);font-size:14px">' +
      escapar(u.bio || "Sem bio por enquanto.") + "</p>" +
      "</div>" +
      '<div class="estatisticas">' +
      "<div><strong>" + e.total_avaliacoes + "</strong><span>Avaliações</span></div>" +
      "<div><strong>" + e.total_diario + "</strong><span>No diário</span></div>" +
      "<div><strong>" + (e.media_notas === null ? "—" : e.media_notas) + "</strong><span>Média</span></div>" +
      "</div></div>" +
      (souEu
        ? '<div class="aviso ok esconde" id="aviso-perfil"></div>' +
          '<form class="form-perfil esconde" id="form-perfil">' +
          '<input type="file" id="campo-foto" accept="image/*" style="font-size:13px">' +
          '<textarea id="campo-bio" maxlength="280" placeholder="Escreva sua bio (máx. 280 caracteres)">' +
          escapar(u.bio || "") + "</textarea>" +
          '<div class="linha-acoes">' +
          '<button class="btn btn-verde btn-pequeno" type="submit">Salvar perfil</button>' +
          '<button class="btn btn-linha btn-pequeno" type="button" id="btn-cancelar-perfil">Cancelar</button>' +
          '<span class="contador" id="contador-bio"></span>' +
          "</div></form>"
        : "");

    if (souEu) ligarEdicaoPerfil();
  } catch (erro) {
    caixa.innerHTML = '<p class="vazio">' + escapar(erro.message) + "</p>";
  }
}

function ligarEdicaoPerfil() {
  var form = el("#form-perfil");
  var bio = el("#campo-bio");
  var contador = el("#contador-bio");

  function atualizarContador() {
    contador.textContent = bio.value.length + "/280";
  }
  atualizarContador();
  bio.addEventListener("input", atualizarContador);

  el("#btn-trocar-foto").addEventListener("click", function () {
    form.classList.toggle("esconde");
    if (!form.classList.contains("esconde")) bio.focus();
  });

  el("#btn-cancelar-perfil").addEventListener("click", function () {
    form.classList.add("esconde");
  });

  el("#campo-foto").addEventListener("change", function () {
    var arquivo = this.files && this.files[0];
    if (!arquivo) return;

    var tiposAceitos = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (tiposAceitos.indexOf(arquivo.type) === -1) {
      mostrarAviso("#aviso-perfil", "Envie uma imagem JPG, PNG, GIF ou WEBP.", "erro");
      this.value = "";
      return;
    }
    if (arquivo.size > 2 * 1024 * 1024) {
      mostrarAviso("#aviso-perfil", "A imagem precisa ter no máximo 2 MB.", "erro");
      this.value = "";
      return;
    }
    limparAviso("#aviso-perfil");

    var previa = el("#foto-atual");
    var url = URL.createObjectURL(arquivo);
    if (previa && previa.tagName === "IMG") {
      previa.src = url;
    } else if (previa) {
      var img = document.createElement("img");
      img.className = "perfil-foto";
      img.id = "foto-atual";
      img.src = url;
      img.alt = "Prévia da foto";
      previa.replaceWith(img);
    }
  });

  form.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    limparAviso("#aviso-perfil");
    var botao = form.querySelector('button[type="submit"]');
    botao.disabled = true;
    botao.textContent = "Salvando...";
    try {
      var dados = new FormData();
      dados.append("bio", bio.value);
      var arquivo = el("#campo-foto").files[0];
      if (arquivo) dados.append("foto", arquivo);
      await api.atualizarPerfil(dados);
      await carregarPerfil();
      mostrarAviso("#aviso-perfil", "Perfil atualizado!", "ok");
    } catch (erro) {
      mostrarAviso("#aviso-perfil", erro.message, "erro");
      botao.disabled = false;
      botao.textContent = "Salvar perfil";
    }
  });
}


function linhaItem(dados, acaoHtml, extra) {
  return (
    '<article class="item">' +
    '<img src="' + escapar(dados.capa_url || "") + '" alt="Capa de ' + escapar(dados.titulo) + '">' +
    '<div class="corpo">' +
    "<h3>" + escapar(dados.titulo) + "</h3>" +
    "<p>" + extra + "</p>" +
    "</div>" +
    '<div class="acoes">' + (acaoHtml || "") + "</div>" +
    "</article>"
  );
}

var abas = {
  avaliacoes: async function () {
    var dados = await api.avaliacoesDoUsuario(usuarioId);
    var lista = dados.avaliacoes || [];
    if (!lista.length) return '<p class="vazio">Nenhuma avaliação ainda.</p>';
    return lista
      .map(function (a) {
        return linhaItem(
          a,
          "",
          estrelas(a.nota) + " " + (a.resenha ? escapar(a.resenha) : "<em>sem resenha</em>")
        );
      })
      .join("");
  },
  diario: async function () {
    var dados = await api.diario(usuarioId);
    var lista = dados.diario || [];
    if (!lista.length) return '<p class="vazio">Diário vazio. Registre o que ouviu hoje!</p>';
    return lista
      .map(function (d) {
        var acao = souEu
          ? '<button class="btn btn-linha btn-pequeno" data-remover-diario="' + d.id + '">Remover</button>'
          : "";
        return linhaItem(d, acao, "Ouvido em " + escapar(d.data_escuta));
      })
      .join("");
  },
  quero: async function () {
    var dados = await api.queroOuvir(usuarioId);
    var lista = dados.quero_ouvir || [];
    if (!lista.length) return '<p class="vazio">Lista de quero ouvir vazia.</p>';
    return lista
      .map(function (q) {
        var acao = souEu
          ? '<button class="btn btn-linha btn-pequeno" data-remover-quero="' +
            escapar(q.deezer_id) + '|' + escapar(q.tipo) + '">Remover</button>'
          : "";
        return linhaItem(q, acao, q.tipo === "album" ? "Álbum" : "Música");
      })
      .join("");
  },
};

var abaAtual = "avaliacoes";

async function mostrarAba(nome) {
  abaAtual = nome;
  todos(".abas button").forEach(function (b) {
    b.classList.toggle("ativa", b.dataset.aba === nome);
  });
  var caixa = el("#conteudo-aba");
  caixa.innerHTML = '<p class="carregando">Carregando...</p>';
  try {
    caixa.innerHTML = await abas[nome]();
  } catch (erro) {
    caixa.innerHTML = '<p class="vazio">' + escapar(erro.message) + "</p>";
  }
}

todos(".abas button").forEach(function (botao) {
  botao.addEventListener("click", function () {
    mostrarAba(botao.dataset.aba);
  });
});

el("#conteudo-aba").addEventListener("click", async function (evento) {
  var alvo = evento.target;
  try {
    if (alvo.dataset.removerDiario) {
      await api.removerDiario(Number(alvo.dataset.removerDiario));
      mostrarAba(abaAtual);
    } else if (alvo.dataset.removerQuero) {
      var partes = alvo.dataset.removerQuero.split("|");
      await api.removerQueroOuvir(partes[0], partes[1]);
      mostrarAba(abaAtual);
    }
  } catch (erro) {
    alert(erro.message);
  }
});

carregarPerfil();
var abaInicial = parametro("aba");
mostrarAba(abas[abaInicial] ? abaInicial : "avaliacoes");
