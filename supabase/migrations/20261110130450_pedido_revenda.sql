-- Pedido, estoque, revenda e conta.

-- Fecha o pedido: copia a sacola, aplica cupom, baixa estoque, limpa a sacola.
create or replace function public.criar_pedido(p_cupom text default null, p_observacoes text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := privado.exigir_login();
  eu public.perfis;
  v_rev boolean;
  v_sub numeric;
  r record;
  v_cupom public.cupons;
  v_desc numeric := 0;
  v_ped public.pedidos;
begin
  select * into eu from public.perfis where id = v_uid for update;
  if coalesce(eu.nome, '') = '' or coalesce(eu.telefone, '') = '' then
    raise exception 'Complete seu nome e telefone em Minha conta antes de finalizar';
  end if;
  v_rev := eu.revenda = 'aprovada';

  if exists (select 1 from public.sacola_ver() where not disponivel) then
    raise exception 'Algum item da sacola esgotou ou ficou indisponível. Confira a sacola.';
  end if;
  select coalesce(sum(subtotal), 0) into v_sub from public.sacola_ver();
  if v_sub = 0 then raise exception 'Sua sacola está vazia'; end if;

  if nullif(trim(coalesce(p_cupom, '')), '') is not null then
    select * into r from privado.calcular_cupom(p_cupom, v_sub, v_uid);
    if r.erro is not null then raise exception '%', r.erro; end if;
    v_cupom := r.cupom;
    v_desc := r.desconto;
  end if;

  insert into public.pedidos (cliente_id, tabela_preco, subtotal, desconto, total,
                              cupom_id, cupom_codigo, observacoes, cliente_snapshot)
  values (v_uid, case when v_rev then 'revenda' else 'varejo' end, v_sub,
          v_desc, v_sub - v_desc,
          v_cupom.id, v_cupom.codigo, nullif(trim(coalesce(p_observacoes, '')), ''),
          jsonb_build_object('nome', eu.nome, 'email', eu.email, 'cpf', eu.cpf, 'telefone', eu.telefone,
                             'cidade', eu.cidade, 'uf', eu.uf, 'revenda', v_rev))
  returning * into v_ped;

  insert into public.pedido_itens (pedido_id, produto_id, variacao_id, sku, produto_nome, variacao_nome,
                                   imagem_url, quantidade, preco_unitario, subtotal)
  select v_ped.id, s.produto_id, s.variacao_id, p.sku, s.nome, s.variacao_nome, s.imagem,
         s.quantidade, s.preco_por, s.subtotal
    from public.sacola_ver() s join public.produtos p on p.id = s.produto_id;

  perform privado.baixar_estoque(v_ped.id, -1);
  delete from public.sacola_itens where usuario_id = v_uid;

  return jsonb_build_object('id', v_ped.id, 'numero', v_ped.numero, 'total', v_ped.total);
end $$;

-- Baixa (sinal -1) ou devolve (sinal +1) o estoque dos itens de um pedido.
create or replace function privado.baixar_estoque(p_pedido uuid, p_sinal integer)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.produto_variacoes v set estoque = greatest(v.estoque + p_sinal * i.qtd, 0)
    from (select variacao_id, sum(quantidade) qtd from public.pedido_itens
           where pedido_id = p_pedido and variacao_id is not null group by variacao_id) i
   where v.id = i.variacao_id and v.estoque is not null;
  update public.produtos p set estoque = greatest(p.estoque + p_sinal * i.qtd, 0),
                               vendas = greatest(p.vendas - p_sinal * i.qtd, 0)
    from (select produto_id, sum(quantidade) qtd from public.pedido_itens
           where pedido_id = p_pedido and variacao_id is null group by produto_id) i
   where p.id = i.produto_id;
  -- vendas também conta itens com variação
  update public.produtos p set vendas = greatest(p.vendas - p_sinal * i.qtd, 0)
    from (select produto_id, sum(quantidade) qtd from public.pedido_itens
           where pedido_id = p_pedido and variacao_id is not null group by produto_id) i
   where p.id = i.produto_id;
end $$;

-- Mudança de status: registra a hora e devolve estoque se cancelar (ou baixa de novo se "descancelar").
create or replace function privado.tg_pedido_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    new.status_alterado_em := now();
    if new.status = 'cancelado' then
      perform privado.baixar_estoque(new.id, 1);
    elsif old.status = 'cancelado' then
      perform privado.baixar_estoque(new.id, -1);
    end if;
  end if;
  return new;
end $$;
create trigger pedido_status before update of status on public.pedidos
  for each row execute function privado.tg_pedido_status();

-- Revenda: a cliente pede; a equipe aprova ou recusa.
create or replace function public.solicitar_revenda()
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := privado.exigir_login();
begin
  if (select cpf from public.perfis where id = v_uid) is null then
    raise exception 'Cadastre seu CPF em Minha conta antes de pedir acesso de revenda';
  end if;
  perform set_config('app.interno', '1', true);
  update public.perfis set revenda = 'pendente'
   where id = v_uid and revenda in ('nao_solicitada', 'recusada');
  perform set_config('app.interno', '', true);
end $$;

create or replace function public.decidir_revenda(p_usuario uuid, p_aprovar boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.eh_equipe() then raise exception 'Sem permissão' using errcode = '42501'; end if;
  perform set_config('app.interno', '1', true);
  update public.perfis
     set revenda = case when p_aprovar then 'aprovada' else 'recusada' end::public.situacao_revenda,
         revenda_decidida_em = now()
   where id = p_usuario;
  perform set_config('app.interno', '', true);
end $$;

create or replace function public.registrar_acesso()
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform set_config('app.interno', '1', true);
  update public.perfis set ultimo_acesso = now() where id = auth.uid();
  perform set_config('app.interno', '', true);
end $$;

-- Apaga a própria conta (exigência da Play Store). Pedidos ficam (sem o vínculo).
create or replace function public.excluir_minha_conta()
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := privado.exigir_login();
begin
  delete from auth.users where id = v_uid;
end $$;
