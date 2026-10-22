montarTopo("");
montarRodape();

var item = {
  deezer_id: parametro("deezer_id") || "",
  tipo: parametro("tipo") === "album" ? "album" : "musica",
  titulo: parametro("titulo") || "Sem título",
  artista: parametro("artista") || "",
  capa_url: parametro("capa") || "",
};

var notaEscolhida = 0;

// ---------- ficha do item ----------
el("#ficha").innerHTML =
  '<div style="display:flex;gap:18px;flex-wrap:wrap">' +
  '<img src="' + escapar(item.capa_url) + '" alt="Capa de ' + escapar(item.titulo) +
  '" style="width:150px;height:150px;border-radius:14px;object-fit:cover;background:#17171d">' +
  '<div style="flex:1;min-width:180px">' +
  '<span class="etiqueta' + (item.tipo === "album" ? "" : " rosa") + '">' +
  (item.tipo === "album" ? "Álbum" : "Música") + "</span>" +
  '<h1 style="font-size:26px;line-height:1.15;margin:6px 0 4px">' + escapar(item.titulo) + "</h1>" +
  '<p style="color:var(--texto-fraco)">' + escapar(item.artista) + "</p>" +
  '<div class="acoes" style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">' +
  '<button class="btn btn-verde btn-pequeno" id="btn-diario">Ouvi hoje</button>' +
  '<button class="btn btn-linha btn-pequeno" id="btn-quero">Quero ouvir</button>' +
  "</div></div></div>" +
  '<div id="ficha-detalhes-area"><p class="ficha-carregando">Carregando mais informações...</p></div>';

// ---------- carrega todos os detalhes disponíveis no Deezer ----------
function linhaInfo(rotulo, valor) {
  if (valor === null || valor === undefined || valor === "") return "";
  return (
    '<div class="campo-info"><span class="rotulo">' + escapar(rotulo) + "</span>" +
    '<span class="valor">' + valor + "</span></div>"
  );
}

async function carregarDetalhes() {
  var area = el("#ficha-detalhes-area");
  if (!item.deezer_id) {
    area.innerHTML = "";
    return;
  }
  try {
    var resposta = await api.detalhesItem(item.deezer_id, item.tipo);
    var d = resposta.item || {};
    var html = '<div class="ficha-detalhes">';

    if (item.tipo === "musica") {
      html += linhaInfo("Música", escapar(d.titulo) + (d.titulo_versao ? " (" + escapar(d.titulo_versao) + ")" : ""));
      html += linhaInfo("Cantor / Artista", d.artista_id
        ? '<a href="buscar.html?q=' + encodeURIComponent(d.artista || "") + '&tipo=album">' + escapar(d.artista) + "</a>"
        : escapar(d.artista));
      html += linhaInfo("Álbum", escapar(d.album));
      html += linhaInfo("Publicada em", formatarData(d.data_lancamento));
      html += linhaInfo("Duração", d.duracao_segundos ? formatarDuracao(d.duracao_segundos) : null);
      html += linhaInfo("Faixa nº", d.numero_faixa ? d.numero_faixa + (d.numero_disco > 1 ? " (disco " + d.numero_disco + ")" : "") : null);
      html += linhaInfo("BPM", d.bpm);
      html += linhaInfo("Conteúdo explícito", d.conteudo_explicito === true ? "Sim" : d.conteudo_explicito === false ? "Não" : null);

      if (d.contribuintes && d.contribuintes.length > 1) {
        var nomes = d.contribuintes.map(function (c) { return escapar(c.nome); }).join(", ");
        html += linhaInfo("Participações", nomes);
      }

      html += "</div>";

      if (d.preview_url) {
        html += '<audio class="ficha-audio" controls src="' + escapar(d.preview_url) + '">Seu navegador não toca áudio.</audio>';
      }
    } else {
      html += linhaInfo("Álbum", escapar(d.titulo));
      html += linhaInfo("Artista", d.artista_id
        ? '<a href="buscar.html?q=' + encodeURIComponent(d.artista || "") + '&tipo=album">' + escapar(d.artista) + "</a>"
        : escapar(d.artista));
      html += linhaInfo("Publicado em", formatarData(d.data_lancamento));
      html += linhaInfo("Tipo de lançamento", d.tipo_lancamento ? d.tipo_lancamento.charAt(0).toUpperCase() + d.tipo_lancamento.slice(1) : null);
      html += linhaInfo("Faixas", d.numero_faixas);
      html += linhaInfo("Duração total", d.duracao_segundos ? formatarDuracao(d.duracao_segundos) : null);
      html += linhaInfo("Gravadora", escapar(d.gravadora));
      html += linhaInfo("Fãs no Deezer", d.fas !== null ? formatarNumero(d.fas) : null);
      html += linhaInfo("Conteúdo explícito", d.conteudo_explicito === true ? "Sim" : d.conteudo_explicito === false ? "Não" : null);
      html += linhaInfo("Código UPC", d.upc);

      if (d.generos && d.generos.length) {
        html += linhaInfo("Gêneros", '<span class="ficha-generos">' +
          d.generos.map(function (g) { return "<span>" + escapar(g) + "</span>"; }).join("") + "</span>");
      }

      html += "</div>";

      if (d.faixas && d.faixas.length) {
        html += '<div class="ficha-faixas"><h3>Faixas do álbum (' + d.faixas.length + ")</h3>";
        d.faixas.forEach(function (f) {
          html +=
            '<div class="ficha-faixa"><span class="numero">' + (f.numero_faixa || "") + "</span>" +
            '<span class="titulo-faixa">' + escapar(f.titulo) + "</span>" +
            '<span class="duracao-faixa">' + (f.duracao_segundos ? formatarDuracao(f.duracao_segundos) : "") + "</span></div>";
        });
        html += "</div>";
      }
    }

    if (d.link_deezer) {
      html += '<a class="ficha-link-externo" href="' + escapar(d.link_deezer) + '" target="_blank" rel="noopener">Abrir no Deezer →</a>';
    }

    area.innerHTML = html;
  } catch (erro) {
    area.innerHTML = '<p class="ficha-carregando">Não consegui carregar mais informações (' + escapar(erro.message) + ")</p>";
  }
}

carregarDetalhes();

// ---------- escolha de nota (estrelas, com meia estrela) ----------
// Por acessibilidade (funciona igual com mouse, teclado e toque no celular,
// já que toque não tem "posição do cursor" pra detectar metade esquerda/
// direita da estrela): a escolha é só por CLIQUE, sem depender de onde
// dentro da estrela você clicou.
//   1º clique numa estrela  -> ela fica cheia (nota = número da estrela)
//   2º clique na MESMA estrela -> vira meia estrela (nota = número - 0,5)
//   3º clique na MESMA estrela -> volta a ficar cheia, e o ciclo se repete
//   clique em OUTRA estrela -> essa outra sempre começa cheia
var caixaEstrelasInput = el("#estrelas-input");
caixaEstrelasInput.innerHTML = [1, 2, 3, 4, 5]
  .map(function (n) {
    return (
      '<span class="estrela-input" tabindex="0" role="button" aria-label="Dar nota ' + n + ' de 5 estrelas">' +
      svgEstrela("base") +
      '<span class="preenchida">' + svgEstrela("cheia") + "</span>" +
      "</span>"
    );
  })
  .join("");

var estrelasInput = todos("#estrelas-input .estrela-input");
var valorEstrelas = el("#estrelas-input-valor");

function pintarEstrelas(nota) {
  estrelasInput.forEach(function (estrela, indice) {
    var preenchido = Math.max(0, Math.min(1, nota - indice)) * 100;
    estrela.querySelector(".preenchida").style.width = preenchido + "%";
  });
  valorEstrelas.textContent = nota > 0 ? nota.toString().replace(".", ",") + " de 5 estrelas" : "Sem nota ainda";
}

function escolherEstrela(indice) {
  var numeroEstrela = indice + 1; // estrela 1 a 5
  if (notaEscolhida === numeroEstrela) {
    notaEscolhida = numeroEstrela - 0.5; // 2º clique: vira meia estrela
  } else if (notaEscolhida === numeroEstrela - 0.5) {
    notaEscolhida = numeroEstrela; // 3º clique: volta a ficar cheia
  } else {
    notaEscolhida = numeroEstrela; // clicou numa estrela diferente: começa cheia
  }
  pintarEstrelas(notaEscolhida);
}

estrelasInput.forEach(function (estrela, i) {
  estrela.addEventListener("click", function () {
    escolherEstrela(i);
  });
  // acessível também via teclado (Enter ou espaço, depois de dar Tab até a estrela)
  estrela.addEventListener("keydown", function (ev) {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      escolherEstrela(i);
    }
  });
});

function exigirConta() {
  if (sessao.pegar()) return true;
  window.location.href = "entrar.html?voltar=" + encodeURIComponent(window.location.href);
  return false;
}

function dadosBase() {
  return {
    deezer_id: item.deezer_id,
    tipo: item.tipo,
    titulo: item.titulo,
    capa_url: item.capa_url,
  };
}

el("#btn-salvar").addEventListener("click", async function () {
  limparAviso("#aviso-avaliar");
  if (!exigirConta()) return;
  if (notaEscolhida < 0.5) {
    mostrarAviso("#aviso-avaliar", "Escolhe uma nota (pelo menos meia estrela) primeiro.", "erro");
    return;
  }
  try {
    var corpo = dadosBase();
    corpo.nota = notaEscolhida;
    corpo.resenha = el("#resenha").value.trim();
    await api.avaliar(corpo);
    mostrarAviso("#aviso-avaliar", "Avaliação salva!", "ok");
    carregarResenhas();
  } catch (erro) {
    mostrarAviso("#aviso-avaliar", erro.message, "erro");
  }
});

el("#btn-diario").addEventListener("click", async function () {
  if (!exigirConta()) return;
  try {
    var corpo = dadosBase();
    corpo.data_escuta = new Date().toISOString().slice(0, 10);
    await api.addDiario(corpo);
    mostrarAviso("#aviso-avaliar", "Registrado no seu diário de hoje.", "ok");
  } catch (erro) {
    mostrarAviso("#aviso-avaliar", erro.message, "erro");
  }
});

el("#btn-quero").addEventListener("click", async function () {
  if (!exigirConta()) return;
  try {
    await api.addQueroOuvir(dadosBase());
    mostrarAviso("#aviso-avaliar", "Adicionado em quero ouvir.", "ok");
  } catch (erro) {
    mostrarAviso("#aviso-avaliar", erro.message, "erro");
  }
});

// ---------- resenhas ----------
async function carregarResenhas() {
  var caixa = el("#resenhas");
  try {
    var resposta = await api.avaliacoesDoItem(item.deezer_id, item.tipo);
    var lista = resposta.avaliacoes || [];
    if (!lista.length) {
      caixa.innerHTML = '<p class="vazio">Ninguém avaliou ainda. Seja o primeiro!</p>';
      return;
    }
    caixa.innerHTML = lista
      .map(function (a) {
        return (
          '<article class="item">' +
          '<div class="avatar" style="width:46px;height:46px;font-size:18px">' +
          escapar((a.usuario_nome || "?").charAt(0).toUpperCase()) +
          "</div>" +
          '<div class="corpo">' +
          '<h3><a href="perfil.html?usuario_id=' + a.usuario_id + '">' + escapar(a.usuario_nome) + "</a> " +
          estrelas(a.nota) + "</h3>" +
          "<p>" + (a.resenha ? escapar(a.resenha) : "<em>Sem resenha</em>") + "</p>" +
          "</div></article>"
        );
      })
      .join("");
  } catch (erro) {
    caixa.innerHTML = '<p class="vazio">' + escapar(erro.message) + "</p>";
  }
}

carregarResenhas();
