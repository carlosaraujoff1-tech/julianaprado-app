import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useToast } from '@/components/toast';
import { vibrar } from '@/components/ui';
import { cores, espaco, fontes, raio } from '@/constants/tema';
import { useAuth } from '@/lib/auth';
import { useAlternarFavorito, useIdsFavoritos } from '@/lib/favoritos';
import { formatarReais } from '@/lib/formatacao';
import { urlImagem, type TamanhoImagem } from '@/lib/imagem';
import { useSacola } from '@/lib/sacola';
import { mensagemErro } from '@/lib/supabase';
import { semearProduto } from '@/lib/vitrine';
import type { ProdutoVitrine } from '@/types/database';

// Foto do produto. Sem foto: fundo creme com o monograma "JP".
export function FotoProduto({ uri: original, style, tamMonograma = 34, tamanho = 'card' }: { uri?: string | null; style?: StyleProp<ViewStyle>; tamMonograma?: number; tamanho?: TamanhoImagem }) {
  const uri = urlImagem(original, tamanho);
  return (
    <View style={[f.caixa, style]}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} cachePolicy="memory-disk" recyclingKey={uri} />
      ) : (
        <Text style={[f.mono, { fontSize: tamMonograma }]}>JP</Text>
      )}
    </View>
  );
}
const f = StyleSheet.create({
  caixa: { backgroundColor: cores.cremeFoto, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  mono: { fontFamily: fontes.serifaMedia, color: '#D9CDB4', letterSpacing: 2 },
});

export function Preco({ de, por, grande }: { de?: number | null; por: number; grande?: boolean }) {
  return (
    <View style={{ gap: 1 }}>
      <Text style={[p.de, grande && { fontSize: 14 }, !de && { opacity: 0 }]} numberOfLines={1}>
        {de ? formatarReais(de) : ' '}
      </Text>
      <Text style={[p.por, grande && p.porGrande]} numberOfLines={1}>{formatarReais(por)}</Text>
    </View>
  );
}
const p = StyleSheet.create({
  de: { fontFamily: fontes.texto, fontSize: 12, color: cores.textoSuave, textDecorationLine: 'line-through' },
  por: { fontFamily: fontes.textoForte, fontSize: 16, color: cores.texto },
  porGrande: { fontSize: 26 },
});

export function useAbrirProduto() {
  const qc = useQueryClient();
  return (prod: ProdutoVitrine) => {
    semearProduto(qc, prod);
    router.push({ pathname: '/produto/[id]', params: { id: prod.id } });
  };
}

function CardProdutoBase({ produto, largura }: { produto: ProdutoVitrine; largura: number }) {
  const abrir = useAbrirProduto();
  const sacola = useSacola();
  const toast = useToast();
  const { logado } = useAuth();
  const favs = useIdsFavoritos();
  const alternar = useAlternarFavorito();
  const favorito = !!favs.data?.has(produto.id);

  const comprar = async () => {
    if (produto.tem_variacoes) return abrir(produto); // precisa escolher tamanho/cor
    try {
      await sacola.adicionar(produto.id, null, 1);
      toast({ texto: 'Adicionado à sacola', tipo: 'ok', acao: { titulo: 'Ver sacola', onPress: () => router.navigate('/sacola') } });
    } catch (e) {
      toast({ texto: mensagemErro(e), tipo: 'erro' });
    }
  };

  const favoritar = () => {
    vibrar();
    if (!logado) {
      toast({ texto: 'Entre na sua conta para salvar favoritos', tipo: 'erro', acao: { titulo: 'Entrar', onPress: () => router.push('/entrar') } });
      return;
    }
    alternar.mutate({ produtoId: produto.id, favoritar: !favorito });
  };

  return (
    <Pressable onPress={() => abrir(produto)} style={[s.card, { width: largura }]} accessibilityLabel={produto.nome}>
      <View>
        <FotoProduto uri={produto.imagem} style={{ width: largura, height: largura, borderTopLeftRadius: raio.lg, borderTopRightRadius: raio.lg }} />
        {!!produto.desconto_pct && produto.desconto_pct > 0 && (
          <View style={s.selo}><Text style={s.seloTexto}>-{produto.desconto_pct}%</Text></View>
        )}
        {produto.novidade && !produto.desconto_pct && (
          <View style={[s.selo, { backgroundColor: cores.grafite }]}><Text style={s.seloTexto}>NOVO</Text></View>
        )}
        <Pressable onPress={favoritar} hitSlop={8} style={s.coracao} accessibilityLabel="Favoritar">
          <Ionicons name={favorito ? 'heart' : 'heart-outline'} size={18} color={favorito ? cores.douradoEscuro : cores.grafite} />
        </Pressable>
        {produto.esgotado && (
          <View style={s.esgotado}><Text style={s.esgotadoTexto}>ESGOTADO</Text></View>
        )}
      </View>
      <View style={s.info}>
        <Text style={s.nome} numberOfLines={2}>{`${produto.nome}\n`}</Text>
        <View style={s.linhaPreco}>
          <Preco de={produto.preco_de} por={produto.preco_por} />
          {!produto.esgotado && (
            <Pressable onPress={comprar} hitSlop={6} style={({ pressed }) => [s.mais, pressed && { opacity: 0.8 }]}
              accessibilityLabel="Adicionar à sacola">
              <Ionicons name={produto.tem_variacoes ? 'options-outline' : 'bag-add-outline'} size={19} color={cores.branco} />
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}
export const CardProduto = memo(CardProdutoBase);

const s = StyleSheet.create({
  card: { backgroundColor: cores.branco, borderRadius: raio.lg, borderWidth: 1, borderColor: cores.linha },
  selo: { position: 'absolute', top: 10, left: 10, backgroundColor: cores.dourado, borderRadius: raio.pill, paddingHorizontal: 8, paddingVertical: 3 },
  seloTexto: { color: cores.branco, fontFamily: fontes.textoForte, fontSize: 11, letterSpacing: 0.5 },
  coracao: { position: 'absolute', top: 8, right: 8, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
  esgotado: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(250,247,242,0.65)', alignItems: 'center', justifyContent: 'center' },
  esgotadoTexto: { fontFamily: fontes.textoForte, fontSize: 12, letterSpacing: 2, color: cores.grafite },
  info: { padding: espaco.md, gap: espaco.sm },
  nome: { fontFamily: fontes.textoMedio, fontSize: 13, lineHeight: 18, color: cores.texto, minHeight: 36 },
  linhaPreco: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  mais: { width: 38, height: 38, borderRadius: raio.sm, backgroundColor: cores.dourado, alignItems: 'center', justifyContent: 'center' },
});
