-- Categoria sem foto própria usa a foto da peça principal dela (destaque primeiro).
create or replace function public.vitrine_categorias()
returns table (id uuid, nome text, imagem_url text, qtd integer)
language sql stable security definer set search_path = '' as $$
  select c.id, c.nome,
         coalesce(c.imagem_url, (select p2.imagem_principal from public.produtos p2
                                  where p2.categoria_id = c.id and p2.ativo and p2.imagem_principal is not null
                                  order by p2.destaque desc, p2.ordem, p2.criado_em limit 1)),
         count(p.id)::integer
    from public.categorias c
    join public.produtos p on p.categoria_id = c.id and p.ativo
   where c.ativo
   group by c.id
   order by c.ordem, c.nome;
$$;
