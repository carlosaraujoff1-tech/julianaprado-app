-- Teste das regras dos posts (aba Descubra). Tudo é desfeito no final.
do $$
declare
  adm uuid := gen_random_uuid(); ven uuid := gen_random_uuid(); cli uuid := gen_random_uuid();
  pid uuid; prod uuid; n int; t text; j jsonb; res text[] := '{}';
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
    (adm, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tp-adm@exemplo.com', '{"nome":"Adm Teste"}'),
    (ven, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tp-ven@exemplo.com', '{"nome":"Vera Vendedora"}'),
    (cli, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tp-cli@exemplo.com', '{"nome":"Cli Teste","cpf":"52998224725"}');
  update public.perfis set tipo = 'admin' where id = adm;
  update public.perfis set tipo = 'vendedora' where id = ven;
  select id into prod from public.produtos where nome = 'Brinco Argola Coração com Cristal';

  -- vendedora cria tentando já publicar
  perform set_config('request.jwt.claims', json_build_object('sub', ven, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.posts (imagem_url, imagem_mini_url, titulo, produto_id, status, curtidas, publicado_em)
    values ('https://x/a.webp', 'https://x/a-mini.webp', 'Teste', prod, 'aprovado', 999, now()) returning id into pid;
  reset role;
  select status::text || '/' || curtidas || '/' || (criado_por = ven) into t from public.posts where id = pid;
  res := res || ('01 nasce pendente, 0 curtidas, autora certa: ' || t);
  select count(*) into n from public.notificacoes where evento = 'post_pendente' and destinatario_id = adm;
  res := res || ('02 admin avisada do post pendente: ' || (n = 1));

  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  select count(*) into n from public.feed_posts();
  res := res || ('03 visitante não vê pendente: ' || (n = 0));
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', cli, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    insert into public.posts (imagem_url, imagem_mini_url) values ('https://x/b.webp', 'https://x/b.webp');
    res := res || '04 cliente não cria post: false'::text;
  exception when insufficient_privilege then res := res || '04 cliente não cria post: true'::text;
  end;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', ven, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    perform public.moderar_post(pid, true);
    res := res || '05 vendedora não aprova: false'::text;
  exception when insufficient_privilege then res := res || '05 vendedora não aprova: true'::text;
  end;
  update public.posts set titulo = 'Teste 2', status = 'aprovado' where id = pid;
  reset role;
  select titulo || '/' || status::text into t from public.posts where id = pid;
  res := res || ('06 vendedora edita texto mas não muda status: ' || t);

  perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    perform public.moderar_post(pid, false, '  ');
    res := res || '07 recusa exige motivo: false'::text;
  exception when others then res := res || '07 recusa exige motivo: true'::text;
  end;
  perform public.moderar_post(pid, false, 'Foto escura');
  reset role;
  select count(*) into n from public.notificacoes where evento = 'post_recusado' and destinatario_id = ven;
  res := res || ('08 autora avisada da recusa: ' || (n = 1));

  perform set_config('request.jwt.claims', json_build_object('sub', ven, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.posts set titulo = 'Teste corrigido' where id = pid;
  reset role;
  select status::text || '/' || coalesce(motivo_recusa, '-') into t from public.posts where id = pid;
  res := res || ('09 corrigido volta para pendente: ' || t);

  perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.moderar_post(pid, true);
  reset role;
  select count(*) into n from public.notificacoes where evento = 'post_aprovado' and destinatario_id = ven;
  res := res || ('10 autora avisada da aprovação: ' || (n = 1));

  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  select count(*) into n from public.feed_posts();
  res := res || ('11 visitante vê o aprovado: ' || (n = 1));
  select produto_nome || ' ' || preco_por into t from public.feed_posts();
  res := res || ('12 peça e preço de varejo no feed: ' || t);
  begin
    perform public.alternar_curtida(pid);
    res := res || '13 visitante não curte: false'::text;
  exception when others then res := res || '13 visitante não curte: true'::text;
  end;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', ven, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.posts set titulo = 'mexendo no publicado' where id = pid;
  get diagnostics n = row_count;
  res := res || ('14 vendedora não mexe em post publicado: ' || (n = 0));
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', cli, 'role', 'authenticated')::text, true);
  set local role authenticated;
  j := public.alternar_curtida(pid);
  res := res || ('15 cliente curte: ' || j::text);
  j := public.alternar_curtida(pid);
  res := res || ('16 descurte: ' || j::text);
  perform public.alternar_salvo(pid);
  select count(*) into n from public.feed_posts(p_salvos := true);
  res := res || ('17 aparece em salvos: ' || (n = 1));
  update public.posts set curtidas = 500 where id = pid;
  get diagnostics n = row_count;
  res := res || ('18 cliente não altera contador: ' || (n = 0));
  reset role;

  perform set_config('request.jwt.claims', '', true);
  update public.perfis set revenda = 'aprovada' where id = cli;
  perform set_config('request.jwt.claims', json_build_object('sub', cli, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select preco_por || ' de ' || preco_de into t from public.feed_posts();
  res := res || ('19 revendedora vê preço de revenda no feed: ' || t);
  reset role;

  raise exception 'TESTES (tudo desfeito):%', E'\n' || array_to_string(res, E'\n');
end $$;
