import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Botao, Cabecalho, Campo, T } from '@/components/ui';
import { espaco } from '@/constants/tema';
import { emailValido } from '@/lib/formatacao';
import { mensagemErro, supabase } from '@/lib/supabase';

export default function EsqueciSenha() {
  const p = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(p.email ?? '');
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    setErro(null);
    if (!emailValido(email)) return setErro('Digite um e-mail válido.');
    setEnviando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: 'julianaprado://redefinir-senha' });
    setEnviando(false);
    if (error) return setErro(mensagemErro(error));
    setEnviado(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <Cabecalho titulo="Recuperar senha" />
      <View style={{ padding: espaco.xl, gap: espaco.lg }}>
        {enviado ? (
          <>
            <T v="titulo">Confira seu e-mail</T>
            <T>Se houver uma conta com {email}, você vai receber um link para criar uma nova senha. Abra o link neste celular.</T>
          </>
        ) : (
          <>
            <T>Digite o e-mail da sua conta. Enviaremos um link para você criar uma senha nova.</T>
            <Campo rotulo="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" erro={erro} />
            <Botao titulo="Enviar link" onPress={enviar} carregando={enviando} />
          </>
        )}
      </View>
    </View>
  );
}
