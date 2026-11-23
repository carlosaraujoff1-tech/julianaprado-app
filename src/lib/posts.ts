import { useInfiniteQuery, useQuery, type QueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { PostFeed } from '@/types/database';

// Aba Descubra. Velocidade: páginas pequenas (6 posts), foto em WebP já reduzida no envio
// (1080 px) + miniatura (~15 KB) que aparece na hora enquanto a grande carrega,
// e as próximas fotos são baixadas antes de a pessoa chegar nelas.
const POR_PAGINA = 6;
// Contador de curtidas só aparece a partir deste número (evita "1 curtida" com cara de vazio).
export const MINIMO_CONTADOR = 10;

async function buscarPagina(antes?: string) {
  const { data, error } = await supabase.rpc('feed_posts', { p_limite: POR_PAGINA, p_antes: antes });
  if (error) throw error;
  return (data ?? []) as PostFeed[];
}

const chaveFeed = (uid?: string) => ['feed', uid ?? 'visitante'] as const;

export function useFeed() {
  const { session } = useAuth();
  return useInfiniteQuery({
    queryKey: chaveFeed(session?.user.id),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => buscarPagina(pageParam),
    getNextPageParam: (ultima) => (ultima.length < POR_PAGINA ? undefined : ultima[ultima.length - 1].publicado_em),
    staleTime: 5 * 60_000,
  });
}

// Chamado logo depois de o app abrir: quando a pessoa tocar em Descubra, já está tudo pronto.
export async function preCarregarFeed(qc: QueryClient, uid?: string) {
  await qc.prefetchInfiniteQuery({
    queryKey: chaveFeed(uid),
    initialPageParam: undefined as string | undefined,
    queryFn: () => buscarPagina(),
    staleTime: 5 * 60_000,
  });
  const pagina = qc.getQueryData<{ pages: PostFeed[][] }>(chaveFeed(uid))?.pages[0] ?? [];
  // miniaturas de todos da 1ª página + a foto grande do primeiro
  Image.prefetch(pagina.map((p) => p.imagem_mini_url), 'memory-disk');
  if (pagina[0]) Image.prefetch(pagina[0].imagem_url, 'memory-disk');
}

export function useSalvos() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['salvos', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('feed_posts', { p_limite: 50, p_salvos: true });
      if (error) throw error;
      return (data ?? []) as PostFeed[];
    },
  });
}

export async function alternarCurtida(postId: string) {
  const { data, error } = await supabase.rpc('alternar_curtida', { p_post: postId });
  if (error) throw error;
  return data as { curtido: boolean; curtidas: number };
}

export async function alternarSalvo(postId: string) {
  const { data, error } = await supabase.rpc('alternar_salvo', { p_post: postId });
  if (error) throw error;
  return data as boolean;
}
