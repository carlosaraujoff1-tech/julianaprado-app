import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';

import { gerarFotos, Recorte, type Corte } from './Recorte';
import { mensagemErro, supabase } from './supabase';

type Status = 'pendente' | 'aprovado' | 'recusado' | 'arquivado';
type Post = {
  id: string; imagem_url: string; imagem_mini_url: string; titulo: string | null; legenda: string | null; hashtags: string[];
  status: Status; motivo_recusa: string | null; criado_em: string; publicado_em: string | null; curtidas: number;
  criado_por: string | null; produto: { nome: string } | null; autor: { nome: string; email: string } | null;
};

const ABAS: { status: Status; nome: string }[] = [
  { status: 'pendente', nome: 'Para aprovar' },
  { status: 'aprovado', nome: 'Publicados' },
  { status: 'recusado', nome: 'Recusados' },
  { status: 'arquivado', nome: 'Fora do ar' },
];

const quando = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export function Posts({ admin, uid }: { admin: boolean; uid: string }) {
  const qc = useQueryClient();
  const [aba, setAba] = useState<Status>('pendente');
  const [novo, setNovo] = useState(false);

  const contagem = useQuery({
    queryKey: ['posts-contagem'],
    refetchInterval: 20_000,
    queryFn: async () => {
      const { count } = await supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'pendente');
      return count ?? 0;
    },
  });
  const lista = useQuery({
    queryKey: ['posts', aba],
    queryFn: async () => {
      const { data, error } = await supabase.from('posts')
        .select('id,imagem_url,imagem_mini_url,titulo,legenda,hashtags,status,motivo_recusa,criado_em,publicado_em,curtidas,criado_por,produto:produtos(nome),autor:perfis!posts_criado_por_fkey(nome,email)')
        .eq('status', aba).order(aba === 'aprovado' ? 'publicado_em' : 'criado_em', { ascending: false }).limit(60);
      if (error) throw error;
      return (data ?? []) as unknown as Post[];
    },
  });
  const atualizar = () => { qc.invalidateQueries({ queryKey: ['posts'] }); qc.invalidateQueries({ queryKey: ['posts-contagem'] }); };

  return (
    <div className="coluna">
      <div className="linha entre">
        <div>
          <h1 className="titulo">Posts da aba Descubra</h1>
          <p className="suave">{admin ? 'Você aprova o que vai para o app.' : 'Seus posts vão para aprovação de uma administradora antes de aparecer no app.'}</p>
        </div>
        {!novo && <button className="botao" onClick={() => setNovo(true)}>+ Novo post</button>}
      </div>

      {novo && <NovoPost onFechar={() => setNovo(false)} onEnviado={() => { setNovo(false); setAba('pendente'); atualizar(); }} admin={admin} />}

      <div className="chips">
        {ABAS.map((a) => (
          <button key={a.status} className={'chip' + (aba === a.status ? ' ativo' : '')} onClick={() => setAba(a.status)}>
            {a.nome}{a.status === 'pendente' && (contagem.data ?? 0) > 0 ? ` (${contagem.data})` : ''}
          </button>
        ))}
      </div>

      {lista.isLoading ? <div className="carregando" /> : (lista.data ?? []).length === 0 ? (
        <p className="suave">Nenhum post aqui.</p>
      ) : (
        <div className="grade-posts">
          {(lista.data ?? []).map((p) => <CartaoPost key={p.id} post={p} admin={admin} uid={uid} onMudou={atualizar} />)}
        </div>
      )}
    </div>
  );
}

function CartaoPost({ post, admin, uid, onMudou }: { post: Post; admin: boolean; uid: string; onMudou: () => void }) {
  const [motivo, setMotivo] = useState('');
  const [recusando, setRecusando] = useState(false);
  const [confirmarApagar, setConfirmarApagar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const acao = useMutation({
    mutationFn: async (tipo: 'aprovar' | 'recusar' | 'arquivar' | 'apagar') => {
      if (tipo === 'aprovar') { const r = await supabase.rpc('moderar_post', { p_post: post.id, p_aprovar: true }); if (r.error) throw r.error; }
      if (tipo === 'recusar') { const r = await supabase.rpc('moderar_post', { p_post: post.id, p_aprovar: false, p_motivo: motivo }); if (r.error) throw r.error; }
      if (tipo === 'arquivar') { const r = await supabase.rpc('arquivar_post', { p_post: post.id }); if (r.error) throw r.error; }
      if (tipo === 'apagar') { const r = await supabase.from('posts').delete().eq('id', post.id); if (r.error) throw r.error; }
    },
    onSuccess: () => { setErro(null); onMudou(); },
    onError: (e) => setErro(mensagemErro(e)),
  });
  const podeApagar = admin || (post.criado_por === uid && (post.status === 'pendente' || post.status === 'recusado'));

  return (
    <article className="post">
      <a href={post.imagem_url} target="_blank" rel="noreferrer"><img src={post.imagem_mini_url} alt="" loading="lazy" /></a>
      <div className="post-info">
        <b>{post.titulo || 'Sem título'}</b>
        {post.produto && <span>Peça: {post.produto.nome}</span>}
        {post.legenda && <span className="post-legenda">{post.legenda}</span>}
        {post.hashtags.length > 0 && <span className="post-tags">{post.hashtags.map((h) => '#' + h).join(' ')}</span>}
        <small>
          {post.autor ? `Por ${post.autor.nome || post.autor.email} · ` : ''}{quando(post.criado_em)}
          {post.status === 'aprovado' && post.publicado_em ? ` · no ar desde ${quando(post.publicado_em)} · ${post.curtidas} curtida(s)` : ''}
        </small>
        {post.status === 'recusado' && post.motivo_recusa && <span className="erro">Motivo: {post.motivo_recusa}</span>}
        {erro && <span className="erro">{erro}</span>}

        {admin && (post.status === 'pendente' || post.status === 'recusado' || post.status === 'arquivado') && !recusando && (
          <div className="linha">
            <button className="botao pequeno" disabled={acao.isPending} onClick={() => acao.mutate('aprovar')}>Aprovar e publicar</button>
            {post.status === 'pendente' && <button className="botao pequeno contorno" onClick={() => setRecusando(true)}>Recusar</button>}
          </div>
        )}
        {recusando && (
          <div className="coluna estreita">
            <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo (a autora vai ver)" maxLength={140} />
            <div className="linha">
              <button className="botao pequeno escuro" disabled={!motivo.trim() || acao.isPending} onClick={() => acao.mutate('recusar')}>Confirmar recusa</button>
              <button className="botao pequeno texto" onClick={() => setRecusando(false)}>Cancelar</button>
            </div>
          </div>
        )}
        {admin && post.status === 'aprovado' && (
          <div className="linha"><button className="botao pequeno contorno" disabled={acao.isPending} onClick={() => acao.mutate('arquivar')}>Tirar do ar</button></div>
        )}
        {podeApagar && post.status !== 'aprovado' && (
          confirmarApagar ? (
            <div className="linha">
              <button className="botao pequeno escuro" onClick={() => acao.mutate('apagar')}>Apagar de vez</button>
              <button className="botao pequeno texto" onClick={() => setConfirmarApagar(false)}>Cancelar</button>
            </div>
          ) : <button className="link esquerda" onClick={() => setConfirmarApagar(true)}>Apagar</button>
        )}
      </div>
    </article>
  );
}

type Produto = { id: string; nome: string; imagem_principal: string | null; preco: number };

function NovoPost({ onFechar, onEnviado, admin }: { onFechar: () => void; onEnviado: () => void; admin: boolean }) {
  const entrada = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const corte = useRef<Corte | null>(null);
  const [titulo, setTitulo] = useState('');
  const [legenda, setLegenda] = useState('');
  const [tags, setTags] = useState('JulianaPrado');
  const [busca, setBusca] = useState('');
  const [produto, setProduto] = useState<Produto | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const produtos = useQuery({
    queryKey: ['produtos-busca', busca],
    enabled: busca.trim().length >= 2 && !produto,
    queryFn: async () => {
      const { data, error } = await supabase.from('produtos').select('id,nome,imagem_principal,preco').eq('ativo', true)
        .ilike('nome', `%${busca.trim()}%`).order('nome').limit(8);
      if (error) throw error;
      return (data ?? []) as Produto[];
    },
  });

  const enviar = useMutation({
    mutationFn: async () => {
      if (!corte.current) throw new Error('Escolha a foto.');
      const fotos = await gerarFotos(corte.current);
      const pasta = `${crypto.randomUUID()}`;
      const a = await supabase.storage.from('posts').upload(`${pasta}/foto.webp`, fotos.grande, { contentType: 'image/webp' });
      if (a.error) throw a.error;
      const b = await supabase.storage.from('posts').upload(`${pasta}/mini.webp`, fotos.mini, { contentType: 'image/webp' });
      if (b.error) throw b.error;
      const url = (p: string) => supabase.storage.from('posts').getPublicUrl(p).data.publicUrl;
      const hashtags = tags.split(/[\s,#]+/).map((t) => t.trim()).filter(Boolean).slice(0, 8);
      const r = await supabase.from('posts').insert({
        imagem_url: url(`${pasta}/foto.webp`), imagem_mini_url: url(`${pasta}/mini.webp`),
        titulo: titulo.trim() || null, legenda: legenda.trim() || null, hashtags, produto_id: produto?.id ?? null,
      });
      if (r.error) throw r.error;
      return { kb: Math.round(fotos.grande.size / 1024), l: fotos.largura, a: fotos.altura };
    },
    onSuccess: onEnviado,
    onError: (e) => setErro(mensagemErro(e)),
  });

  return (
    <section className="cartao novo-post">
      <div className="linha entre">
        <h2 className="subtitulo">Novo post</h2>
        <button className="botao pequeno texto" onClick={onFechar}>Fechar</button>
      </div>
      <div className="novo-grade">
        <div className="campo">
          <span className="rotulo">Foto</span>
          <input ref={entrada} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) setArquivo(f); e.target.value = ''; }} />
          {arquivo ? (
            <>
              <Recorte arquivo={arquivo} onPronto={(c) => { corte.current = c; }} />
              <button type="button" className="botao pequeno contorno" onClick={() => entrada.current?.click()}>Trocar foto</button>
            </>
          ) : (
            <button type="button" className="soltar alto" onClick={() => entrada.current?.click()}
              onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) setArquivo(f); }}>
              <b>Escolher foto</b><span>ou arraste aqui · de preferência em pé (vertical)</span>
            </button>
          )}
        </div>

        <div className="coluna">
          <label>Título sobre a foto <small>{titulo.length}/60</small>
            <input value={titulo} maxLength={60} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Elegância em cada detalhe" />
          </label>
          <label>Legenda <small>{legenda.length}/400</small>
            <textarea value={legenda} maxLength={400} rows={3} onChange={(e) => setLegenda(e.target.value)} placeholder="Ex.: Porque você merece se sentir ainda mais linda!" />
          </label>
          <label>Hashtags <small>separe por espaço</small>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="JulianaPrado Joias Elegancia" />
          </label>
          <div className="campo">
            <span className="rotulo">Peça que aparece na foto (botão Comprar)</span>
            {produto ? (
              <div className="produto-escolhido">
                {produto.imagem_principal && <img src={produto.imagem_principal + (produto.imagem_principal.includes('?') ? '&' : '?') + 'width=120'} alt="" />}
                <span>{produto.nome}</span>
                <button type="button" className="botao pequeno texto" onClick={() => { setProduto(null); setBusca(''); }}>Trocar</button>
              </div>
            ) : (
              <>
                <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Digite o nome da peça" />
                {(produtos.data ?? []).length > 0 && (
                  <ul className="sugestoes">
                    {produtos.data!.map((p) => <li key={p.id}><button type="button" onClick={() => setProduto(p)}>{p.nome}</button></li>)}
                  </ul>
                )}
              </>
            )}
          </div>
          {erro && <p className="erro">{erro}</p>}
          <button className="botao" disabled={!arquivo || enviar.isPending} onClick={() => { setErro(null); enviar.mutate(); }}>
            {enviar.isPending ? 'Reduzindo e enviando a foto…' : 'Enviar para aprovação'}
          </button>
          <p className="legenda">
            A foto é reduzida automaticamente antes de subir (até 1080 x 1920, formato WebP leve).
            {admin ? ' Depois de enviar, aprove na lista "Para aprovar".' : ' Uma administradora aprova antes de aparecer no app.'}
          </p>
        </div>
      </div>
    </section>
  );
}
