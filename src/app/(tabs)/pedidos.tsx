import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SeloStatus } from '@/components/pedido';
import { Botao, Carregando, T, Vazio } from '@/components/ui';
import { cores, espaco, fontes, raio } from '@/constants/tema';
import { useAuth } from '@/lib/auth';
import { dataHora, formatarReais, rotuloStatus } from '@/lib/formatacao';
import { usePedidos, type ClienteSnapshot } from '@/lib/pedidos';
import type { StatusPedido } from '@/types/database';

const filtros: (StatusPedido | null)[] = [null, 'recebido', 'pago', 'em_separacao', 'enviado', 'entregue', 'cancelado'];

export default function Pedidos() {
  const ins = useSafeAreaInsets();
  const { logado, equipe } = useAuth();
  const [status, setStatus] = useState<StatusPedido | null>(null);
  const q = usePedidos(equipe ? status : null);

  return (
    <View style={{ flex: 1, paddingTop: ins.top + espaco.md }}>
      <View style={{ paddingHorizontal: espaco.lg, gap: 2 }}>
        <T v="tituloGrande">{equipe ? 'Pedidos da loja' : 'Meus pedidos'}</T>
        {equipe && <T v="legenda">Você está vendo os pedidos de todas as clientes.</T>}
      </View>
      {!logado ? (
        <Vazio icone="receipt-outline" titulo="Acompanhe seus pedidos" texto="Entre na sua conta para ver seus pedidos e o andamento de cada um."
          acao={<Botao titulo="Entrar" onPress={() => router.push('/entrar')} />} />
      ) : (
        <>
          {equipe && (
            <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtros}>
                {filtros.map((f) => (
                  <Pressable key={f ?? 'todos'} onPress={() => setStatus(f)} style={[s.filtro, status === f && s.filtroAtivo]}>
                    <Text style={[s.filtroTexto, status === f && { color: cores.branco }]}>{f ? rotuloStatus[f] : 'Todos'}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
          {q.isLoading ? <Carregando /> : (
            <FlatList
              data={q.data ?? []}
              keyExtractor={(p) => p.id}
              contentContainerStyle={{ padding: espaco.lg, gap: espaco.md, paddingBottom: 100 }}
              refreshing={q.isRefetching}
              onRefresh={q.refetch}
              ListEmptyComponent={
                <Vazio icone="receipt-outline" titulo="Nenhum pedido ainda" texto={equipe ? 'Nenhum pedido neste filtro.' : 'Quando você finalizar uma compra, ela aparece aqui.'} />
              }
              renderItem={({ item }) => {
                const cli = item.cliente_snapshot as ClienteSnapshot;
                return (
                  <Pressable style={s.card} onPress={() => router.push({ pathname: '/pedido/[id]', params: { id: item.id } })}>
                    <View style={{ flex: 1, gap: 6 }}>
                      <View style={s.linha}>
                        <Text style={s.numero}>Pedido Nº {item.numero}</Text>
                        <SeloStatus status={item.status} />
                      </View>
                      {equipe && <T v="corpoForte">{cli?.nome}{item.tabela_preco === 'revenda' ? ' · revenda' : ''}</T>}
                      <View style={s.linha}>
                        <T v="legenda">{dataHora(item.criado_em)}</T>
                        <Text style={s.total}>{formatarReais(item.total)}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={cores.textoSuave} />
                  </Pressable>
                );
              }}
            />
          )}
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  filtros: { paddingHorizontal: espaco.lg, paddingTop: espaco.md, gap: espaco.sm },
  filtro: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: raio.pill, borderWidth: 1, borderColor: cores.linha, backgroundColor: cores.branco },
  filtroAtivo: { backgroundColor: cores.grafite, borderColor: cores.grafite },
  filtroTexto: { fontFamily: fontes.textoSemi, fontSize: 13, color: cores.texto },
  card: { flexDirection: 'row', alignItems: 'center', gap: espaco.md, backgroundColor: cores.branco, borderRadius: raio.lg, padding: espaco.lg, borderWidth: 1, borderColor: cores.linha },
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  numero: { fontFamily: fontes.serifa, fontSize: 20, color: cores.texto },
  total: { fontFamily: fontes.textoForte, fontSize: 15, color: cores.texto },
});
