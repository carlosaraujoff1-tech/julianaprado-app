// Fase 3: equipe (admin/vendedora).
const abas = require('./abas');
const entrar = require('./entrar');
module.exports = async function fase3(page, cap, BASE) {
  const telas = [];
  const A = abas(true, true);
  const ir = async (p) => { await page.goto(BASE + p); };
  await entrar(page, BASE, 'demo-cliente@julianaprado.app');

  await ir('/conta');
  telas.push(await cap(page, 'conta-admin', [
    { q: { text: 'ADMINISTRADORA' }, titulo: 'Selo da equipe', status: 'ok', texto: 'Mostra ADMINISTRADORA ou VENDEDORA. O seu e-mail (carlosaraujoff1@gmail.com) vira admin automaticamente ao se cadastrar. Tornar alguém vendedora ainda é feito por mim no banco; vai para o painel.' },
    { q: { text: 'Equipe', exact: true, parentUp: 1 }, titulo: 'Área da equipe', status: 'ok', texto: 'Só aparece para vendedora e admin. O banco também bloqueia: mesmo que alguém abra essas telas, não vê nada sem ser da equipe.' },
    { q: { text: 'Pedidos da loja', grow: { left: 50, right: 140, top: 14, bottom: 14 } }, titulo: 'Pedidos da loja', status: 'ok', go: 'pedidos-equipe', texto: 'Todos os pedidos de todas as clientes.' },
    { q: { text: 'Aprovar revendedoras', grow: { left: 50, right: 100, top: 14, bottom: 14 } }, titulo: 'Aprovar revendedoras', status: 'ok', go: 'revendas', texto: 'Lista de pedidos de revenda esperando decisão.' },
    { q: { rect: [12, 780, 369, 18] }, titulo: 'Painel web', status: 'futuro',
      texto: 'Não existe ainda. Será um site separado só para admin: produtos, fotos com recorte, importar planilha, categorias, banners, cupons, clientes, enviar notificações, textos dos avisos automáticos, configurações (WhatsApp, % de revenda) e relatórios.' },
    ...A,
  ], { semRolagem: true }));

  await ir('/pedidos');
  telas.push(await cap(page, 'pedidos-equipe', [
    { q: { text: 'Pedidos da loja' }, titulo: 'Pedidos da loja', status: 'ok', texto: 'Visão da equipe: pedidos de todas as clientes.' },
    { q: { text: 'Todos', exact: true, grow: { left: 14, right: 14, top: 8, bottom: 8 } }, titulo: 'Filtros por status', status: 'ok', texto: 'Todos, Recebido, Pago, Em separação, Enviado, Entregue, Cancelado. Desliza para o lado.' },
    { q: { text: 'Pedido Nº', exact: false, parentUp: 3 }, titulo: 'Pedido de uma cliente', status: 'ok', go: 'pedido-equipe', texto: 'Mostra o nome da cliente e a marca "revenda" quando o pedido foi com preço de revenda.' },
    ...A,
  ], { semRolagem: true }));

  await page.getByText('Pedido Nº', { exact: false }).locator('visible=true').first().click();
  await page.waitForTimeout(2500);
  telas.push(await cap(page, 'pedido-equipe', [
    { q: { text: 'Cliente', exact: true, parentUp: 1 }, titulo: 'Dados da cliente', status: 'ok', texto: 'Nome, celular, e-mail, CPF e cidade, copiados no momento do pedido.' },
    { q: { text: 'Chamar cliente no WhatsApp', grow: { top: 10, bottom: 10, left: 40, right: 40 } }, titulo: 'Chamar cliente', status: 'ok', texto: 'Abre o WhatsApp da cliente com "Olá, Cliente! Aqui é da Juliana Prado, sobre o seu pedido Nº 1003.".' },
    { q: { text: 'Mudar status', parentUp: 1 }, titulo: 'Mudar status', status: 'ok',
      texto: 'Um toque no novo status, com confirmação. A cliente recebe um aviso automático. Cancelar devolve o estoque; tirar do cancelado baixa de novo. Ainda não existem na tela: observações internas, atendente responsável, código de rastreio e impressão do pedido (o banco já tem os campos de observação e atendente).' },
    { q: { text: 'Pago', exact: true, nth: -1, grow: { left: 14, right: 14, top: 10, bottom: 10 } }, titulo: 'Status atual', status: 'ok', texto: 'O status atual fica grafite e não pode ser tocado.' },
  ]));

  await ir('/equipe/revendas');
  telas.push(await cap(page, 'revendas', [
    { q: { text: 'Revendedora Demonstração', parentUp: 1 }, titulo: 'Pedido de revenda', status: 'ok', texto: 'Nome, e-mail, celular, CPF, cidade e desde quando é cliente.' },
    { q: { text: 'Aprovar', exact: true, grow: { top: 10, bottom: 10, left: 50, right: 50 } }, titulo: 'Aprovar', status: 'ok', texto: 'Na hora, a pessoa passa a ver o preço de revenda e recebe o aviso "Acesso de revenda liberado!".' },
    { q: { text: 'Recusar', exact: true, grow: { top: 10, bottom: 10, left: 50, right: 50 } }, titulo: 'Recusar', status: 'ok', texto: 'A cliente vê que não foi aprovada e pode pedir de novo.' },
  ], { semRolagem: true }));

  await ir('/notificacoes');
  telas.push(await cap(page, 'notificacoes-equipe', [
    { q: { text: 'Pedido de revenda', parentUp: 2 }, titulo: 'Aviso para a equipe', status: 'ressalva', texto: 'Avisos automáticos chegam para toda a equipe: pedido novo e pedido de revenda. Ressalva: aparecem aqui; no celular só depois do Firebase.' },
    { q: { text: 'Pedido Nº 1003: Pago', parentUp: 2 }, titulo: 'Aviso de status', status: 'ressalva', go: 'pedido-cliente-pago', texto: 'Tocar no aviso abre a tela certa (aqui, o pedido).' },
  ], { semRolagem: true }));

  await ir('/equipe/revendas');
  await page.waitForTimeout(2500);
  await page.getByText('Aprovar', { exact: true }).locator('visible=true').first().click();
  await page.waitForTimeout(2000);
  return telas;
};
