# iPhone (TestFlight) — passo a passo

Atualizado em 23/11/2026. Pacote iOS: `br.com.julianaprado.app` (o mesmo do Android).

## O que já está pronto no projeto
- `app.json`: `ios.bundleIdentifier` e `ios.buildNumber` ("1"). A cada novo envio à Apple, aumentar o `buildNumber`.
- `eas.json`: perfil `testflight` (loja, canal de atualizações `preview`, igual ao APK de teste).
- Fontes: o iPhone chama a fonte pelo nome interno (PostScript), o Android pelo nome do arquivo. `src/constants/tema.ts` já faz a troca.
- A assinatura do Android NÃO mudou (`0d72289c…`): o APK instalado continua recebendo atualizações. A do iPhone é `225ae819…`.

## Por que precisa do computador do dono (uma vez só)
Na primeira vez, a Expo precisa criar o certificado e o perfil do iPhone **entrando na conta Apple com código de verificação (2FA)**. A nuvem onde o Claude trabalha não consegue digitar esse código, e a senha da Apple nunca deve ser passada no chat.
Depois dessa primeira vez, o Claude consegue gerar novas versões e enviar sem a senha.

## Passos (no computador, Windows ou Mac)
1. Instale o Node.js (versão LTS) em nodejs.org.
2. Baixe o projeto: https://github.com/carlosaraujoff1-tech/julianaprado-app/archive/refs/heads/main.zip e extraia.
3. Abra o terminal DENTRO da pasta extraída (Windows: na pasta, clique na barra de endereço, digite `cmd` e Enter).
4. Rode, um de cada vez:
   - `npm install`
   - `npx eas-cli@latest login`  (entre com a conta da Expo, a mesma do expo.dev)
   - `npx eas-cli@latest build --platform ios --profile testflight --auto-submit`
5. Quando perguntar "Do you want to log in to your Apple account?" responda **Y** e entre com o Apple ID da conta de desenvolvedor (e o código que chegar no iPhone).
6. Responda **Y** para criar: Apple Distribution Certificate, Provisioning Profile e **Push Notifications key** (necessária para as notificações).
7. Se perguntar para criar o app no App Store Connect: **Y** (nome sugerido: Juliana Prado). Se o nome já existir na Apple, escolha outro, ex.: "Juliana Prado Acessórios".
8. O build leva ~15–30 min na nuvem e, ao terminar, é enviado sozinho ao TestFlight.

## Depois do envio
- Em ~10–15 min o build aparece em appstoreconnect.apple.com → seu app → TestFlight.
- Se aparecer "Missing Compliance": abra o build → responda a pergunta de criptografia com **"None of the algorithms mentioned above"** (o app só usa HTTPS do sistema).
- Testadores internos (até 100, sem revisão da Apple): App Store Connect → Users and Access → convide a pessoa (precisa ter função na equipe) → TestFlight → Internal Testing → crie um grupo e adicione. Cada pessoa instala o app **TestFlight** no iPhone e aceita o convite.
- Testadores externos (link público): exige revisão da Apple, descrição do teste, e-mail de contato e **URL da política de privacidade** (ainda não existe).
- Builds do TestFlight vencem em 90 dias.

## Atualizações sem reinstalar
Mudanças só de tela/regra chegam ao iPhone por `eas update --channel preview`, igual ao Android. Mudança nativa (ícone, permissões, pacote novo) exige novo build.

## Ainda não testado em iPhone de verdade
Fontes (corrigidas por nome interno), barra de abas, notificações (principalmente **foto dentro da notificação**, que no iPhone costuma exigir configuração extra), toque duplo e rolagem do Descubra.

## Estado em 23/11/2026 (primeiro envio feito)
- Conta Apple usada: **RAIO DE LUZ ARTIGOS RELIGIOSOS LTDA** (equipe A56Q684NKD), só para testes. O identificador `br.com.julianaprado.app` ficou registrado nela. Para publicar na App Store em nome da Juliana Prado será preciso uma conta Apple dela e outro identificador no iPhone (o Android não muda).
- Build iOS `03dfa88d-83cf-4bda-bb2a-deda6d606f4f` (perfil testflight, canal preview, buildNumber 1), runtime `460db299…`. Chave do App Store Connect (APP_MANAGER) criada pela Expo.
- Testador interno liberado: o Apple ID que fez o envio (grupo "Team (Expo)").

## Atualizações sem reinstalar: Android e iPhone têm "assinaturas" diferentes
Ao responder "usa só criptografia padrão", a Expo gravou `ios.infoPlist.ITSAppUsesNonExemptEncryption=false` no app.json usado no build do iPhone. Essa linha muda a assinatura do iPhone (`460db299…`) e também mudaria a do Android (`0d72289c…` → `83b70d61…`), cujo APK já está instalado. Por isso a linha NÃO está no app.json do repositório.
- Para publicar atualizações use sempre: `scripts/publicar-atualizacao.sh "mensagem" [android|ios|todas]`. Ele publica o Android com o app.json do repositório e o iPhone com a linha (só durante o comando).
- Quando for gerado um novo APK do Android por outro motivo, incluir a linha no app.json e unificar os dois.
- Conferir diferenças entre assinaturas: `eas fingerprint:compare <hash1> <hash2>`.

## Envio concluído (23/11/2026, 18:17)
- App no App Store Connect: https://appstoreconnect.apple.com/apps/6838409644/testflight/ios (ascAppId `6838409644`, já em `eas.json` → `submit.testflight`).
- Próximas versões (depois da primeira, sem senha da Apple): `eas build -p ios --profile testflight --non-interactive` e `eas submit -p ios --profile testflight --latest --non-interactive`. Antes, aumentar `ios.buildNumber` no app.json e lembrar da linha `infoPlist` do iPhone (ver seção acima).
