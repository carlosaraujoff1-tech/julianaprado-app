import { StyleSheet, Text, View } from 'react-native';

import { fontes, raio } from '@/constants/tema';
import { rotuloStatus } from '@/lib/formatacao';

const corStatus: Record<string, [string, string]> = {
  recebido: ['#EFE6D2', '#7A5F1E'],
  pago: ['#E3EEF9', '#1F5A96'],
  em_separacao: ['#F3E8F7', '#6E3C86'],
  enviado: ['#E5F2EE', '#24715A'],
  entregue: ['#E3F1E6', '#2E7D4F'],
  cancelado: ['#F8E5E4', '#A3302A'],
};

export function SeloStatus({ status }: { status: string }) {
  const [fundo, texto] = corStatus[status] ?? ['#eee', '#333'];
  return (
    <View style={[s.selo, { backgroundColor: fundo }]}>
      <Text style={[s.texto, { color: texto }]}>{rotuloStatus[status] ?? status}</Text>
    </View>
  );
}
const s = StyleSheet.create({
  selo: { borderRadius: raio.pill, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  texto: { fontFamily: fontes.textoSemi, fontSize: 11 },
});
