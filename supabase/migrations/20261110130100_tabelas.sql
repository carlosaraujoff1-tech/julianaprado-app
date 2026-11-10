-- Tabelas principais.

-- Perfil 1:1 com auth.users (criado por gatilho no cadastro).
create table public.perfis (
  id                   uuid primary key references auth.users(id) on delete cascade,
  nome                 text not null default '',
  email                text,
  cpf                  text unique check (cpf is null or public.cpf_valido(cpf)),
  telefone             text,
  data_nascimento      date,
  cidade               text,
  uf                   text check (uf is null or uf ~ '^[A-Z]{2}$'),
  tipo                 public.tipo_perfil not null default 'cliente',
  revenda              public.situacao_revenda not null default 'nao_solicitada',
  revenda_decidida_em  timestamptz,
  ultimo_acesso        timestamptz,
  notificacoes_lidas_em timestamptz not null default now(),
  sacola_alterada_em   timestamptz,
  sacola_aviso_1h_em   timestamptz,
  sacola_aviso_1d_em   timestamptz,
  bubble_id            text unique,
  criado_em            timestamptz not null default now(),
  atualizado_em        timestamptz not null default now()
);
create trigger perfis_atualizado_em before update on public.perfis
  for each row execute function public.tg_set_atualizado_em();

create table public.categorias (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  imagem_url  text,
  ordem       integer not null default 0,
  ativo       boolean not null default true,
  bubble_id   text unique,
  criado_em   timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create trigger categorias_atualizado_em before update on public.categorias
  for each row execute function public.tg_set_atualizado_em();

-- Preço de varejo (preco / preco_promocional) e de revenda (preco_revenda).
-- A promoção sempre precisa ser MENOR que o preço cheio (evita o "-100%" do Bubble).
create table public.produtos (
  id                uuid primary key default gen_random_uuid(),
  sku               text unique,
  nome              text not null,
  descricao         text,
  categoria_id      uuid references public.categorias(id) on delete set null,
  preco             numeric(10,2) not null check (preco > 0),
  preco_promocional numeric(10,2) check (preco_promocional is null or (preco_promocional > 0 and preco_promocional < preco)),
  preco_revenda     numeric(10,2) check (preco_revenda is null or preco_revenda > 0),
  estoque           integer check (estoque is null or estoque >= 0), -- null = não controla
  imagem_principal  text,
  imagens           text[] not null default '{}',
  ativo             boolean not null default true,
  destaque          boolean not null default false,
  novidade          boolean not null default false,
  vendas            integer not null default 0,
  ordem             integer not null default 0,
  busca             text generated always as (public.sem_acento(nome || ' ' || coalesce(sku, ''))) stored,
  bubble_id         text unique,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now()
);
create trigger produtos_atualizado_em before update on public.produtos
  for each row execute function public.tg_set_atualizado_em();
create index produtos_categoria_idx on public.produtos (categoria_id) where ativo;
create index produtos_vendas_idx    on public.produtos (vendas desc) where ativo;
create index produtos_ofertas_idx   on public.produtos (criado_em desc) where ativo and preco_promocional is not null;
create index produtos_busca_trgm    on public.produtos using gin (busca extensions.gin_trgm_ops);

-- Variações (tamanho do aro, cor, banho...). Estoque por variação.
create table public.produto_variacoes (
  id          uuid primary key default gen_random_uuid(),
  produto_id  uuid not null references public.produtos(id) on delete cascade,
  nome        text not null,
  estoque     integer check (estoque is null or estoque >= 0),
  ordem       integer not null default 0,
  ativo       boolean not null default true,
  unique (produto_id, nome)
);
create index produto_variacoes_produto_idx on public.produto_variacoes (produto_id);

create table public.banners (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null default '',
  imagem_url  text not null,
  link        text,
  ordem       integer not null default 0,
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now()
);

-- Configurações públicas (lidas pelo app). Nada secreto aqui.
create table public.configuracoes (
  chave     text primary key,
  valor     text not null default '',
  descricao text
);
insert into public.configuracoes (chave, valor, descricao) values
  ('whatsapp_pedidos', '', 'Número do WhatsApp que recebe os pedidos (só dígitos, com 55 e DDD)'),
  ('mensagem_pedido', 'Olá! Acabei de fazer o pedido Nº {numero} pelo app.', 'Texto que abre no WhatsApp ao finalizar'),
  ('instagram', '', 'Link do Instagram da loja');

create table public.favoritos (
  usuario_id  uuid not null references public.perfis(id) on delete cascade,
  produto_id  uuid not null references public.produtos(id) on delete cascade,
  criado_em   timestamptz not null default now(),
  primary key (usuario_id, produto_id)
);
create index favoritos_produto_idx on public.favoritos (produto_id);

create table public.sacola_itens (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references public.perfis(id) on delete cascade,
  produto_id  uuid not null references public.produtos(id) on delete cascade,
  variacao_id uuid references public.produto_variacoes(id) on delete cascade,
  quantidade  integer not null check (quantidade between 1 and 99),
  criado_em   timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique nulls not distinct (usuario_id, produto_id, variacao_id)
);
create trigger sacola_itens_atualizado_em before update on public.sacola_itens
  for each row execute function public.tg_set_atualizado_em();

create table public.cupons (
  id                    uuid primary key default gen_random_uuid(),
  codigo                text not null check (codigo ~ '^[A-Z0-9_-]{3,30}$'),
  descricao             text,
  tipo                  public.tipo_cupom not null,
  valor                 numeric(10,2) not null check (valor > 0),
  valor_minimo          numeric(10,2) not null default 0,
  inicio                timestamptz not null default now(),
  fim                   timestamptz,
  limite_usos           integer check (limite_usos is null or limite_usos > 0),
  uso_unico_por_cliente boolean not null default true,
  publico               text not null default 'todos' check (publico in ('todos', 'varejo', 'revenda')),
  divulgar              boolean not null default false,
  ativo                 boolean not null default true,
  criado_em             timestamptz not null default now(),
  check (tipo <> 'percentual' or valor <= 100),
  check (fim is null or fim > inicio)
);
create unique index cupons_codigo_idx on public.cupons (codigo);

create table public.pedidos (
  id                 uuid primary key default gen_random_uuid(),
  numero             bigint generated always as identity (start with 1001) unique,
  cliente_id         uuid references public.perfis(id) on delete set null,
  atendente_id       uuid references public.perfis(id) on delete set null,
  status             public.status_pedido not null default 'recebido',
  tabela_preco       text not null check (tabela_preco in ('varejo', 'revenda')),
  subtotal           numeric(10,2) not null,
  desconto           numeric(10,2) not null default 0,
  total              numeric(10,2) not null,
  cupom_id           uuid references public.cupons(id) on delete set null,
  cupom_codigo       text,
  observacoes        text,
  observacoes_internas text,
  cliente_snapshot   jsonb not null default '{}',
  status_alterado_em timestamptz not null default now(),
  criado_em          timestamptz not null default now(),
  atualizado_em      timestamptz not null default now()
);
create trigger pedidos_atualizado_em before update on public.pedidos
  for each row execute function public.tg_set_atualizado_em();
create index pedidos_cliente_idx on public.pedidos (cliente_id, criado_em desc);
create index pedidos_status_idx  on public.pedidos (status, criado_em desc);
create index pedidos_cupom_idx   on public.pedidos (cupom_id) where cupom_id is not null;

create table public.pedido_itens (
  id              uuid primary key default gen_random_uuid(),
  pedido_id       uuid not null references public.pedidos(id) on delete cascade,
  produto_id      uuid references public.produtos(id) on delete set null,
  variacao_id     uuid references public.produto_variacoes(id) on delete set null,
  sku             text,
  produto_nome    text not null,
  variacao_nome   text,
  imagem_url      text,
  quantidade      integer not null check (quantidade > 0),
  preco_unitario  numeric(10,2) not null,
  subtotal        numeric(10,2) not null
);
create index pedido_itens_pedido_idx on public.pedido_itens (pedido_id);

-- Notificações: destinatario_id nulo = para todo mundo (inclusive visitantes).
create table public.notificacoes (
  id              uuid primary key default gen_random_uuid(),
  titulo          text not null,
  corpo           text not null,
  imagem_url      text,
  rota            text,
  destinatario_id uuid references public.perfis(id) on delete cascade,
  evento          text,
  criado_por      uuid references public.perfis(id) on delete set null,
  criado_em       timestamptz not null default now()
);
create index notificacoes_dest_idx  on public.notificacoes (destinatario_id, criado_em desc);
create index notificacoes_geral_idx on public.notificacoes (criado_em desc) where destinatario_id is null;

create table public.erros_app (
  id          bigint generated always as identity primary key,
  mensagem    text not null,
  stack       text,
  tela        text,
  plataforma  text,
  versao_app  text,
  usuario_id  uuid references public.perfis(id) on delete set null,
  criado_em   timestamptz not null default now()
);
