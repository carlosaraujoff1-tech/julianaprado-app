import { FlatList, useWindowDimensions, View, type ListRenderItem } from 'react-native';
import type { ReactElement } from 'react';

import { CardProduto } from '@/components/produto';
import { espaco } from '@/constants/tema';
import type { ProdutoVitrine } from '@/types/database';

// Grade de 2 colunas (3 em telas largas) com rolagem rápida.
export function useLarguraCard(colunas?: number) {
  const { width } = useWindowDimensions();
  const n = colunas ?? (width >= 700 ? 3 : 2);
  return { n, largura: Math.floor((width - espaco.lg * 2 - espaco.md * (n - 1)) / n) };
}

export function GradeProdutos({
  produtos, cabecalho, rodape, vazio, onEndReached, refrescando, onRefresh,
}: {
  produtos: ProdutoVitrine[];
  cabecalho?: ReactElement | null;
  rodape?: ReactElement | null;
  vazio?: ReactElement | null;
  onEndReached?: () => void;
  refrescando?: boolean;
  onRefresh?: () => void;
}) {
  const { n, largura } = useLarguraCard();
  const render: ListRenderItem<ProdutoVitrine> = ({ item }) => <CardProduto produto={item} largura={largura} />;
  return (
    <FlatList
      key={n}
      data={produtos}
      numColumns={n}
      keyExtractor={(p) => p.id}
      renderItem={render}
      columnWrapperStyle={{ gap: espaco.md, paddingHorizontal: espaco.lg }}
      contentContainerStyle={{ gap: espaco.md, paddingBottom: 110 }}
      ListHeaderComponent={cabecalho ?? undefined}
      ListFooterComponent={rodape ?? <View style={{ height: espaco.lg }} />}
      ListEmptyComponent={vazio ?? undefined}
      initialNumToRender={6}
      maxToRenderPerBatch={8}
      windowSize={7}
      removeClippedSubviews
      onEndReached={onEndReached}
      onEndReachedThreshold={0.6}
      refreshing={refrescando}
      onRefresh={onRefresh}
      showsVerticalScrollIndicator={false}
    />
  );
}
