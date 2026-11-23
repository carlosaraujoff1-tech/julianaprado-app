import { Image } from 'expo-image';
import { router } from 'expo-router';
import { FlatList, Pressable, useWindowDimensions, View } from 'react-native';

import { Botao, Cabecalho, Carregando, Vazio } from '@/components/ui';
import { cores, espaco, raio } from '@/constants/tema';
import { useAuth } from '@/lib/auth';
import { useSalvos } from '@/lib/posts';

// Posts salvos: grade de miniaturas (leves); toque abre o feed a partir daquele post.
export default function Salvos() {
  const { logado } = useAuth();
  const q = useSalvos();
  const { width } = useWindowDimensions();
  const l = Math.floor((width - espaco.lg * 2 - espaco.sm * 2) / 3);
  return (
    <View style={{ flex: 1 }}>
      <Cabecalho titulo="Posts salvos" />
      {!logado ? (
        <Vazio icone="bookmark-outline" titulo="Seus posts salvos" texto="Entre na sua conta para salvar looks da aba Descubra."
          acao={<Botao titulo="Entrar" onPress={() => router.push('/entrar')} />} />
      ) : q.isLoading ? <Carregando /> : (
        <FlatList
          data={q.data ?? []}
          numColumns={3}
          keyExtractor={(p) => p.id}
          columnWrapperStyle={{ gap: espaco.sm, paddingHorizontal: espaco.lg }}
          contentContainerStyle={{ gap: espaco.sm, paddingVertical: espaco.md, paddingBottom: 80 }}
          refreshing={q.isRefetching}
          onRefresh={q.refetch}
          ListEmptyComponent={<Vazio icone="bookmark-outline" titulo="Nenhum post salvo" texto="Toque em Salvar nos posts da aba Descubra para guardar aqui." />}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push({ pathname: '/salvos/[id]', params: { id: item.id } })} accessibilityLabel={item.titulo ?? 'Post'}>
              <Image source={{ uri: item.imagem_mini_url }} style={{ width: l, height: l * 16 / 9, borderRadius: raio.sm, backgroundColor: cores.cremeFoto }}
                contentFit="cover" cachePolicy="memory-disk" recyclingKey={item.id} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
