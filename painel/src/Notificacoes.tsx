import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';

import { prepararFoto } from './imagem';
import { mensagemErro, supabase } from './supabase';

type Enviada = {
  id: string; titulo: string; corpo: string; imagem_url: string | null; rota: string | null; criado_em: string; evento: string | null;
  fila_push: { status: string; enviados: number | null; erro: string | null; tentativas: number }[];
};

const DESTINOS = [
  { rota: '/', nome: 'Início' },
  { rota: '/lista/novidades', nome: 'Novidades' },
  { rota: '/lista/ofertas', nome: 'Ofertas' },
  { rota: '/lista/destaques', nome: 'Destaques' },
  { rota: '/sacola', nome: 'Sacola' },
];

function quando(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function Notificacoes() {
  const qc = useQueryClient();
  const [titulo, setTitulo] = useState('');
  const [corpo, setCorpo] = useState('');
  const [rota, setRota] = useState('/');
  const [foto, setFoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  const aparelhos = useQuery({
    queryKey: ['aparelhos'],
    queryFn: async () => {
      const [a, b] = await Promise.all([
        supabase.from('dispositivos_push').select('id', { count: 'exact', head: true }).eq('ativo', true),
        supabase.from('dispositivos_push').select('id', { count: 'exact', head: true }).eq('ativo', true).is('usuario_id', null),
      ]);
      return { total: a.count ?? 0, visitantes: b.count ?? 0 };
    },
  });

  const categorias = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categorias').select('id,nome').eq('ativo', true).order('ordem');
      if (error) throw error;
      return data ?? [];
    },
  });

  const historico = useQuery({
    queryKey: ['enviadas'],
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase.from('notificacoes')
        .select('id,titulo,corpo,imagem_url,rota,criado_em,evento,fila_push(status,enviados,erro,tentativas)')
        .is('destinatario_id', null).order('criado_em', { ascending: false }).limit(20);
      if (error) throw error;
      return (data ?? []) as unknown as Enviada[];
    },
  });

  const enviar = useMutation({
    mutationFn: async () => {
      let imagem_url: string | null = null;
      if (foto) {
        const caminho = `notificacoes/${Date.now()}.jpg`;
        const up = await supabase.storage.from('catalogo').upload(caminho, foto.blob, { contentType: 'image/jpeg' });
        if (up.error) throw up.error;
        imagem_url = supabase.storage.from('catalogo').getPublicUrl(caminho).data.publicUrl;
      }
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from('notificacoes').insert({ titulo: titulo.trim(), corpo: corpo.trim(), imagem_url, rota, criado_por: u.user?.id ?? null });
      if (error) throw error;
    },
    onSuccess: () => {
      setMsg({ tipo: 'ok', texto: 'Notificação enviada! O resultado aparece em "Últimas enviadas" em alguns segundos.' });
      setTitulo(''); setCorpo(''); setFoto(null); setRota('/'); setConfirmar(false);
      qc.invalidateQueries({ queryKey: ['enviadas'] });
    },
    onError: (e) => { setMsg({ tipo: 'erro', texto: mensagemErro(e) }); setConfirmar(false); },
  });

  async function escolher(arquivo?: File) {
    if (!arquivo) return;
    try { setFoto(await prepararFoto(arquivo)); setConfirmar(false); }
    catch (e) { setMsg({ tipo: 'erro', texto: 'Não consegui preparar a foto: ' + mensagemErro(e) }); }
  }

  function clicar() {
    setMsg(null);
    if (titulo.trim().length < 3 || corpo.trim().length < 3) return setMsg({ tipo: 'erro', texto: 'Preencha o título e o texto.' });
    if (!confirmar) return setConfirmar(true);
    enviar.mutate();
  }

  const destinos = [...DESTINOS, ...(categorias.data ?? []).map((c) => ({ rota: `/categoria/${c.id}`, nome: c.nome }))];
  const total = aparelhos.data?.total ?? 0;

  return (
    <div className="grade2">
      <section className="cartao">
        <h1 className="titulo">Enviar notificação</h1>
        <p className="suave">
          Vai para <b>{aparelhos.isLoading ? '…' : total} {total === 1 ? 'aparelho' : 'aparelhos'}</b> com o app instalado
          {total > 0 && <> ({aparelhos.data?.visitantes} sem conta)</>}.
          {total === 0 && <> Ainda não há aparelho registrado: instale o app, permita as notificações e abra uma vez.</>}
        </p>

        <label>Título <small>{titulo.length}/65</small>
          <input value={titulo} maxLength={65} onChange={(e) => { setTitulo(e.target.value); setConfirmar(false); }} placeholder="Ex.: Coleção nova chegou ✨" />
        </label>
        <label>Texto <small>{corpo.length}/180</small>
          <textarea value={corpo} maxLength={180} rows={3} onChange={(e) => { setCorpo(e.target.value); setConfirmar(false); }} placeholder="Ex.: Brincos e colares da Primavera com 10% de desconto." />
        </label>

        <div className="campo">
          <span className="rotulo">Foto (opcional)</span>
          <input ref={entrada} type="file" accept="image/*" hidden onChange={(e) => { escolher(e.target.files?.[0]); e.target.value = ''; }} />
          {foto ? (
            <div className="foto-caixa">
              <img src={foto.url} alt="Foto da notificação" />
              <div className="linha">
                <button type="button" className="botao pequeno contorno" onClick={() => entrada.current?.click()}>Trocar</button>
                <button type="button" className="botao pequeno texto" onClick={() => { setFoto(null); setConfirmar(false); }}>Remover</button>
              </div>
            </div>
          ) : (
            <button type="button" className="soltar" onClick={() => entrada.current?.click()}
              onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); escolher(e.dataTransfer.files?.[0]); }}>
              <b>Escolher foto</b><span>ou arraste aqui · recorte automático no formato 2 × 1</span>
            </button>
          )}
        </div>

        <div className="campo">
          <span className="rotulo">Ao tocar, abrir</span>
          <div className="chips">
            {destinos.map((d) => (
              <button type="button" key={d.rota} className={'chip' + (rota === d.rota ? ' ativo' : '')} onClick={() => setRota(d.rota)}>{d.nome}</button>
            ))}
          </div>
        </div>

        {msg && <p className={msg.tipo === 'ok' ? 'ok' : 'erro'}>{msg.texto}</p>}
        <div className="linha">
          <button className={'botao' + (confirmar ? ' escuro' : '')} onClick={clicar} disabled={enviar.isPending}>
            {enviar.isPending ? 'Enviando…' : confirmar ? `Confirmar envio para ${total} aparelho${total === 1 ? '' : 's'}` : 'Enviar notificação'}
          </button>
          {confirmar && !enviar.isPending && <button className="botao texto" onClick={() => setConfirmar(false)}>Cancelar</button>}
        </div>
      </section>

      <aside className="coluna">
        <section className="cartao">
          <h2 className="subtitulo">Prévia no celular</h2>
          <div className="previa">
            <div className="previa-topo"><span className="previa-icone">JP</span><small>Juliana Prado · agora</small></div>
            <b>{titulo || 'Título da notificação'}</b>
            <span>{corpo || 'Texto da notificação'}</span>
            {foto && <img src={foto.url} alt="" />}
          </div>
          <p className="legenda">Android mostra a foto grande quando a notificação é aberta na barra.</p>
        </section>

        <section className="cartao">
          <h2 className="subtitulo">Últimas enviadas <small>atualiza sozinho</small></h2>
          {(historico.data ?? []).length === 0 && <p className="suave">Nenhuma ainda.</p>}
          <ul className="historico">
            {(historico.data ?? []).map((n) => {
              const f = n.fila_push?.[0];
              const situ = !f ? ['na fila', 'neutro'] : f.status === 'enviado' ? [`entregue a ${f.enviados ?? 0} aparelho(s)`, 'ok'] :
                f.status === 'erro' ? [`erro: ${f.erro ?? 'desconhecido'}`, 'erro'] : [`enviando… (tentativa ${f.tentativas})`, 'neutro'];
              return (
                <li key={n.id}>
                  {n.imagem_url && <img src={n.imagem_url} alt="" />}
                  <div>
                    <b>{n.titulo}</b>
                    <span>{n.corpo}</span>
                    <small className={situ[1]}>{quando(n.criado_em)} · {n.evento ? `automática (${n.evento}) · ` : ''}{situ[0]}</small>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </aside>
    </div>
  );
}
