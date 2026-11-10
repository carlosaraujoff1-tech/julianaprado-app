import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FotoProduto } from '@/components/produto';
import { useToast } from '@/components/toast';
import { Botao, Carregando, T, Vazio, vibrar } from '@/components/ui';
import { cores, espaco, fontes, raio } from '@/constants/tema';
import { useAuth } from '@/lib/auth';
import { formatarReais } from '@/lib/formatacao';
import { useSacola, type ItemTela } from '@/lib/sacola';
import { mensagemErro, supabase } from '@/lib/supabase';
import { useConfiguracoes } from '@/lib/vitrine';
import { abrirWhatsapp, mensagemPedido } from '@/lib/whatsapp';
import type { Pedido, PedidoItem } from '@/types/database';

function Linha({ item }: { item: ItemTela }) {
  const { alterar } = useSacola();
  const toast = useToast();
  const mudar = (q: number) => {
    vibrar();
    alterar(item, q).catch((e) => toast({ texto: mensagemErro(e), tipo: 'erro' }));
  };
  return (
    <View style={[s.item, !item.disponivel && { opacity: 0.6 }]}>
      <Pressable onPress={() => router.push({ pathname: '/produto/[id]', params: { id: item.produto_id } })}>
        <FotoProduto uri={item.imagem} style={s.foto} tamMonograma={22} tamanho="miniatura" />
      </Pressable>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={s.nome} numberOfLines={2}>{item.nome}</Text>
        {!!item.variacao_nome && <T v="legenda">{item.variacao_nome}</T>}
        {!item.disponivel && <T v="legenda" style={{ color: cores.erro }}>Esgotou — remova para finalizar</T>}
        <View style={s.itemRodape}>
          <Text style={s.preco}>{formatarReais(item.subtotal)}</Text>
          <View style={s.qtd}>
            <Pressable hitSlop={6} style={s.qtdBotao} onPress={() => mudar(item.quantidade - 1)}
              accessibilityLabel={item.quantidade === 1 ? 'Remover' : 'Diminuir'}>
              <Ionicons name={item.quantidade === 1 ? 'trash-outline' : 'remove'} size={16} color={cores.texto} />
            </Pressable>
            <Text style={s.qtdTexto}>{item.quantidade}</Text>
            <Pressable hitSlop={6} style={s.qtdBotao} onPress={() => mudar(item.quantidade + 1)} accessibilityLabel="Aumentar">
              <Ionicons name="add" size={16} color={cores.texto} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function Sacola() {
  const ins = useSafeAreaInsets();
  const sacola = useSacola();
  const { logado, perfil, revendedora } = useAuth();
  const config = useConfiguracoes();
  const toast = useToast();
  const qc = useQueryClient();
  const [cupom, setCupom] = useState('');
  const [desconto, setDesconto] = useState<{ codigo: string; valor: number; texto: string } | null>(null);
  const [validando, setValidando] = useState(false);
  const [obs, setObs] = useState('');
  const [enviando, setEnviando] = useState(false);

  const aplicarCupom = async () => {
    if (!logado) return router.push('/entrar');
    if (!cupom.trim()) return;
    setValidando(true);
    const { data, error } = await supabase.rpc('validar_cupom', { p_codigo: cupom.trim() });
    setValidando(false);
    const r = data as { valido: boolean; mensagem: string; desconto?: number; codigo?: string } | null;
    if (error || !r?.valido) {
      setDesconto(null);
      toast({ texto: error ? mensagemErro(error) : r?.mensagem ?? 'Cupom inválido', tipo: 'erro' });
      return;
    }
    setDesconto({ codigo: r.codigo!, valor: Number(r.desconto ?? 0), texto: r.mensagem });
    vibrar();
  };

  const finalizar = async () => {
    if (!logado) {
      router.push('/entrar');
      return;
    }
    if (!perfil?.telefone || !perfil?.nome) {
      Alert.alert('Falta pouco!', 'Para finalizar, complete seu nome e telefone (é por ele que combinamos a entrega).', [
        { text: 'Agora não', style: 'cancel' },
        { text: 'Completar', onPress: () => router.push('/meus-dados') },
      ]);
      return;
    }
    setEnviando(true);
    try {
      const { data, error } = await supabase.rpc('criar_pedido', { p_cupom: desconto?.codigo, p_observacoes: obs || undefined });
      if (error) throw error;
      const r = data as { id: string; numero: number };
      const [p, i] = await Promise.all([
        supabase.from('pedidos').select('*').eq('id', r.id).single(),
        supabase.from('pedido_itens').select('*').eq('pedido_id', r.id),
      ]);
      await qc.invalidateQueries({ queryKey: ['sacola'] });
      qc.invalidateQueries({ queryKey: ['pedidos'] });
      qc.invalidateQueries({ queryKey: ['produtos'] });
      setDesconto(null); setCupom(''); setObs('');
      router.push({ pathname: '/pedido/[id]', params: { id: r.id, novo: '1' } });
      if (p.data && config.data?.whatsapp_pedidos) {
        await abrirWhatsapp(config.data.whatsapp_pedidos,
          mensagemPedido(config.data.mensagem_pedido, p.data as Pedido, (i.data ?? []) as PedidoItem[], perfil.nome));
      }
    } catch (e) {
      toast({ texto: mensagemErro(e), tipo: 'erro' });
    } finally {
      setEnviando(false);
    }
  };

  if (sacola.carregando) return <Carregando />;

  const total = Math.max(0, sacola.subtotal - (desconto?.valor ?? 0));
  return (
    <View style={{ flex: 1, paddingTop: ins.top + espaco.md }}>
      <View style={s.cab}>
        <T v="tituloGrande">Sacola</T>
        {sacola.quantidadeTotal > 0 && <T v="legenda">{sacola.quantidadeTotal} {sacola.quantidadeTotal === 1 ? 'peça' : 'peças'}</T>}
      </View>
      <FlatList
        data={sacola.itens}
        keyExtractor={(i) => i.chave}
        renderItem={({ item }) => <Linha item={item} />}
        contentContainerStyle={{ padding: espaco.lg, gap: espaco.md, paddingBottom: 40 }}
        refreshing={false}
        onRefresh={sacola.recarregar}
        ListEmptyComponent={
          <Vazio icone="bag-handle-outline" titulo="Sua sacola está vazia" texto="Que tal escolher uma peça linda para você?"
            acao={<Botao titulo="Ver novidades" onPress={() => router.navigate('/')} />} />
        }
        ListFooterComponent={sacola.itens.length ? (
          <View style={{ gap: espaco.lg, marginTop: espaco.sm }}>
            <View style={{ gap: 6 }}>
              <T v="rotulo">Cupom de desconto</T>
              <View style={{ flexDirection: 'row', gap: espaco.sm }}>
                <TextInput value={cupom} onChangeText={(t) => { setCupom(t.toUpperCase()); setDesconto(null); }}
                  placeholder="Digite o código" placeholderTextColor="#B3ABB1" autoCapitalize="characters"
                  style={[s.input, { flex: 1 }]} />
                <Botao titulo="Aplicar" tipo="escuro" onPress={aplicarCupom} carregando={validando} pequeno style={{ minHeight: 50 }} />
              </View>
              {desconto && <T v="legenda" style={{ color: cores.sucesso }}>✓ {desconto.codigo}: {desconto.texto}</T>}
            </View>
            <View style={{ gap: 6 }}>
              <T v="rotulo">Observações (opcional)</T>
              <TextInput value={obs} onChangeText={setObs} placeholder="Ex.: é para presente" placeholderTextColor="#B3ABB1"
                multiline style={[s.input, { minHeight: 70, paddingTop: 12, textAlignVertical: 'top' }]} />
            </View>
            <View style={s.resumo}>
              <View style={s.resumoLinha}><T>Subtotal</T><T>{formatarReais(sacola.subtotal)}</T></View>
              {desconto && <View style={s.resumoLinha}><T style={{ color: cores.sucesso }}>Desconto</T><T style={{ color: cores.sucesso }}>- {formatarReais(desconto.valor)}</T></View>}
              <View style={s.resumoLinha}><T v="legenda">Frete</T><T v="legenda">combinado no WhatsApp</T></View>
              <View style={[s.resumoLinha, { marginTop: 6 }]}>
                <Text style={s.totalRotulo}>Total</Text>
                <Text style={s.total}>{formatarReais(total)}</Text>
              </View>
              {revendedora && <T v="legenda">Preços de revenda aplicados.</T>}
            </View>
          </View>
        ) : undefined}
      />
      {sacola.itens.length > 0 && (
        <View style={s.barra}>
          <Botao
            titulo={logado ? 'Finalizar pelo WhatsApp' : 'Entrar para finalizar'}
            icone={logado ? 'logo-whatsapp' : 'person-outline'}
            onPress={finalizar}
            carregando={enviando}
            desabilitado={sacola.temIndisponivel}
          />
          <T v="legenda" style={{ textAlign: 'center' }}>
            Seu pedido fica registrado e abrimos o WhatsApp da loja para combinar pagamento e entrega.
          </T>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  cab: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: espaco.lg },
  item: { flexDirection: 'row', gap: espaco.md, backgroundColor: cores.branco, borderRadius: raio.lg, padding: espaco.md, borderWidth: 1, borderColor: cores.linha },
  foto: { width: 84, height: 84, borderRadius: raio.md },
  nome: { fontFamily: fontes.textoMedio, fontSize: 14, color: cores.texto },
  itemRodape: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' },
  preco: { fontFamily: fontes.textoForte, fontSize: 15, color: cores.texto },
  qtd: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: cores.linha, borderRadius: raio.sm },
  qtdBotao: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  qtdTexto: { minWidth: 22, textAlign: 'center', fontFamily: fontes.textoSemi, fontSize: 14, color: cores.texto },
  input: { minHeight: 50, borderWidth: 1, borderColor: cores.linha, borderRadius: raio.md, backgroundColor: cores.branco, paddingHorizontal: espaco.lg, fontFamily: fontes.texto, fontSize: 15, color: cores.texto },
  resumo: { backgroundColor: cores.branco, borderRadius: raio.lg, padding: espaco.lg, gap: 8, borderWidth: 1, borderColor: cores.linha },
  resumoLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalRotulo: { fontFamily: fontes.serifa, fontSize: 22, color: cores.texto },
  total: { fontFamily: fontes.textoForte, fontSize: 20, color: cores.texto },
  barra: { paddingHorizontal: espaco.lg, paddingVertical: espaco.md, gap: 6, backgroundColor: cores.branco, borderTopWidth: 1, borderTopColor: cores.linha },
});
