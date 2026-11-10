import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { useToast } from '@/components/toast';
import { Botao, Cabecalho, Campo, T } from '@/components/ui';
import { espaco } from '@/constants/tema';
import { useAuth } from '@/lib/auth';
import { cpfValido, dataParaIso, isoParaData, mascaraCpf, mascaraData, mascaraTelefone, soDigitos } from '@/lib/formatacao';
import { mensagemErro, supabase } from '@/lib/supabase';

export default function MeusDados() {
  const { perfil, recarregarPerfil } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({
    nome: perfil?.nome ?? '',
    cpf: mascaraCpf(perfil?.cpf ?? ''),
    telefone: mascaraTelefone(perfil?.telefone ?? ''),
    nascimento: isoParaData(perfil?.data_nascimento),
    cidade: perfil?.cidade ?? '',
    uf: perfil?.uf ?? '',
  });
  const [salvando, setSalvando] = useState(false);
  const muda = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));
  const cpfTravado = !!perfil?.cpf;

  const salvar = async () => {
    if (!perfil) return;
    if (f.nome.trim().length < 3) return toast({ texto: 'Digite seu nome.', tipo: 'erro' });
    if (soDigitos(f.telefone).length < 10) return toast({ texto: 'Telefone com DDD.', tipo: 'erro' });
    if (!cpfTravado && f.cpf && !cpfValido(f.cpf)) return toast({ texto: 'CPF inválido.', tipo: 'erro' });
    if (f.nascimento && !dataParaIso(f.nascimento)) return toast({ texto: 'Data de nascimento inválida.', tipo: 'erro' });
    setSalvando(true);
    const { error } = await supabase.from('perfis').update({
      nome: f.nome.trim(),
      telefone: soDigitos(f.telefone),
      data_nascimento: dataParaIso(f.nascimento),
      cidade: f.cidade.trim() || null,
      uf: f.uf.trim().toUpperCase() || null,
      ...(cpfTravado ? {} : { cpf: soDigitos(f.cpf) || null }),
    }).eq('id', perfil.id);
    setSalvando(false);
    if (error) return toast({ texto: /cpf/i.test(error.message) ? 'Este CPF já está em outra conta.' : mensagemErro(error), tipo: 'erro' });
    await recarregarPerfil();
    toast({ texto: 'Dados salvos!', tipo: 'ok' });
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Cabecalho titulo="Meus dados" />
      <ScrollView contentContainerStyle={{ padding: espaco.xl, gap: espaco.lg, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Campo rotulo="Nome completo" value={f.nome} onChangeText={muda('nome')} />
        <Campo rotulo="CPF" value={f.cpf} editable={!cpfTravado} onChangeText={(v) => muda('cpf')(mascaraCpf(v))} keyboardType="number-pad"
          style={cpfTravado ? { opacity: 0.6 } : undefined} />
        {cpfTravado && <T v="legenda">Para corrigir o CPF, fale com a loja.</T>}
        <Campo rotulo="Celular (WhatsApp)" value={f.telefone} onChangeText={(v) => muda('telefone')(mascaraTelefone(v))} keyboardType="phone-pad" />
        <Campo rotulo="Data de nascimento" value={f.nascimento} onChangeText={(v) => muda('nascimento')(mascaraData(v))} keyboardType="number-pad" placeholder="dd/mm/aaaa" />
        <Campo rotulo="Cidade" value={f.cidade} onChangeText={muda('cidade')} />
        <Campo rotulo="Estado (UF)" value={f.uf} onChangeText={(v) => muda('uf')(v.replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase())} autoCapitalize="characters" placeholder="PR" />
        <Botao titulo="Salvar" onPress={salvar} carregando={salvando} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
