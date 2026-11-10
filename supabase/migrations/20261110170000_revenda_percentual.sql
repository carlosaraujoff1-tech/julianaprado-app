-- Preço de revenda = preço final do varejo (com promoção, se houver) menos X%.
-- X fica em configuracoes.desconto_revenda_pct (padrão 20). Se o produto tiver
-- preco_revenda preenchido, ele vale no lugar da regra (exceção por produto).
insert into public.configuracoes (chave, valor, descricao)
values ('desconto_revenda_pct', '20', 'Desconto da revendedora sobre o preço final do varejo (%)')
on conflict (chave) do nothing;

create or replace function privado.precos(p public.produtos, p_revenda boolean,
  out preco_de numeric, out preco_por numeric)
language plpgsql stable set search_path = '' as $$
declare
  v_final numeric := coalesce(p.preco_promocional, p.preco);
  v_pct numeric;
begin
  if p_revenda then
    select coalesce(nullif(valor, '')::numeric, 0) into v_pct
      from public.configuracoes where chave = 'desconto_revenda_pct';
    preco_por := coalesce(p.preco_revenda, round(v_final * (1 - least(greatest(coalesce(v_pct, 0), 0), 90) / 100), 2));
    preco_de := case when preco_por < v_final then v_final end;
  else
    preco_por := v_final;
    preco_de := case when p.preco_promocional is not null then p.preco end;
  end if;
end $$;
