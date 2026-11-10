import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type TextProps, type TextStyle, type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cores, espaco, fontes, raio } from '@/constants/tema';

type Variante = 'titulo' | 'tituloGrande' | 'subtitulo' | 'corpo' | 'corpoForte' | 'legenda' | 'rotulo' | 'preco';

export function T({ v = 'corpo', style, ...p }: TextProps & { v?: Variante }) {
  return <Text {...p} style={[estilosTexto[v], style]} />;
}

const estilosTexto = StyleSheet.create({
  tituloGrande: { fontFamily: fontes.serifa, fontSize: 30, color: cores.texto, lineHeight: 34 },
  titulo: { fontFamily: fontes.serifa, fontSize: 24, color: cores.texto, lineHeight: 28 },
  subtitulo: { fontFamily: fontes.textoSemi, fontSize: 16, color: cores.texto },
  corpo: { fontFamily: fontes.texto, fontSize: 14, color: cores.texto, lineHeight: 20 },
  corpoForte: { fontFamily: fontes.textoSemi, fontSize: 14, color: cores.texto, lineHeight: 20 },
  legenda: { fontFamily: fontes.texto, fontSize: 12, color: cores.textoSuave, lineHeight: 16 },
  rotulo: { fontFamily: fontes.textoSemi, fontSize: 11, color: cores.textoSuave, letterSpacing: 1.2, textTransform: 'uppercase' },
  preco: { fontFamily: fontes.textoForte, fontSize: 16, color: cores.texto },
});

export type NomeIcone = ComponentProps<typeof Ionicons>['name'];
export function Icone({ nome, tam = 22, cor = cores.texto }: { nome: NomeIcone; tam?: number; cor?: string }) {
  return <Ionicons name={nome} size={tam} color={cor} />;
}

export function vibrar() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

type BotaoProps = {
  titulo: string;
  onPress?: () => void;
  tipo?: 'principal' | 'escuro' | 'contorno' | 'contornoClaro' | 'texto' | 'whatsapp';
  icone?: NomeIcone;
  carregando?: boolean;
  desabilitado?: boolean;
  style?: StyleProp<ViewStyle>;
  pequeno?: boolean;
};

export function Botao({ titulo, onPress, tipo = 'principal', icone, carregando, desabilitado, style, pequeno }: BotaoProps) {
  const fundo = { principal: cores.dourado, escuro: cores.grafite, contorno: 'transparent', contornoClaro: 'transparent', texto: 'transparent', whatsapp: cores.whatsapp }[tipo];
  const corTexto = tipo === 'contorno' ? cores.grafite : tipo === 'texto' ? cores.douradoEscuro : cores.branco;
  const inativo = desabilitado || carregando;
  return (
    <Pressable
      onPress={() => { if (!inativo) { vibrar(); onPress?.(); } }}
      style={({ pressed }) => [
        b.base,
        pequeno && b.pequeno,
        { backgroundColor: fundo, opacity: inativo ? 0.55 : pressed ? 0.85 : 1 },
        tipo === 'contorno' && b.contorno,
        tipo === 'contornoClaro' && b.contornoClaro,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inativo }}>
      {carregando ? <ActivityIndicator color={corTexto} /> : (
        <>
          {icone && <Ionicons name={icone} size={pequeno ? 16 : 19} color={corTexto} />}
          <Text style={[b.texto, pequeno && b.textoPequeno, { color: corTexto }]}>{titulo}</Text>
        </>
      )}
    </Pressable>
  );
}

const b = StyleSheet.create({
  base: { minHeight: 50, borderRadius: raio.md, paddingHorizontal: espaco.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: espaco.sm },
  pequeno: { minHeight: 38, paddingHorizontal: espaco.lg, borderRadius: raio.sm },
  contorno: { borderWidth: 1.2, borderColor: cores.grafite },
  contornoClaro: { borderWidth: 1.2, borderColor: 'rgba(255,255,255,0.8)' },
  texto: { fontFamily: fontes.textoSemi, fontSize: 15, letterSpacing: 0.3 },
  textoPequeno: { fontSize: 13 },
});

export function Campo({ rotulo, erro, style, ...p }: TextInputProps & { rotulo: string; erro?: string | null; style?: StyleProp<TextStyle> }) {
  return (
    <View style={{ gap: 6 }}>
      <T v="rotulo">{rotulo}</T>
      <TextInput
        placeholderTextColor="#B3ABB1"
        {...p}
        style={[c.input, !!erro && { borderColor: cores.erro }, style]}
      />
      {!!erro && <T v="legenda" style={{ color: cores.erro }}>{erro}</T>}
    </View>
  );
}
const c = StyleSheet.create({
  input: {
    minHeight: 50, borderWidth: 1, borderColor: cores.linha, borderRadius: raio.md, backgroundColor: cores.branco,
    paddingHorizontal: espaco.lg, fontFamily: fontes.texto, fontSize: 15, color: cores.texto,
  },
});

// Cabeçalho com voltar (telas internas).
export function Cabecalho({ titulo, direita, escuro }: { titulo?: string; direita?: ReactNode; escuro?: boolean }) {
  const ins = useSafeAreaInsets();
  const cor = escuro ? cores.branco : cores.texto;
  return (
    <View style={[h.caixa, { paddingTop: ins.top + 6, backgroundColor: escuro ? cores.grafite : cores.creme }]}>
      <Pressable
        hitSlop={12}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={h.botao}
        accessibilityLabel="Voltar">
        <Ionicons name="chevron-back" size={26} color={cor} />
      </Pressable>
      <Text numberOfLines={1} style={[h.titulo, { color: cor }]}>{titulo}</Text>
      <View style={[h.botao, { alignItems: 'flex-end' }]}>{direita}</View>
    </View>
  );
}
const h = StyleSheet.create({
  caixa: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: espaco.md, paddingBottom: espaco.sm },
  botao: { width: 44, height: 44, justifyContent: 'center' },
  titulo: { flex: 1, textAlign: 'center', fontFamily: fontes.serifa, fontSize: 22 },
});

export function Vazio({ icone, titulo, texto, acao }: { icone: NomeIcone; titulo: string; texto?: string; acao?: ReactNode }) {
  return (
    <View style={{ alignItems: 'center', padding: espaco.xxl, gap: espaco.md }}>
      <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: cores.douradoClaro, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icone} size={36} color={cores.douradoEscuro} />
      </View>
      <T v="titulo" style={{ textAlign: 'center' }}>{titulo}</T>
      {!!texto && <T style={{ textAlign: 'center', color: cores.textoSuave }}>{texto}</T>}
      {acao}
    </View>
  );
}

export function Carregando() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: espaco.xxl }}>
      <ActivityIndicator color={cores.dourado} size="large" />
    </View>
  );
}

export function Selo({ texto, cor = cores.grafite, fundo = cores.douradoClaro }: { texto: string; cor?: string; fundo?: string }) {
  return (
    <View style={{ backgroundColor: fundo, paddingHorizontal: 10, paddingVertical: 4, borderRadius: raio.pill, alignSelf: 'flex-start' }}>
      <Text style={{ fontFamily: fontes.textoSemi, fontSize: 11, color: cor }}>{texto}</Text>
    </View>
  );
}

export function Cartao({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ backgroundColor: cores.branco, borderRadius: raio.lg, padding: espaco.lg, borderWidth: 1, borderColor: cores.linha }, style]}>{children}</View>;
}
