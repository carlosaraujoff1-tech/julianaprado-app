# Juliana Prado — app (Expo) + painel (Vite) + Supabase

Dono: Carlos, único responsável de TI. Explicar tudo em português do Brasil, simples, sem jargão.
Padrão de referência: repositório `tiraiodeluz-web/raio-de-luz-app` (só os padrões, não as regras de loja B2B).

## Regras de trabalho
- Expo muda muito: antes de usar qualquer API do Expo/EAS/React Native, ler a doc da versão do `expo` no package.json (`https://docs.expo.dev/versions/v<major>.0.0/`, índice em https://docs.expo.dev/llms.txt).
- Instalar pacotes com `npx expo install <pacote>`. Nunca editar `ios/`/`android/` (usar app.json e config plugins).
- Antes de dizer que terminou: `npx tsc --noEmit` e `npx expo lint`.
- Todo SQL em `supabase/migrations` (nome com data) E aplicado no projeto. Regras testadas com blocos desfeitos (rollback).
- Segurança sempre no banco (RLS + funções security definer). O app nunca decide quem pode o quê.
- Avisar antes de mudar eas.json, app.json, pacote Android ou google-services.json (muda o fingerprint das atualizações sem reinstalar).
- Nunca pedir senhas/tokens no chat: usar Supabase Secrets / EAS e só os NOMES das variáveis.
- Imagens do painel: recorte na proporção do campo + WebP antes de subir.
- Confirmar com o dono antes de qualquer ação irreversível ou em produção.
- Painel não importa do app módulos que puxam react-native (quebra o Vite).
- MCP do Supabase: sem DELETE sem filtro; funções grandes em arquivos menores.
