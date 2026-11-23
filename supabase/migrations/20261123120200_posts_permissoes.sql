-- As funções dos posts foram aplicadas pelo SQL Editor (a confirmação do MCP não chegava ao dono):
-- fecha o acesso de visitante às que exigem conta. feed_posts continua aberta (vitrine pública).
revoke execute on function public.alternar_curtida(uuid), public.alternar_salvo(uuid), public.moderar_post(uuid, boolean, text), public.arquivar_post(uuid) from public, anon;
revoke execute on function privado.tg_evento_post() from public, anon, authenticated;
grant execute on function public.alternar_curtida(uuid), public.alternar_salvo(uuid), public.moderar_post(uuid, boolean, text), public.arquivar_post(uuid) to authenticated;
grant execute on function public.feed_posts(integer, timestamptz, boolean) to anon, authenticated;
