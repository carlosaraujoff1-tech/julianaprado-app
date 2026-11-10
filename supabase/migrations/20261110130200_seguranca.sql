-- Quem é quem + regras de acesso (RLS) em TODAS as tabelas.

create or replace function public.eh_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.perfis where id = auth.uid() and tipo = 'admin');
$$;

-- Equipe = admin ou vendedora.
create or replace function public.eh_equipe()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.perfis where id = auth.uid() and tipo in ('admin', 'vendedora'));
$$;

-- Revendedora aprovada vê a tabela de preço de revenda.
create or replace function public.eh_revendedora()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.perfis where id = auth.uid() and revenda = 'aprovada');
$$;

-- Cria o perfil quando alguém se cadastra (dados vêm de raw_user_meta_data).
create or replace function privado.tg_novo_usuario()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}');
  v_cpf text := nullif(regexp_replace(coalesce(m->>'cpf', ''), '\D', '', 'g'), '');
begin
  insert into public.perfis (id, nome, email, cpf, telefone, data_nascimento, cidade, uf)
  values (
    new.id,
    coalesce(m->>'nome', ''),
    new.email,
    case when public.cpf_valido(v_cpf) then v_cpf end,
    nullif(regexp_replace(coalesce(m->>'telefone', ''), '\D', '', 'g'), ''),
    case when coalesce(m->>'data_nascimento', '') ~ '^\d{4}-\d{2}-\d{2}$' then (m->>'data_nascimento')::date end,
    nullif(m->>'cidade', ''),
    nullif(upper(m->>'uf'), '')
  );
  return new;
end $$;
create trigger ao_criar_usuario after insert on auth.users
  for each row execute function privado.tg_novo_usuario();

-- Cliente não pode mudar os próprios campos sensíveis.
create or replace function privado.tg_perfis_protege_campos()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if public.eh_admin() or auth.uid() is null or current_setting('app.interno', true) = '1' then
    return new;
  end if;
  if new.tipo is distinct from old.tipo
     or new.revenda is distinct from old.revenda
     or new.revenda_decidida_em is distinct from old.revenda_decidida_em
     or (old.cpf is not null and new.cpf is distinct from old.cpf)
     or new.email is distinct from old.email
     or new.sacola_alterada_em is distinct from old.sacola_alterada_em
     or new.sacola_aviso_1h_em is distinct from old.sacola_aviso_1h_em
     or new.sacola_aviso_1d_em is distinct from old.sacola_aviso_1d_em
     or new.bubble_id is distinct from old.bubble_id
     or new.criado_em is distinct from old.criado_em then
    raise exception 'Sem permissão para alterar estes campos' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger perfis_protege_campos before update on public.perfis
  for each row execute function privado.tg_perfis_protege_campos();

alter table public.perfis            enable row level security;
alter table public.categorias        enable row level security;
alter table public.produtos          enable row level security;
alter table public.produto_variacoes enable row level security;
alter table public.banners           enable row level security;
alter table public.configuracoes     enable row level security;
alter table public.favoritos         enable row level security;
alter table public.sacola_itens      enable row level security;
alter table public.cupons            enable row level security;
alter table public.pedidos           enable row level security;
alter table public.pedido_itens      enable row level security;
alter table public.notificacoes      enable row level security;
alter table public.erros_app         enable row level security;

-- Perfis: cada um vê o seu; equipe vê todos. Só o próprio (ou admin) edita.
create policy perfis_ler on public.perfis for select to authenticated
  using (id = (select auth.uid()) or (select public.eh_equipe()));
create policy perfis_editar on public.perfis for update to authenticated
  using (id = (select auth.uid()) or (select public.eh_admin()))
  with check (id = (select auth.uid()) or (select public.eh_admin()));

-- Vitrine pública (sem login): categorias, banners, variações e configurações.
create policy categorias_ler on public.categorias for select to anon, authenticated
  using (ativo or (select public.eh_equipe()));
create policy categorias_admin on public.categorias for all to authenticated
  using ((select public.eh_admin())) with check ((select public.eh_admin()));

create policy banners_ler on public.banners for select to anon, authenticated
  using (ativo or (select public.eh_equipe()));
create policy banners_admin on public.banners for all to authenticated
  using ((select public.eh_admin())) with check ((select public.eh_admin()));

create policy variacoes_ler on public.produto_variacoes for select to anon, authenticated
  using (ativo or (select public.eh_equipe()));
create policy variacoes_admin on public.produto_variacoes for all to authenticated
  using ((select public.eh_admin())) with check ((select public.eh_admin()));

create policy configuracoes_ler on public.configuracoes for select to anon, authenticated
  using (true);
create policy configuracoes_admin on public.configuracoes for all to authenticated
  using ((select public.eh_admin())) with check ((select public.eh_admin()));

-- Produtos: a tabela tem o preço de revenda, então o público NÃO lê direto.
-- O app usa as funções vitrine_* (que mostram o preço certo para cada pessoa).
create policy produtos_equipe_ler on public.produtos for select to authenticated
  using ((select public.eh_equipe()));
create policy produtos_admin on public.produtos for all to authenticated
  using ((select public.eh_admin())) with check ((select public.eh_admin()));

create policy favoritos_proprio on public.favoritos for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

create policy sacola_propria on public.sacola_itens for all to authenticated
  using (usuario_id = (select auth.uid()) or (select public.eh_equipe()))
  with check (usuario_id = (select auth.uid()));

create policy cupons_equipe_ler on public.cupons for select to authenticated
  using ((select public.eh_equipe()));
create policy cupons_admin on public.cupons for all to authenticated
  using ((select public.eh_admin())) with check ((select public.eh_admin()));

-- Pedidos: cliente vê os seus; equipe vê e atualiza (só colunas liberadas abaixo).
create policy pedidos_ler on public.pedidos for select to authenticated
  using (cliente_id = (select auth.uid()) or (select public.eh_equipe()));
create policy pedidos_equipe_editar on public.pedidos for update to authenticated
  using ((select public.eh_equipe())) with check ((select public.eh_equipe()));

create policy pedido_itens_ler on public.pedido_itens for select to authenticated
  using (exists (select 1 from public.pedidos p
                  where p.id = pedido_id
                    and (p.cliente_id = (select auth.uid()) or (select public.eh_equipe()))));

create policy notificacoes_ler on public.notificacoes for select to anon, authenticated
  using (destinatario_id is null
         or destinatario_id = (select auth.uid())
         or (select public.eh_admin()));
create policy notificacoes_admin on public.notificacoes for insert to authenticated
  with check ((select public.eh_admin()));

create policy erros_registrar on public.erros_app for insert to anon, authenticated
  with check (usuario_id is null or usuario_id = (select auth.uid()));
create policy erros_admin_ler on public.erros_app for select to authenticated
  using ((select public.eh_admin()));

-- Permissões de tabela (além do RLS): o visitante só lê o necessário.
revoke all on all tables in schema public from anon;
grant select on public.categorias, public.banners, public.produto_variacoes,
                public.configuracoes, public.notificacoes to anon;
grant insert on public.erros_app to anon;

-- Pedidos: ninguém cria/apaga direto (só pela função criar_pedido);
-- a equipe só altera status, atendente e observações internas.
revoke insert, update, delete on public.pedidos, public.pedido_itens from authenticated;
grant update (status, atendente_id, observacoes_internas) on public.pedidos to authenticated;
