import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { router, type Href } from 'expo-router';
import * as Updates from 'expo-updates';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '@/components/toast';
import { Botao, Cartao, T, type NomeIcone } from '@/components/ui';
import { cores, espaco, fontes, raio } from '@/constants/tema';
import { useAuth } from '@/lib/auth';
import { mensagemErro, supabase } from '@/lib/supabase';
import { useConfiguracoes } from '@/lib/vitrine';
import { abrirWhatsapp } from '@/lib/whatsapp';

function Item({ icone, titulo, onPress, perigo }: { icone: NomeIcone; titulo: string; onPress: () => void; perigo?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.item, pressed && { backgroundColor: '#F6F2EC' }]}>
      <Ionicons name={icone} size={21} color={perigo ? cores.erro : cores.douradoEscuro} />
      <Text style={[s.itemTexto, perigo && { color: cores.erro }]}>{titulo}</Text>
      <Ionicons name="chevron-forward" size={18} color={cores.textoSuave} />
    </Pressable>
  );
}

function CartaoRevenda() {
  const { perfil, revendedora, recarregarPerfil } = useAuth();
  const toast = useToast();
  const [enviando, setEnviando] = useState(false);
  if (!perfil || perfil.tipo !== 'cliente') return null;
  if (revendedora) {
    return (
      <View style={[s.revenda, { backgroundColor: cores.grafite }]}>
        <Ionicons name="sparkles" size={22} color={cores.dourado} />
        <View style={{ flex: 1 }}>
          <Text style={[s.revendaTitulo, { color: cores.branco }]}>Você é revendedora</Text>
          <Text style={[s.revendaTexto, { color: '#E6DEE3' }]}>Os preços que você vê já são os de revenda.</Text>
        </View>
      </View>
    );
  }
  if (perfil.revenda === 'pendente') {
    return (
      <View style={s.revenda}>
        <Ionicons name="time-outline" size={22} color={cores.douradoEscuro} />
        <View style={{ flex: 1 }}>
          <Text style={s.revendaTitulo}>Pedido de revenda em análise</Text>
          <Text style={s.revendaTexto}>Avisaremos você assim que for aprovado.</Text>
        </View>
      </View>
    );
  }
  const pedir = async () => {
    if (!perfil.cpf) {
      toast({ texto: 'Cadastre seu CPF em Meus dados antes de pedir', tipo: 'erro', acao: { titulo: 'Abrir', onPress: () => router.push('/meus-dados') } });
      return;
    }
    setEnviando(true);
    const { error } = await supabase.rpc('solicitar_revenda');
    setEnviando(false);
    if (error) return toast({ texto: mensagemErro(error), tipo: 'erro' });
    toast({ texto: 'Pedido enviado! Avisaremos quando for aprovado.', tipo: 'ok' });
    recarregarPerfil();
  };
  return (
    <View style={s.revenda}>
      <Ionicons name="sparkles-outline" size={22} color={cores.douradoEscuro} />
      <View style={{ flex: 1, gap: 8 }}>
        <View>
          <Text style={s.revendaTitulo}>Quer revender Juliana Prado?</Text>
          <Text style={s.revendaTexto}>
            {perfil.revenda === 'recusada' ? 'Seu pedido anterior não foi aprovado. Você pode pedir de novo.' : 'Peça acesso à tabela de preços de revenda.'}
          </Text>
        </View>
        <Botao titulo="Quero ser revendedora" pequeno onPress={pedir} carregando={enviando} style={{ alignSelf: 'flex-start' }} />
      </View>
    </View>
  );
}

export default function Conta() {
  const ins = useSafeAreaInsets();
  const { logado, perfil, equipe, admin, sair } = useAuth();
  const config = useConfiguracoes();
  const qc = useQueryClient();
  const toast = useToast();
  const ir = (h: Href) => () => router.push(h);

  const excluir = () => {
    Alert.alert('Excluir minha conta', 'Seus dados de cadastro, favoritos e sacola serão apagados para sempre. Os pedidos já feitos continuam registrados para a loja. Deseja continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.rpc('excluir_minha_conta');
          if (error) return toast({ texto: mensagemErro(error), tipo: 'erro' });
          await sair();
          qc.clear();
          toast({ texto: 'Sua conta foi excluída.', tipo: 'ok' });
        },
      },
    ]);
  };

  const versao = `${Constants.expoConfig?.version ?? ''}${Updates.updateId ? ` · ${Updates.updateId.slice(0, 8)}` : ''}`;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: ins.top + espaco.md, padding: espaco.lg, gap: espaco.lg, paddingBottom: 110 }}>
      {logado ? (
        <View style={s.ola}>
          <View style={s.avatar}><Text style={s.avatarTexto}>{(perfil?.nome || '?').charAt(0).toUpperCase()}</Text></View>
          <View style={{ flex: 1 }}>
            <T v="titulo">Olá, {perfil?.nome?.split(' ')[0] || 'cliente'}!</T>
            <T v="legenda">{perfil?.email}</T>
            {equipe && <Text style={s.equipe}>{admin ? 'ADMINISTRADORA' : 'VENDEDORA'}</Text>}
          </View>
        </View>
      ) : (
        <Cartao style={{ gap: espaco.md, backgroundColor: cores.grafite, borderColor: cores.grafite }}>
          <Text style={[s.revendaTitulo, { color: cores.branco, fontSize: 24 }]}>Bem-vinda à Juliana Prado</Text>
          <Text style={{ fontFamily: fontes.texto, color: '#E6DEE3', fontSize: 14, lineHeight: 20 }}>
            Entre para finalizar pedidos, salvar favoritos e acompanhar suas compras.
          </Text>
          <View style={{ flexDirection: 'row', gap: espaco.sm }}>
            <Botao titulo="Entrar" onPress={ir('/entrar')} style={{ flex: 1 }} />
            <Botao titulo="Criar conta" tipo="contornoClaro" onPress={ir('/cadastro')} style={{ flex: 1 }} />
          </View>
        </Cartao>
      )}

      <CartaoRevenda />

      {equipe && (
        <View style={s.grupo}>
          <T v="rotulo" style={s.grupoTitulo}>Equipe</T>
          <Item icone="receipt-outline" titulo="Pedidos da loja" onPress={() => router.navigate('/pedidos')} />
          <Item icone="people-outline" titulo="Aprovar revendedoras" onPress={ir('/equipe/revendas')} />
          {admin && <Item icone="megaphone-outline" titulo="Enviar notificação" onPress={ir('/equipe/notificar')} />}
        </View>
      )}

      <View style={s.grupo}>
        {logado && <Item icone="person-outline" titulo="Meus dados" onPress={ir('/meus-dados')} />}
        {logado && <Item icone="receipt-outline" titulo="Meus pedidos" onPress={() => router.navigate('/pedidos')} />}
        <Item icone="heart-outline" titulo="Favoritos" onPress={() => router.push({ pathname: '/lista/[filtro]', params: { filtro: 'favoritos' } })} />
        <Item icone="notifications-outline" titulo="Notificações" onPress={ir('/notificacoes')} />
      </View>

      <View style={s.grupo}>
        <Item icone="logo-whatsapp" titulo="Fale com a gente" onPress={() => abrirWhatsapp(config.data?.whatsapp_pedidos ?? '', 'Olá! Vim pelo app da Juliana Prado.')} />
        {!!config.data?.instagram && <Item icone="logo-instagram" titulo="Instagram" onPress={() => Linking.openURL(config.data!.instagram).catch(() => undefined)} />}
      </View>

      {logado && (
        <View style={s.grupo}>
          <Item icone="log-out-outline" titulo="Sair da conta" onPress={async () => { await sair(); qc.clear(); }} />
          <Item icone="trash-outline" titulo="Excluir minha conta" onPress={excluir} perigo />
        </View>
      )}
      <T v="legenda" style={{ textAlign: 'center' }}>Juliana Prado · versão {versao}</T>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  ola: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: cores.grafite, alignItems: 'center', justifyContent: 'center' },
  avatarTexto: { fontFamily: fontes.serifa, fontSize: 28, color: cores.dourado },
  equipe: { fontFamily: fontes.textoForte, fontSize: 10, letterSpacing: 1.5, color: cores.douradoEscuro, marginTop: 4 },
  revenda: { flexDirection: 'row', gap: espaco.md, backgroundColor: cores.douradoClaro, borderRadius: raio.lg, padding: espaco.lg },
  revendaTitulo: { fontFamily: fontes.serifa, fontSize: 20, color: cores.texto },
  revendaTexto: { fontFamily: fontes.texto, fontSize: 13, color: cores.textoSuave, lineHeight: 18 },
  grupo: { backgroundColor: cores.branco, borderRadius: raio.lg, borderWidth: 1, borderColor: cores.linha, overflow: 'hidden' },
  grupoTitulo: { paddingHorizontal: espaco.lg, paddingTop: espaco.md },
  item: { flexDirection: 'row', alignItems: 'center', gap: espaco.md, paddingHorizontal: espaco.lg, paddingVertical: 15 },
  itemTexto: { flex: 1, fontFamily: fontes.textoMedio, fontSize: 15, color: cores.texto },
});
