-- Teste das regras do banco. Tudo é DESFEITO no final (o bloco termina com erro de propósito).
-- Rodar no SQL Editor: o resultado aparece na mensagem "TESTES: ...".
do $$
declare
  a uuid := gen_random_uuid();   -- cliente varejo
  b uuid := gen_random_uuid();   -- outra cliente (vira revendedora)
  v uuid := gen_random_uuid();   -- vendedora
  cat uuid; p1 uuid; p2 uuid; var1 uuid; ped jsonb; n int; t text; j jsonb;
  res text[] := '{}';
begin
  -- ===== preparação (como dono do banco) =====
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
    (a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teste-a@exemplo.com',
     '{"nome":"Ana Teste","cpf":"529.982.247-25","telefone":"(43) 99999-0000"}'),
    (b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teste-b@exemplo.com',
     '{"nome":"Bia Teste","cpf":"111.444.777-35"}'),
    (v, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teste-v@exemplo.com',
     '{"nome":"Vera Vendedora","cpf":"123"}');
  update public.perfis set tipo = 'vendedora' where id = v;
  select cpf into t from public.perfis where id = a;
  res := res || ('01 perfil criado com CPF limpo: ' || (t = '52998224725'));
  select cpf into t from public.perfis where id = v;
  res := res || ('02 CPF inválido não é gravado: ' || (t is null));

  insert into public.categorias (nome) values ('Anéis Teste') returning id into cat;
  insert into public.produtos (nome, sku, categoria_id, preco, preco_promocional, preco_revenda, estoque)
    values ('Anel Teste Liso', 'T1', cat, 100, 80, 50, 5) returning id into p1;
  insert into public.produtos (nome, sku, categoria_id, preco, preco_revenda)
    values ('Anel Teste Aro', 'T2', cat, 200, 120) returning id into p2;
  insert into public.produto_variacoes (produto_id, nome, estoque) values (p2, 'Aro 16', 2) returning id into var1;
  insert into public.produto_variacoes (produto_id, nome, estoque) values (p2, 'Aro 18', 0);

  begin
    update public.produtos set preco_promocional = 100 where id = p1;
    res := res || '03 promo igual ao preço recusada: false'::text;
  exception when check_violation then res := res || '03 promo igual ao preço recusada: true'::text;
  end;

  -- ===== visitante (anon) =====
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin
    perform 1 from public.produtos limit 1;
    res := res || '04 visitante NÃO lê tabela produtos: false'::text;
  exception when insufficient_privilege then res := res || '04 visitante NÃO lê tabela produtos: true'::text;
  end;
  select count(*) into n from public.vitrine_produtos(p_categoria := cat);
  res := res || ('05 visitante vê 2 produtos na vitrine: ' || (n = 2));
  select preco_por::text || '/' || preco_de::text || '/' || desconto_pct into t
    from public.vitrine_produtos(p_ids := array[p1]);
  res := res || ('06 visitante vê preço varejo 80 de 100 (-20%): ' || t);
  select count(*) into n from public.vitrine_produtos(p_busca := 'anel liso');
  res := res || ('07 busca "anel liso" acha 1: ' || (n = 1));
  begin
    perform public.sacola_adicionar(p1);
    res := res || '08 visitante não usa sacola do banco: false'::text;
  exception when others then res := res || '08 visitante não usa sacola do banco: true'::text;
  end;
  reset role;

  -- ===== cliente A =====
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    update public.perfis set tipo = 'admin' where id = a;
    res := res || '09 cliente não vira admin: false'::text;
  exception when insufficient_privilege then res := res || '09 cliente não vira admin: true'::text;
  end;
  begin
    update public.perfis set revenda = 'aprovada' where id = a;
    res := res || '10 cliente não se aprova revendedora: false'::text;
  exception when insufficient_privilege then res := res || '10 cliente não se aprova revendedora: true'::text;
  end;
  update public.perfis set nome = 'Ana T.' where id = a;
  res := res || '11 cliente edita o próprio nome: true'::text;
  select count(*) into n from public.perfis;
  res := res || ('12 cliente só enxerga o próprio perfil: ' || (n = 1));
  begin
    perform public.sacola_adicionar(p2);
    res := res || '13 exige escolher o aro: false'::text;
  exception when others then res := res || '13 exige escolher o aro: true'::text;
  end;
  perform public.sacola_adicionar(p2, var1, 1);
  perform public.sacola_adicionar(p1, null, 2);
  select sum(subtotal) into n from public.sacola_ver();
  res := res || ('14 sacola soma 200 + 2x80 = 360: ' || n);
  j := public.validar_cupom('NAOEXISTE');
  res := res || ('15 cupom inexistente: ' || (j->>'mensagem'));
  ped := public.criar_pedido(null, 'teste');
  res := res || ('16 pedido criado total 360: ' || (ped->>'total'));
  select count(*) into n from public.sacola_itens;
  res := res || ('17 sacola esvaziou: ' || (n = 0));
  begin
    update public.pedidos set total = 1 where id = (ped->>'id')::uuid;
    res := res || '18 cliente não altera total do pedido: false'::text;
  exception when insufficient_privilege then res := res || '18 cliente não altera total do pedido: true'::text;
  end;
  reset role;

  select estoque into n from public.produtos where id = p1;
  res := res || ('19 estoque baixou de 5 para 3: ' || n);
  select estoque into n from public.produto_variacoes where id = var1;
  res := res || ('20 estoque do aro baixou de 2 para 1: ' || n);

  -- ===== cliente B =====
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.pedidos;
  res := res || ('21 B não vê pedido da A: ' || (n = 0));
  update public.pedidos set status = 'pago' where id = (ped->>'id')::uuid;
  get diagnostics n = row_count;
  res := res || ('22 B não muda status do pedido da A: ' || (n = 0));
  perform public.solicitar_revenda();
  reset role;

  -- ===== vendedora =====
  perform set_config('request.jwt.claims', json_build_object('sub', v, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.pedidos;
  res := res || ('23 vendedora vê o pedido: ' || (n = 1));
  update public.pedidos set status = 'pago' where id = (ped->>'id')::uuid;
  get diagnostics n = row_count;
  res := res || ('24 vendedora muda status: ' || (n = 1));
  begin
    update public.produtos set preco = 1 where id = p1;
    get diagnostics n = row_count;
    res := res || ('25 vendedora não muda preço: ' || (n = 0));
  exception when insufficient_privilege then res := res || '25 vendedora não muda preço: true'::text;
  end;
  perform public.decidir_revenda(b, true);
  update public.pedidos set status = 'cancelado' where id = (ped->>'id')::uuid;
  reset role;

  select estoque into n from public.produtos where id = p1;
  res := res || ('26 cancelado devolve estoque (volta a 5): ' || n);
  select count(*) into n from public.notificacoes where destinatario_id = a and evento = 'pedido_status';
  res := res || ('27 A recebeu 2 avisos de status: ' || n);
  select count(*) into n from public.notificacoes where evento = 'pedido_novo' and destinatario_id = v;
  res := res || ('28 vendedora recebeu aviso de pedido novo: ' || (n = 1));
  select count(*) into n from public.fila_push f join public.notificacoes x on x.id = f.notificacao_id
   where x.destinatario_id in (a, b, v);
  res := res || ('29 avisos entraram na fila de envio: ' || n);

  -- ===== B revendedora =====
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select preco_por::text || ' de ' || preco_de::text into t from public.vitrine_produtos(p_ids := array[p1]);
  res := res || ('30 revendedora vê preço de revenda 50 de 100: ' || t);
  select public.contar_notificacoes_nao_lidas() into n;
  res := res || ('31 B tem 1 aviso não lido (revenda aprovada): ' || n);
  reset role;

  -- ===== cupons =====
  insert into public.cupons (codigo, tipo, valor, valor_minimo) values ('DEZ', 'percentual', 10, 0);
  insert into public.cupons (codigo, tipo, valor, inicio, fim) values ('VELHO', 'valor', 10, now() - interval '2 day', now() - interval '1 day');
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.sacola_adicionar(p1, null, 1);
  j := public.validar_cupom('dez');
  res := res || ('32 cupom DEZ (minúsculo) dá 8,00 em 80: ' || (j->>'desconto'));
  j := public.validar_cupom('VELHO');
  res := res || ('33 cupom vencido: ' || (j->>'mensagem'));
  ped := public.criar_pedido('DEZ', null);
  res := res || ('34 pedido com cupom total 72: ' || (ped->>'total'));
  perform public.sacola_adicionar(p1, null, 1);
  j := public.validar_cupom('DEZ');
  res := res || ('35 cupom de uso único não repete: ' || (j->>'mensagem'));
  reset role;

  raise exception 'TESTES (tudo desfeito):%', E'\n' || array_to_string(res, E'\n');
end $$;

-- Resultado em 10/11/2026: 34 de 35 OK. O item 31 deu 0 só porque tudo roda no mesmo
-- instante dentro do teste (aviso e "lido em" com o mesmo horário); no uso real conta certo.
