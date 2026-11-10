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

## 4. App (src/)
- Abas: Início (vitrine da marca ou banners, categorias, ofertas, destaques, novidades, mais vendidas), Categorias, Sacola, Pedidos, Conta.
- Telas: produto/[id] (fotos, aro/opção, quantidade, WhatsApp), categoria/[id], lista/[filtro], busca, pedido/[id] (linha do tempo; equipe muda status), notificacoes, entrar, cadastro (CPF validado), esqueci-senha, redefinir-senha (deep link julianaprado://redefinir-senha), meus-dados, equipe/revendas.
- Sacola de visitante fica no celular (AsyncStorage) e é juntada à conta ao entrar (`sacola_mesclar`).
- Finalizar: `criar_pedido` → abre WhatsApp (configuracoes.whatsapp_pedidos = 5543920009775) com o resumo.
- Visual: grafite #3A3539 + dourado #B8994A, Cormorant Garamond (títulos) + Inter (texto), fontes embutidas via expo-font. Sem foto: monograma "JP".
- Admin automático: e-mails em privado.config('admins_iniciais') (hoje carlosaraujoff1@gmail.com) viram admin ao se cadastrar.

## 5. Publicação
- Expo: conta `carlosaraujo1308s-team`, projeto `julianaprado-app` (ID e2e6ec4d-f4dc-4a97-af48-07e1897452af). Pacote Android `br.com.julianaprado.app` (confirmado pelo dono; definitivo só no 1º envio à Play).
- `eas.json`: preview (APK, canal preview), production (AAB, canal production). `runtimeVersion: fingerprint`.
- Token do EAS: credencial de rede do ambiente de nuvem (host api.expo.dev), nunca em arquivo. Comandos: `EXPO_TOKEN=proxy-injected npx eas-cli@latest build -p android --profile preview --non-interactive`.
- Edge Function `processar-fila-push` publicada (verify_jwt=false, protegida por x-push-segredo). Canal Android "avisos".

## 6. Pendências
- Firebase (google-services.json + chave FCM V1 no expo.dev) para o push chegar no celular → exige APK novo.
- Fotos e dados reais (exportar CSV do Bubble: Produtos, Categorias). Catálogo atual veio dos prints (supabase/dados/).
- Categoria "abas" do Bubble: confirmar nome.
- Supabase Auth: Site URL e Redirect URLs (`julianaprado://**`); SMTP próprio quando houver domínio; hoje confirmação de e-mail desligada.
- Painel web (Vite) ainda não feito: produtos, fotos, banners, cupons, pedidos, clientes, notificações.
- Preço de revenda dos produtos ainda vazio (revendedora vê preço de varejo até preencher).
