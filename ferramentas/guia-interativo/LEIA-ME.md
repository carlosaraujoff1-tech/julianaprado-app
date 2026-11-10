# Guia interativo do app (página com o celular e as explicações)

Gera fotos das telas reais (versão web do app) e mede cada área clicável.
1. `EXPO_OFFLINE=1 npx expo export --platform web --output-dir <pasta>/web` e sirva a pasta em http://localhost:8099 (com volta para index.html).
2. Crie contas de demonstração (ver conversa de 10/11/2026: demo-cliente / demo-revenda) e um cupom BEMVINDA10; a senha fica num arquivo `senha-demo.txt` fora do repositório.
3. `S=<pasta> node rodar.js fase1` (visitante), depois fase2 (cliente), ajuste no banco (cliente vira admin, revenda pendente, pedido Pago), fase3 (equipe), volte a cliente, fase4.
4. Converta as fotos para WebP e injete `telas.json` + `meta.json` no `modelo.html` (marcador `__DADOS__`).
5. Apague as contas, o pedido e o cupom de demonstração e reinicie a numeração dos pedidos.
Publicado em: https://claude.ai/artifact/KAuzcy5pgkUnYR5gbcG9sg
