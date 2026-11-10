import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useToast } from '@/components/toast';
import { Botao, Cabecalho, Campo, Cartao, T, Vazio } from '@/components/ui';
import { cores, espaco, fontes, raio } from '@/constants/tema';
import { useAuth } from '@/lib/auth';
import { tempoRelativo } from '@/lib/formatacao';
import { mensagemErro, supabase } from '@/lib/supabase';
import { useCategorias } from '@/lib/vitrine';

// Aviso manual para TODOS os aparelhos (clientes, equipe e visitantes).
// Só admin envia: o banco recusa de qualquer outra pessoa (regra notificacoes_admin).
// Foto: recorte 2:1 (formato da notificação grande do Android) e JPEG ~1024 px,
// porque a notificação do celular não aceita WebP em todos os aparelhos.

const DESTINOS_FIXOS = [
  { rota: '/', nome: 'Início' },
  { rota: '/lista/novidades', nome: 'Novidades' },
  { rota: '/lista/ofertas', nome: 'Ofertas' },
  { rota: '/lista/destaques', nome: 'Destaques' },
  { rota: '/sacola', nome: 'Sacola' },
];

type Enviada = {
  id: string; titulo: string; corpo: string; imagem_url: string | null; criado_em: string;
  fila_push: { status: string; enviados: number | null; erro: string | null }[];
};

export default function Notificar() {
  const { admin, session } = useAuth();
  const toast = useToast();
  const categorias = useCategorias();
  const [titulo, setTitulo] = useState('');
  const [corpo, setCorpo] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [rota, setRota] = useState('/');
  const [preparandoFoto, setPreparandoFoto] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const aparelhos = useQuery({
    queryKey: ['aparelhos-ativos'],
    enabled: admin,
    queryFn: async () => {
      const { count } = await supabase.from('dispositivos_push' as never).select('id', { count: 'exact', head: true }).eq('ativo', true);
      return count ?? 0;
    },
  });
  const historico = useQuery({
    queryKey: ['notificacoes-enviadas'],
    enabled: admin,
    queryFn: async () => {
      const { data, error } = await supabase.from('notificacoes')
        .select('id,titulo,corpo,imagem_url,criado_em,fila_push(status,enviados,erro)')
        .is('destinatario_id', null).order('criado_em', { ascending: false }).limit(10);
      if (error) throw error;
      return (data ?? []) as unknown as Enviada[];
    },
  });

  if (!admin) {
    return <View style={{ flex: 1 }}><Cabecalho titulo="Enviar notificação" /><Vazio icone="lock-closed-outline" titulo="Somente administradora" /></View>;
  }

  const escolherFoto = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [2, 1], quality: 1 });
    if (r.canceled || !r.assets?.[0]) return;
    setPreparandoFoto(true);
    try {
      const img = await ImageManipulator.manipulate(r.assets[0].uri).resize({ width: 1024 }).renderAsync();
      const salvo = await img.saveAsync({ format: SaveFormat.JPEG, compress: 0.82 });
      setFoto(salvo.uri);
    } catch (e) {
      toast({ texto: 'Não consegui preparar a foto: ' + mensagemErro(e), tipo: 'erro' });
    } finally {
      setPreparandoFoto(false);
    }
  };

  const enviar = async () => {
    if (titulo.trim().length < 3 || corpo.trim().length < 3) {
      toast({ texto: 'Preencha título e texto.', tipo: 'erro' });
      return;
    }
    if (!confirmar) { setConfirmar(true); return; }
    setEnviando(true);
    try {
      let imagem_url: string | null = null;
      if (foto) {
        const dados = await (await fetch(foto)).arrayBuffer();
        const caminho = `notificacoes/${Date.now()}.jpg`;
        const up = await supabase.storage.from('catalogo').upload(caminho, dados, { contentType: 'image/jpeg', upsert: false });
        if (up.error) throw up.error;
        imagem_url = supabase.storage.from('catalogo').getPublicUrl(caminho).data.publicUrl;
      }
      const { error } = await supabase.from('notificacoes').insert({
        titulo: titulo.trim(), corpo: corpo.trim(), imagem_url, rota, criado_por: session?.user.id ?? null,
      });
      if (error) throw error;
      toast({ texto: 'Notificação enviada!', tipo: 'ok' });
      setTitulo(''); setCorpo(''); setFoto(null); setRota('/'); setConfirmar(false);
      setTimeout(() => historico.refetch(), 4000);
    } catch (e) {
      toast({ texto: mensagemErro(e), tipo: 'erro' });
    } finally {
      setEnviando(false);
    }
  };

  const destinos = [...DESTINOS_FIXOS, ...(categorias.data ?? []).map((c) => ({ rota: `/categoria/${c.id}`, nome: c.nome }))];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Cabecalho titulo="Enviar notificação" />
      <ScrollView contentContainerStyle={{ padding: espaco.lg, gap: espaco.lg, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
        <T style={{ color: cores.textoSuave }}>
          Vai para todos os celulares com o app instalado ({aparelhos.data ?? '…'} {aparelhos.data === 1 ? 'aparelho' : 'aparelhos'} hoje), inclusive de quem ainda não tem conta.
        </T>
        <Campo rotulo="Título" value={titulo} onChangeText={(v) => { setTitulo(v); setConfirmar(false); }} maxLength={65} placeholder="Ex.: Coleção nova chegou ✨" />
        <Campo rotulo="Texto" value={corpo} onChangeText={(v) => { setCorpo(v); setConfirmar(false); }} maxLength={180} multiline
          style={{ minHeight: 80, paddingTop: 12, textAlignVertical: 'top' }} placeholder="Ex.: Brincos e colares da Primavera com 10% de desconto." />

        <View style={{ gap: 6 }}>
          <T v="rotulo">Foto (opcional)</T>
          {foto ? (
            <View style={{ gap: espaco.sm }}>
              <Image source={{ uri: foto }} style={s.foto} contentFit="cover" />
              <View style={{ flexDirection: 'row', gap: espaco.sm }}>
                <Botao titulo="Trocar foto" tipo="contorno" pequeno onPress={escolherFoto} style={{ flex: 1 }} />
                <Botao titulo="Remover foto" tipo="texto" pequeno onPress={() => { setFoto(null); setConfirmar(false); }} style={{ flex: 1 }} />
              </View>
            </View>
          ) : (
            <Pressable onPress={escolherFoto} style={s.escolher}>
              <Ionicons name="image-outline" size={26} color={cores.douradoEscuro} />
              <T v="corpoForte">{preparandoFoto ? 'Preparando a foto…' : 'Escolher foto da galeria'}</T>
              <T v="legenda">Recorte no formato da notificação (2 × 1)</T>
            </Pressable>
          )}
        </View>

        <View style={{ gap: 6 }}>
          <T v="rotulo">Ao tocar, abrir</T>
          <View style={s.chips}>
            {destinos.map((d) => (
              <Pressable key={d.rota} onPress={() => setRota(d.rota)} style={[s.chip, rota === d.rota && s.chipAtivo]}>
                <Text style={[s.chipTexto, rota === d.rota && { color: cores.branco }]}>{d.nome}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <T v="rotulo">Prévia</T>
          <View style={s.previa}>
            <View style={s.previaTopo}>
              <View style={s.previaIcone}><Text style={s.previaJp}>JP</Text></View>
              <T v="legenda">Juliana Prado · agora</T>
            </View>
            <T v="corpoForte">{titulo || 'Título da notificação'}</T>
            <T style={{ color: cores.textoSuave }}>{corpo || 'Texto da notificação'}</T>
            {foto && <Image source={{ uri: foto }} style={[s.foto, { marginTop: 8 }]} contentFit="cover" />}
          </View>
        </View>

        <Botao
          titulo={confirmar ? `Confirmar envio para ${aparelhos.data ?? 'todos os'} aparelhos` : 'Enviar notificação'}
          tipo={confirmar ? 'escuro' : 'principal'}
          icone="paper-plane-outline"
          onPress={enviar}
          carregando={enviando}
          desabilitado={preparandoFoto}
        />
        {confirmar && <Botao titulo="Cancelar" tipo="texto" onPress={() => setConfirmar(false)} />}

        <View style={{ gap: espaco.sm, marginTop: espaco.md }}>
          <T v="rotulo">Últimas enviadas</T>
          {(historico.data ?? []).length === 0 && <T v="legenda">Nenhuma ainda.</T>}
          {(historico.data ?? []).map((n) => {
            const f = n.fila_push?.[0];
            const situacao = !f ? 'na fila' : f.status === 'enviado' ? `entregue a ${f.enviados ?? 0} aparelho(s)` : f.status === 'erro' ? `erro: ${f.erro ?? ''}` : 'enviando…';
            return (
              <Cartao key={n.id} style={{ flexDirection: 'row', gap: espaco.md, padding: espaco.md }}>
                {n.imagem_url ? <Image source={{ uri: n.imagem_url }} style={s.mini} contentFit="cover" /> : null}
                <View style={{ flex: 1, gap: 2 }}>
                  <T v="corpoForte" numberOfLines={1}>{n.titulo}</T>
                  <T v="legenda" numberOfLines={2}>{n.corpo}</T>
                  <T v="legenda" style={{ color: f?.status === 'erro' ? cores.erro : cores.sucesso }}>{tempoRelativo(n.criado_em)} · {situacao}</T>
                </View>
              </Cartao>
            );
          })}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  foto: { width: '100%', aspectRatio: 2, borderRadius: raio.md, backgroundColor: cores.cremeFoto },
  mini: { width: 64, height: 32, borderRadius: 6 },
  escolher: { alignItems: 'center', gap: 4, padding: espaco.xl, borderRadius: raio.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: cores.dourado, backgroundColor: cores.branco },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: raio.pill, borderWidth: 1, borderColor: cores.linha, backgroundColor: cores.branco },
  chipAtivo: { backgroundColor: cores.grafite, borderColor: cores.grafite },
  chipTexto: { fontFamily: fontes.textoSemi, fontSize: 13, color: cores.texto },
  previa: { backgroundColor: cores.branco, borderRadius: raio.lg, padding: espaco.lg, gap: 4, borderWidth: 1, borderColor: cores.linha, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 },
  previaTopo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  previaIcone: { width: 22, height: 22, borderRadius: 11, backgroundColor: cores.grafite, alignItems: 'center', justifyContent: 'center' },
  previaJp: { fontFamily: fontes.serifa, fontSize: 11, color: cores.branco },
});
