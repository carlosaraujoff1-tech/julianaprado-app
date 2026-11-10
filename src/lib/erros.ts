import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

// Guarda erros inesperados no banco (tabela erros_app) para a equipe ver no painel.
export async function registrarErro(erro: unknown, tela?: string) {
  try {
    const e = erro as { message?: string; stack?: string };
    const { data } = await supabase.auth.getSession();
    await supabase.from('erros_app').insert({
      mensagem: String(e?.message ?? erro).slice(0, 1000),
      stack: e?.stack?.slice(0, 4000) ?? null,
      tela: tela ?? null,
      plataforma: Platform.OS,
      versao_app: Constants.expoConfig?.version ?? null,
      usuario_id: data.session?.user.id ?? null,
    });
  } catch {
    // nunca deixa o registro de erro derrubar o app
  }
}
