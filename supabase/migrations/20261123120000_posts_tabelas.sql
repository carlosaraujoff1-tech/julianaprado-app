-- Aba "Descubra": posts de foto (estilo Reels) com aprovação de administradora.
-- Regras (todas no banco):
--  * equipe (vendedora/admin) cria; o post nasce SEMPRE 'pendente';
--  * só admin aprova/recusa (função moderar_post); cliente só vê 'aprovado';
--  * autora pode corrigir enquanto pendente/recusado (recusado volta a pendente);
--  * curtidas ficam num contador no próprio post (feed rápido, sem contar linha a linha).
create type public.status_post as enum ('pendente', 'aprovado', 'recusado', 'arquivado');

create table public.posts (
  id              uuid primary key default gen_random_uuid(),
  imagem_url      text not null,
  imagem_mini_url text not null,
  titulo          text check (titulo is null or char_length(titulo) <= 60),
  legenda         text check (legenda is null or char_length(legenda) <= 400),
  hashtags        text[] not null default '{}',
  produto_id      uuid references public.produtos(id) on delete set null,
  status          public.status_post not null default 'pendente',
  motivo_recusa   text,
  criado_por      uuid references public.perfis(id) on delete set null,
  moderado_por    uuid references public.perfis(id) on delete set null,
  moderado_em     timestamptz,
  publicado_em    timestamptz,
  curtidas        integer not null default 0 check (curtidas >= 0),
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);
create trigger posts_atualizado_em before update on public.posts
  for each row execute function public.tg_set_atualizado_em();
create index posts_feed_idx   on public.posts (publicado_em desc) where status = 'aprovado';
create index posts_status_idx on public.posts (status, criado_em desc);
create index posts_produto_idx on public.posts (produto_id);

create table public.post_curtidas (
  post_id    uuid not null references public.posts(id) on delete cascade,
  usuario_id uuid not null references public.perfis(id) on delete cascade,
  criado_em  timestamptz not null default now(),
  primary key (post_id, usuario_id)
);
create index post_curtidas_usuario_idx on public.post_curtidas (usuario_id);

create table public.post_salvos (
  post_id    uuid not null references public.posts(id) on delete cascade,
  usuario_id uuid not null references public.perfis(id) on delete cascade,
  criado_em  timestamptz not null default now(),
  primary key (post_id, usuario_id)
);
create index post_salvos_usuario_idx on public.post_salvos (usuario_id, criado_em desc);

-- Protege os campos de moderação e o contador: só mudam pelas funções do banco.
create or replace function privado.tg_posts_protege()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or current_setting('app.interno', true) = '1' then
    return new;  -- SQL direto ou função interna do banco
  end if;
  if tg_op = 'INSERT' then
    new.status := 'pendente';
    new.criado_por := auth.uid();
    new.moderado_por := null; new.moderado_em := null; new.publicado_em := null;
    new.motivo_recusa := null; new.curtidas := 0;
    return new;
  end if;
  -- UPDATE comum: campos de moderação e contador não mudam
  new.criado_por := old.criado_por; new.moderado_por := old.moderado_por; new.moderado_em := old.moderado_em;
  new.publicado_em := old.publicado_em; new.curtidas := old.curtidas;
  if old.status = 'recusado' then
    new.status := 'pendente'; new.motivo_recusa := null;  -- corrigido: volta para aprovação
  else
    new.status := old.status; new.motivo_recusa := old.motivo_recusa;
  end if;
  return new;
end $$;
create trigger posts_protege before insert or update on public.posts
  for each row execute function privado.tg_posts_protege();

-- Contador de curtidas
create or replace function privado.tg_post_curtidas_contador()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform set_config('app.interno', '1', true);
  if tg_op = 'INSERT' then
    update public.posts set curtidas = curtidas + 1 where id = new.post_id;
  else
    update public.posts set curtidas = greatest(curtidas - 1, 0) where id = old.post_id;
  end if;
  perform set_config('app.interno', '', true);
  return null;
end $$;
create trigger post_curtidas_contador after insert or delete on public.post_curtidas
  for each row execute function privado.tg_post_curtidas_contador();

alter table public.posts         enable row level security;
alter table public.post_curtidas enable row level security;
alter table public.post_salvos   enable row level security;

create policy posts_ler on public.posts for select to anon, authenticated
  using ((status = 'aprovado' and publicado_em <= now()) or (select public.eh_equipe()));
create policy posts_criar on public.posts for insert to authenticated
  with check ((select public.eh_equipe()));
create policy posts_editar on public.posts for update to authenticated
  using ((select public.eh_admin())
         or ((select public.eh_equipe()) and criado_por = (select auth.uid()) and status in ('pendente', 'recusado')))
  with check ((select public.eh_equipe()));
create policy posts_apagar on public.posts for delete to authenticated
  using ((select public.eh_admin())
         or ((select public.eh_equipe()) and criado_por = (select auth.uid()) and status in ('pendente', 'recusado')));

create policy curtidas_proprias on public.post_curtidas for select to authenticated
  using (usuario_id = (select auth.uid()));
create policy salvos_proprios on public.post_salvos for select to authenticated
  using (usuario_id = (select auth.uid()));
-- (curtir/salvar só pelas funções alternar_curtida / alternar_salvo)

revoke insert, update, delete on public.post_curtidas, public.post_salvos from anon, authenticated;
revoke all on public.post_curtidas, public.post_salvos from anon;

-- Fotos dos posts: bucket público, até 1,5 MB, só WebP/JPEG. Equipe envia; só admin apaga/troca.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('posts', 'posts', true, 1572864, array['image/webp', 'image/jpeg'])
on conflict (id) do nothing;

create policy posts_equipe_envia on storage.objects for insert to authenticated
  with check (bucket_id = 'posts' and (select public.eh_equipe()));
create policy posts_admin_altera on storage.objects for update to authenticated
  using (bucket_id = 'posts' and (select public.eh_admin()))
  with check (bucket_id = 'posts' and (select public.eh_admin()));
create policy posts_admin_apaga on storage.objects for delete to authenticated
  using (bucket_id = 'posts' and (select public.eh_admin()));
