-- Gatilhos que criam notificações automáticas.


create or replace function privado.tg_evento_pedido_novo()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform privado.disparar_evento('pedido_novo', new.cliente_id, jsonb_build_object(
    'numero', new.numero, 'pedido_id', new.id, 'total', public.formatar_reais(new.total),
    'cliente', new.cliente_snapshot->>'nome'));
  return null;
end $$;
create trigger evento_pedido_novo after insert on public.pedidos
  for each row execute function privado.tg_evento_pedido_novo();

create or replace function privado.tg_evento_pedido_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status and new.cliente_id is not null then
    perform privado.disparar_evento('pedido_status', new.cliente_id, jsonb_build_object(
      'numero', new.numero, 'pedido_id', new.id, 'total', public.formatar_reais(new.total),
      'status', public.status_pedido_rotulo(new.status)));
  end if;
  return null;
end $$;
create trigger evento_pedido_status after update of status on public.pedidos
  for each row execute function privado.tg_evento_pedido_status();

create or replace function privado.tg_evento_revenda()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.revenda is distinct from old.revenda then
    if new.revenda = 'pendente' then
      perform privado.disparar_evento('revenda_solicitada', new.id,
        jsonb_build_object('nome', new.nome, 'usuario_id', new.id));
    elsif new.revenda = 'aprovada' then
      perform privado.disparar_evento('revenda_aprovada', new.id,
        jsonb_build_object('nome', split_part(new.nome, ' ', 1)));
    end if;
  end if;
  return null;
end $$;
create trigger evento_revenda after update of revenda on public.perfis
  for each row execute function privado.tg_evento_revenda();

-- Cupom marcado como "divulgar": avisa todo mundo uma vez (quando fica ativo e divulgado).
create or replace function privado.tg_evento_cupom()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.divulgar and new.ativo and new.inicio <= now()
     and (tg_op = 'INSERT' or not (old.divulgar and old.ativo)) then
    perform privado.disparar_evento('cupom_novo', null, jsonb_build_object(
      'codigo', new.codigo,
      'descricao', coalesce(nullif(new.descricao, ''),
        case when new.tipo = 'percentual' then trim(to_char(new.valor, 'FM990D##'), ',.') || '% de desconto'
             else public.formatar_reais(new.valor) || ' de desconto' end
        || ' usando o código ' || new.codigo || '.')));
  end if;
  return null;
end $$;
create trigger evento_cupom after insert or update of divulgar, ativo on public.cupons
  for each row execute function privado.tg_evento_cupom();

-- Produto favorito entrou em oferta: avisa quem favoritou (só varejo; revenda tem preço próprio).
create or replace function privado.tg_evento_favorito_oferta()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  f record;
begin
  if new.ativo and new.preco_promocional is not null
     and (old.preco_promocional is null or new.preco_promocional < old.preco_promocional) then
    for f in
      select fv.usuario_id from public.favoritos fv
        join public.perfis p on p.id = fv.usuario_id
       where fv.produto_id = new.id and p.revenda <> 'aprovada'
    loop
      perform privado.disparar_evento('favorito_oferta', f.usuario_id, jsonb_build_object(
        'produto', new.nome, 'produto_id', new.id,
        'preco_de', public.formatar_reais(new.preco), 'preco_por', public.formatar_reais(new.preco_promocional)));
    end loop;
  end if;
  return null;
end $$;
create trigger evento_favorito_oferta after update of preco_promocional on public.produtos
  for each row execute function privado.tg_evento_favorito_oferta();

-- Sacola: guarda quando mudou pela última vez (para o aviso de sacola esquecida).
create or replace function privado.tg_sacola_alterada()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform set_config('app.interno', '1', true);
  update public.perfis
     set sacola_alterada_em = now(), sacola_aviso_1h_em = null, sacola_aviso_1d_em = null
   where id = coalesce(new.usuario_id, old.usuario_id);
  perform set_config('app.interno', '', true);
  return null;
end $$;
create trigger sacola_alterada after insert or update on public.sacola_itens
  for each row execute function privado.tg_sacola_alterada();
