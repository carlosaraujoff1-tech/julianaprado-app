-- Funções da aba Descubra: feed, curtir, salvar, moderar. E avisos de moderação.

-- Feed: posts aprovados, mais novos primeiro, já com a peça ligada e o preço certo
-- para quem está vendo (varejo ou revenda). p_salvos = só os que a pessoa salvou.
create or replace function public.feed_posts(p_limite integer default 8, p_antes timestamptz default null, p_salvos boolean default false)
returns table (
  id uuid, imagem_url text, imagem_mini_url text, titulo text, legenda text, hashtags text[],
  publicado_em timestamptz, curtidas integer, curtido boolean, salvo boolean,
  produto_id uuid, produto_nome text, produto_imagem text, preco_de numeric, preco_por numeric,
  tem_variacoes boolean, esgotado boolean)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_rev boolean := public.eh_revendedora();
  v_uid uuid := auth.uid();
begin
  if p_salvos and v_uid is null then return; end if;
  return query
  select p.id, p.imagem_url, p.imagem_mini_url, p.titulo, p.legenda, p.hashtags,
         p.publicado_em, p.curtidas,
         (v_uid is not null and exists (select 1 from public.post_curtidas c where c.post_id = p.id and c.usuario_id = v_uid)),
         (v_uid is not null and exists (select 1 from public.post_salvos s where s.post_id = p.id and s.usuario_id = v_uid)),
         pr.id, pr.nome, pr.imagem_principal,
         case when pr.id is not null then (privado.precos(pr, v_rev)).preco_de end,
         case when pr.id is not null then (privado.precos(pr, v_rev)).preco_por end,
         case when pr.id is not null then exists (select 1 from public.produto_variacoes v where v.produto_id = pr.id and v.ativo) end,
         case when pr.id is not null then privado.esgotado(pr) end
    from public.posts p
    left join public.produtos pr on pr.id = p.produto_id and pr.ativo
    left join public.post_salvos sv on p_salvos and sv.post_id = p.id and sv.usuario_id = v_uid
   where p.status = 'aprovado' and p.publicado_em <= now()
     and (not p_salvos or sv.post_id is not null)
     and (p_antes is null or p.publicado_em < p_antes)
   order by case when p_salvos then sv.criado_em end desc nulls last, p.publicado_em desc
   limit least(greatest(coalesce(p_limite, 8), 1), 50);
end $$;

create or replace function public.alternar_curtida(p_post uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := privado.exigir_login();
  v_curtido boolean;
begin
  if not exists (select 1 from public.posts where id = p_post and status = 'aprovado') then
    raise exception 'Post indisponível';
  end if;
  delete from public.post_curtidas where post_id = p_post and usuario_id = v_uid;
  if found then v_curtido := false;
  else insert into public.post_curtidas (post_id, usuario_id) values (p_post, v_uid); v_curtido := true;
  end if;
  return jsonb_build_object('curtido', v_curtido, 'curtidas', (select curtidas from public.posts where id = p_post));
end $$;

create or replace function public.alternar_salvo(p_post uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := privado.exigir_login();
begin
  if not exists (select 1 from public.posts where id = p_post and status = 'aprovado') then
    raise exception 'Post indisponível';
  end if;
  delete from public.post_salvos where post_id = p_post and usuario_id = v_uid;
  if found then return false; end if;
  insert into public.post_salvos (post_id, usuario_id) values (p_post, v_uid);
  return true;
end $$;

-- Aprovar (publica na hora) ou recusar (com motivo). Só administradora.
create or replace function public.moderar_post(p_post uuid, p_aprovar boolean, p_motivo text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.eh_admin() then raise exception 'Só administradora aprova posts' using errcode = '42501'; end if;
  if not p_aprovar and coalesce(trim(p_motivo), '') = '' then raise exception 'Diga o motivo da recusa'; end if;
  perform set_config('app.interno', '1', true);
  update public.posts
     set status = case when p_aprovar then 'aprovado' else 'recusado' end::public.status_post,
         motivo_recusa = case when p_aprovar then null else trim(p_motivo) end,
         moderado_por = auth.uid(), moderado_em = now(),
         publicado_em = case when p_aprovar then coalesce(publicado_em, now()) else publicado_em end
   where id = p_post and status in ('pendente', 'recusado', 'arquivado');
  if not found then raise exception 'Post não encontrado ou já aprovado'; end if;
  perform set_config('app.interno', '', true);
end $$;

-- Tirar do ar (sem apagar). Só administradora.
create or replace function public.arquivar_post(p_post uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.eh_admin() then raise exception 'Só administradora arquiva posts' using errcode = '42501'; end if;
  perform set_config('app.interno', '1', true);
  update public.posts set status = 'arquivado', moderado_por = auth.uid(), moderado_em = now() where id = p_post;
  perform set_config('app.interno', '', true);
end $$;

-- ===== Avisos =====
alter table public.eventos_push drop constraint if exists eventos_push_publico_check;
alter table public.eventos_push add constraint eventos_push_publico_check check (publico in ('cliente', 'equipe', 'admins', 'todos'));

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
    union all
    select id from public.perfis where e.publico = 'admins' and tipo = 'admin'
  loop
    insert into public.notificacoes (titulo, corpo, rota, destinatario_id, evento)
    values (privado.aplicar_modelo(e.titulo, p_vars), privado.aplicar_modelo(e.corpo, p_vars),
            privado.aplicar_modelo(e.rota, p_vars), dest, p_chave);
  end loop;
end $$;

insert into public.eventos_push (chave, descricao, publico, titulo, corpo, rota) values
  ('post_pendente', 'Post novo esperando aprovação (para administradoras)', 'admins',
   'Post para aprovar', '{autor} enviou um post para a aba Descubra: "{titulo}".', null),
  ('post_aprovado', 'Post aprovado (para quem enviou)', 'cliente',
   'Seu post foi publicado ✨', '"{titulo}" já está na aba Descubra.', '/descubra'),
  ('post_recusado', 'Post recusado (para quem enviou)', 'cliente',
   'Post não aprovado', '"{titulo}": {motivo}', null)
on conflict (chave) do nothing;

create or replace function privado.tg_evento_post()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_titulo text := coalesce(nullif(new.titulo, ''), 'sem título');
begin
  if tg_op = 'INSERT' or (new.status = 'pendente' and old.status is distinct from 'pendente') then
    if new.status = 'pendente' then
      perform privado.disparar_evento('post_pendente', null, jsonb_build_object(
        'titulo', v_titulo, 'autor', coalesce((select nullif(nome, '') from public.perfis where id = new.criado_por), 'Alguém da equipe')));
    end if;
  elsif new.status is distinct from old.status and new.criado_por is not null
        and new.criado_por is distinct from new.moderado_por then
    if new.status = 'aprovado' then
      perform privado.disparar_evento('post_aprovado', new.criado_por, jsonb_build_object('titulo', v_titulo));
    elsif new.status = 'recusado' then
      perform privado.disparar_evento('post_recusado', new.criado_por, jsonb_build_object('titulo', v_titulo, 'motivo', coalesce(new.motivo_recusa, '')));
    end if;
  end if;
  return null;
end $$;
create trigger evento_post after insert or update of status on public.posts
  for each row execute function privado.tg_evento_post();

grant execute on function public.feed_posts(integer, timestamptz, boolean) to anon, authenticated;
grant execute on function public.alternar_curtida(uuid) to authenticated;
grant execute on function public.alternar_salvo(uuid) to authenticated;
grant execute on function public.moderar_post(uuid, boolean, text) to authenticated;
grant execute on function public.arquivar_post(uuid) to authenticated;
