# Dossiê técnico — Juliana Prado (app de semijoias + painel web)

Atualizado em 10/11/2026. Repositório `carlosaraujoff1-tech/julianaprado-app`.

## 1. Visão geral
App Android (iOS depois) da Juliana Prado, Santo Antônio da Platina/PR, substituindo o app do Bubble.
- **Visitante:** navega o app inteiro sem login; monta a sacola no celular.
- **Cliente (varejo):** cadastro livre com CPF + e-mail + senha; finaliza o pedido, que fica registrado e abre o WhatsApp da loja (sem pagamento no app; frete combinado no WhatsApp).
- **Revendedora:** cliente que pediu acesso de revenda e foi aprovada pela equipe; vê a tabela de preço de revenda.
- **Vendedora (equipe):** vê pedidos e clientes, muda status do pedido, aprova revenda. Não mexe em catálogo/preço/cupom.
- **Admin:** tudo, pelo painel web.
Foco: beleza no design e velocidade.

## 2. Stack
- Expo SDK 58 (React Native 0.88, React 19.3, TypeScript 6 estrito), Expo Router (`src/app`), TanStack Query.
- Supabase `julianaprado-app` (ref `jgohlujbljnuduimtnox`, sa-east-1, org CA APPS plano grátis): Postgres + RLS, Auth, Storage (`catalogo`), Edge Functions, pg_cron, pg_net.
- Painel web: Vite + React + react-router (HashRouter) no EAS Hosting (a fazer).

## 3. Banco (supabase/migrations)
- `perfis` (tipo cliente|vendedora|admin; revenda nao_solicitada|pendente|aprovada|recusada; CPF validado), `categorias`, `produtos` (preco, preco_promocional < preco, preco_revenda, estoque), `produto_variacoes` (aro/cor, estoque), `banners`, `configuracoes` (públicas: whatsapp_pedidos...), `favoritos`, `sacola_itens`, `cupons` (% ou R$, início/fim, mínimo, limite, uso único, público, divulgar), `pedidos` + `pedido_itens` (status recebido|pago|em_separacao|enviado|entregue|cancelado), `notificacoes`, `dispositivos_push` (inclui visitantes), `eventos_push`, `fila_push`, `erros_app`.
- `produtos` NÃO é legível pelo público (tem preço de revenda): o app usa `vitrine_produtos`, `vitrine_produto`, `vitrine_categorias`, que devolvem o preço certo para quem está vendo.
- Ações: `sacola_adicionar|quantidade|mesclar|ver`, `validar_cupom`, `criar_pedido`, `solicitar_revenda`, `decidir_revenda`, `registrar_dispositivo`, `contar_notificacoes_nao_lidas`, `marcar_notificacoes_lidas`, `excluir_minha_conta`.
- Avisos automáticos (modelos editáveis em `eventos_push`): pedido novo (equipe), status do pedido, revenda solicitada/aprovada, cupom divulgado (todos), sacola esquecida 1h e 1 dia (cron a cada 10 min), favorito entrou em oferta.

## 4. Pendências
Ver a conversa/plano: app, painel, Edge Function de push, Firebase, conta Expo, dados do Bubble.
