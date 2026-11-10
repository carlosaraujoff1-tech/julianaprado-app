import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { ProdutoDetalhe } from '@/lib/vitrine';

export function useIdsFavoritos() {
  const { session } = useAuth();
  const uid = session?.user.id;
  return useQuery({
    queryKey: ['favoritos-ids', uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from('favoritos').select('produto_id');
      if (error) throw error;
      return new Set((data ?? []).map((f) => f.produto_id));
    },
  });
}

export function useAlternarFavorito() {
  const qc = useQueryClient();
  const { session } = useAuth();
  const uid = session?.user.id;
  return useMutation({
    mutationFn: async ({ produtoId, favoritar }: { produtoId: string; favoritar: boolean }) => {
      if (!uid) throw new Error('login');
      const r = favoritar
        ? await supabase.from('favoritos').insert({ usuario_id: uid, produto_id: produtoId })
        : await supabase.from('favoritos').delete().eq('usuario_id', uid).eq('produto_id', produtoId);
      if (r.error) throw r.error;
    },
    onMutate: ({ produtoId, favoritar }) => {
      qc.setQueryData<Set<string>>(['favoritos-ids', uid], (antes) => {
        const s = new Set(antes ?? []);
        if (favoritar) s.add(produtoId);
        else s.delete(produtoId);
        return s;
      });
      qc.setQueryData<ProdutoDetalhe | null>(['produto', produtoId], (p) => (p ? { ...p, favorito: favoritar } : p));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['favoritos-ids', uid] });
      qc.invalidateQueries({ queryKey: ['produtos', { filtro: 'favoritos' }] });
    },
  });
}
