-- O selo "NOVO" do card aparece só nas peças marcadas como novidade pela loja.
-- (A lista "Novidades" continua incluindo o que foi cadastrado nos últimos 30 dias.)
create or replace function public.vitrine_produtos(
  p_categoria uuid default null,
  p_filtro    text default null,
  p_busca     text default null,
  p_ids       uuid[] default null,
  p_limite    integer default 40,
  p_offset    integer default 0)
returns table (
  id uuid, nome text, sku text, imagem text, categoria_id uuid, categoria_nome text,
  preco_de numeric, preco_por numeric, desconto_pct integer,
  esgotado boolean, tem_variacoes boolean, novidade boolean)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_rev boolean := public.eh_revendedora();
  v_palavras text[] := array(
    select w from unnest(string_to_array(public.sem_acento(coalesce(p_busca, '')), ' ')) w where w <> '');
begin
  return query
  select p.id, p.nome, p.sku, p.imagem_principal, p.categoria_id, c.nome,
         pr.preco_de, pr.preco_por,
         case when pr.preco_de > 0 then round((1 - pr.preco_por / pr.preco_de) * 100)::integer end,
         privado.esgotado(p),
         exists (select 1 from public.produto_variacoes v where v.produto_id = p.id and v.ativo),
         p.novidade
    from public.produtos p
    left join public.categorias c on c.id = p.categoria_id
    cross join lateral privado.precos(p, v_rev) pr
   where p.ativo
     and (c.id is null or c.ativo)
     and (p_categoria is null or p.categoria_id = p_categoria)
     and (p_ids is null or p.id = any(p_ids))
     and (p_filtro is distinct from 'ofertas'   or p.preco_promocional is not null)
     and (p_filtro is distinct from 'destaques' or p.destaque)
     and (p_filtro is distinct from 'novidades' or p.novidade or p.criado_em > now() - interval '30 days')
     and (p_filtro is distinct from 'favoritos'
          or exists (select 1 from public.favoritos f where f.produto_id = p.id and f.usuario_id = auth.uid()))
     and not exists (
           select 1 from unnest(v_palavras) w
            where position(w in p.busca || ' ' || public.sem_acento(c.nome)) = 0)
   order by
     case when p_ids is not null then array_position(p_ids, p.id) end,
     case when p_filtro = 'mais_vendidos' then p.vendas end desc nulls last,
     case when p_filtro = 'novidades' then p.criado_em end desc nulls last,
     case when cardinality(v_palavras) > 0 then position(v_palavras[1] in p.busca) end,
     privado.esgotado(p),
     p.destaque desc, p.ordem, p.vendas desc, p.nome
   limit least(greatest(p_limite, 1), 100) offset greatest(p_offset, 0);
end $$;
