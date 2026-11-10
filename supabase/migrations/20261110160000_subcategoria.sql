-- Subcategoria do produto (ex.: Brincos → Argolas, Ponto de luz), vinda da planilha do site.
alter table public.produtos add column if not exists subcategoria text;
