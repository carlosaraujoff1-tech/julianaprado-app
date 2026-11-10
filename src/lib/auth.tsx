import type { Session } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';
import type { Perfil } from '@/types/database';

type Auth = {
  carregando: boolean;
  session: Session | null;
  perfil: Perfil | null;
  logado: boolean;
  equipe: boolean;
  admin: boolean;
  revendedora: boolean;
  recarregarPerfil: () => Promise<unknown>;
  sair: () => Promise<void>;
};

const Ctx = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [iniciou, setIniciou] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIniciou(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_evento, s) => {
      setSession((antes) => {
        // Trocou de pessoa (entrou/saiu): preços e listas mudam (varejo x revenda).
        if (antes?.user.id !== s?.user.id) qc.invalidateQueries();
        return s;
      });
    });
    return () => data.subscription.unsubscribe();
  }, [qc]);

  const uid = session?.user.id;
  const perfilQ = useQuery({
    queryKey: ['perfil', uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from('perfis').select('*').eq('id', uid!).single();
      if (error) throw error;
      return data as Perfil;
    },
  });

  useEffect(() => {
    if (uid) supabase.rpc('registrar_acesso').then(() => undefined);
  }, [uid]);

  const perfil = uid ? (perfilQ.data ?? null) : null;
  const valor: Auth = {
    carregando: !iniciou || (!!uid && perfilQ.isLoading),
    session,
    perfil,
    logado: !!uid,
    equipe: perfil?.tipo === 'admin' || perfil?.tipo === 'vendedora',
    admin: perfil?.tipo === 'admin',
    revendedora: perfil?.revenda === 'aprovada',
    recarregarPerfil: () => perfilQ.refetch(),
    sair: async () => {
      await supabase.auth.signOut();
    },
  };
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth fora do AuthProvider');
  return c;
}
