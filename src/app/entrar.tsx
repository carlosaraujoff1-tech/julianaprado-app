import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '@/components/toast';
import { Botao, Campo, T } from '@/components/ui';
import { cores, espaco, fontes } from '@/constants/tema';
import { emailValido } from '@/lib/formatacao';
import { mensagemErro, supabase } from '@/lib/supabase';

export default function Entrar() {
  const ins = useSafeAreaInsets();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [ver, setVer] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const entrar = async () => {
    setErro(null);
    if (!emailValido(email)) return setErro('Digite um e-mail válido.');
    if (!senha) return setErro('Digite sua senha.');
    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: senha });
    setEnviando(false);
    if (error) return setErro(mensagemErro(error));
    toast({ texto: 'Que bom ter você de volta!', tipo: 'ok' });
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: cores.creme }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={[s.topo, { paddingTop: ins.top + espaco.lg }]}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={s.fechar} accessibilityLabel="Fechar">
            <Ionicons name="close" size={26} color={cores.branco} />
          </Pressable>
          <Text style={s.logo}>JULIANA{'\n'}PRADO</Text>
          <View style={s.linha} />
          <Text style={s.sub}>Entre na sua conta</Text>
        </View>
        <View style={s.form}>
          <Campo rotulo="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
            autoComplete="email" textContentType="emailAddress" placeholder="seuemail@exemplo.com" />
          <View>
            <Campo rotulo="Senha" value={senha} onChangeText={setSenha} secureTextEntry={!ver} autoComplete="password"
              textContentType="password" placeholder="Sua senha" onSubmitEditing={entrar} />
            <Pressable onPress={() => setVer((v) => !v)} hitSlop={10} style={s.olho} accessibilityLabel="Mostrar senha">
              <Ionicons name={ver ? 'eye-off-outline' : 'eye-outline'} size={20} color={cores.textoSuave} />
            </Pressable>
          </View>
          {!!erro && <T style={{ color: cores.erro }}>{erro}</T>}
          <Botao titulo="Entrar" onPress={entrar} carregando={enviando} />
          <Botao titulo="Esqueci minha senha" tipo="texto" onPress={() => router.push({ pathname: '/esqueci-senha', params: { email } })} />
          <View style={s.divisor} />
          <T style={{ textAlign: 'center' }}>Ainda não tem conta?</T>
          <Botao titulo="Criar minha conta" tipo="contorno" onPress={() => router.replace('/cadastro')} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  topo: { backgroundColor: cores.grafite, alignItems: 'center', paddingBottom: espaco.xxl, gap: espaco.md, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  fechar: { position: 'absolute', left: espaco.lg, top: 48 },
  logo: { fontFamily: fontes.serifaMedia, color: cores.branco, fontSize: 34, letterSpacing: 6, textAlign: 'center', lineHeight: 34, marginTop: espaco.xl },
  linha: { width: 40, height: 1.5, backgroundColor: cores.dourado },
  sub: { fontFamily: fontes.texto, color: '#E6DEE3', fontSize: 14 },
  form: { padding: espaco.xl, gap: espaco.lg },
  olho: { position: 'absolute', right: 14, bottom: 15 },
  divisor: { height: 1, backgroundColor: cores.linha, marginVertical: espaco.sm },
});
