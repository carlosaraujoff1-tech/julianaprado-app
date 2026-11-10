import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradeProdutos } from '@/components/grade';
import { T } from '@/components/ui';
import { CarrosselProdutos, FaixaCategorias, TituloSecao, Vitrine } from '@/components/vitrine';
import { cores, espaco, fontes, raio } from '@/constants/tema';
import { useAuth } from '@/lib/auth';
import { useNaoLidas } from '@/lib/notificacoes';
import { useBanners, useCategorias, useProdutos } from '@/lib/vitrine';

function Topo() {
  const ins = useSafeAreaInsets();
  const naoLidas = useNaoLidas().data ?? 0;
  return (
    <View style={[s.topo, { paddingTop: ins.top + 10 }]}>
      <View style={s.topoLinha}>
        <View>
          <Text style={s.logo}>JULIANA</Text>
          <Text style={s.logo}>PRADO<Text style={s.registrado}>®</Text></Text>
        </View>
        <Pressable onPress={() => router.push('/notificacoes')} style={s.sino} hitSlop={8} accessibilityLabel="Notificações">
          <Ionicons name="notifications-outline" size={22} color={cores.branco} />
          {naoLidas > 0 && <View style={s.sinoBadge}><Text style={s.sinoBadgeTexto}>{naoLidas > 9 ? '9+' : naoLidas}</Text></View>}
        </Pressable>
      </View>
      <Pressable onPress={() => router.push('/busca')} style={s.busca} accessibilityRole="search">
        <Ionicons name="search" size={18} color="#CFC6CC" />
        <Text style={s.buscaTexto}>Buscar anéis, brincos, colares…</Text>
      </Pressable>
    </View>
  );
}

function ConviteRevenda() {
  const { revendedora, equipe, perfil } = useAuth();
  if (revendedora || equipe || perfil?.revenda === 'pendente') return null;
  return (
    <Pressable onPress={() => router.push('/conta')} style={s.revenda}>
      <Ionicons name="sparkles-outline" size={22} color={cores.douradoEscuro} />
      <View style={{ flex: 1 }}>
        <T v="corpoForte">Quer revender Juliana Prado?</T>
        <T v="legenda">Peça acesso aos preços especiais de revenda.</T>
      </View>
      <Ionicons name="chevron-forward" size={18} color={cores.textoSuave} />
    </Pressable>
  );
}

export default function Inicio() {
  const banners = useBanners();
  const categorias = useCategorias();
  const maisVendidos = useProdutos({ filtro: 'mais_vendidos', limite: 20 });
  const atualizando = banners.isRefetching || maisVendidos.isRefetching;

  return (
    <View style={{ flex: 1, backgroundColor: cores.creme }}>
      <Topo />
      <GradeProdutos
        produtos={maisVendidos.data ?? []}
        refrescando={atualizando}
        onRefresh={() => { banners.refetch(); categorias.refetch(); maisVendidos.refetch(); }}
        cabecalho={
          <View style={{ gap: espaco.xl, paddingTop: espaco.lg, paddingBottom: espaco.md }}>
            <Vitrine banners={banners.data ?? []} />
            <FaixaCategorias categorias={categorias.data ?? []} />
            <CarrosselProdutos titulo="Em oferta" filtro="ofertas" />
            <CarrosselProdutos titulo="Destaques" filtro="destaques" />
            <ConviteRevenda />
            <CarrosselProdutos titulo="Novidades" filtro="novidades" />
            {!!maisVendidos.data?.length && <TituloSecao titulo="Mais vendidas" verTodos={{ pathname: '/lista/[filtro]', params: { filtro: 'mais_vendidos' } }} />}
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  topo: { backgroundColor: cores.grafite, paddingHorizontal: espaco.lg, paddingBottom: espaco.lg, gap: espaco.md, borderBottomLeftRadius: 22, borderBottomRightRadius: 22 },
  topoLinha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontFamily: fontes.serifaMedia, color: cores.branco, fontSize: 22, letterSpacing: 3.5, lineHeight: 22 },
  registrado: { fontSize: 11, letterSpacing: 0 },
  sino: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: 'rgba(184,153,74,0.7)', alignItems: 'center', justifyContent: 'center' },
  sinoBadge: { position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: cores.dourado, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  sinoBadgeTexto: { color: cores.branco, fontFamily: fontes.textoForte, fontSize: 10 },
  busca: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: raio.pill, paddingHorizontal: espaco.lg, height: 44 },
  buscaTexto: { fontFamily: fontes.texto, color: '#CFC6CC', fontSize: 14 },
  revenda: { marginHorizontal: espaco.lg, flexDirection: 'row', alignItems: 'center', gap: espaco.md, backgroundColor: cores.douradoClaro, borderRadius: raio.lg, padding: espaco.lg },
});
