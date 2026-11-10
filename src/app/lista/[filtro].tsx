import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { GradeProdutos } from '@/components/grade';
import { Botao, Cabecalho, Carregando, Vazio } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { titulosFiltro, useProdutos, type FiltroLista } from '@/lib/vitrine';

export default function Lista() {
  const { filtro } = useLocalSearchParams<{ filtro: FiltroLista }>();
  const { logado } = useAuth();
  const precisaLogin = filtro === 'favoritos' && !logado;
  const q = useProdutos({ filtro, limite: 100 }, !precisaLogin);
  return (
    <View style={{ flex: 1 }}>
      <Cabecalho titulo={titulosFiltro[filtro] ?? 'Produtos'} />
      {precisaLogin ? (
        <Vazio icone="heart-outline" titulo="Seus favoritos" texto="Entre na sua conta para salvar as peças que você amou."
          acao={<Botao titulo="Entrar" onPress={() => router.push('/entrar')} />} />
      ) : q.isLoading ? <Carregando /> : (
        <GradeProdutos
          produtos={q.data ?? []}
          refrescando={q.isRefetching}
          onRefresh={q.refetch}
          vazio={filtro === 'favoritos'
            ? <Vazio icone="heart-outline" titulo="Nenhum favorito ainda" texto="Toque no coração das peças para guardar aqui." />
            : <Vazio icone="diamond-outline" titulo="Nada por aqui agora" texto="Volte em breve, sempre tem novidade." />}
        />
      )}
    </View>
  );
}
