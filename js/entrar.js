montarTopo("entrar");
montarRodape();

function irParaPerfil(usuario) {
  sessao.salvar(usuario);
  var volta = parametro("voltar");
  window.location.href = volta || "perfil.html?usuario_id=" + usuario.id;
}

el("#form-login").addEventListener("submit", async function (evento) {
  evento.preventDefault();
  limparAviso("#aviso-login");
  try {
    var resposta = await api.login(el("#login-email").value.trim(), el("#login-senha").value);
    irParaPerfil(resposta.usuario);
  } catch (erro) {
    mostrarAviso("#aviso-login", erro.message, "erro");
  }
});

el("#form-registro").addEventListener("submit", async function (evento) {
  evento.preventDefault();
  limparAviso("#aviso-registro");
  var nome = el("#reg-nome").value.trim();
  var email = el("#reg-email").value.trim();
  var senha = el("#reg-senha").value;
  try {
    await api.registrar(nome, email, senha);
    var resposta = await api.login(email, senha);
    irParaPerfil(resposta.usuario);
  } catch (erro) {
    mostrarAviso("#aviso-registro", erro.message, "erro");
  }
});
