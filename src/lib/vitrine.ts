import { keepPreviousData, useQuery, type QueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Banner, ProdutoVitrine } from '@/types/database';

export type FiltroLista = 'ofertas' | 'mais_vendidos' | 'novidades' | 'destaques' | 'favoritos';

export type ProdutoDetalhe = {
  id: string;
  nome: string;
  sku: string | null;
  descricao: string | null;
  categoria_id: string | null;
  categoria_nome: string | null;
  imagens: string[];
  preco_de: number | null;
  preco_por: number;
  desconto_pct: number | null;
  esgotado: boolean;
  favorito: boolean;
  variacoes: { id: string; nome: string; disponivel: boolean }[];
};

type Parametros = {
  categoria?: string;
  filtro?: FiltroLista;
  busca?: string;
  ids?: string[];
  limite?: number;
};

export function useProdutos(p: Parametros, habilitado = true) {
  return useQuery({
    queryKey: ['produtos', p],
    enabled: habilitado,
    placeholderData: p.busca !== undefined ? keepPreviousData : undefined,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('vitrine_produtos', {
        p_categoria: p.categoria,
        p_filtro: p.filtro,
        p_busca: p.busca,
        p_ids: p.ids,
        p_limite: p.limite ?? 60,
      });
      if (error) throw error;
      return (data ?? []) as ProdutoVitrine[];
    },
  });
}

export function useProduto(id: string) {
  return useQuery({
    queryKey: ['produto', id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('vitrine_produto', { p_id: id });
      if (error) throw error;
      return data as unknown as ProdutoDetalhe | null;
    },
  });
}

// Ao tocar num card, já deixa o detalhe com o que temos (abre na hora, sem "carregando").
export function semearProduto(qc: QueryClient, p: ProdutoVitrine) {
  if (qc.getQueryData(['produto', p.id])) return;
  qc.setQueryData<ProdutoDetalhe>(['produto', p.id], {
    id: p.id, nome: p.nome, sku: p.sku, descricao: null, categoria_id: p.categoria_id,
    categoria_nome: p.categoria_nome, imagens: p.imagem ? [p.imagem] : [], preco_de: p.preco_de,
    preco_por: p.preco_por, desconto_pct: p.desconto_pct, esgotado: p.esgotado, favorito: false, variacoes: [],
  });
  // marca como "velho" para buscar o completo em seguida
  qc.invalidateQueries({ queryKey: ['produto', p.id], refetchType: 'none' });
}

export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('vitrine_categorias');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useBanners() {
  return useQuery({
    queryKey: ['banners'],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('banners').select('*').eq('ativo', true).order('ordem');
      if (error) throw error;
      return (data ?? []) as Banner[];
    },
  });
}

export function useConfiguracoes() {
  return useQuery({
    queryKey: ['configuracoes'],
    staleTime: 30 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('configuracoes').select('chave,valor');
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((c) => [c.chave, c.valor])) as Record<string, string>;
    },
  });
}

export const titulosFiltro: Record<FiltroLista, string> = {
  ofertas: 'Ofertas',
  mais_vendidos: 'Mais vendidas',
  novidades: 'Novidades',
  destaques: 'Destaques',
  favoritos: 'Meus favoritos',
};
