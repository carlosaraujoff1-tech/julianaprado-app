// Fase 4: cliente acompanhando o pedido; depois a revendedora aprovada.
const abas = require('./abas');
const entrar = require('./entrar');
module.exports = async function fase4(page, cap, BASE) {
  const telas = [];
  const ir = async (p) => { await page.goto(BASE + p); };
  await entrar(page, BASE, 'demo-cliente@julianaprado.app');
  await ir('/pedidos');
  await page.waitForTimeout(2000);
  await page.getByText('Pedido Nº', { exact: false }).locator('visible=true').first().click();
  telas.push(await cap(page, 'pedido-cliente-pago', [
    { q: { text: 'Pago', exact: true, nth: 0, grow: { left: 8, right: 8, top: 4, bottom: 4 } }, titulo: 'Status atual', status: 'ok', texto: 'Etiqueta do status com cor própria (Pago em azul, Enviado em verde, Cancelado em vermelho...).' },
    { q: { text: 'Em separação', exact: true, nth: 0, grow: { top: 30, left: 160, right: 70 } }, titulo: 'Linha do tempo', status: 'ok', texto: 'Recebido e Pago já dourados; as próximas etapas acendem conforme a loja atualiza.' },
    { q: { text: 'Falar sobre este pedido', grow: { top: 15, bottom: 15, left: 60, right: 60 } }, titulo: 'Falar sobre este pedido', status: 'ok', texto: 'Abre o WhatsApp da loja com o resumo.' },
  ], { semRolagem: true }));
  await ir('/notificacoes');
  telas.push(await cap(page, 'notificacoes-cliente', [
    { q: { text: 'Pedido Nº 1003: Pago', parentUp: 2 }, titulo: 'Aviso de mudança de status', status: 'ressalva', go: 'pedido-cliente-pago',
      texto: 'Criado automaticamente quando a loja mudou o status. Toque abre o pedido. Ressalva: aparece aqui e no sininho; para chegar como notificação no celular falta o Firebase (próximo APK).' },
    { q: { rect: [16, 200, 361, 120] }, titulo: 'Outros avisos automáticos', status: 'ressalva',
      texto: 'Também chegam aqui: revenda aprovada, cupom novo divulgado, sacola esquecida (1 hora e 1 dia depois) e peça favorita em oferta. Os textos são editáveis no banco e irão para o painel. Envio manual de avisos (com foto) virá pelo painel.' },
  ], { semRolagem: true }));

  // revendedora
  await ir('/conta');
  await page.waitForTimeout(1500);
  await page.getByText('Sair da conta', { exact: true }).locator('visible=true').click();
  await page.waitForTimeout(1500);
  await entrar(page, BASE, 'demo-revenda@julianaprado.app');
  await ir('/conta');
  telas.push(await cap(page, 'conta-revenda', [
    { q: { text: 'Você é revendedora', parentUp: 2 }, titulo: 'Revendedora aprovada', status: 'ok', texto: 'Cartão grafite confirmando. Os preços que ela vê em todo o app já são de revenda.' },
    ...abas(true, false),
  ], { semRolagem: true }));
  await ir('/produto/e604ea0c-8e4f-4cbf-b8b6-ceff6cee5afc');
  telas.push(await cap(page, 'produto-revenda', [
    { q: { text: 'R$ 87,92', exact: true, nth: 0, grow: { top: 22, right: 20 } }, titulo: 'Preço de revenda', status: 'ok',
      texto: 'Revendedora paga 20% menos que o preço final do varejo: R$ 109,90 vira R$ 87,92 (sem arredondar). O preço de varejo aparece riscado. Os 20% ficam numa configuração e podem ser mudados; um produto pode ter preço de revenda próprio. Visitante e cliente comum nem conseguem ler esse valor no banco.' },
    { q: { text: 'REVENDA', exact: true }, titulo: 'Selo REVENDA', status: 'ok', texto: 'Substitui o selo de desconto para a revendedora.' },
    { q: { text: 'Preço de revenda.', exact: false }, titulo: 'Explicação', status: 'ok', texto: 'Frase que explica o preço riscado.' },
  ], { baseFixa: 75 }));
  await ir('/');
  telas.push(await cap(page, 'inicio-revenda', [
    { q: { label: 'Brinco Argola Cravejada com Zircônia', nth: 0 }, titulo: 'Vitrine com preço de revenda', status: 'ok', go: 'produto-revenda',
      texto: 'Todos os cards mostram o preço de revenda e o de varejo riscado. O convite "Quer revender" some.' },
    ...abas(true, false),
  ]));
  return telas;
};
