montarTopo("buscar");
montarRodape();

var caixa = el("#resultados");

async function buscar(termo, tipo) {
  caixa.innerHTML = '<p class="carregando">Procurando "' + escapar(termo) + '"...</p>';
  try {
    var resposta = await api.buscar(termo, tipo);
    var itens = listaDeezerDe(resposta);
    if (!itens.length) {
      caixa.innerHTML = '<p class="vazio">Nenhum resultado para "' + escapar(termo) + '".</p>';
      return;
    }
    caixa.innerHTML = itens
      .map(function (bruto) {
        return cartaoHtml(normalizar(bruto, tipo));
      })
      .join("");
  } catch (erro) {
    caixa.innerHTML = '<p class="vazio">' + escapar(erro.message) + "</p>";
  }
}

el("#form-busca").addEventListener("submit", function (evento) {
  evento.preventDefault();
  var termo = el("#campo-busca").value.trim();
  if (!termo) return;
  var tipo = el("#tipo-busca").value;
  history.replaceState({}, "", "buscar.html?q=" + encodeURIComponent(termo) + "&tipo=" + tipo);
  buscar(termo, tipo);
});

var termoInicial = parametro("q");
var tipoInicial = parametro("tipo") || "track";
el("#tipo-busca").value = tipoInicial;
if (termoInicial) {
  el("#campo-busca").value = termoInicial;
  buscar(termoInicial, tipoInicial);
} else {
  caixa.innerHTML = '<p class="vazio">Comece digitando algo aí em cima.</p>';
}
