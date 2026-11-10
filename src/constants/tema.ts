// Identidade visual da Juliana Prado: grafite da logo + dourado dos botões.
export const cores = {
  grafite: '#3A3539',
  grafiteEscuro: '#2B272A',
  dourado: '#B8994A',
  douradoEscuro: '#94782F',
  douradoClaro: '#EFE6D2',
  creme: '#FAF7F2',
  cremeFoto: '#F3EEE6',
  branco: '#FFFFFF',
  texto: '#2A2629',
  textoSuave: '#7A7178',
  linha: '#E9E2D6',
  erro: '#B3261E',
  sucesso: '#2E7D4F',
  whatsapp: '#1FA855',
} as const;

// Fontes embutidas no app (expo-font, app.json). No Android o nome é o do arquivo.
export const fontes = {
  serifa: 'CormorantGaramond_600SemiBold',
  serifaMedia: 'CormorantGaramond_500Medium',
  serifaForte: 'CormorantGaramond_700Bold',
  texto: 'Inter_400Regular',
  textoMedio: 'Inter_500Medium',
  textoSemi: 'Inter_600SemiBold',
  textoForte: 'Inter_700Bold',
} as const;

export const espaco = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const raio = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
