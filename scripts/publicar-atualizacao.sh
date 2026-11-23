#!/usr/bin/env bash
# Publica a atualização "sem reinstalar" (canal preview) para Android e iPhone.
# Uso: scripts/publicar-atualizacao.sh "mensagem" [android|ios|todas]
#
# Por que são duas publicações: o build do iPhone (TestFlight) foi feito com a linha
# ios.infoPlist.ITSAppUsesNonExemptEncryption=false no app.json (a Expo gravou isso ao responder
# "usa só criptografia padrão"). Essa linha muda a "assinatura" do iPhone (460db299…) e TAMBÉM mudaria
# a do Android (0d72289c…), cujo APK já está instalado. Então:
#   - Android: publica com o app.json do repositório (sem a linha);
#   - iPhone: publica com a linha, só durante este comando, e restaura o app.json depois.
set -euo pipefail
MSG="${1:-Atualização}"
ALVO="${2:-todas}"
export EXPO_TOKEN="${EXPO_TOKEN:-proxy-injected}"
EAS="npx eas-cli@latest"

if [[ "$ALVO" == "android" || "$ALVO" == "todas" ]]; then
  $EAS update --platform android --channel preview --environment preview --message "$MSG" --non-interactive
fi

if [[ "$ALVO" == "ios" || "$ALVO" == "todas" ]]; then
  cp app.json app.json.sem-linha-ios
  restaurar() { mv -f app.json.sem-linha-ios app.json; }
  trap restaurar EXIT
  node -e "
    const fs=require('fs'); const a=JSON.parse(fs.readFileSync('app.json','utf8'));
    a.expo.ios.infoPlist={...(a.expo.ios.infoPlist||{}), ITSAppUsesNonExemptEncryption:false};
    fs.writeFileSync('app.json', JSON.stringify(a,null,2)+'\n');"
  $EAS update --platform ios --channel preview --environment preview --message "$MSG" --non-interactive
fi
