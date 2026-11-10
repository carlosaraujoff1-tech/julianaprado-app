-- Vitrine: listas e detalhe de produto com o preço certo para quem está vendo.
-- Visitante e cliente comum: preço de varejo (com promoção, se houver).
-- Revendedora aprovada: preço de revenda (o de varejo aparece riscado como referência).

-- Preço "por" (o que a pessoa paga) e "de" (riscado), para um produto.
create or replace function privado.precos(p public.produtos, p_revenda boolean,
  out preco_de numeric, out preco_por numeric)
language sql immutable set search_path = '' as $$
  select
    case
      when p_revenda and p.preco_revenda is not null then p.preco
      when not p_revenda and p.preco_promocional is not null then p.preco
    end,
    case
      when p_revenda and p.preco_revenda is not null then p.preco_revenda
      else coalesce(p.preco_promocional, p.preco)
    end;
$$;

-- Esgotado: sem estoque no produto (quando não tem variação) ou em todas as variações ativas.
create or replace function privado.esgotado(p public.produtos)
returns boolean language sql stable set search_path = '' as $$
  select case
    when exists (select 1 from public.produto_variacoes v where v.produto_id = p.id and v.ativo)
      then not exists (select 1 from public.produto_variacoes v
                        where v.produto_id = p.id and v.ativo and coalesce(v.estoque, 1) > 0)
    else coalesce(p.estoque, 1) <= 0
  end;
$$;

-- Lista de produtos. p_filtro: null | 'ofertas' | 'mais_vendidos' | 'novidades' | 'destaques' | 'favoritos'
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
         (p.novidade or p.criado_em > now() - interval '30 days')
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

-- Detalhe de um produto (com fotos, variações e se é favorito).
create or replace function public.vitrine_produto(p_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  p public.produtos;
  pr record;
begin
  select * into p from public.produtos where id = p_id and ativo;
  if not found then return null; end if;
  select * into pr from privado.precos(p, public.eh_revendedora());
  return jsonb_build_object(
    'id', p.id, 'nome', p.nome, 'sku', p.sku, 'descricao', p.descricao,
    'categoria_id', p.categoria_id,
    'categoria_nome', (select nome from public.categorias where id = p.categoria_id),
    'imagens', to_jsonb(array_remove(array_prepend(p.imagem_principal,
                 array(select i from unnest(p.imagens) i where i is distinct from p.imagem_principal)), null)),
    'preco_de', pr.preco_de, 'preco_por', pr.preco_por,
    'desconto_pct', case when pr.preco_de > 0 then round((1 - pr.preco_por / pr.preco_de) * 100) end,
    'esgotado', privado.esgotado(p),
    'favorito', exists (select 1 from public.favoritos f where f.produto_id = p.id and f.usuario_id = auth.uid()),
    'variacoes', coalesce((
       select jsonb_agg(jsonb_build_object('id', v.id, 'nome', v.nome,
                'disponivel', coalesce(v.estoque, 1) > 0) order by v.ordem, v.nome)
         from public.produto_variacoes v where v.produto_id = p.id and v.ativo), '[]'::jsonb));
end $$;

-- Categorias com quantidade de produtos ativos (esconde as vazias).
create or replace function public.vitrine_categorias()
returns table (id uuid, nome text, imagem_url text, qtd integer)
language sql stable security definer set search_path = '' as $$
  select c.id, c.nome, c.imagem_url, count(p.id)::integer
    from public.categorias c
    join public.produtos p on p.categoria_id = c.id and p.ativo
   where c.ativo
   group by c.id
   order by c.ordem, c.nome;
$$;
