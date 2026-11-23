import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import type { ColorValue } from 'react-native';

import { cores, fontes } from '@/constants/tema';
import { useAuth } from '@/lib/auth';
import { preCarregarFeed } from '@/lib/posts';
import { useSacola } from '@/lib/sacola';
import { supabase } from '@/lib/supabase';

type Nome = React.ComponentProps<typeof Ionicons>['name'];
const icone = (ativo: Nome, inativo: Nome) =>
  function TabIcone({ focused, color }: { focused: boolean; color: ColorValue }) {
    return <Ionicons name={focused ? ativo : inativo} size={23} color={color as string} />;
  };

export default function LayoutAbas() {
  const { quantidadeTotal } = useSacola();
  const { equipe, session } = useAuth();
  const qc = useQueryClient();
  const uid = session?.user.id;

  // Depois que a tela inicial já carregou, busca o feed do Descubra em segundo plano.
  useEffect(() => {
    const t = setTimeout(() => { preCarregarFeed(qc, uid).catch(() => undefined); }, 2500);
    return () => clearTimeout(t);
  }, [qc, uid]);

  // Equipe: bolinha na aba Conta com os pedidos novos (status "Recebido").
  const novos = useQuery({
    queryKey: ['pedidos-novos', uid],
    enabled: equipe,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { count } = await supabase.from('pedidos').select('id', { count: 'exact', head: true }).eq('status', 'recebido');
      return count ?? 0;
    },
  });
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cores.douradoEscuro,
        tabBarInactiveTintColor: '#9B9298',
        tabBarStyle: { backgroundColor: cores.branco, borderTopColor: cores.linha },
        tabBarLabelStyle: { fontFamily: fontes.textoMedio, fontSize: 11 },
        tabBarBadgeStyle: { backgroundColor: cores.dourado, color: cores.branco, fontFamily: fontes.textoForte, fontSize: 10 },
        sceneStyle: { backgroundColor: cores.creme },
        animation: 'fade',
      }}>
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: icone('home', 'home-outline') }} />
      <Tabs.Screen name="categorias" options={{ title: 'Categorias', tabBarIcon: icone('grid', 'grid-outline') }} />
      <Tabs.Screen
        name="sacola"
        options={{
          title: 'Sacola',
          tabBarIcon: icone('bag-handle', 'bag-handle-outline'),
          tabBarBadge: quantidadeTotal > 0 ? (quantidadeTotal > 99 ? '99+' : quantidadeTotal) : undefined,
        }}
      />
      <Tabs.Screen name="descubra" options={{ title: 'Descubra', tabBarIcon: icone('sparkles', 'sparkles-outline') }} />
      <Tabs.Screen
        name="conta"
        options={{
          title: 'Conta',
          tabBarIcon: icone('person', 'person-outline'),
          tabBarBadge: equipe && (novos.data ?? 0) > 0 ? novos.data : undefined,
        }}
      />
    </Tabs>
  );
}
