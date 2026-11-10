-- Notificações push: aparelhos, modelos de aviso por evento, fila e gatilhos.
-- Diferente da Raio de Luz: visitante (sem login) também registra o aparelho
-- e recebe os avisos gerais (ofertas, cupons). Ao entrar na conta, o mesmo
-- aparelho passa a ficar ligado à pessoa.

create table public.dispositivos_push (
  id            uuid primary key default gen_random_uuid(),
  usuario_id    uuid references public.perfis(id) on delete set null,
  token         text not null unique,
  plataforma    text not null check (plataforma in ('ios', 'android')),
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index dispositivos_usuario_idx on public.dispositivos_push (usuario_id) where ativo;
create trigger dispositivos_atualizado_em before update on public.dispositivos_push
  for each row execute function public.tg_set_atualizado_em();
alter table public.dispositivos_push enable row level security;
create policy dispositivos_ler on public.dispositivos_push for select to authenticated
  using (usuario_id = (select auth.uid()) or (select public.eh_admin()));

-- Chamado pelo app ao abrir (visitante) e ao entrar/sair da conta.
create or replace function public.registrar_dispositivo(p_token text, p_plataforma text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_token !~ '^Expo(nent)?PushToken\[.+\]$' then
    raise exception 'Token inválido';
  end if;
  insert into public.dispositivos_push (usuario_id, token, plataforma)
  values (auth.uid(), p_token, p_plataforma)
  on conflict (token) do update
    set usuario_id = auth.uid(), plataforma = excluded.plataforma, ativo = true;
end $$;

create table public.eventos_push (
  chave         text primary key,
  descricao     text not null,
  publico       text not null check (publico in ('cliente', 'equipe', 'todos')),
  ativo         boolean not null default true,
  titulo        text not null,
  corpo         text not null,
  rota          text,
  atualizado_em timestamptz not null default now()
);
create trigger eventos_push_atualizado_em before update on public.eventos_push
  for each row execute function public.tg_set_atualizado_em();
alter table public.eventos_push enable row level security;
create policy eventos_push_admin on public.eventos_push for all to authenticated
  using ((select public.eh_admin())) with check ((select public.eh_admin()));

insert into public.eventos_push (chave, descricao, publico, titulo, corpo, rota) values
  ('pedido_novo', 'Novo pedido recebido (para a equipe)', 'equipe',
   'Novo pedido Nº {numero}', '{cliente} fez um pedido de {total}.', '/pedido/{pedido_id}'),
  ('pedido_status', 'Status do pedido mudou (para a cliente)', 'cliente',
   'Pedido Nº {numero}: {status}', 'Toque para ver os detalhes do seu pedido.', '/pedido/{pedido_id}'),
  ('revenda_solicitada', 'Pedido de acesso de revenda (para a equipe)', 'equipe',
   'Pedido de revenda', '{nome} quer comprar com preço de revenda.', null),
  ('revenda_aprovada', 'Acesso de revenda aprovado (para a cliente)', 'cliente',
   'Acesso de revenda liberado! ✨', 'Olá, {nome}! Agora você já vê os preços de revenda no app.', '/'),
  ('cupom_novo', 'Cupom novo divulgado (para todos)', 'todos',
   'Cupom {codigo} liberado! 🎁', '{descricao}', '/'),
  ('sacola_1h', 'Sacola esquecida há 1 hora', 'cliente',
   'Suas peças estão esperando 💛', 'Você deixou itens na sacola. Finalize antes que acabem!', '/sacola'),
  ('sacola_1d', 'Sacola esquecida há 1 dia', 'cliente',
   'Ainda pensando? 💛', 'Os itens da sua sacola continuam reservados para você por pouco tempo.', '/sacola'),
  ('favorito_oferta', 'Produto favorito entrou em oferta', 'cliente',
   '{produto} entrou em oferta!', 'De {preco_de} por {preco_por}. Corre!', '/produto/{produto_id}');

create table public.fila_push (
  id              bigint generated always as identity primary key,
  notificacao_id  uuid not null references public.notificacoes(id) on delete cascade,
  status          text not null default 'pendente' check (status in ('pendente', 'enviando', 'enviado', 'erro')),
  tentativas      integer not null default 0,
  enviados        integer,
  erro            text,
  criado_em       timestamptz not null default now(),
  processado_em   timestamptz
);
create index fila_push_pendentes on public.fila_push (criado_em) where status in ('pendente', 'enviando');
create index fila_push_notificacao_idx on public.fila_push (notificacao_id);
alter table public.fila_push enable row level security;
create policy fila_push_admin_ler on public.fila_push for select to authenticated
  using ((select public.eh_admin()));

create or replace function privado.aplicar_modelo(p_texto text, p_vars jsonb)
returns text language plpgsql immutable set search_path = '' as $$
declare
  k text; v text; r text := p_texto;
begin
  if r is null then return null; end if;
  for k, v in select * from jsonb_each_text(p_vars) loop
    r := replace(r, '{' || k || '}', coalesce(v, ''));
  end loop;
  return r;
end $$;

-- Cria a(s) notificação(ões) de um evento usando o modelo editável em eventos_push.
create or replace function privado.disparar_evento(p_chave text, p_usuario uuid, p_vars jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  e public.eventos_push%rowtype;
  dest uuid;
begin
  select * into e from public.eventos_push where chave = p_chave and ativo;
  if not found then return; end if;

  if e.publico = 'todos' then
    insert into public.notificacoes (titulo, corpo, rota, destinatario_id, evento)
    values (privado.aplicar_modelo(e.titulo, p_vars), privado.aplicar_modelo(e.corpo, p_vars),
            privado.aplicar_modelo(e.rota, p_vars), null, p_chave);
    return;
  end if;

  for dest in
    select p_usuario where e.publico = 'cliente' and p_usuario is not null
    union all
    select id from public.perfis where e.publico = 'equipe' and tipo in ('admin', 'vendedora')
  loop
    insert into public.notificacoes (titulo, corpo, rota, destinatario_id, evento)
    values (privado.aplicar_modelo(e.titulo, p_vars), privado.aplicar_modelo(e.corpo, p_vars),
            privado.aplicar_modelo(e.rota, p_vars), dest, p_chave);
  end loop;
end $$;

create or replace function privado.tg_notificacao_para_fila()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.fila_push (notificacao_id) values (new.id);
  return new;
end $$;
create trigger notificacao_para_fila after insert on public.notificacoes
  for each row execute function privado.tg_notificacao_para_fila();

-- Chama a Edge Function que envia (pelo pg_net, sem travar quem inseriu).
create or replace function privado.chamar_processar_push()
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_url text := privado.cfg('edge_functions_url');
  v_seg text := privado.cfg('push_segredo');
begin
  if v_url is null or v_seg is null then return; end if;
  perform net.http_post(
    url     := v_url || '/processar-fila-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-segredo', v_seg),
    body    := '{}'::jsonb);
end $$;

create or replace function privado.tg_fila_acionar()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform privado.chamar_processar_push();
  return null;
end $$;
create trigger fila_acionar after insert on public.fila_push
  for each statement execute function privado.tg_fila_acionar();

-- Funções usadas só pela Edge Function (service_role).
create or replace function public.push_segredo_confere(p_segredo text)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_segredo is not null and p_segredo = privado.cfg('push_segredo');
$$;

create or replace function public.reservar_fila_push(p_limite integer default 50)
returns table (id bigint, notificacao_id uuid)
language sql security definer set search_path = '' as $$
  update public.fila_push f
     set status = 'enviando', tentativas = f.tentativas + 1
   where f.id in (
     select q.id from public.fila_push q
      where (q.status = 'pendente' or (q.status = 'enviando' and q.criado_em < now() - interval '2 minutes'))
        and q.tentativas < 5
      order by q.id
      limit p_limite
      for update skip locked)
  returning f.id, f.notificacao_id;
$$;

-- Contador do sininho: notificações que chegaram depois da última vez que a pessoa abriu a tela.
create or replace function public.contar_notificacoes_nao_lidas()
returns integer language sql stable security definer set search_path = '' as $$
  select count(*)::integer
    from public.notificacoes n
    join public.perfis p on p.id = auth.uid()
   where n.criado_em > greatest(p.notificacoes_lidas_em, p.criado_em)
     and (n.destinatario_id = p.id or n.destinatario_id is null);
$$;

create or replace function public.marcar_notificacoes_lidas()
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform set_config('app.interno', '1', true);
  update public.perfis set notificacoes_lidas_em = now() where id = auth.uid();
  perform set_config('app.interno', '', true);
end $$;

