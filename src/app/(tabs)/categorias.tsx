import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Carregando, T } from '@/components/ui';
import { cores, espaco, fontes, raio } from '@/constants/tema';
import { useCategorias } from '@/lib/vitrine';

export default function Categorias() {
  const ins = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const q = useCategorias();
  const larg = (width - espaco.lg * 2 - espaco.md) / 2;
  return (
    <View style={{ flex: 1, paddingTop: ins.top + espaco.md }}>
      <View style={s.cab}>
        <T v="tituloGrande">Categorias</T>
        <Pressable onPress={() => router.push('/busca')} hitSlop={10} accessibilityLabel="Buscar">
          <Ionicons name="search" size={22} color={cores.texto} />
        </Pressable>
      </View>
      {q.isLoading ? <Carregando /> : (
        <FlatList
          data={q.data ?? []}
          numColumns={2}
          keyExtractor={(c) => c.id}
          columnWrapperStyle={{ gap: espaco.md, paddingHorizontal: espaco.lg }}
          contentContainerStyle={{ gap: espaco.md, paddingBottom: 100, paddingTop: espaco.md }}
          refreshing={q.isRefetching}
          onRefresh={q.refetch}
          renderItem={({ item }) => (
            <Pressable style={[s.card, { width: larg }]}
              onPress={() => router.push({ pathname: '/categoria/[id]', params: { id: item.id, nome: item.nome } })}>
              {item.imagem_url ? (
                <Image source={{ uri: item.imagem_url }} style={{ width: larg, height: larg * 0.8 }} contentFit="cover" cachePolicy="memory-disk" />
              ) : (
                <View style={[s.semFoto, { width: larg, height: larg * 0.8 }]}><Text style={s.letra}>{item.nome.charAt(0)}</Text></View>
              )}
              <View style={s.rodape}>
                <Text style={s.nome}>{item.nome}</Text>
                <Text style={s.qtd}>{item.qtd} {item.qtd === 1 ? 'peça' : 'peças'}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  cab: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: espaco.lg },
  card: { backgroundColor: cores.branco, borderRadius: raio.lg, overflow: 'hidden', borderWidth: 1, borderColor: cores.linha },
  semFoto: { backgroundColor: cores.douradoClaro, alignItems: 'center', justifyContent: 'center' },
  letra: { fontFamily: fontes.serifa, fontSize: 56, color: cores.douradoEscuro },
  rodape: { padding: espaco.md, gap: 2 },
  nome: { fontFamily: fontes.serifa, fontSize: 20, color: cores.texto },
  qtd: { fontFamily: fontes.texto, fontSize: 12, color: cores.textoSuave },
});
