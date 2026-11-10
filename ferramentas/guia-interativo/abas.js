// Barra de abas (igual em todas as telas principais).
module.exports = function abas(logado, equipe) {
  const g = { top: 26, bottom: 4, left: 14, right: 14 };
  return [
    { q: { text: 'Início', nth: 0, grow: g }, titulo: 'Aba Início', status: 'ok', go: 'inicio',
      texto: 'Volta para a vitrine principal da loja. A aba ativa fica dourada e com o ícone preenchido.' },
    { q: { text: 'Categorias', nth: -1, grow: g }, titulo: 'Aba Categorias', status: 'ok', go: 'categorias',
      texto: 'Mostra todas as categorias com foto e quantidade de peças.' },
    { q: { text: 'Sacola', nth: -1, grow: g }, titulo: 'Aba Sacola', status: 'ok', go: logado ? 'sacola-logada' : 'sacola-visitante',
      texto: 'Abre a sacola. A bolinha dourada mostra quantas peças há nela e some quando a sacola está vazia (no Bubble aparecia um "0").' },
    { q: { text: 'Pedidos', nth: -1, grow: g }, titulo: 'Aba Pedidos', status: 'ok', go: equipe ? 'pedidos-equipe' : logado ? 'pedidos-cliente' : 'pedidos-visitante',
      texto: 'Cliente vê "Meus pedidos". Vendedora e admin veem "Pedidos da loja", com os pedidos de todas as clientes. Quem decide o que cada um vê é o banco de dados.' },
    { q: { text: 'Conta', nth: -1, grow: g }, titulo: 'Aba Conta', status: 'ok', go: equipe ? 'conta-admin' : logado ? 'conta-cliente' : 'conta-visitante',
      texto: 'Login, cadastro, dados pessoais, revenda, favoritos, notificações e área da equipe.' },
  ];
};
