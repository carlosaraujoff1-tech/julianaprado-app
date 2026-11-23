import { View } from 'react-native';

import { BarraStatusClara } from '@/components/barra-status';
import { FeedLista } from '@/components/feed';
import { Botao, Carregando, Vazio } from '@/components/ui';
import { cores } from '@/constants/tema';
import { useFeed } from '@/lib/posts';

export default function Descubra() {
  const q = useFeed();
  const posts = q.data?.pages.flat() ?? [];
  return (
    <View style={{ flex: 1, backgroundColor: cores.grafiteEscuro }}>
      <BarraStatusClara />
      {q.isLoading ? <Carregando /> : q.isError ? (
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: cores.creme }}>
          <Vazio icone="cloud-offline-outline" titulo="Não deu para carregar" texto="Confira a internet e tente de novo."
            acao={<Botao titulo="Tentar de novo" onPress={() => q.refetch()} />} />
        </View>
      ) : (
        <FeedLista
          posts={posts}
          carregarMais={() => { if (q.hasNextPage && !q.isFetchingNextPage) q.fetchNextPage(); }}
          atualizando={q.isRefetching && !q.isFetchingNextPage}
          atualizar={() => q.refetch()}
          vazio={
            <View style={{ flex: 1, justifyContent: 'center', backgroundColor: cores.creme }}>
              <Vazio icone="sparkles-outline" titulo="Em breve por aqui" texto="Looks, lançamentos e inspirações da Juliana Prado." />
            </View>
          }
        />
      )}
    </View>
  );
}
