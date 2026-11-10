import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Cabecalho, Carregando, T, Vazio } from '@/components/ui';
import { cores, espaco, raio } from '@/constants/tema';
import { tempoRelativo } from '@/lib/formatacao';
import { useMarcarLidas, useNotificacoes } from '@/lib/notificacoes';

export default function Notificacoes() {
  const q = useNotificacoes();
  const marcar = useMarcarLidas();
  useFocusEffect(useCallback(() => { marcar(); }, [marcar]));

  return (
    <View style={{ flex: 1 }}>
      <Cabecalho titulo="Notificações" />
      {q.isLoading ? <Carregando /> : (
        <FlatList
          data={q.data ?? []}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ padding: espaco.lg, gap: espaco.md, paddingBottom: 80 }}
          refreshing={q.isRefetching}
          onRefresh={q.refetch}
          ListEmptyComponent={<Vazio icone="notifications-outline" titulo="Nada por aqui" texto="Ofertas, cupons e novidades dos seus pedidos aparecem aqui." />}
          renderItem={({ item }) => (
            <Pressable style={s.card} disabled={!item.rota}
              onPress={() => item.rota && router.push(item.rota as Href)}>
              <View style={s.icone}>
                <Ionicons name={item.evento?.startsWith('pedido') ? 'receipt-outline' : item.evento === 'cupom_novo' ? 'pricetag-outline' : 'sparkles-outline'}
                  size={20} color={cores.douradoEscuro} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <T v="corpoForte">{item.titulo}</T>
                <T style={{ color: cores.textoSuave }}>{item.corpo}</T>
                <T v="legenda">{tempoRelativo(item.criado_em)}</T>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', gap: espaco.md, backgroundColor: cores.branco, borderRadius: raio.lg, padding: espaco.lg, borderWidth: 1, borderColor: cores.linha },
  icone: { width: 40, height: 40, borderRadius: 20, backgroundColor: cores.douradoClaro, alignItems: 'center', justifyContent: 'center' },
});
