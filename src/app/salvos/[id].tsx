import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarraStatusClara } from '@/components/barra-status';
import { FeedLista } from '@/components/feed';
import { Carregando } from '@/components/ui';
import { cores } from '@/constants/tema';
import { useSalvos } from '@/lib/posts';

// Feed só com os posts salvos, começando pelo que foi tocado.
export default function SalvosFeed() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ins = useSafeAreaInsets();
  const q = useSalvos();
  const posts = q.data ?? [];
  const inicio = Math.max(0, posts.findIndex((p) => p.id === id));
  return (
    <View style={{ flex: 1, backgroundColor: cores.grafiteEscuro }}>
      <BarraStatusClara />
      {q.isLoading ? <Carregando /> : <FeedLista posts={posts} inicio={inicio} mostrarTopo={false} />}
      <Pressable onPress={() => router.back()} style={[s.voltar, { top: ins.top + 10 }]} hitSlop={10} accessibilityLabel="Voltar">
        <Ionicons name="chevron-back" size={24} color={cores.branco} />
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  voltar: { position: 'absolute', right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
});
