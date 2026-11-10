import { createClient } from '@supabase/supabase-js';

// Mesma URL e chave PUBLICÁVEL do app (feitas para ficar no navegador).
// Quem pode o quê é decidido pelas regras do banco, não por esta chave.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://jgohlujbljnuduimtnox.supabase.co';
const chave = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_3ka84CXEecuUhu1_l4vOJQ_VE-ijq2X';

export const supabase = createClient(url, chave, { auth: { persistSession: true, autoRefreshToken: true } });

export function mensagemErro(e: unknown): string {
  const m = (e as { message?: string })?.message ?? String(e);
  if (/Invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.';
  if (/User already registered/i.test(m)) return 'Este e-mail já tem cadastro. Use "Entrar".';
  if (/Password should be at least/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (/Email not confirmed/i.test(m)) return 'Confirme seu e-mail antes de entrar.';
  if (/row-level security|42501/i.test(m)) return 'Sem permissão para esta ação (só administradora).';
  return m;
}
