import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

import type { Database } from '@/types/database';

// URL do projeto e chave PUBLICÁVEL (feita para ficar no app). Quem pode o quê
// é decidido pelas regras do banco (RLS), não pelo sigilo desta chave.
// Os valores padrão garantem que uma atualização sem as variáveis nunca derrube o app.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://jgohlujbljnuduimtnox.supabase.co';
const chave = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_3ka84CXEecuUhu1_l4vOJQ_VE-ijq2X';

export const supabase = createClient<Database>(url, chave, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Mensagem amigável a partir de um erro do Supabase.
export function mensagemErro(e: unknown): string {
  const m = (e as { message?: string })?.message ?? String(e);
  if (/Invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.';
  if (/Email not confirmed/i.test(m)) return 'Confirme seu e-mail antes de entrar (veja sua caixa de entrada).';
  if (/User already registered/i.test(m)) return 'Este e-mail já tem cadastro. Tente entrar ou recuperar a senha.';
  if (/Database error saving new user|perfis_cpf_key/i.test(m)) return 'Este CPF já tem cadastro. Tente entrar ou recuperar a senha.';
  if (/Password should be at least/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (/rate limit|too many/i.test(m)) return 'Muitas tentativas seguidas. Aguarde um pouco e tente de novo.';
  if (/network|fetch failed|Failed to fetch/i.test(m)) return 'Sem conexão com a internet. Verifique e tente de novo.';
  return m;
}
