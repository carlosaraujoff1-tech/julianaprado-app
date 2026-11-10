-- Sacola, cupom e pedido. Toda conta de preço acontece aqui no banco.

create or replace function privado.exigir_login()
returns uuid language plpgsql stable set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'Entre na sua conta para continuar' using errcode = '42501';
  end if;
  return auth.uid();
end $$;

-- Adiciona (ou soma) um item na sacola. Produto com variação exige escolher a variação.
create or replace function public.sacola_adicionar(p_produto_id uuid, p_variacao_id uuid default null, p_quantidade integer default 1)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := privado.exigir_login();
  p public.produtos;
  v public.produto_variacoes;
  v_tem_var boolean;
begin
  select * into p from public.produtos where id = p_produto_id and ativo;
  if not found then raise exception 'Produto indisponível'; end if;
  v_tem_var := exists (select 1 from public.produto_variacoes where produto_id = p.id and ativo);
  if v_tem_var and p_variacao_id is null then raise exception 'Escolha uma opção (tamanho/cor)'; end if;
  if not v_tem_var then p_variacao_id := null; end if;
  if p_variacao_id is not null then
    select * into v from public.produto_variacoes where id = p_variacao_id and produto_id = p.id and ativo;
    if not found then raise exception 'Opção indisponível'; end if;
    if coalesce(v.estoque, 1) <= 0 then raise exception 'Esta opção esgotou'; end if;
  elsif coalesce(p.estoque, 1) <= 0 then
    raise exception 'Produto esgotado';
  end if;

  insert into public.sacola_itens (usuario_id, produto_id, variacao_id, quantidade)
  values (v_uid, p.id, p_variacao_id, least(greatest(coalesce(p_quantidade, 1), 1), 99))
  on conflict (usuario_id, produto_id, variacao_id)
  do update set quantidade = least(public.sacola_itens.quantidade + excluded.quantidade, 99);
end $$;

-- Muda a quantidade (0 remove).
create or replace function public.sacola_quantidade(p_item_id uuid, p_quantidade integer)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := privado.exigir_login();
begin
  if coalesce(p_quantidade, 0) <= 0 then
    delete from public.sacola_itens where id = p_item_id and usuario_id = v_uid;
  else
    update public.sacola_itens set quantidade = least(p_quantidade, 99)
     where id = p_item_id and usuario_id = v_uid;
  end if;
end $$;

-- Junta a sacola feita como visitante (guardada no celular) à sacola da conta.
-- p_itens: [{"produto_id": "...", "variacao_id": "..." | null, "quantidade": 1}, ...]
create or replace function public.sacola_mesclar(p_itens jsonb)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  i jsonb; n integer := 0;
begin
  perform privado.exigir_login();
  for i in select * from jsonb_array_elements(coalesce(p_itens, '[]')) limit 100 loop
    begin
      perform public.sacola_adicionar((i->>'produto_id')::uuid, nullif(i->>'variacao_id', '')::uuid,
                                      coalesce((i->>'quantidade')::integer, 1));
      n := n + 1;
    exception when others then
      null; -- item que não existe mais ou esgotou: ignora
    end;
  end loop;
  return n;
end $$;

-- Sacola com preços atuais para a pessoa logada.
create or replace function public.sacola_ver()
returns table (item_id uuid, produto_id uuid, variacao_id uuid, nome text, variacao_nome text, imagem text,
               quantidade integer, preco_de numeric, preco_por numeric, subtotal numeric, disponivel boolean)
language sql stable security definer set search_path = '' as $$
  select s.id, p.id, v.id, p.nome, v.nome, p.imagem_principal, s.quantidade,
         pr.preco_de, pr.preco_por, pr.preco_por * s.quantidade,
         p.ativo and (case when v.id is not null then v.ativo and coalesce(v.estoque, 1) >= s.quantidade
                           else coalesce(p.estoque, 1) >= s.quantidade end)
    from public.sacola_itens s
    join public.produtos p on p.id = s.produto_id
    left join public.produto_variacoes v on v.id = s.variacao_id
    cross join lateral privado.precos(p, public.eh_revendedora()) pr
   where s.usuario_id = auth.uid()
   order by s.criado_em;
$$;

-- Calcula o desconto de um cupom para um subtotal. Devolve o desconto ou um erro amigável.
create or replace function privado.calcular_cupom(p_codigo text, p_subtotal numeric, p_uid uuid,
  out cupom public.cupons, out desconto numeric, out erro text)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_rev boolean;
begin
  desconto := 0;
  select * into cupom from public.cupons c where c.codigo = upper(trim(p_codigo));
  if not found or not cupom.ativo then erro := 'Cupom não encontrado'; return; end if;
  if now() < cupom.inicio then erro := 'Este cupom ainda não começou a valer'; return; end if;
  if cupom.fim is not null and now() > cupom.fim then erro := 'Este cupom expirou'; return; end if;
  select revenda = 'aprovada' into v_rev from public.perfis where id = p_uid;
  if cupom.publico = 'varejo' and v_rev then erro := 'Cupom não vale para revenda'; return; end if;
  if cupom.publico = 'revenda' and not coalesce(v_rev, false) then erro := 'Cupom exclusivo para revendedoras'; return; end if;
  if p_subtotal < cupom.valor_minimo then
    erro := 'Compra mínima de ' || public.formatar_reais(cupom.valor_minimo) || ' para este cupom'; return;
  end if;
  if cupom.limite_usos is not null and (select count(*) from public.pedidos
       where cupom_id = cupom.id and status <> 'cancelado') >= cupom.limite_usos then
    erro := 'Este cupom já esgotou'; return;
  end if;
  if cupom.uso_unico_por_cliente and exists (select 1 from public.pedidos
       where cupom_id = cupom.id and cliente_id = p_uid and status <> 'cancelado') then
    erro := 'Você já usou este cupom'; return;
  end if;
  desconto := round(case when cupom.tipo = 'percentual' then p_subtotal * cupom.valor / 100
                         else least(cupom.valor, p_subtotal) end, 2);
end $$;

create or replace function public.validar_cupom(p_codigo text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_uid uuid := privado.exigir_login();
  v_sub numeric;
  r record;
begin
  select coalesce(sum(subtotal), 0) into v_sub from public.sacola_ver() where disponivel;
  select * into r from privado.calcular_cupom(p_codigo, v_sub, v_uid);
  if r.erro is not null then
    return jsonb_build_object('valido', false, 'mensagem', r.erro);
  end if;
  return jsonb_build_object('valido', true, 'codigo', (r.cupom).codigo, 'desconto', r.desconto,
    'mensagem', case when (r.cupom).tipo = 'percentual'
                     then trim(to_char((r.cupom).valor, 'FM990D##'), ',.') || '% de desconto'
                     else public.formatar_reais((r.cupom).valor) || ' de desconto' end);
end $$;

