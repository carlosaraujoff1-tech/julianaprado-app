// Fase 1: visitante (sem conta).
const abas = require('./abas');
const NATALIA = '936957b6-b6c5-4423-a4e1-e79231220768';
const BRINCOS = '2083c7e8-d23d-4540-a910-6184268b5302';

module.exports = async function fase1(page, cap, BASE) {
  const telas = [];
  const ir = async (p) => { await page.goto(BASE + p); };
  const A = abas(false, false);

  await ir('/');
  telas.push(await cap(page, 'inicio', [
    { q: { text: 'JULIANA', grow: { bottom: 26, right: 30 } }, titulo: 'Logo Juliana Prado', status: 'ok',
      texto: 'A logo é desenhada com a fonte Cormorant Garamond, a mesma família de letra elegante da marca, sobre o grafite #3A3539 tirado da própria logo. Não é uma imagem: fica nítida em qualquer tela.' },
    { q: { label: 'Notificações' }, titulo: 'Sininho de notificações', status: 'ok', go: 'notificacoes-visitante',
      texto: 'Abre a tela de Notificações. Quando há avisos não lidos aparece um número dourado (1 a 9+). O número se atualiza sozinho a cada 2 minutos e zera ao abrir a tela. Funciona também para visitante.' },
    { q: { text: 'Buscar anéis, brincos, colares…', grow: { left: 44, right: 20, top: 12, bottom: 12 } }, titulo: 'Barra de busca', status: 'ok', go: 'busca',
      texto: 'Toque para abrir a busca com o teclado já aberto. A busca ignora acentos e maiúsculas e procura cada palavra no nome, no código e na categoria.' },
    { q: { text: 'Brilho para todos', exact: false, parentUp: 1 }, titulo: 'Vitrine principal (banners)', status: 'ressalva',
      texto: 'Aqui aparecem os banners da loja (foto 2:1), deslizando para o lado, com bolinhas mostrando qual está na tela e link para uma categoria, produto ou site. Como ainda não há banner cadastrado, o app mostra este quadro da marca no lugar, para nunca ficar um buraco vazio. Os banners serão cadastrados pelo painel web, que ainda não existe.' },
    { q: { text: 'Ver novidades' , grow: { top: 10, bottom: 10, left: 16, right: 30 } }, titulo: 'Botão Ver novidades', status: 'ok', go: 'novidades',
      texto: 'Abre a lista de Novidades: peças marcadas como novidade pela loja ou cadastradas nos últimos 30 dias.' },
    { q: { text: 'Categorias', nth: 0 }, titulo: 'Seção Categorias', status: 'ok', go: 'categorias',
      texto: 'Faixa que desliza para o lado com as categorias em círculos dourados. Categoria sem foto própria usa a foto da peça principal dela. Categoria sem peças some sozinha (Piercings, Pingentes, Infantil, Mix e Gargantilhas estão escondidas por isso).' },
    { q: { text: 'Ver todas', nth: 0, grow: { left: 4, right: 20, top: 6, bottom: 6 } }, titulo: 'Ver todas as categorias', status: 'ok', go: 'categorias',
      texto: 'Abre a aba Categorias com a grade completa.' },
    { q: { text: 'Brincos', nth: 0, grow: { top: 80, left: 6, right: 6 } }, titulo: 'Círculo da categoria Brincos', status: 'ok', go: 'categoria-brincos',
      texto: 'Cada círculo abre a sua categoria. A foto vem no tamanho de miniatura (cerca de 6 KB), para a faixa carregar instantaneamente.' },
    { q: { text: 'Destaques' }, titulo: 'Destaques', status: 'ok',
      texto: 'Carrossel com as peças marcadas como destaque. Hoje são 6, escolhidas entre as de maior valor e mais bonitas: Colar São Bento, Brinco Argola Cravejada, Choker Luara, Bracelete Aurora, Colar Clarissa Blue e Colar Duo Esmeralda. A loja poderá trocar pelo painel. Acima desta seção fica a seção "Em oferta", que só aparece quando há peça em promoção (hoje nenhuma).' },
    { q: { label: 'Brinco Argola Cravejada com Zircônia', nth: 0 }, titulo: 'Card de produto', status: 'ok', go: 'produto',
      texto: 'Toque no card para abrir a peça. A página abre na hora porque já reaproveita a foto, o nome e o preço do card. O nome sempre ocupa 2 linhas, então todos os cards ficam alinhados (problema que o Bubble tinha). A foto vem em WebP no tamanho do card: cerca de 15 KB em vez de 1,4 MB.' },
    { q: { label: 'Favoritar', nth: 0 }, titulo: 'Coração (favoritar)', status: 'ok',
      texto: 'Salva a peça nos Favoritos da cliente. Para visitante aparece o aviso "Entre na sua conta para salvar favoritos" com o botão Entrar. Se a peça favoritada entrar em promoção, a cliente recebe um aviso automático.' },
    { q: { label: 'Adicionar à sacola', nth: 0 }, titulo: 'Botão dourado do card', status: 'ok',
      texto: 'Peça sem tamanho: vai direto para a sacola e aparece o aviso "Adicionado à sacola · Ver sacola". Peça com aro (ícone de ajustes): abre a página da peça para escolher o tamanho antes. Peça esgotada não mostra o botão e fica coberta com "ESGOTADO".' },
    { q: { text: 'Quer revender Juliana Prado?', parentUp: 2 }, titulo: 'Convite para revendedoras', status: 'ok', go: 'conta-visitante',
      texto: 'Leva à aba Conta, onde a cliente pede acesso ao preço de revenda (20% abaixo do preço final). Some para quem já é revendedora, para a equipe e para quem já pediu e está em análise.' },
    { q: { text: 'Novidades' }, titulo: 'Novidades', status: 'ok',
      texto: 'Carrossel com as peças novas. O selo preto "NOVO" aparece nas peças marcadas como novidade (hoje 15, as de foto mais recente no site).' },
    { q: { text: 'Mais vendidas' }, titulo: 'Mais vendidas', status: 'ressalva',
      texto: 'Grade de 2 colunas com 20 peças ordenadas pelas vendas reais (cada pedido soma, cada cancelamento desconta). Como ainda não há pedidos, segue a ordem dos destaques. Puxar a tela para baixo atualiza tudo.' },
    ...A,
  ]));

  await ir('/busca');
  telas.push(await cap(page, 'busca', [
    { q: { label: 'Voltar' }, titulo: 'Voltar', status: 'ok', go: 'inicio', texto: 'Volta para a tela anterior.' },
    { q: { placeholder: 'O que você procura?' }, titulo: 'Campo de busca', status: 'ok', go: 'busca-anel',
      texto: 'Abre com o teclado pronto. Pesquisa enquanto a pessoa digita (espera um quarto de segundo depois que ela para). Ignora acento e maiúscula: "aneis" acha "Anéis". Com mais de uma palavra, precisa achar todas ("argola coração").' },
    { q: { text: 'Sugestões' }, titulo: 'Sugestões', status: 'ok',
      texto: 'Antes de digitar, mostra as categorias como atalhos. Tocar numa sugestão preenche a busca.' },
    { q: { text: 'Brincos', grow: { left: 14, right: 14, top: 8, bottom: 8 } }, titulo: 'Atalho de categoria', status: 'ok', texto: 'Preenche a busca com o nome da categoria.' },
  ], { semRolagem: true }));

  await page.getByPlaceholder('O que você procura?').fill('anel');
  telas.push(await cap(page, 'busca-anel', [
    { q: { placeholder: 'O que você procura?' }, titulo: 'Busca com texto', status: 'ok',
      texto: 'Enquanto busca, aparece um círculo carregando no lugar do X. O X limpa o campo.' },
    { q: { text: 'resultados para', exact: false }, titulo: 'Contador de resultados', status: 'ok',
      texto: 'Mostra quantas peças foram achadas. Sem resultado aparece "Nada encontrado" com uma sugestão de tentar outra palavra.' },
    { q: { label: 'Anel Natalia Dourado' }, titulo: 'Resultado', status: 'ok', go: 'produto',
      texto: 'Mesmo card da vitrine. Resultados com o código (SKU) exato aparecem primeiro.' },
  ], { semRolagem: true }));

  await ir('/categorias');
  telas.push(await cap(page, 'categorias', [
    { q: { text: 'Categorias', nth: 0 }, titulo: 'Título', status: 'ok', texto: 'Aba Categorias.' },
    { q: { label: 'Buscar' }, titulo: 'Lupa', status: 'ok', go: 'busca', texto: 'Abre a busca.' },
    { q: { text: 'Brincos', nth: 0, parentUp: 2 }, titulo: 'Card da categoria', status: 'ressalva', go: 'categoria-brincos',
      texto: 'Foto, nome e quantidade de peças ativas. As 7 categorias atuais: Brincos 14, Colares 10, Choker 9, Pulseiras 6, Anéis 4, Conjuntos 4, Braceletes 3. Ressalva: ainda não há foto própria de categoria; o app usa a foto da peça principal até a loja enviar uma pelo painel.' },
    ...A,
  ]));

  await page.getByText('Brincos', { exact: true }).first().click();
  telas.push(await cap(page, 'categoria-brincos', [
    { q: { label: 'Voltar' }, titulo: 'Voltar', status: 'ok', go: 'categorias', texto: 'Volta para Categorias.' },
    { q: { text: 'Brincos', nth: 0 }, titulo: 'Nome da categoria', status: 'ok',
      texto: 'Todas as peças da categoria: destaques primeiro, esgotadas por último.' },
    { q: { label: 'Brinco Argola Cravejada com Zircônia' }, titulo: 'Peça', status: 'ok', go: 'produto', texto: 'Abre a página da peça.' },
    { q: { rect: [16, 120, 361, 40] }, titulo: 'Filtro por subcategoria', status: 'futuro',
      texto: 'Ainda não existe: filtros como Argolas, Ponto de luz, Cravejados, Pedras coloridas e ordenar por preço. A informação de subcategoria já está gravada no banco (veio da planilha); falta só colocar os botões na tela.' },
  ], {}));

  await ir('/lista/novidades');
  telas.push(await cap(page, 'novidades', [
    { q: { label: 'Voltar' }, titulo: 'Voltar', status: 'ok', go: 'inicio', texto: 'Volta.' },
    { q: { text: 'Novidades', nth: 0 }, titulo: 'Lista pronta', status: 'ok',
      texto: 'A mesma tela serve para Ofertas, Novidades, Destaques, Mais vendidas e Favoritos. Ofertas hoje fica vazia porque nenhuma peça tem preço promocional.' },
    { q: { text: 'NOVO', nth: 0 }, titulo: 'Selo NOVO', status: 'ok', texto: 'Aparece nas peças marcadas como novidade. O selo de desconto (-20%) tem prioridade sobre ele.' },
  ], {}));

  // Produto (anel com aros)
  await ir(`/produto/${NATALIA}`);
  telas.push(await cap(page, 'produto', [
    { q: { label: 'Voltar' }, titulo: 'Voltar', status: 'ok', go: 'inicio', texto: 'Volta para onde a cliente estava.' },
    { q: { rect: [0, 70, 393, 300] }, titulo: 'Fotos da peça', status: 'ressalva',
      texto: 'Foto em tela cheia, em alta (cerca de 50 KB em WebP). Com várias fotos, desliza para o lado com bolinhas indicando a posição. Ressalva: hoje cada peça tem só 1 foto, a que veio da planilha do site; mais fotos serão enviadas pelo painel. As fotos ainda vêm do site da loja; serão copiadas para o nosso servidor.' },
    { q: { label: 'Compartilhar' }, titulo: 'Compartilhar', status: 'ok',
      texto: 'Abre o compartilhamento do celular (WhatsApp, Instagram...) com o nome e o preço da peça.' },
    { q: { label: 'Favoritar' }, titulo: 'Favoritar', status: 'ok', texto: 'Visitante é levada para Entrar. Logada, o coração fica dourado e a peça vai para Favoritos.' },
    { q: { text: 'ANÉIS', exact: false, nth: 0 }, titulo: 'Categoria', status: 'ok', texto: 'Nome da categoria em dourado, acima do nome da peça.' },
    { q: { text: 'Anel Natalia Dourado', nth: 0 }, titulo: 'Nome e preço', status: 'ok',
      texto: 'Preço grande. Em promoção: preço antigo riscado, preço novo e selo (-20%). Para revendedora aparece o preço de revenda, o de varejo riscado e o selo "REVENDA".' },
    { q: { text: 'Escolha o aro', exact: false, grow: { bottom: 64, right: 220 } }, titulo: 'Escolha o aro', status: 'ressalva',
      texto: 'Botões de tamanho. O escolhido fica grafite. Aro esgotado aparece riscado e não pode ser tocado. Sem escolher, o app avisa "Escolha uma opção antes de adicionar". Ressalva: os aros 12 a 22 foram criados como exemplo nos anéis Natalia e Coração; a loja precisa confirmar quais peças têm aro e quais tamanhos.' },
    { q: { text: 'Não sabe seu aro?', exact: false }, titulo: 'Ajuda com o aro', status: 'ok', texto: 'Dica que leva a cliente a perguntar no WhatsApp.' },
    { q: { text: 'Quantidade', grow: { right: 260, top: 8, bottom: 8 } }, titulo: 'Quantidade', status: 'ok', texto: 'Botões − e + de 1 a 99.' },
    { q: { text: 'Detalhes', grow: { bottom: 26, right: 280 } }, titulo: 'Detalhes da peça', status: 'ressalva',
      texto: 'Descrição e código (SKU). Ressalva: as 42 peças que vieram da planilha do site ainda não têm descrição nem código; só as que existiam no Bubble têm.' },
    { q: { text: 'Dúvidas sobre a peça? Fale com a gente', parentUp: 1 }, titulo: 'Dúvidas pelo WhatsApp', status: 'ok',
      texto: 'Abre o WhatsApp da loja (43 92000-9775) com a mensagem "Olá! Tenho uma dúvida sobre a peça Anel Natalia Dourado (cód. AN-NATALIA)." já escrita.' },
    { q: { text: 'Você também pode gostar' }, titulo: 'Você também pode gostar', status: 'ok', texto: 'Carrossel com outras peças da mesma categoria.' },
    { q: { text: 'Sacola', nth: 0, grow: { top: 14, bottom: 14, left: 40, right: 30 } }, titulo: 'Botão Sacola', status: 'ok',
      texto: 'Adiciona à sacola e mostra o aviso "Adicionado à sacola · Ver sacola", sem sair da página.' },
    { q: { text: 'Comprar', grow: { top: 14, bottom: 14, left: 50, right: 50 } }, titulo: 'Botão Comprar', status: 'ok', go: 'sacola-visitante',
      texto: 'Adiciona à sacola e já leva para a sacola. Com a peça esgotada, a barra vira "Avisar quando chegar (WhatsApp)".' },
  ], { baseFixa: 75 }));

  // Sacola vazia antes de adicionar
  await ir('/sacola');
  telas.push(await cap(page, 'sacola-vazia', [
    { q: { text: 'Sua sacola está vazia' , grow: { top: 110, bottom: 20, left: 40, right: 40 } }, titulo: 'Sacola vazia', status: 'ok', go: 'novidades',
      texto: 'Mensagem amigável com o botão "Ver novidades". A sacola do visitante fica guardada no celular, mesmo fechando o app.' },
    ...A,
  ], { semRolagem: true }));

  // Adiciona o anel (aro 16) e um brinco
  await ir(`/produto/${NATALIA}`);
  await page.waitForTimeout(2500);
  await page.getByText('16', { exact: true }).first().click();
  await page.getByText('Sacola', { exact: true }).first().click();
  await page.waitForTimeout(1500);
  await ir('/produto/e604ea0c-8e4f-4cbf-b8b6-ceff6cee5afc');
  await page.waitForTimeout(2500);
  await page.getByText('Comprar', { exact: true }).first().click();
  await page.waitForTimeout(2000);
  telas.push(await cap(page, 'sacola-visitante', [
    { q: { text: 'Sacola', nth: 0 }, titulo: 'Sacola', status: 'ok', texto: 'Título e quantidade de peças. Puxar para baixo atualiza preços e disponibilidade.' },
    { q: { text: 'Anel Natalia Dourado', parentUp: 2 }, titulo: 'Item da sacola', status: 'ok', go: 'produto',
      texto: 'Foto, nome, aro escolhido e valor. Tocar na foto abre a peça. Se a peça esgotar, o item fica apagado com "Esgotou — remova para finalizar" e o botão de finalizar trava.' },
    { q: { label: 'Aumentar', nth: 0 }, titulo: 'Mais uma unidade', status: 'ok', texto: 'Muda a quantidade na hora (até 99).' },
    { q: { label: 'Remover', nth: 0 }, titulo: 'Remover / diminuir', status: 'ok', texto: 'Com 1 unidade o botão vira lixeira e remove o item; com mais, diminui.' },
    { q: { placeholder: 'Digite o código' }, titulo: 'Cupom de desconto', status: 'ressalva',
      texto: 'Visitante é levada para Entrar ao tocar em Aplicar. Ressalva: não há cupom cadastrado ainda (cadastro pelo painel).' },
    { q: { placeholder: 'Ex.: é para presente' }, titulo: 'Observações', status: 'ok', texto: 'Texto livre que vai junto com o pedido e na mensagem do WhatsApp.' },
    { q: { text: 'Subtotal', parentUp: 2 }, titulo: 'Resumo', status: 'ok',
      texto: 'Subtotal, desconto do cupom, "Frete: combinado no WhatsApp" e Total. O valor final é sempre recalculado pelo banco ao finalizar, então não há como pagar menos mexendo no app.' },
    { q: { text: 'Entrar para finalizar', grow: { top: 14, bottom: 14, left: 60, right: 60 } }, titulo: 'Entrar para finalizar', status: 'ok', go: 'entrar',
      texto: 'Para finalizar é preciso ter conta. Ao entrar, as peças da sacola do celular passam automaticamente para a sacola da conta.' },
    ...A,
  ]));

  await ir('/pedidos');
  telas.push(await cap(page, 'pedidos-visitante', [
    { q: { text: 'Acompanhe seus pedidos', grow: { top: 110, bottom: 90, left: 30, right: 30 } }, titulo: 'Pedidos sem conta', status: 'ok', go: 'entrar',
      texto: 'Visitante vê o convite para entrar. Depois de entrar, aparece a lista de pedidos.' },
    ...A,
  ], { semRolagem: true }));

  await ir('/conta');
  telas.push(await cap(page, 'conta-visitante', [
    { q: { text: 'Bem-vinda à Juliana Prado', parentUp: 1 }, titulo: 'Boas-vindas', status: 'ok', texto: 'Cartão grafite para quem ainda não entrou.' },
    { q: { text: 'Entrar', nth: 0, grow: { top: 14, bottom: 14, left: 50, right: 50 } }, titulo: 'Entrar', status: 'ok', go: 'entrar', texto: 'Abre a tela de login.' },
    { q: { text: 'Criar conta', grow: { top: 14, bottom: 14, left: 40, right: 40 } }, titulo: 'Criar conta', status: 'ok', go: 'cadastro', texto: 'Abre o cadastro.' },
    { q: { text: 'Favoritos', grow: { left: 50, right: 150, top: 14, bottom: 14 } }, titulo: 'Favoritos', status: 'ok', go: 'favoritos', texto: 'Lista de favoritos (pede login).' },
    { q: { text: 'Notificações', grow: { left: 50, right: 130, top: 14, bottom: 14 } }, titulo: 'Notificações', status: 'ok', go: 'notificacoes-visitante', texto: 'Avisos da loja.' },
    { q: { text: 'Fale com a gente', grow: { left: 50, right: 110, top: 14, bottom: 14 } }, titulo: 'Fale com a gente', status: 'ok',
      texto: 'Abre o WhatsApp da loja com "Olá! Vim pelo app da Juliana Prado.". Substitui o botão flutuante verde do Bubble, que cobria os botões de compra. Um atalho do Instagram aparece aqui quando o endereço for cadastrado.' },
    { q: { text: 'versão', exact: false }, titulo: 'Versão do app', status: 'ok', texto: 'Mostra a versão e o código da última atualização recebida sem reinstalar. Ajuda a saber se a cliente está com a versão nova.' },
    ...A,
  ], { semRolagem: true }));

  await ir('/entrar');
  telas.push(await cap(page, 'entrar', [
    { q: { label: 'Fechar' }, titulo: 'Fechar', status: 'ok', go: 'conta-visitante', texto: 'Fecha e volta para onde estava (a tela de entrar sobe de baixo, como uma janela).' },
    { q: { placeholder: 'seuemail@exemplo.com' }, titulo: 'E-mail', status: 'ok', texto: 'Login com e-mail e senha. O CPF é pedido no cadastro.' },
    { q: { placeholder: 'Sua senha' }, titulo: 'Senha', status: 'ok', texto: 'O olho mostra ou esconde a senha. Erros aparecem em português claro, como "E-mail ou senha incorretos.".' },
    { q: { text: 'Entrar', exact: true, nth: -1, grow: { top: 15, bottom: 15, left: 140, right: 140 } }, titulo: 'Entrar', status: 'ok', go: 'conta-cliente', texto: 'Entra, mostra "Que bom ter você de volta!" e volta para a tela anterior.' },
    { q: { text: 'Esqueci minha senha' }, titulo: 'Esqueci minha senha', status: 'nao',
      texto: 'A tela existe e envia o link por e-mail, mas ainda não funciona de verdade: o e-mail padrão do Supabase só entrega para a equipe do projeto, e falta cadastrar o endereço de volta ao app (julianaprado://**) no Supabase. Resolve com domínio próprio + Resend.' },
    { q: { text: 'Criar minha conta', grow: { top: 15, bottom: 15, left: 120, right: 120 } }, titulo: 'Criar minha conta', status: 'ok', go: 'cadastro', texto: 'Abre o cadastro.' },
  ], { semRolagem: true }));

  await ir('/cadastro');
  telas.push(await cap(page, 'cadastro', [
    { q: { placeholder: 'Maria da Silva' }, titulo: 'Nome completo', status: 'ok', texto: 'Exige nome e sobrenome.' },
    { q: { placeholder: '000.000.000-00' }, titulo: 'CPF', status: 'ok', texto: 'Máscara automática e validação dos dígitos. CPF repetido avisa "Este CPF já tem cadastro". Depois de gravado, só a loja corrige.' },
    { q: { placeholder: '(43) 90000-0000' }, titulo: 'Celular (WhatsApp)', status: 'ok', texto: 'Obrigatório: é por ele que a loja combina entrega e pagamento.' },
    { q: { placeholder: 'dd/mm/aaaa' }, titulo: 'Data de nascimento', status: 'ok', texto: 'Opcional. Fica guardada para futuras ações (ex.: cupom de aniversário).' },
    { q: { placeholder: 'seuemail@exemplo.com' }, titulo: 'E-mail', status: 'ok', texto: 'Será o login.' },
    { q: { placeholder: 'Mínimo 6 caracteres' }, titulo: 'Senha', status: 'ok', texto: 'Mínimo de 6 caracteres.' },
    { q: { text: 'Criar minha conta', grow: { top: 15, bottom: 15, left: 110, right: 110 } }, titulo: 'Criar minha conta', status: 'ressalva', go: 'conta-cliente',
      texto: 'Cria a conta e já entra. Ressalva: a confirmação por e-mail está desligada até haver domínio próprio; quando ligada, aparece a tela "Confirme seu e-mail".' },
  ], {}));

  await ir('/notificacoes');
  telas.push(await cap(page, 'notificacoes-visitante', [
    { q: { text: 'Nada por aqui', grow: { top: 110, bottom: 40, left: 40, right: 40 } }, titulo: 'Sem avisos', status: 'ok',
      texto: 'Visitante também recebe os avisos gerais (ofertas e cupons), melhoria em relação à Raio de Luz. Para chegar no celular falta o Firebase.' },
  ], { semRolagem: true }));

  await ir('/lista/favoritos');
  telas.push(await cap(page, 'favoritos', [
    { q: { text: 'Seus favoritos', grow: { top: 110, bottom: 80, left: 40, right: 40 } }, titulo: 'Favoritos', status: 'ok', go: 'entrar',
      texto: 'Visitante vê o convite para entrar. Logada, vê a grade das peças com coração.' },
  ], { semRolagem: true }));

  return telas;
};
