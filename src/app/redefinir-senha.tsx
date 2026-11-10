import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useToast } from '@/components/toast';
import { Botao, Cabecalho, Campo, Carregando, T } from '@/components/ui';
import { espaco } from '@/constants/tema';
import { mensagemErro, supabase } from '@/lib/supabase';

// Aberta pelo link do e-mail de recuperação: julianaprado://redefinir-senha#access_token=...&refresh_token=...
export default function RedefinirSenha() {
  const url = Linking.useLinkingURL();
  const toast = useToast();
  const [pronto, setPronto] = useState(false);
  const [erroLink, setErroLink] = useState<string | null>(null);
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!url) return;
    const frag = url.includes('#') ? url.split('#')[1] : url.split('?')[1] ?? '';
    const p = new URLSearchParams(frag);
    const access = p.get('access_token');
    const refresh = p.get('refresh_token');
    if (!access || !refresh) {
      supabase.auth.getSession().then(({ data }) => (data.session ? setPronto(true) : setErroLink('Link inválido ou expirado. Peça outro.')));
      return;
    }
    supabase.auth.setSession({ access_token: access, refresh_token: refresh })
      .then(({ error }) => (error ? setErroLink(mensagemErro(error)) : setPronto(true)));
  }, [url]);

  const salvar = async () => {
    if (senha.length < 6) return toast({ texto: 'A senha precisa ter pelo menos 6 caracteres.', tipo: 'erro' });
    setEnviando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setEnviando(false);
    if (error) return toast({ texto: mensagemErro(error), tipo: 'erro' });
    toast({ texto: 'Senha alterada!', tipo: 'ok' });
    router.replace('/');
  };

  return (
    <View style={{ flex: 1 }}>
      <Cabecalho titulo="Nova senha" />
      <View style={{ padding: espaco.xl, gap: espaco.lg }}>
        {erroLink ? (
          <>
            <T>{erroLink}</T>
            <Botao titulo="Pedir novo link" onPress={() => router.replace('/esqueci-senha')} />
          </>
        ) : !pronto ? <Carregando /> : (
          <>
            <Campo rotulo="Nova senha" value={senha} onChangeText={setSenha} secureTextEntry autoComplete="new-password" />
            <Botao titulo="Salvar nova senha" onPress={salvar} carregando={enviando} />
          </>
        )}
      </View>
    </View>
  );
}
