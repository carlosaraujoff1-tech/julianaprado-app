import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CardProduto } from '@/components/produto';
import { T } from '@/components/ui';
import { cores, espaco, fontes, raio } from '@/constants/tema';
import { urlImagem } from '@/lib/imagem';
import { useProdutos, type FiltroLista } from '@/lib/vitrine';
import type { Banner } from '@/types/database';

export function TituloSecao({ titulo, verTodos }: { titulo: string; verTodos?: Href }) {
  return (
    <View style={s.tituloLinha}>
      <T v="titulo">{titulo}</T>
      {verTodos && (
        <Pressable hitSlop={10} onPress={() => router.push(verTodos)} style={s.verTodos}>
          <Text style={s.verTodosTexto}>Ver todas</Text>
          <Ionicons name="arrow-forward" size={14} color={cores.douradoEscuro} />
        </Pressable>
      )}
    </View>
  );
}

export function CarrosselProdutos({ titulo, filtro }: { titulo: string; filtro: FiltroLista }) {
  const q = useProdutos({ filtro, limite: 12 });
  if (!q.data?.length) return null;
  return (
    <View style={{ gap: espaco.md }}>
      <TituloSecao titulo={titulo} verTodos={{ pathname: '/lista/[filtro]', params: { filtro } }} />
      <FlatList
        horizontal
        data={q.data}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <CardProduto produto={item} largura={156} />}
        contentContainerStyle={{ paddingHorizontal: espaco.lg, gap: espaco.md }}
        showsHorizontalScrollIndicator={false}
        initialNumToRender={3}
      />
    </View>
  );
}

function abrirLink(link: string | null) {
  if (!link) return;
  if (link.startsWith('/')) router.push(link as Href);
  else Linking.openURL(link).catch(() => undefined);
}

export function Vitrine({ banners }: { banners: Banner[] }) {
  const { width } = useWindowDimensions();
  const [atual, setAtual] = useState(0);
  const largura = width - espaco.lg * 2;

  if (!banners.length) {
    // Sem banner cadastrado: vitrine da marca (nunca fica um buraco vazio).
    return (
      <View style={{ paddingHorizontal: espaco.lg }}>
        <LinearGradient colors={[cores.grafite, '#5B4F54']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
          <Text style={s.heroRotulo}>NOVA COLEÇÃO</Text>
          <Text style={s.heroTitulo}>Brilho para todos{'\n'}os seus momentos</Text>
          <View style={s.heroLinha} />
          <Pressable onPress={() => router.push({ pathname: '/lista/[filtro]', params: { filtro: 'novidades' } })} style={s.heroBotao}>
            <Text style={s.heroBotaoTexto}>Ver novidades</Text>
            <Ionicons name="arrow-forward" size={16} color={cores.grafite} />
          </Pressable>
        </LinearGradient>
      </View>
    );
  }
  return (
    <View style={{ gap: espaco.sm }}>
      <FlatList
        horizontal
        pagingEnabled
        snapToInterval={largura + espaco.md}
        decelerationRate="fast"
        data={banners}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ paddingHorizontal: espaco.lg, gap: espaco.md }}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setAtual(Math.round(e.nativeEvent.contentOffset.x / (largura + espaco.md)))}
        renderItem={({ item }) => (
          <Pressable onPress={() => abrirLink(item.link)}>
            <Image source={{ uri: item.imagem_url }} style={{ width: largura, height: largura / 2, borderRadius: raio.lg }}
              contentFit="cover" transition={200} cachePolicy="memory-disk" />
          </Pressable>
        )}
      />
      {banners.length > 1 && (
        <View style={s.pontos}>
          {banners.map((b, i) => <View key={b.id} style={[s.ponto, i === atual && s.pontoAtivo]} />)}
        </View>
      )}
    </View>
  );
}

export function FaixaCategorias({ categorias }: { categorias: { id: string; nome: string; imagem_url: string | null }[] }) {
  if (!categorias.length) return null;
  return (
    <View style={{ gap: espaco.md }}>
      <TituloSecao titulo="Categorias" verTodos="/categorias" />
      <FlatList
        horizontal
        data={categorias}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingHorizontal: espaco.lg, gap: espaco.lg }}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable style={s.cat} onPress={() => router.push({ pathname: '/categoria/[id]', params: { id: item.id, nome: item.nome } })}>
            <View style={s.catAro}>
              {item.imagem_url ? (
                <Image source={{ uri: urlImagem(item.imagem_url, 'miniatura') ?? undefined }} style={s.catImg} contentFit="cover" cachePolicy="memory-disk" />
              ) : (
                <View style={[s.catImg, s.catSemFoto]}><Text style={s.catLetra}>{item.nome.charAt(0)}</Text></View>
              )}
            </View>
            <Text style={s.catNome} numberOfLines={1}>{item.nome}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  tituloLinha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: espaco.lg },
  verTodos: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verTodosTexto: { fontFamily: fontes.textoSemi, fontSize: 13, color: cores.douradoEscuro },
  hero: { borderRadius: raio.lg, padding: espaco.xl, gap: espaco.md, minHeight: 190, justifyContent: 'center' },
  heroRotulo: { fontFamily: fontes.textoSemi, fontSize: 11, letterSpacing: 2.5, color: cores.dourado },
  heroTitulo: { fontFamily: fontes.serifa, fontSize: 30, lineHeight: 33, color: cores.branco },
  heroLinha: { width: 44, height: 1.5, backgroundColor: cores.dourado },
  heroBotao: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: cores.dourado, paddingHorizontal: 18, paddingVertical: 11, borderRadius: raio.pill },
  heroBotaoTexto: { fontFamily: fontes.textoSemi, fontSize: 14, color: cores.grafite },
  pontos: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  ponto: { width: 6, height: 6, borderRadius: 3, backgroundColor: cores.linha },
  pontoAtivo: { width: 18, backgroundColor: cores.dourado },
  cat: { alignItems: 'center', gap: 6, width: 76 },
  catAro: { padding: 3, borderRadius: 40, borderWidth: 1.5, borderColor: cores.dourado },
  catImg: { width: 66, height: 66, borderRadius: 33 },
  catSemFoto: { backgroundColor: cores.douradoClaro, alignItems: 'center', justifyContent: 'center' },
  catLetra: { fontFamily: fontes.serifa, fontSize: 30, color: cores.douradoEscuro },
  catNome: { fontFamily: fontes.textoMedio, fontSize: 12, color: cores.texto },
});
