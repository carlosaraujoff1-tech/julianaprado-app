import type { Session } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { Notificacoes } from './Notificacoes';
import { Login } from './Login';
import { supabase } from './supabase';

export function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const perfil = useQuery({
    queryKey: ['perfil', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from('perfis').select('nome,email,tipo').eq('id', session!.user.id).single();
      if (error) throw error;
      return data;
    },
  });

  if (session === undefined || (session && perfil.isLoading)) return <div className="centro"><div className="carregando" /></div>;
  if (!session) return <Login />;

  if (perfil.data?.tipo !== 'admin') {
    return (
      <div className="centro">
        <div className="cartao estreito">
          <h1 className="titulo">Sem acesso</h1>
          <p>A conta <b>{session.user.email}</b> não é de administradora. Este painel é só para a equipe da loja.</p>
          <button className="botao contorno" onClick={() => supabase.auth.signOut()}>Sair</button>
        </div>
      </div>
    );
  }

  return (
    <div className="layout">
      <header className="topo">
        <div className="logo">JULIANA PRADO<span> · painel</span></div>
        <nav className="abas"><span className="aba ativa">Notificações</span></nav>
        <div className="usuario">
          <span>{perfil.data.email}</span>
          <button className="botao pequeno contorno" onClick={() => supabase.auth.signOut()}>Sair</button>
        </div>
      </header>
      <main className="conteudo"><Notificacoes /></main>
    </div>
  );
}
