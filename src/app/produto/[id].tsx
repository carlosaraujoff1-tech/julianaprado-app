import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardProduto, FotoProduto, Preco } from '@/components/produto';
import { useToast } from '@/components/toast';
import { Botao, Carregando, T, Vazio, vibrar } from '@/components/ui';
import { cores, espaco, fontes, raio } from '@/constants/tema';
import { useAuth } from '@/lib/auth';
import { useAlternarFavorito } from '@/lib/favoritos';
import { formatarReais } from '@/lib/formatacao';
import { useSacola } from '@/lib/sacola';
import { mensagemErro } from '@/lib/supabase';
import { useConfiguracoes, useProduto, useProdutos } from '@/lib/vitrine';
import { abrirWhatsapp } from '@/lib/whatsapp';

export default function Produto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ins = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const q = useProduto(id);
  const { logado, revendedora } = useAuth();
  const sacola = useSacola();
  const toast = useToast();
  const alternar = useAlternarFavorito();
  const config = useConfiguracoes();
  const [foto, setFoto] = useState(0);
  const [variacao, setVariacao] = useState<{ id: string; nome: string } | null>(null);
  const [qtd, setQtd] = useState(1);
  const [adicionando, setAdicionando] = useState(false);
  const p = q.data;
  const parecidos = useProdutos({ categoria: p?.categoria_id ?? undefined, limite: 12 }, !!p?.categoria_id);

  if (q.isLoading) return <Carregando />;
  if (!p) {
    return (
      <View style={{ flex: 1, paddingTop: ins.top + 40 }}>
        <Vazio icone="diamond-outline" titulo="Peça indisponível" texto="Este produto não está mais à venda."
          acao={<Botao titulo="Voltar" onPress={() => router.back()} />} />
      </View>
    );
  }

  const precisaVariacao = p.variacoes.length > 0;
  const fotos = p.imagens.length ? p.imagens : [null];

  const adicionar = async (irParaSacola: boolean) => {
    if (precisaVariacao && !variacao) {
      toast({ texto: 'Escolha uma opção antes de adicionar', tipo: 'erro' });
      return;
    }
    setAdicionando(true);
    try {
      await sacola.adicionar(p.id, variacao, qtd);
      if (irParaSacola) router.navigate('/sacola');
      else toast({ texto: 'Adicionado à sacola', tipo: 'ok', acao: { titulo: 'Ver sacola', onPress: () => router.navigate('/sacola') } });
    } catch (e) {
      toast({ texto: mensagemErro(e), tipo: 'erro' });
    } finally {
      setAdicionando(false);
    }
  };

  const favoritar = () => {
    vibrar();
    if (!logado) return router.push('/entrar');
    alternar.mutate({ produtoId: p.id, favoritar: !p.favorito });
  };

  const duvida = () => abrirWhatsapp(config.data?.whatsapp_pedidos ?? '',
    `Olá! Tenho uma dúvida sobre a peça ${p.nome}${p.sku ? ` (cód. ${p.sku})` : ''}.`);

  return (
    <View style={{ flex: 1, backgroundColor: cores.creme }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        <View>
          <FlatList
            horizontal
            pagingEnabled
            data={fotos}
            keyExtractor={(u, i) => `${u}-${i}`}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setFoto(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item }) => <FotoProduto uri={item} style={{ width, height: width }} tamMonograma={72} tamanho="grande" />}
          />
          {fotos.length > 1 && (
            <View style={s.pontos}>{fotos.map((_, i) => <View key={i} style={[s.ponto, i === foto && s.pontoAtivo]} />)}</View>
          )}
          <View style={[s.botoesTopo, { top: ins.top + 8 }]}>
            <Pressable style={s.botaoRedondo} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} accessibilityLabel="Voltar">
              <Ionicons name="chevron-back" size={24} color={cores.texto} />
            </Pressable>
            <View style={{ flexDirection: 'row', gap: espaco.sm }}>
              <Pressable style={s.botaoRedondo} accessibilityLabel="Compartilhar"
                onPress={() => Share.share({ message: `${p.nome} — ${formatarReais(p.preco_por)} na Juliana Prado ✨` })}>
                <Ionicons name="share-social-outline" size={20} color={cores.texto} />
              </Pressable>
              <Pressable style={s.botaoRedondo} onPress={favoritar} accessibilityLabel="Favoritar">
                <Ionicons name={p.favorito ? 'heart' : 'heart-outline'} size={21} color={p.favorito ? cores.douradoEscuro : cores.texto} />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={s.corpo}>
          {!!p.categoria_nome && <T v="rotulo" style={{ color: cores.douradoEscuro }}>{p.categoria_nome}</T>}
          <T v="tituloGrande">{p.nome}</T>
          <View style={s.linhaPreco}>
            <Preco de={p.preco_de} por={p.preco_por} grande />
            {!!p.desconto_pct && p.desconto_pct > 0 && (
              <View style={s.desconto}><Text style={s.descontoTexto}>{revendedora ? 'REVENDA' : `-${p.desconto_pct}%`}</Text></View>
            )}
          </View>
          {revendedora && <T v="legenda">Preço de revenda. O valor riscado é o preço de varejo.</T>}

          {precisaVariacao && (
            <View style={{ gap: espaco.sm, marginTop: espaco.sm }}>
              <T v="rotulo">Escolha {p.variacoes[0]?.nome.toLowerCase().startsWith('aro') ? 'o aro' : 'uma opção'}</T>
              <View style={s.chips}>
                {p.variacoes.map((v) => {
                  const ativo = variacao?.id === v.id;
                  return (
                    <Pressable key={v.id} disabled={!v.disponivel} onPress={() => { vibrar(); setVariacao(v); }}
                      style={[s.chip, ativo && s.chipAtivo, !v.disponivel && s.chipOff]}>
                      <Text style={[s.chipTexto, ativo && { color: cores.branco }, !v.disponivel && { textDecorationLine: 'line-through' }]}>
                        {v.nome.replace(/^Aro /i, '')}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {p.variacoes[0]?.nome.toLowerCase().startsWith('aro') && (
                <T v="legenda">Não sabe seu aro? Chame a gente no WhatsApp que ajudamos.</T>
              )}
            </View>
          )}

          {!p.esgotado && (
            <View style={s.qtdLinha}>
              <T v="rotulo">Quantidade</T>
              <View style={s.qtd}>
                <Pressable onPress={() => setQtd((n) => Math.max(1, n - 1))} hitSlop={8} style={s.qtdBotao} accessibilityLabel="Diminuir">
                  <Ionicons name="remove" size={18} color={cores.texto} />
                </Pressable>
                <Text style={s.qtdTexto}>{qtd}</Text>
                <Pressable onPress={() => setQtd((n) => Math.min(99, n + 1))} hitSlop={8} style={s.qtdBotao} accessibilityLabel="Aumentar">
                  <Ionicons name="add" size={18} color={cores.texto} />
                </Pressable>
              </View>
            </View>
          )}

          {!!p.descricao && (
            <View style={{ gap: espaco.sm, marginTop: espaco.md }}>
              <T v="rotulo">Detalhes</T>
              <T style={{ fontSize: 15, lineHeight: 23 }}>{p.descricao}</T>
            </View>
          )}
          {!!p.sku && <T v="legenda">Código: {p.sku}</T>}

          <Pressable onPress={duvida} style={s.duvida}>
            <Ionicons name="logo-whatsapp" size={20} color={cores.whatsapp} />
            <T v="corpoForte" style={{ flex: 1 }}>Dúvidas sobre a peça? Fale com a gente</T>
            <Ionicons name="chevron-forward" size={18} color={cores.textoSuave} />
          </Pressable>
        </View>

        {(parecidos.data?.filter((x) => x.id !== p.id).length ?? 0) > 0 && (
          <View style={{ gap: espaco.md }}>
            <T v="titulo" style={{ paddingHorizontal: espaco.lg }}>Você também pode gostar</T>
            <FlatList
              horizontal
              data={parecidos.data!.filter((x) => x.id !== p.id)}
              keyExtractor={(x) => x.id}
              renderItem={({ item }) => <CardProduto produto={item} largura={150} />}
              contentContainerStyle={{ paddingHorizontal: espaco.lg, gap: espaco.md }}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}
      </ScrollView>

      <View style={[s.barra, { paddingBottom: ins.bottom + espaco.md }]}>
        {p.esgotado ? (
          <Botao titulo="Avisar quando chegar (WhatsApp)" tipo="escuro" icone="logo-whatsapp" style={{ flex: 1 }}
            onPress={() => abrirWhatsapp(config.data?.whatsapp_pedidos ?? '', `Olá! Quero ser avisada quando a peça ${p.nome} voltar.`)} />
        ) : (
          <>
            <Botao titulo="Sacola" tipo="contorno" icone="bag-add-outline" onPress={() => adicionar(false)} carregando={adicionando} style={{ flex: 1 }} />
            <Botao titulo="Comprar" onPress={() => adicionar(true)} desabilitado={adicionando} style={{ flex: 1.4 }} />
          </>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  botoesTopo: { position: 'absolute', left: espaco.lg, right: espaco.lg, flexDirection: 'row', justifyContent: 'space-between' },
  botaoRedondo: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
  pontos: { position: 'absolute', bottom: 14, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  ponto: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(58,53,57,0.25)' },
  pontoAtivo: { width: 18, backgroundColor: cores.dourado },
  corpo: { padding: espaco.lg, gap: espaco.sm, paddingBottom: espaco.xl },
  linhaPreco: { flexDirection: 'row', alignItems: 'center', gap: espaco.md, marginTop: espaco.xs },
  desconto: { backgroundColor: cores.dourado, borderRadius: raio.pill, paddingHorizontal: 10, paddingVertical: 4 },
  descontoTexto: { color: cores.branco, fontFamily: fontes.textoForte, fontSize: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
  chip: { minWidth: 48, height: 44, paddingHorizontal: 12, borderRadius: raio.md, borderWidth: 1.2, borderColor: cores.linha, backgroundColor: cores.branco, alignItems: 'center', justifyContent: 'center' },
  chipAtivo: { backgroundColor: cores.grafite, borderColor: cores.grafite },
  chipOff: { opacity: 0.4 },
  chipTexto: { fontFamily: fontes.textoSemi, fontSize: 14, color: cores.texto },
  qtdLinha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: espaco.md },
  qtd: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: cores.linha, borderRadius: raio.md, backgroundColor: cores.branco },
  qtdBotao: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  qtdTexto: { minWidth: 28, textAlign: 'center', fontFamily: fontes.textoSemi, fontSize: 16, color: cores.texto },
  duvida: { flexDirection: 'row', alignItems: 'center', gap: espaco.md, marginTop: espaco.lg, padding: espaco.lg, backgroundColor: cores.branco, borderRadius: raio.lg, borderWidth: 1, borderColor: cores.linha },
  barra: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: espaco.md, paddingHorizontal: espaco.lg, paddingTop: espaco.md, backgroundColor: cores.branco, borderTopWidth: 1, borderTopColor: cores.linha },
});
