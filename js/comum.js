/* ==========================================================
   comum.js — sessão local, menu e utilidades da interface
   ========================================================== */

var CHAVE_USUARIO = "bartotec_usuario";

var sessao = {
  pegar: function () {
    try {
      return JSON.parse(localStorage.getItem(CHAVE_USUARIO));
    } catch (e) {
      return null;
    }
  },
  salvar: function (usuario) {
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
  },
  limpar: function () {
    localStorage.removeItem(CHAVE_USUARIO);
  },
};

function el(seletor) {
  return document.querySelector(seletor);
}

function todos(seletor) {
  return Array.prototype.slice.call(document.querySelectorAll(seletor));
}

function escapar(texto) {
  return String(texto == null ? "" : texto).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

// Caminho de uma estrela de 5 pontas (SVG, viewBox 0 0 24 24), perfeitamente
// simétrica na horizontal — por isso um clip de 50% sempre corta ela bem no
// meio, sem depender da fonte do navegador (usar o caractere de texto "★"
// tinha esse problema: cada fonte desenha ele de um jeito diferente).
var CAMINHO_ESTRELA = "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";

function svgEstrela(classe) {
  return '<svg class="' + classe + '" viewBox="0 0 24 24"><path d="' + CAMINHO_ESTRELA + '"/></svg>';
}

function estrelas(nota) {
  nota = Number(nota) || 0;
  var html = "";
  for (var i = 1; i <= 5; i++) {
    // quanto dessa estrela (0 a 100%) fica preenchida
    var preenchido = Math.max(0, Math.min(1, nota - (i - 1))) * 100;
    html +=
      '<span class="estrela-mostrar">' +
      svgEstrela("base") +
      '<span class="preenchida" style="width:' + preenchido + '%">' + svgEstrela("cheia") + "</span>" +
      "</span>";
  }
  return '<span class="estrelas-mostrar">' + html + "</span>";
}

function parametro(nome) {
  return new URLSearchParams(window.location.search).get(nome);
}

// Segundos -> "3:45" (ou "1:02:10" se passar de 1h, caso de álbuns longos)
function formatarDuracao(segundos) {
  segundos = Number(segundos) || 0;
  var h = Math.floor(segundos / 3600);
  var m = Math.floor((segundos % 3600) / 60);
  var s = Math.floor(segundos % 60);
  var mm = (h > 0 ? String(m).padStart(2, "0") : String(m)) + ":" + String(s).padStart(2, "0");
  return h > 0 ? h + ":" + mm : mm;
}

// "2024-03-12" -> "12 de março de 2024"
function formatarData(dataISO) {
  if (!dataISO) return null;
  var partes = String(dataISO).split("-");
  if (partes.length !== 3) return dataISO;
  var meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  var mes = meses[Number(partes[1]) - 1];
  if (!mes) return dataISO;
  return Number(partes[2]) + " de " + mes + " de " + partes[0];
}

// 1234567 -> "1.234.567" (separador de milhar no padrão brasileiro)
function formatarNumero(n) {
  if (n === null || n === undefined) return null;
  return Number(n).toLocaleString("pt-BR");
}

function mostrarAviso(alvo, texto, tipo) {
  var caixa = el(alvo);
  if (!caixa) return;
  caixa.className = "aviso " + (tipo || "erro");
  caixa.textContent = texto;
  caixa.classList.remove("esconde");
}

function limparAviso(alvo) {
  var caixa = el(alvo);
  if (caixa) caixa.classList.add("esconde");
}

// Monta o cabeçalho em todas as páginas
function montarTopo(paginaAtual) {
  // A barra inferior é montada de forma INDEPENDENTE do cabeçalho de cima —
  // de propósito. Se por algum motivo o cabeçalho falhar (erro de rede,
  // sessão corrompida, etc.), a navegação de baixo continua funcionando.
  try {
    montarBarraInferior(paginaAtual);
  } catch (erro) {
    console.error("Não consegui montar a barra inferior:", erro);
  }

  try {
    var usuario = sessao.pegar();
    var links = [
      { href: "index.html", texto: "Início", id: "inicio" },
      { href: "buscar.html", texto: "Buscar", id: "buscar" },
    ];

    if (usuario) {
      links.push({ href: "perfil.html?usuario_id=" + usuario.id, texto: "Meu perfil", id: "perfil" });
    }

    var html =
      '<div class="container topo-interno">' +
      '<a class="marca" href="index.html"><span>BARTO</span><span>TEC</span></a>' +
      '<nav class="menu">' +
      links
        .map(function (l) {
          return '<a class="' + (l.id === paginaAtual ? "ativo" : "") + '" href="' + l.href + '">' + l.texto + "</a>";
        })
        .join("") +
      (usuario
        ? '<button class="btn btn-linha btn-pequeno" id="btn-sair">Sair</button>'
        : '<a class="btn btn-rosa btn-pequeno" href="entrar.html">Entrar</a>') +
      "</nav></div>";

    var topo = el("#topo");
    if (!topo) return;
    topo.className = "topo";
    topo.innerHTML = html;

    ligarBotaoSair();
  } catch (erro) {
    console.error("Não consegui montar o cabeçalho:", erro);
  }
}

function ligarBotaoSair() {
  todos("[data-sair]").forEach(function (botao) {
    botao.addEventListener("click", async function () {
      try {
        await api.logout();
      } catch (e) {
        /* mesmo se falhar, limpamos aqui */
      }
      sessao.limpar();
      window.location.href = "index.html";
    });
  });

  var sair = el("#btn-sair");
  if (sair) {
    sair.addEventListener("click", async function () {
      try {
        await api.logout();
      } catch (e) {
        /* mesmo se falhar, limpamos aqui */
      }
      sessao.limpar();
      window.location.href = "index.html";
    });
  }
}

// Ícones simples em SVG pra barra inferior (estilo Instagram)
var ICONES = {
  inicio:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.5"/><path d="M9.5 21v-6h5v6"/></svg>',
  buscar:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>',
  diario:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v18H6.5A1.5 1.5 0 0 1 5 19.5z"/><path d="M9 3v18"/></svg>',
  perfil:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/></svg>',
  entrar:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><path d="M15 8l4 4-4 4"/><path d="M19 12H9"/></svg>',
};

function montarBarraInferior(paginaAtual) {
  var usuario = sessao.pegar();
  // se o que tá salvo no localStorage não é um usuário válido (corrompido,
  // formato antigo, etc.), trata como deslogado em vez de gerar link quebrado
  if (!usuario || usuario.id === undefined || usuario.id === null) {
    usuario = null;
  }

  var antiga = el("#barra-inferior");
  if (antiga) antiga.remove();

  var itens = [
    { href: "index.html", texto: "Início", id: "inicio", icone: ICONES.inicio },
    { href: "buscar.html", texto: "Buscar", id: "buscar", icone: ICONES.buscar },
  ];

  if (usuario) {
    itens.push({
      href: "perfil.html?usuario_id=" + encodeURIComponent(usuario.id) + "&aba=diario",
      texto: "Diário",
      id: "diario",
      icone: ICONES.diario,
    });
    itens.push({
      href: "perfil.html?usuario_id=" + encodeURIComponent(usuario.id),
      texto: "Perfil",
      id: "perfil",
      icone: usuario.foto_url
        ? '<img class="foto-mini" src="' + escapar(usuario.foto_url) + '" alt="" onerror="this.remove()">'
        : ICONES.perfil,
    });
  } else {
    itens.push({ href: "entrar.html", texto: "Entrar", id: "entrar", icone: ICONES.entrar });
  }

  var nav = document.createElement("nav");
  nav.id = "barra-inferior";
  nav.className = "barra-inferior";
  nav.setAttribute("aria-label", "Navegação principal");
  nav.innerHTML = itens
    .map(function (i) {
      return (
        '<a class="item-barra' + (i.id === paginaAtual ? " ativo" : "") + '" href="' + i.href + '">' +
        i.icone +
        "<span>" + i.texto + "</span>" +
        "</a>"
      );
    })
    .join("");

  if (!document.body) return;
  document.body.appendChild(nav);
  document.body.classList.add("com-barra-inferior");
}


function montarRodape() {
  var rodape = el("#rodape");
  if (!rodape) return;
  rodape.className = "rodape container";
  rodape.innerHTML =
    "<span>BARTOTEC</span>" +
    "<span>" + new Date().getFullYear() + "</span>";
}

// Normaliza um resultado do Deezer (track / album / artist)
function normalizar(bruto, tipoPadrao) {
  var tipo = bruto.type || tipoPadrao || "track";
  var capa =
    bruto.cover_medium ||
    bruto.picture_medium ||
    (bruto.album && bruto.album.cover_medium) ||
    bruto.cover ||
    bruto.picture ||
    "";
  var artista = (bruto.artist && bruto.artist.name) || (tipo === "artist" ? "Artista" : "");
  return {
    deezer_id: String(bruto.id),
    tipo: tipo === "album" ? "album" : "musica",
    ehArtista: tipo === "artist",
    titulo: bruto.title || bruto.name || "Sem título",
    artista: artista,
    capa_url: capa,
  };
}

function cartaoHtml(item) {
  var link = item.ehArtista
    ? "buscar.html?q=" + encodeURIComponent(item.titulo) + "&tipo=album"
    : "item.html?deezer_id=" + encodeURIComponent(item.deezer_id) +
      "&tipo=" + item.tipo +
      "&titulo=" + encodeURIComponent(item.titulo) +
      "&artista=" + encodeURIComponent(item.artista) +
      "&capa=" + encodeURIComponent(item.capa_url);

  return (
    '<a class="cartao" href="' + link + '">' +
    '<img class="capa" loading="lazy" src="' + escapar(item.capa_url) + '" alt="Capa de ' + escapar(item.titulo) + '">' +
    '<div class="info">' +
    '<span class="etiqueta' + (item.tipo === "album" ? "" : " rosa") + '">' +
    (item.ehArtista ? "Artista" : item.tipo === "album" ? "Álbum" : "Música") +
    "</span>" +
    '<div class="titulo">' + escapar(item.titulo) + "</div>" +
    '<div class="sub">' + escapar(item.artista) + "</div>" +
    "</div></a>"
  );
}

function listaDeezerDe(resposta) {
  // As rotas do PHP devolvem formatos levemente diferentes; aqui a gente acha o array
  if (!resposta) return [];
  if (Array.isArray(resposta)) return resposta;
  var chaves = ["resultados", "top", "lancamentos", "recentes", "data", "musicas", "albuns", "artistas", "tracks", "albums", "artists"];
  for (var i = 0; i < chaves.length; i++) {
    var valor = resposta[chaves[i]];
    if (Array.isArray(valor)) return valor;
    if (valor && Array.isArray(valor.data)) return valor.data;
    if (valor && typeof valor === "object") {
      var interno = listaDeezerDe(valor);
      if (interno.length) return interno;
    }
  }
  return [];
}
