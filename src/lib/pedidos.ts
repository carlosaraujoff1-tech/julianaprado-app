import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Pedido, PedidoItem, StatusPedido } from '@/types/database';

export type ClienteSnapshot = {
  nome?: string; email?: string; cpf?: string; telefone?: string; cidade?: string; uf?: string; revenda?: boolean;
};

// Cliente vê os seus; equipe vê todos (quem decide é o banco).
export function usePedidos(status?: StatusPedido | null) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['pedidos', session?.user.id, status ?? 'todos'],
    enabled: !!session,
    queryFn: async () => {
      let q = supabase.from('pedidos').select('*').order('criado_em', { ascending: false }).limit(200);
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Pedido[];
    },
  });
}

export function usePedido(id: string) {
  return useQuery({
    queryKey: ['pedido', id],
    queryFn: async () => {
      const [p, i] = await Promise.all([
        supabase.from('pedidos').select('*').eq('id', id).maybeSingle(),
        supabase.from('pedido_itens').select('*').eq('pedido_id', id),
      ]);
      if (p.error) throw p.error;
      if (i.error) throw i.error;
      return p.data ? { pedido: p.data as Pedido, itens: (i.data ?? []) as PedidoItem[] } : null;
    },
  });
}
