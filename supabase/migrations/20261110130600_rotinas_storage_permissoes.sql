-- Rotinas automáticas (pg_cron), armazenamento de fotos e permissões das funções.

-- Sacola esquecida: aviso com 1 hora e com 1 dia (uma vez cada, até a sacola mudar de novo).
create or replace function privado.processar_sacolas_esquecidas()
returns integer language plpgsql security definer set search_path = '' as $$
declare
  r record; n integer := 0;
begin
  perform set_config('app.interno', '1', true);
  for r in
    select p.id, case when p.sacola_aviso_1h_em is null then '1h' else '1d' end as etapa
      from public.perfis p
     where p.sacola_alterada_em is not null
       and exists (select 1 from public.sacola_itens s where s.usuario_id = p.id)
       and ((p.sacola_aviso_1h_em is null and p.sacola_alterada_em <= now() - interval '1 hour'
             and p.sacola_alterada_em > now() - interval '1 day')
         or (p.sacola_aviso_1d_em is null and p.sacola_alterada_em <= now() - interval '1 day'
             and p.sacola_alterada_em > now() - interval '3 days'))
     for update of p skip locked
  loop
    perform privado.disparar_evento('sacola_' || r.etapa, r.id, '{}'::jsonb);
    if r.etapa = '1h' then
      update public.perfis set sacola_aviso_1h_em = now() where id = r.id;
    else
      update public.perfis set sacola_aviso_1h_em = coalesce(sacola_aviso_1h_em, now()),
                               sacola_aviso_1d_em = now() where id = r.id;
    end if;
    n := n + 1;
  end loop;
  perform set_config('app.interno', '', true);
  return n;
end $$;

-- Reenvia o que ficou preso na fila de push.
create or replace function privado.reprocessar_fila_push()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.fila_push
              where status in ('pendente', 'enviando') and tentativas < 5
                and criado_em < now() - interval '1 minute') then
    perform privado.chamar_processar_push();
  end if;
end $$;

select cron.schedule('sacola-esquecida', '*/10 * * * *', 'select privado.processar_sacolas_esquecidas()');
select cron.schedule('fila-push-reprocessar', '* * * * *', 'select privado.reprocessar_fila_push()');

-- Segredo que só o banco e a Edge Function conhecem.
insert into privado.config (chave, valor) values
  ('edge_functions_url', 'https://jgohlujbljnuduimtnox.supabase.co/functions/v1'),
  ('push_segredo', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (chave) do nothing;

-- Fotos: bucket público "catalogo"; só admin envia/apaga.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalogo', 'catalogo', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy catalogo_admin_escreve on storage.objects for all to authenticated
  using (bucket_id = 'catalogo' and (select public.eh_admin()))
  with check (bucket_id = 'catalogo' and (select public.eh_admin()));

-- ===== Permissões das funções: tudo fechado, libera uma a uma =====
revoke execute on all functions in schema public  from public, anon, authenticated;
revoke execute on all functions in schema privado from public, anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges in schema privado revoke execute on functions from public, anon, authenticated;

-- Visitante (sem login) e logado
grant execute on function public.vitrine_produtos(uuid, text, text, uuid[], integer, integer) to anon, authenticated;
grant execute on function public.vitrine_produto(uuid)            to anon, authenticated;
grant execute on function public.vitrine_categorias()             to anon, authenticated;
grant execute on function public.registrar_dispositivo(text, text) to anon, authenticated;
grant execute on function public.cpf_valido(text)                 to anon, authenticated;
grant execute on function public.sem_acento(text)                 to anon, authenticated;
grant execute on function public.formatar_reais(numeric)          to anon, authenticated;
grant execute on function public.status_pedido_rotulo(public.status_pedido) to anon, authenticated;
grant execute on function public.tg_set_atualizado_em()           to anon, authenticated;

-- Usadas dentro das regras de acesso (para visitante sempre respondem "não")
grant execute on function public.eh_admin()                       to anon, authenticated;
grant execute on function public.eh_equipe()                      to anon, authenticated;
grant execute on function public.eh_revendedora()                 to anon, authenticated;

-- Só logado
grant execute on function public.sacola_adicionar(uuid, uuid, integer) to authenticated;
grant execute on function public.sacola_quantidade(uuid, integer) to authenticated;
grant execute on function public.sacola_mesclar(jsonb)            to authenticated;
grant execute on function public.sacola_ver()                     to authenticated;
grant execute on function public.validar_cupom(text)              to authenticated;
grant execute on function public.criar_pedido(text, text)         to authenticated;
grant execute on function public.solicitar_revenda()              to authenticated;
grant execute on function public.decidir_revenda(uuid, boolean)   to authenticated;
grant execute on function public.registrar_acesso()               to authenticated;
grant execute on function public.excluir_minha_conta()            to authenticated;
grant execute on function public.contar_notificacoes_nao_lidas()  to authenticated;
grant execute on function public.marcar_notificacoes_lidas()      to authenticated;

-- Só a Edge Function
grant execute on function public.push_segredo_confere(text)       to service_role;
grant execute on function public.reservar_fila_push(integer)      to service_role;

revoke all on public.fila_push, public.dispositivos_push, public.eventos_push from anon;
