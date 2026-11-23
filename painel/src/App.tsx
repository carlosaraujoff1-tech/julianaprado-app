import type { Session } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { Notificacoes } from './Notificacoes';
import { Posts } from './Posts';
import { Login } from './Login';
import { supabase } from './supabase';

export function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [aba, setAba] = useState<'posts' | 'notificacoes'>('posts');
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

  const admin = perfil.data?.tipo === 'admin';
  if (!admin && perfil.data?.tipo !== 'vendedora') {
    return (
      <div className="centro">
        <div className="cartao estreito">
          <h1 className="titulo">Sem acesso</h1>
          <p>A conta <b>{session.user.email}</b> não é da equipe. Este painel é só para a equipe da loja.</p>
          <button className="botao contorno" onClick={() => supabase.auth.signOut()}>Sair</button>
        </div>
      </div>
    );
  }

  return (
    <div className="layout">
      <header className="topo">
        <div className="logo">JULIANA PRADO<span> · painel</span></div>
        <nav className="abas">
          <button className={'aba' + (aba === 'posts' ? ' ativa' : '')} onClick={() => setAba('posts')}>Posts</button>
          {admin && <button className={'aba' + (aba === 'notificacoes' ? ' ativa' : '')} onClick={() => setAba('notificacoes')}>Notificações</button>}
        </nav>
        <div className="usuario">
          <span>{perfil.data!.email}{admin ? '' : ' · vendedora'}</span>
          <button className="botao pequeno contorno" onClick={() => supabase.auth.signOut()}>Sair</button>
        </div>
      </header>
      <main className="conteudo">
        {aba === 'notificacoes' && admin ? <Notificacoes /> : <Posts admin={admin} uid={session.user.id} />}
      </main>
    </div>
  );
}
