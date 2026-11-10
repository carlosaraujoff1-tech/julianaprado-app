import { useState, type FormEvent } from 'react';

import { mensagemErro, supabase } from './supabase';

export function Login() {
  const [modo, setModo] = useState<'entrar' | 'criar'>('entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro(null); setAviso(null); setEnviando(true);
    const dados = { email: email.trim().toLowerCase(), password: senha };
    const r = modo === 'entrar' ? await supabase.auth.signInWithPassword(dados) : await supabase.auth.signUp(dados);
    setEnviando(false);
    if (r.error) return setErro(mensagemErro(r.error));
    if (modo === 'criar' && !r.data.session) setAviso('Conta criada. Confirme o e-mail e depois entre.');
  }

  return (
    <div className="centro">
      <form className="cartao estreito" onSubmit={enviar}>
        <div className="logo grande">JULIANA<br />PRADO</div>
        <p className="suave">Painel da loja</p>
        <label>E-mail<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Senha<input type="password" required minLength={6} autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'} value={senha} onChange={(e) => setSenha(e.target.value)} /></label>
        {erro && <p className="erro">{erro}</p>}
        {aviso && <p className="ok">{aviso}</p>}
        <button className="botao" disabled={enviando}>{enviando ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}</button>
        <button type="button" className="link" onClick={() => { setModo(modo === 'entrar' ? 'criar' : 'entrar'); setErro(null); }}>
          {modo === 'entrar' ? 'Primeiro acesso? Criar conta' : 'Já tenho conta'}
        </button>
        <p className="legenda">Só contas de administradora acessam o painel.</p>
      </form>
    </div>
  );
}
