-- Quem se cadastrar com um e-mail desta lista vira admin automaticamente.
-- (lista em privado.config 'admins_iniciais', separada por vírgula)
insert into privado.config (chave, valor) values ('admins_iniciais', 'carlosaraujoff1@gmail.com')
on conflict (chave) do update set valor = excluded.valor;

create or replace function privado.tg_admin_inicial()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if lower(new.email) = any (string_to_array(lower(replace(coalesce(privado.cfg('admins_iniciais'), ''), ' ', '')), ',')) then
    new.tipo := 'admin';
  end if;
  return new;
end $$;
create trigger perfis_admin_inicial before insert on public.perfis
  for each row execute function privado.tg_admin_inicial();

-- Se a conta já existir, promove agora.
update public.perfis set tipo = 'admin' where lower(email) = 'carlosaraujoff1@gmail.com';

update public.configuracoes set valor = '5543920009775' where chave = 'whatsapp_pedidos';
