-- Base: extensões, schema privado, tipos e funções utilitárias.
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm  with schema extensions;
create extension if not exists pg_net   with schema extensions;
create extension if not exists pg_cron;

-- Schema "privado": nunca exposto pela API (configurações e funções internas).
create schema if not exists privado;
revoke all on schema privado from public, anon, authenticated;

create table privado.config (
  chave text primary key,
  valor text not null
);

create or replace function privado.cfg(p_chave text)
returns text language sql stable security definer set search_path = '' as $$
  select valor from privado.config where chave = p_chave;
$$;

create type public.tipo_perfil      as enum ('cliente', 'vendedora', 'admin');
create type public.situacao_revenda as enum ('nao_solicitada', 'pendente', 'aprovada', 'recusada');
create type public.status_pedido    as enum ('recebido', 'pago', 'em_separacao', 'enviado', 'entregue', 'cancelado');
create type public.tipo_cupom       as enum ('percentual', 'valor');

create or replace function public.tg_set_atualizado_em()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.atualizado_em := now();
  return new;
end $$;

-- Texto em minúsculas e sem acento (usado na busca).
create or replace function public.sem_acento(t text)
returns text language sql immutable parallel safe set search_path = '' as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(t, '')));
$$;

-- Valida CPF (só dígitos, 11 números, dígitos verificadores corretos).
create or replace function public.cpf_valido(p text)
returns boolean language plpgsql immutable set search_path = '' as $$
declare
  s int; d1 int; d2 int; i int;
begin
  if p is null or p !~ '^\d{11}$' or p ~ '^(\d)\1{10}$' then
    return false;
  end if;
  s := 0;
  for i in 1..9 loop s := s + substr(p, i, 1)::int * (11 - i); end loop;
  d1 := (s * 10) % 11; if d1 = 10 then d1 := 0; end if;
  s := 0;
  for i in 1..10 loop s := s + substr(p, i, 1)::int * (12 - i); end loop;
  d2 := (s * 10) % 11; if d2 = 10 then d2 := 0; end if;
  return d1 = substr(p, 10, 1)::int and d2 = substr(p, 11, 1)::int;
end $$;

create or replace function public.formatar_reais(v numeric)
returns text language sql immutable set search_path = '' as $$
  select 'R$ ' || replace(replace(replace(to_char(coalesce(v, 0), 'FM999G999G990D00'), ',', '#'), '.', ','), '#', '.');
$$;

create or replace function public.status_pedido_rotulo(s public.status_pedido)
returns text language sql immutable set search_path = '' as $$
  select case s
    when 'recebido'     then 'Recebido'
    when 'pago'         then 'Pago'
    when 'em_separacao' then 'Em separação'
    when 'enviado'      then 'Enviado'
    when 'entregue'     then 'Entregue'
    when 'cancelado'    then 'Cancelado'
  end;
$$;
