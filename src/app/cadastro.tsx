import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, ScrollView, View } from 'react-native';

import { useToast } from '@/components/toast';
import { Botao, Cabecalho, Campo, T } from '@/components/ui';
import { cores, espaco } from '@/constants/tema';
import { cpfValido, dataParaIso, emailValido, mascaraCpf, mascaraData, mascaraTelefone, soDigitos } from '@/lib/formatacao';
import { mensagemErro, supabase } from '@/lib/supabase';

export default function Cadastro() {
  const toast = useToast();
  const [f, setF] = useState({ nome: '', cpf: '', telefone: '', nascimento: '', email: '', senha: '' });
  const [erros, setErros] = useState<Partial<Record<keyof typeof f, string>>>({});
  const [enviando, setEnviando] = useState(false);
  const [confirmarEmail, setConfirmarEmail] = useState(false);
  const muda = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  const cadastrar = async () => {
    const e: typeof erros = {};
    if (f.nome.trim().split(/\s+/).length < 2) e.nome = 'Digite nome e sobrenome.';
    if (!cpfValido(f.cpf)) e.cpf = 'CPF inválido.';
    if (soDigitos(f.telefone).length < 10) e.telefone = 'Telefone com DDD.';
    if (f.nascimento && !dataParaIso(f.nascimento)) e.nascimento = 'Data inválida (dd/mm/aaaa).';
    if (!emailValido(f.email)) e.email = 'E-mail inválido.';
    if (f.senha.length < 6) e.senha = 'Mínimo de 6 caracteres.';
    setErros(e);
    if (Object.keys(e).length) return;
    setEnviando(true);
    const { data, error } = await supabase.auth.signUp({
      email: f.email.trim().toLowerCase(),
      password: f.senha,
      options: {
        emailRedirectTo: 'julianaprado://',
        data: {
          nome: f.nome.trim(),
          cpf: soDigitos(f.cpf),
          telefone: soDigitos(f.telefone),
          data_nascimento: dataParaIso(f.nascimento) ?? undefined,
        },
      },
    });
    setEnviando(false);
    if (error) return toast({ texto: mensagemErro(error), tipo: 'erro' });
    if (!data.session) {
      setConfirmarEmail(true); // confirmação de e-mail ligada no Supabase
      return;
    }
    toast({ texto: 'Conta criada! Seja bem-vinda ✨', tipo: 'ok' });
    router.dismissTo('/');
  };

  if (confirmarEmail) {
    return (
      <View style={{ flex: 1 }}>
        <Cabecalho titulo="Quase lá!" />
        <View style={{ padding: espaco.xl, gap: espaco.lg }}>
          <T v="titulo">Confirme seu e-mail</T>
          <T>Enviamos um link para <T v="corpoForte">{f.email}</T>. Abra o e-mail e toque no link para ativar sua conta. Depois é só entrar.</T>
          <Botao titulo="Abrir meu e-mail" onPress={() => Linking.openURL('mailto:')} />
          <Botao titulo="Já confirmei, entrar" tipo="contorno" onPress={() => router.replace('/entrar')} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Cabecalho titulo="Criar conta" />
      <ScrollView contentContainerStyle={{ padding: espaco.xl, gap: espaco.lg, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <T style={{ color: cores.textoSuave }}>Leva menos de 1 minuto. Você pode navegar à vontade sem conta: ela só é pedida para finalizar a compra.</T>
        <Campo rotulo="Nome completo" value={f.nome} onChangeText={muda('nome')} autoComplete="name" erro={erros.nome} placeholder="Maria da Silva" />
        <Campo rotulo="CPF" value={f.cpf} onChangeText={(v) => muda('cpf')(mascaraCpf(v))} keyboardType="number-pad" erro={erros.cpf} placeholder="000.000.000-00" />
        <Campo rotulo="Celular (WhatsApp)" value={f.telefone} onChangeText={(v) => muda('telefone')(mascaraTelefone(v))} keyboardType="phone-pad"
          autoComplete="tel" erro={erros.telefone} placeholder="(43) 90000-0000" />
        <Campo rotulo="Data de nascimento (opcional)" value={f.nascimento} onChangeText={(v) => muda('nascimento')(mascaraData(v))}
          keyboardType="number-pad" erro={erros.nascimento} placeholder="dd/mm/aaaa" />
        <Campo rotulo="E-mail" value={f.email} onChangeText={muda('email')} keyboardType="email-address" autoCapitalize="none"
          autoComplete="email" erro={erros.email} placeholder="seuemail@exemplo.com" />
        <Campo rotulo="Crie uma senha" value={f.senha} onChangeText={muda('senha')} secureTextEntry autoComplete="new-password"
          erro={erros.senha} placeholder="Mínimo 6 caracteres" />
        <Botao titulo="Criar minha conta" onPress={cadastrar} carregando={enviando} />
        <T v="legenda" style={{ textAlign: 'center' }}>Ao criar a conta, você concorda com o uso dos seus dados para processar pedidos e enviar avisos da loja.</T>
        <Botao titulo="Já tenho conta" tipo="texto" onPress={() => router.replace('/entrar')} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
