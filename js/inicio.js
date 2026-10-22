montarTopo("inicio");
montarRodape();

el("#form-busca").addEventListener("submit", function (evento) {
  evento.preventDefault();
  var termo = el("#campo-busca").value.trim();
  if (!termo) return;
  window.location.href =
    "buscar.html?q=" + encodeURIComponent(termo) + "&tipo=" + el("#tipo-busca").value;
});

async function preencher(alvo, promessa, tipoPadrao) {
  var caixa = el(alvo);
  try {
    var resposta = await promessa;
    var itens = listaDeezerDe(resposta).slice(0, 12);
    if (!itens.length) {
      caixa.innerHTML = '<p class="vazio">Nada por aqui no momento.</p>';
      return;
    }
    caixa.innerHTML = itens
      .map(function (bruto) {
        return cartaoHtml(normalizar(bruto, tipoPadrao));
      })
      .join("");
  } catch (erro) {
    caixa.innerHTML = '<p class="vazio">' + escapar(erro.message) + "</p>";
  }
}

preencher("#grade-top", api.top("musica", 12), "track");
preencher("#grade-recentes", api.recentes("album", 12), "album");
