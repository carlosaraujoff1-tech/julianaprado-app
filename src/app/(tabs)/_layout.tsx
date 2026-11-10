import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { cores, fontes } from '@/constants/tema';
import { useAuth } from '@/lib/auth';
import { useSacola } from '@/lib/sacola';

type Nome = React.ComponentProps<typeof Ionicons>['name'];
const icone = (ativo: Nome, inativo: Nome) =>
  function TabIcone({ focused, color }: { focused: boolean; color: ColorValue }) {
    return <Ionicons name={focused ? ativo : inativo} size={23} color={color as string} />;
  };

export default function LayoutAbas() {
  const { quantidadeTotal } = useSacola();
  const { equipe } = useAuth();
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
      <Tabs.Screen name="pedidos" options={{ title: 'Pedidos', tabBarAccessibilityLabel: equipe ? 'Pedidos da loja' : 'Meus pedidos', tabBarIcon: icone('receipt', 'receipt-outline') }} />
      <Tabs.Screen name="conta" options={{ title: 'Conta', tabBarIcon: icone('person', 'person-outline') }} />
    </Tabs>
  );
}
