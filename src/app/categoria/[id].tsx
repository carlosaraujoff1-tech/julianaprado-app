import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { GradeProdutos } from '@/components/grade';
import { Cabecalho, Carregando, Vazio } from '@/components/ui';
import { useProdutos } from '@/lib/vitrine';

export default function Categoria() {
  const { id, nome } = useLocalSearchParams<{ id: string; nome?: string }>();
  const q = useProdutos({ categoria: id, limite: 100 });
  return (
    <View style={{ flex: 1 }}>
      <Cabecalho titulo={nome ?? q.data?.[0]?.categoria_nome ?? 'Categoria'} />
      {q.isLoading ? <Carregando /> : (
        <GradeProdutos
          produtos={q.data ?? []}
          refrescando={q.isRefetching}
          onRefresh={q.refetch}
          vazio={<Vazio icone="diamond-outline" titulo="Em breve" texto="Novas peças chegando nesta categoria." />}
        />
      )}
    </View>
  );
}
