import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList, Pressable, Share, StyleSheet, Text, View,
  type LayoutChangeEvent, type ListRenderItem,
} from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FotoProduto } from '@/components/produto';
import { useToast } from '@/components/toast';
import { vibrar } from '@/components/ui';
import { cores, espaco, fontes, raio } from '@/constants/tema';
import { useAuth } from '@/lib/auth';
import { formatarReais, tempoRelativo } from '@/lib/formatacao';
import { alternarCurtida, alternarSalvo, MINIMO_CONTADOR } from '@/lib/posts';
import { useSacola } from '@/lib/sacola';
import { mensagemErro } from '@/lib/supabase';
import type { PostFeed } from '@/types/database';

// Feed em tela cheia (desliza para cima). Pontos de velocidade:
// - cada item tem altura fixa (a lista sabe onde está cada post sem medir);
// - só 3 posts ficam montados por vez (o atual, o anterior e o próximo);
// - a miniatura (~15 KB) aparece na hora e a foto grande entra por cima;
// - as fotos dos 2 próximos posts são baixadas antes de a pessoa chegar nelas.

function contador(n: number) {
  if (n < MINIMO_CONTADOR) return '';
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '').replace('.', ',')} mil` : String(n);
}

type ItemProps = { post: PostFeed; altura: number; largura: number; mostrarTopo: boolean };

function PostItemBase({ post, altura, largura, mostrarTopo }: ItemProps) {
  const ins = useSafeAreaInsets();
  const { logado } = useAuth();
  const sacola = useSacola();
  const toast = useToast();
  const qc = useQueryClient();
  const [curtido, setCurtido] = useState(post.curtido);
  const [curtidas, setCurtidas] = useState(post.curtidas);
  const [salvo, setSalvo] = useState(post.salvo);
  const [coracao, setCoracao] = useState(0);
  const [legendaAberta, setLegendaAberta] = useState(false);
  const ultimoToque = useRef(0);

  const pedirLogin = (acao: string) =>
    toast({ texto: `Entre na sua conta para ${acao}`, tipo: 'erro', acao: { titulo: 'Entrar', onPress: () => router.push('/entrar') } });

  const curtir = useCallback(async (forcar?: boolean) => {
    if (!logado) return pedirLogin('curtir');
    if (forcar && curtido) { setCoracao((n) => n + 1); return; }
    vibrar();
    const novo = !curtido;
    setCurtido(novo); setCurtidas((n) => Math.max(0, n + (novo ? 1 : -1)));
    if (novo) setCoracao((n) => n + 1);
    try {
      const r = await alternarCurtida(post.id);
      setCurtido(r.curtido); setCurtidas(r.curtidas);
    } catch (e) {
      setCurtido(!novo); setCurtidas((n) => Math.max(0, n + (novo ? -1 : 1)));
      toast({ texto: mensagemErro(e), tipo: 'erro' });
    }
  }, [logado, curtido, post.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const salvar = async () => {
    if (!logado) return pedirLogin('salvar');
    vibrar();
    const novo = !salvo; setSalvo(novo);
    try {
      setSalvo(await alternarSalvo(post.id));
      qc.invalidateQueries({ queryKey: ['salvos'] });
      if (novo) toast({ texto: 'Post salvo', tipo: 'ok', acao: { titulo: 'Ver salvos', onPress: () => router.push('/salvos') } });
    } catch (e) {
      setSalvo(!novo); toast({ texto: mensagemErro(e), tipo: 'erro' });
    }
  };

  const compartilhar = () => {
    const peca = post.produto_nome ? ` ${post.produto_nome}${post.preco_por ? ` por ${formatarReais(post.preco_por)}` : ''}.` : '';
    Share.share({ message: `${post.titulo ?? 'Juliana Prado'} ✨${peca} Veja no app da Juliana Prado.` }).catch(() => undefined);
  };

  const abrirProduto = () => post.produto_id && router.push({ pathname: '/produto/[id]', params: { id: post.produto_id } });

  const comprar = async () => {
    if (!post.produto_id) return;
    if (post.tem_variacoes || post.esgotado) return abrirProduto(); // escolher aro/opção na página da peça
    try {
      await sacola.adicionar(post.produto_id, null, 1);
      toast({ texto: 'Adicionado à sacola', tipo: 'ok', acao: { titulo: 'Ver sacola', onPress: () => router.navigate('/sacola') } });
    } catch (e) {
      toast({ texto: mensagemErro(e), tipo: 'erro' });
    }
  };

  // toque duplo na foto = curtir
  const tocarFoto = () => {
    const agora = Date.now();
    if (agora - ultimoToque.current < 280) { ultimoToque.current = 0; curtir(true); } else ultimoToque.current = agora;
  };

  return (
    <View style={{ width: largura, height: altura, backgroundColor: cores.grafiteEscuro }}>
      <Pressable onPress={tocarFoto} style={StyleSheet.absoluteFill} accessibilityLabel={post.titulo ?? 'Foto do post'}>
        <Image
          source={{ uri: post.imagem_url }}
          placeholder={{ uri: post.imagem_mini_url }}
          placeholderContentFit="cover"
          contentFit="cover"
          transition={120}
          cachePolicy="memory-disk"
          recyclingKey={post.id}
          style={StyleSheet.absoluteFill}
        />
      </Pressable>

      <LinearGradient pointerEvents="none" colors={['rgba(20,17,19,0.55)', 'rgba(20,17,19,0)']} style={[s.gradTopo, { height: ins.top + 120 }]} />
      <LinearGradient pointerEvents="none" colors={['rgba(20,17,19,0)', 'rgba(20,17,19,0.78)']} style={s.gradBase} />

      {mostrarTopo && (
        <View style={[s.topo, { paddingTop: ins.top + 8 }]} pointerEvents="box-none">
          <Text style={s.logo}>JULIANA{'\n'}PRADO<Text style={s.reg}>®</Text></Text>
          <Text style={s.aba}>Descubra</Text>
        </View>
      )}
      <View style={[s.perfil, { top: ins.top + (mostrarTopo ? 70 : 12) }]} pointerEvents="none">
        <View style={s.avatar}><Text style={s.avatarTexto}>JP</Text></View>
        <View>
          <Text style={s.perfilNome}>julianaprado</Text>
          <Text style={s.perfilTempo}>{tempoRelativo(post.publicado_em)}</Text>
        </View>
      </View>

      {coracao > 0 && (
        <Animated.View key={coracao} entering={ZoomIn.springify().damping(12)} exiting={FadeOut.duration(250)} style={s.coracaoGrande} pointerEvents="none">
          <Ionicons name="heart" size={110} color="rgba(255,255,255,0.92)" />
        </Animated.View>
      )}

      <View style={s.base} pointerEvents="box-none">
        <View style={s.linha} pointerEvents="box-none">
          <View style={{ flex: 1, gap: espaco.md }} pointerEvents="box-none">
            {!!post.titulo && <Text style={s.titulo}>{post.titulo}</Text>}
          </View>
          <View style={s.acoes}>
            <Pressable onPress={() => curtir()} hitSlop={8} style={s.acao} accessibilityLabel={curtido ? 'Descurtir' : 'Curtir'}>
              <Ionicons name={curtido ? 'heart' : 'heart-outline'} size={31} color={curtido ? '#FF6B7A' : cores.branco} />
              {!!contador(curtidas) && <Text style={s.acaoTexto}>{contador(curtidas)}</Text>}
            </Pressable>
            <Pressable onPress={salvar} hitSlop={8} style={s.acao} accessibilityLabel={salvo ? 'Remover dos salvos' : 'Salvar'}>
              <Ionicons name={salvo ? 'bookmark' : 'bookmark-outline'} size={28} color={salvo ? cores.dourado : cores.branco} />
              <Text style={s.acaoTexto}>{salvo ? 'Salvo' : 'Salvar'}</Text>
            </Pressable>
            <Pressable onPress={compartilhar} hitSlop={8} style={s.acao} accessibilityLabel="Compartilhar">
              <Ionicons name="arrow-redo-outline" size={28} color={cores.branco} />
              <Text style={s.acaoTexto}>Enviar</Text>
            </Pressable>
          </View>
        </View>

        {!!post.produto_id && (
          <Pressable onPress={abrirProduto} style={s.cartao} accessibilityLabel={`Ver ${post.produto_nome}`}>
            <FotoProduto uri={post.produto_imagem} style={s.cartaoFoto} tamMonograma={16} tamanho="miniatura" />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.cartaoNome} numberOfLines={2}>{post.produto_nome}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                {!!post.preco_de && <Text style={s.cartaoDe}>{formatarReais(post.preco_de)}</Text>}
                {post.preco_por != null && <Text style={s.cartaoPor}>{formatarReais(post.preco_por)}</Text>}
              </View>
            </View>
            {post.esgotado ? (
              <Text style={s.esgotado}>Esgotado</Text>
            ) : (
              <Pressable onPress={comprar} style={({ pressed }) => [s.comprar, pressed && { opacity: 0.85 }]} accessibilityLabel="Comprar">
                <Ionicons name="bag-handle-outline" size={18} color={cores.branco} />
                <Text style={s.comprarTexto}>Comprar</Text>
              </Pressable>
            )}
          </Pressable>
        )}

        {(!!post.legenda || post.hashtags.length > 0) && (
          <Pressable onPress={() => setLegendaAberta((v) => !v)} accessibilityLabel="Legenda">
            <Text style={s.legenda} numberOfLines={legendaAberta ? undefined : 2}>
              {post.legenda}
              {post.hashtags.length > 0 && <Text style={s.hashtags}>{post.legenda ? '  ' : ''}{post.hashtags.map((h) => `#${h.replace(/^#/, '')}`).join('  ')}</Text>}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
export const PostItem = memo(PostItemBase);

type FeedProps = {
  posts: PostFeed[];
  carregarMais?: () => void;
  inicio?: number;
  mostrarTopo?: boolean;
  atualizando?: boolean;
  atualizar?: () => void;
  vazio?: React.ReactElement;
};

export function FeedLista({ posts, carregarMais, inicio = 0, mostrarTopo = true, atualizando, atualizar, vazio }: FeedProps) {
  const [tam, setTam] = useState<{ l: number; a: number } | null>(null);
  const aoMedir = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!tam || Math.abs(tam.a - height) > 1 || Math.abs(tam.l - width) > 1) setTam({ l: width, a: height });
  };

  // Baixa antes as fotos dos 2 próximos posts.
  const lista = useRef(posts);
  useEffect(() => { lista.current = posts; }, [posts]);
  // a FlatList exige que esta função nunca mude de identidade
  const [aoVer] = useState(() => ({ viewableItems }: { viewableItems: { index?: number | null }[] }) => {
    const i = viewableItems[0]?.index ?? 0;
    const proximos = lista.current.slice(i + 1, i + 3);
    if (proximos.length) Image.prefetch(proximos.map((p) => p.imagem_url), 'memory-disk');
  });

  const render: ListRenderItem<PostFeed> = ({ item }) =>
    tam ? <PostItem post={item} altura={tam.a} largura={tam.l} mostrarTopo={mostrarTopo} /> : null;

  return (
    <View style={{ flex: 1, backgroundColor: cores.grafiteEscuro }} onLayout={aoMedir}>
      {tam && (posts.length === 0 ? vazio ?? null : (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          renderItem={render}
          pagingEnabled
          decelerationRate="fast"
          disableIntervalMomentum
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => ({ length: tam.a, offset: tam.a * index, index })}
          initialScrollIndex={Math.min(inicio, Math.max(posts.length - 1, 0))}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
          removeClippedSubviews
          onEndReached={carregarMais}
          onEndReachedThreshold={2}
          onViewableItemsChanged={aoVer}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          refreshing={atualizando}
          onRefresh={atualizar}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  gradTopo: { position: 'absolute', top: 0, left: 0, right: 0 },
  gradBase: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '58%' },
  topo: { position: 'absolute', top: 0, left: espaco.lg, right: espaco.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: { fontFamily: fontes.serifaMedia, color: cores.branco, fontSize: 19, letterSpacing: 3.5, lineHeight: 19 },
  reg: { fontSize: 9, letterSpacing: 0 },
  aba: { fontFamily: fontes.textoSemi, color: cores.branco, fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', borderWidth: 1, borderColor: 'rgba(184,153,74,0.8)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: raio.pill, overflow: 'hidden' },
  perfil: { position: 'absolute', left: espaco.lg, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: cores.grafite, borderWidth: 1.5, borderColor: cores.dourado, alignItems: 'center', justifyContent: 'center' },
  avatarTexto: { fontFamily: fontes.serifa, color: cores.branco, fontSize: 16 },
  perfilNome: { fontFamily: fontes.textoSemi, color: cores.branco, fontSize: 15, textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 6 },
  perfilTempo: { fontFamily: fontes.texto, color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  coracaoGrande: { position: 'absolute', top: '38%', alignSelf: 'center' },
  base: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: espaco.lg, paddingBottom: espaco.lg, gap: espaco.md },
  linha: { flexDirection: 'row', alignItems: 'flex-end', gap: espaco.md },
  titulo: { fontFamily: fontes.serifaMedia, color: cores.branco, fontSize: 34, lineHeight: 36, textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 10 },
  acoes: { alignItems: 'center', gap: 18, paddingBottom: 4 },
  acao: { alignItems: 'center', gap: 2, minWidth: 48 },
  acaoTexto: { fontFamily: fontes.textoSemi, color: cores.branco, fontSize: 12, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 },
  cartao: { flexDirection: 'row', alignItems: 'center', gap: espaco.md, backgroundColor: 'rgba(250,247,242,0.95)', borderRadius: raio.lg, padding: 10 },
  cartaoFoto: { width: 58, height: 58, borderRadius: raio.md },
  cartaoNome: { fontFamily: fontes.serifa, fontSize: 18, lineHeight: 20, color: cores.texto },
  cartaoDe: { fontFamily: fontes.texto, fontSize: 12, color: cores.textoSuave, textDecorationLine: 'line-through' },
  cartaoPor: { fontFamily: fontes.textoForte, fontSize: 16, color: cores.douradoEscuro },
  comprar: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: cores.dourado, borderRadius: raio.pill, paddingHorizontal: 14, paddingVertical: 10 },
  comprarTexto: { fontFamily: fontes.textoSemi, color: cores.branco, fontSize: 14 },
  esgotado: { fontFamily: fontes.textoSemi, color: cores.textoSuave, fontSize: 13, paddingHorizontal: 8 },
  legenda: { fontFamily: fontes.texto, color: cores.branco, fontSize: 14, lineHeight: 20, textShadowColor: 'rgba(0,0,0,0.45)', textShadowRadius: 6 },
  hashtags: { fontFamily: fontes.textoMedio, color: '#E8D9AE' },
});
