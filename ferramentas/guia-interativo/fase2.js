// Fase 2: cliente logada (sacola, cupom, finalizar, pedidos).
const abas = require('./abas');
const entrar = require('./entrar');
module.exports = async function fase2(page, cap, BASE) {
  const telas = [];
  const A = abas(true, false);
  const ir = async (p) => { await page.goto(BASE + p); };
  // sacola de visitante com 1 peça, para mostrar que ela passa para a conta ao entrar
  await ir('/produto/07340df7-1c24-40d2-ab02-95cb54462b39');
  await page.waitForTimeout(2500);
  await page.getByText('Sacola', { exact: true }).locator('visible=true').first().click();
  await page.waitForTimeout(1200);
  await entrar(page, BASE, 'demo-cliente@julianaprado.app');

  await ir('/conta');
  telas.push(await cap(page, 'conta-cliente', [
    { q: { text: 'Olá, Cliente!', parentUp: 2 }, titulo: 'Saudação', status: 'ok', texto: 'Inicial do nome, primeiro nome e e-mail. Para a equipe aparece o selo ADMINISTRADORA ou VENDEDORA.' },
    { q: { text: 'Quer revender Juliana Prado?', parentUp: 3 }, titulo: 'Pedido de revenda', status: 'ok',
      texto: 'O botão "Quero ser revendedora" envia o pedido (exige CPF cadastrado). A equipe recebe um aviso e aprova pelo app. O cartão muda para "Pedido de revenda em análise", depois para "Você é revendedora" (cartão grafite) ou, se recusado, permite pedir de novo. Aprovada, ela passa a ver o preço de revenda (20% abaixo do preço final) em todo o app, na hora.' },
    { q: { text: 'Meus dados', grow: { left: 50, right: 160, top: 14, bottom: 14 } }, titulo: 'Meus dados', status: 'ok', go: 'meus-dados', texto: 'Editar nome, celular, nascimento, cidade e UF.' },
    { q: { text: 'Meus pedidos', grow: { left: 50, right: 140, top: 14, bottom: 14 } }, titulo: 'Meus pedidos', status: 'ok', go: 'pedidos-cliente', texto: 'Atalho para a aba Pedidos.' },
    { q: { text: 'Favoritos', grow: { left: 50, right: 170, top: 14, bottom: 14 } }, titulo: 'Favoritos', status: 'ok', go: 'favoritos-cliente', texto: 'Peças salvas com o coração.' },
    { q: { text: 'Sair da conta', grow: { left: 50, right: 140, top: 14, bottom: 14 } }, titulo: 'Sair da conta', status: 'ok', go: 'conta-visitante', texto: 'Sai e limpa os dados da conta do celular. O aparelho continua recebendo avisos gerais como visitante.' },
    { q: { text: 'Excluir minha conta', grow: { left: 50, right: 90, top: 14, bottom: 14 } }, titulo: 'Excluir minha conta', status: 'ok',
      texto: 'Exigência da Play Store. Pede confirmação e apaga cadastro, favoritos e sacola. Os pedidos já feitos continuam registrados para a loja, sem o vínculo com a pessoa. Ainda não testado com uma conta real.' },
    ...A,
  ]));

  await ir('/meus-dados');
  telas.push(await cap(page, 'meus-dados', [
    { q: { text: 'Nome completo', grow: { bottom: 62, right: 250 } }, titulo: 'Nome', status: 'ok', texto: 'Nome usado no pedido e na mensagem do WhatsApp.' },
    { q: { text: 'CPF', exact: true, grow: { bottom: 62, right: 330 } }, titulo: 'CPF travado', status: 'ok', texto: 'Depois de gravado, o CPF não pode ser mudado pela cliente (aparece apagado). Só a loja corrige.' },
    { q: { text: 'Celular (WhatsApp)', grow: { bottom: 62, right: 220 } }, titulo: 'Celular', status: 'ok', texto: 'Obrigatório para finalizar pedido.' },
    { q: { text: 'Salvar', exact: true, grow: { top: 15, bottom: 15, left: 150, right: 150 } }, titulo: 'Salvar', status: 'ok', go: 'conta-cliente', texto: 'Grava e volta. Avisa se o CPF já estiver em outra conta.' },
  ]));

  // favorita duas peças
  await ir('/lista/novidades');
  await page.waitForTimeout(2500);
  for (const i of [0, 1]) { await page.getByLabel('Favoritar', { exact: true }).locator('visible=true').nth(i).click(); await page.waitForTimeout(700); }
  await ir('/lista/favoritos');
  telas.push(await cap(page, 'favoritos-cliente', [
    { q: { text: 'Meus favoritos' }, titulo: 'Meus favoritos', status: 'ok', texto: 'Peças com o coração marcado. Tocar de novo no coração remove. Se uma delas entrar em promoção, a cliente recebe aviso automático.' },
    { q: { label: 'Favoritar', nth: 0 }, titulo: 'Coração dourado', status: 'ok', texto: 'Coração preenchido = favorito.' },
  ]));

  await ir('/sacola');
  await page.waitForTimeout(2500);
  await page.getByPlaceholder('Digite o código').fill('BEMVINDA10');
  await page.getByText('Aplicar', { exact: true }).locator('visible=true').click();
  await page.waitForTimeout(2000);
  telas.push(await cap(page, 'sacola-logada', [
    { q: { text: 'Colar Clarissa Blue Dourado', parentUp: 2 }, titulo: 'Sacola juntada', status: 'ok',
      texto: 'As 2 peças escolhidas como visitante (anel e brinco) e o colar adicionado depois foram juntados na sacola da conta ao entrar. A sacola da conta fica no banco: aparece igual em qualquer celular.' },
    { q: { text: 'BEMVINDA10:', exact: false }, titulo: 'Cupom aplicado', status: 'ressalva',
      texto: 'Mostra o cupom e o desconto (10%). Cupons podem ser em % ou em R$, com início e fim, compra mínima, limite de usos, uso único por cliente e público (todos, só varejo ou só revenda). Erros aparecem claros: "Este cupom expirou", "Você já usou este cupom", "Compra mínima de R$ 150,00". Ressalva: BEMVINDA10 é um cupom de demonstração; cupons reais serão criados pelo painel.' },
    { q: { text: 'Desconto', parentUp: 1 }, titulo: 'Desconto no resumo', status: 'ok', texto: 'Linha verde com o valor do desconto. O total final é recalculado pelo banco ao finalizar.' },
    { q: { text: 'Finalizar pelo WhatsApp', grow: { top: 14, bottom: 14, left: 60, right: 60 } }, titulo: 'Finalizar pelo WhatsApp', status: 'ok', go: 'pedido-novo',
      texto: 'O banco confere tudo de novo (preço, estoque, cupom), cria o pedido com número, esvazia a sacola, avisa a equipe e abre o WhatsApp da loja com o resumo pronto: número do pedido, peças com aro e valores, cupom, total, nome da cliente e "Podemos combinar a entrega e o pagamento?". Se faltar nome ou telefone, leva para Meus dados.' },
    ...A,
  ]));

  await page.getByText('Finalizar pelo WhatsApp', { exact: true }).locator('visible=true').click();
  await page.waitForTimeout(4000);
  telas.push(await cap(page, 'pedido-novo', [
    { q: { text: 'Pedido enviado!', parentUp: 2 }, titulo: 'Pedido enviado', status: 'ok',
      texto: 'Confirmação logo após finalizar. Ao mesmo tempo o WhatsApp da loja abre com a mensagem pronta; a cliente só toca em enviar.' },
    { q: { text: 'Recebido', exact: true, nth: 0, grow: { top: 30, bottom: 6, left: 20, right: 300 } }, titulo: 'Linha do tempo', status: 'ok',
      texto: 'Recebido, Pago, Em separação, Enviado, Entregue. A etapa atual e as anteriores ficam douradas. Pedido cancelado mostra só a etiqueta vermelha.' },
    { q: { text: 'Itens', parentUp: 1 }, titulo: 'Itens e valores', status: 'ok', texto: 'Cópia exata do que foi comprado (não muda se o produto mudar depois): foto, aro, quantidade, preço, subtotal, cupom e total.' },
    { q: { text: 'Falar sobre este pedido', grow: { top: 15, bottom: 15, left: 60, right: 60 } }, titulo: 'Falar sobre este pedido', status: 'ok', texto: 'Abre o WhatsApp com o resumo do pedido de novo.' },
    { q: { text: 'Continuar comprando' }, titulo: 'Continuar comprando', status: 'ok', go: 'inicio', texto: 'Volta para a vitrine.' },
  ]));

  await ir('/pedidos');
  telas.push(await cap(page, 'pedidos-cliente', [
    { q: { text: 'Meus pedidos' }, titulo: 'Meus pedidos', status: 'ok', texto: 'A cliente vê só os pedidos dela (regra do banco).' },
    { q: { text: 'Pedido Nº', exact: false, parentUp: 3 }, titulo: 'Pedido', status: 'ok', go: 'pedido-cliente-pago', texto: 'Número, data e hora, valor e etiqueta colorida do status. Toque para ver o detalhe.' },
    ...A,
  ], { semRolagem: true }));
  return telas;
};
