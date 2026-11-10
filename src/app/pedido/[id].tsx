import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SeloStatus } from '@/components/pedido';
import { FotoProduto } from '@/components/produto';
import { useToast } from '@/components/toast';
import { Botao, Cabecalho, Carregando, Cartao, T, Vazio } from '@/components/ui';
import { cores, espaco, fontes, raio } from '@/constants/tema';
import { useAuth } from '@/lib/auth';
import { dataHora, formatarReais, mascaraCpf, mascaraTelefone, ordemStatus, rotuloStatus } from '@/lib/formatacao';
import { usePedido, type ClienteSnapshot } from '@/lib/pedidos';
import { mensagemErro, supabase } from '@/lib/supabase';
import { useConfiguracoes } from '@/lib/vitrine';
import { abrirWhatsapp, mensagemPedido } from '@/lib/whatsapp';
import type { StatusPedido } from '@/types/database';

export default function DetalhePedido() {
  const { id, novo } = useLocalSearchParams<{ id: string; novo?: string }>();
  const q = usePedido(id);
  const { equipe, perfil } = useAuth();
  const config = useConfiguracoes();
  const toast = useToast();
  const qc = useQueryClient();
  const [mudando, setMudando] = useState<StatusPedido | null>(null);

  if (q.isLoading) return <View style={{ flex: 1 }}><Cabecalho titulo="Pedido" /><Carregando /></View>;
  if (!q.data) return <View style={{ flex: 1 }}><Cabecalho titulo="Pedido" /><Vazio icone="receipt-outline" titulo="Pedido não encontrado" /></View>;
  const { pedido, itens } = q.data;
  const cli = pedido.cliente_snapshot as ClienteSnapshot;
  const passo = ordemStatus.indexOf(pedido.status as (typeof ordemStatus)[number]);

  const mudarStatus = (st: StatusPedido) => {
    Alert.alert('Mudar status', `Marcar o pedido Nº ${pedido.numero} como "${rotuloStatus[st]}"? A cliente recebe um aviso no celular.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          setMudando(st);
          const { error } = await supabase.from('pedidos').update({ status: st }).eq('id', pedido.id);
          setMudando(null);
          if (error) return toast({ texto: mensagemErro(error), tipo: 'erro' });
          toast({ texto: `Pedido marcado como ${rotuloStatus[st]}`, tipo: 'ok' });
          q.refetch();
          qc.invalidateQueries({ queryKey: ['pedidos'] });
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <Cabecalho titulo={`Pedido Nº ${pedido.numero}`} />
      <ScrollView contentContainerStyle={{ padding: espaco.lg, gap: espaco.lg, paddingBottom: 60 }}>
        {novo === '1' && (
          <View style={s.sucesso}>
            <Ionicons name="checkmark-circle" size={30} color={cores.dourado} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.sucessoTitulo}>Pedido enviado!</Text>
              <Text style={s.sucessoTexto}>Agora é só combinar pagamento e entrega com a gente no WhatsApp.</Text>
            </View>
          </View>
        )}

        <Cartao style={{ gap: espaco.md }}>
          <View style={s.linha}>
            <T v="legenda">{dataHora(pedido.criado_em)}</T>
            <SeloStatus status={pedido.status} />
          </View>
          {pedido.status !== 'cancelado' && (
            <View style={s.trilha}>
              {ordemStatus.map((st, i) => (
                <View key={st} style={s.etapa}>
                  <View style={[s.bolinha, i <= passo && s.bolinhaFeita]}>
                    {i <= passo && <Ionicons name="checkmark" size={12} color={cores.branco} />}
                  </View>
                  <Text style={[s.etapaTexto, i <= passo && { color: cores.texto }]} numberOfLines={2}>{rotuloStatus[st]}</Text>
                  {i < ordemStatus.length - 1 && <View style={[s.traco, i < passo && s.tracoFeito]} />}
                </View>
              ))}
            </View>
          )}
        </Cartao>

        <Cartao style={{ gap: espaco.md }}>
          <T v="rotulo">Itens</T>
          {itens.map((i) => (
            <View key={i.id} style={s.item}>
              <FotoProduto uri={i.imagem_url} style={s.foto} tamMonograma={18} tamanho="miniatura" />
              <View style={{ flex: 1, gap: 2 }}>
                <T v="corpoForte" numberOfLines={2}>{i.produto_nome}</T>
                <T v="legenda">{i.variacao_nome ? `${i.variacao_nome} · ` : ''}{i.quantidade} × {formatarReais(i.preco_unitario)}</T>
              </View>
              <T v="corpoForte">{formatarReais(i.subtotal)}</T>
            </View>
          ))}
          <View style={s.divisor} />
          <View style={s.linha}><T>Subtotal</T><T>{formatarReais(pedido.subtotal)}</T></View>
          {Number(pedido.desconto) > 0 && (
            <View style={s.linha}><T style={{ color: cores.sucesso }}>Cupom {pedido.cupom_codigo}</T><T style={{ color: cores.sucesso }}>- {formatarReais(pedido.desconto)}</T></View>
          )}
          <View style={s.linha}><Text style={s.totalRotulo}>Total</Text><Text style={s.total}>{formatarReais(pedido.total)}</Text></View>
          {pedido.tabela_preco === 'revenda' && <T v="legenda">Preço de revenda</T>}
          {!!pedido.observacoes && <T v="legenda">Obs.: {pedido.observacoes}</T>}
        </Cartao>

        {equipe ? (
          <>
            <Cartao style={{ gap: 6 }}>
              <T v="rotulo">Cliente</T>
              <T v="corpoForte">{cli?.nome}</T>
              {!!cli?.telefone && <T>{mascaraTelefone(cli.telefone)}</T>}
              {!!cli?.email && <T>{cli.email}</T>}
              {!!cli?.cpf && <T v="legenda">CPF {mascaraCpf(cli.cpf)}</T>}
              {!!cli?.cidade && <T v="legenda">{cli.cidade}{cli.uf ? `/${cli.uf}` : ''}</T>}
              {!!cli?.telefone && (
                <Botao titulo="Chamar cliente no WhatsApp" tipo="whatsapp" icone="logo-whatsapp" pequeno style={{ marginTop: 8 }}
                  onPress={() => abrirWhatsapp(`55${cli.telefone}`, `Olá, ${cli.nome?.split(' ')[0]}! Aqui é da Juliana Prado, sobre o seu pedido Nº ${pedido.numero}.`)} />
              )}
            </Cartao>
            <Cartao style={{ gap: espaco.md }}>
              <T v="rotulo">Mudar status</T>
              <View style={s.statusGrade}>
                {(['recebido', 'pago', 'em_separacao', 'enviado', 'entregue', 'cancelado'] as StatusPedido[]).map((st) => (
                  <Pressable key={st} disabled={st === pedido.status || !!mudando} onPress={() => mudarStatus(st)}
                    style={[s.statusBotao, st === pedido.status && s.statusAtual, st === 'cancelado' && st !== pedido.status && { borderColor: '#E7B8B4' }]}>
                    <Text style={[s.statusTexto, st === pedido.status && { color: cores.branco }]}>{mudando === st ? '…' : rotuloStatus[st]}</Text>
                  </Pressable>
                ))}
              </View>
            </Cartao>
          </>
        ) : (
          <Botao titulo="Falar sobre este pedido" tipo="whatsapp" icone="logo-whatsapp"
            onPress={() => abrirWhatsapp(config.data?.whatsapp_pedidos ?? '',
              mensagemPedido(config.data?.mensagem_pedido ?? '', pedido, itens, perfil?.nome))} />
        )}
        {novo === '1' && <Botao titulo="Continuar comprando" tipo="texto" onPress={() => router.navigate('/')} />}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  sucesso: { flexDirection: 'row', gap: espaco.md, alignItems: 'center', backgroundColor: cores.grafite, borderRadius: raio.lg, padding: espaco.lg },
  sucessoTitulo: { fontFamily: fontes.serifa, fontSize: 22, color: cores.branco },
  sucessoTexto: { fontFamily: fontes.texto, fontSize: 13, color: '#E6DEE3', lineHeight: 18 },
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trilha: { flexDirection: 'row' },
  etapa: { flex: 1, alignItems: 'center', gap: 6 },
  bolinha: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: cores.linha, backgroundColor: cores.branco, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  bolinhaFeita: { backgroundColor: cores.dourado, borderColor: cores.dourado },
  etapaTexto: { fontFamily: fontes.textoMedio, fontSize: 10, color: cores.textoSuave, textAlign: 'center' },
  traco: { position: 'absolute', top: 10, left: '60%', right: '-40%', height: 2, backgroundColor: cores.linha },
  tracoFeito: { backgroundColor: cores.dourado },
  item: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  foto: { width: 52, height: 52, borderRadius: raio.sm },
  divisor: { height: 1, backgroundColor: cores.linha },
  totalRotulo: { fontFamily: fontes.serifa, fontSize: 22, color: cores.texto },
  total: { fontFamily: fontes.textoForte, fontSize: 18, color: cores.texto },
  statusGrade: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
  statusBotao: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: raio.md, borderWidth: 1, borderColor: cores.linha, backgroundColor: cores.branco },
  statusAtual: { backgroundColor: cores.grafite, borderColor: cores.grafite },
  statusTexto: { fontFamily: fontes.textoSemi, fontSize: 13, color: cores.texto },
});
