import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { ItemSacola, ProdutoVitrine } from '@/types/database';

// Sacola do visitante (sem conta): fica no celular. Ao entrar, vai para a conta.
type ItemLocal = {
  produto_id: string;
  variacao_id: string | null;
  variacao_nome: string | null;
  quantidade: number;
};
const CHAVE = 'sacola-visitante-v1';

export type ItemTela = ItemSacola & { chave: string };

type Sacola = {
  itens: ItemTela[];
  carregando: boolean;
  quantidadeTotal: number;
  subtotal: number;
  temIndisponivel: boolean;
  adicionar: (produtoId: string, variacao?: { id: string; nome: string } | null, qtd?: number) => Promise<void>;
  alterar: (item: ItemTela, qtd: number) => Promise<void>;
  recarregar: () => Promise<unknown>;
};

const Ctx = createContext<Sacola | null>(null);

async function lerLocal(): Promise<ItemLocal[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(CHAVE)) ?? '[]');
  } catch {
    return [];
  }
}
const gravarLocal = (itens: ItemLocal[]) => AsyncStorage.setItem(CHAVE, JSON.stringify(itens));

export function SacolaProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const uid = session?.user.id;
  const qc = useQueryClient();
  const [local, setLocal] = useState<ItemLocal[] | null>(null);

  useEffect(() => {
    lerLocal().then(setLocal);
  }, []);

  // Entrou na conta com itens no celular: junta na sacola da conta.
  const mesclando = useRef(false);
  useEffect(() => {
    if (!uid || !local?.length || mesclando.current) return;
    mesclando.current = true;
    const itens = local;
    Promise.resolve(supabase.rpc('sacola_mesclar', { p_itens: itens }))
      .then(() => gravarLocal([]))
      .then(() => {
        setLocal([]);
        return qc.invalidateQueries({ queryKey: ['sacola'] });
      })
      .finally(() => { mesclando.current = false; });
  }, [uid, local, qc]);

  const servidor = useQuery({
    queryKey: ['sacola', uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('sacola_ver');
      if (error) throw error;
      return (data ?? []) as ItemSacola[];
    },
  });

  // Visitante: busca nome/foto/preço atual dos produtos da sacola local.
  const idsLocais = useMemo(() => [...new Set((local ?? []).map((i) => i.produto_id))].sort(), [local]);
  const produtosLocais = useQuery({
    queryKey: ['produtos', { ids: idsLocais }],
    enabled: !uid && idsLocais.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('vitrine_produtos', { p_ids: idsLocais, p_limite: 100 });
      if (error) throw error;
      return (data ?? []) as ProdutoVitrine[];
    },
  });

  const itens: ItemTela[] = useMemo(() => {
    if (uid) return (servidor.data ?? []).map((i) => ({ ...i, chave: i.item_id }));
    const mapa = new Map((produtosLocais.data ?? []).map((p) => [p.id, p]));
    return (local ?? []).flatMap((i) => {
      const p = mapa.get(i.produto_id);
      if (!p) return [];
      return [{
        chave: `${i.produto_id}:${i.variacao_id ?? ''}`,
        item_id: '',
        produto_id: p.id,
        variacao_id: i.variacao_id,
        variacao_nome: i.variacao_nome,
        nome: p.nome,
        imagem: p.imagem,
        quantidade: i.quantidade,
        preco_de: p.preco_de,
        preco_por: p.preco_por,
        subtotal: p.preco_por * i.quantidade,
        disponivel: !p.esgotado,
      }];
    });
  }, [uid, servidor.data, local, produtosLocais.data]);

  const adicionar = useCallback<Sacola['adicionar']>(async (produtoId, variacao, qtd = 1) => {
    if (uid) {
      const { error } = await supabase.rpc('sacola_adicionar', {
        p_produto_id: produtoId,
        p_variacao_id: variacao?.id,
        p_quantidade: qtd,
      });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ['sacola', uid] });
      return;
    }
    const atual = await lerLocal();
    const vid = variacao?.id ?? null;
    const achou = atual.find((i) => i.produto_id === produtoId && i.variacao_id === vid);
    if (achou) achou.quantidade = Math.min(achou.quantidade + qtd, 99);
    else atual.push({ produto_id: produtoId, variacao_id: vid, variacao_nome: variacao?.nome ?? null, quantidade: qtd });
    await gravarLocal(atual);
    setLocal(atual);
  }, [uid, qc]);

  const alterar = useCallback<Sacola['alterar']>(async (item, qtd) => {
    if (uid) {
      // atualização otimista: a tela muda na hora
      qc.setQueryData<ItemSacola[]>(['sacola', uid], (antes) =>
        (antes ?? []).flatMap((i) => i.item_id !== item.item_id ? [i]
          : qtd <= 0 ? [] : [{ ...i, quantidade: qtd, subtotal: i.preco_por * qtd }]));
      const { error } = await supabase.rpc('sacola_quantidade', { p_item_id: item.item_id, p_quantidade: qtd });
      if (error) {
        await qc.invalidateQueries({ queryKey: ['sacola', uid] });
        throw error;
      }
      return;
    }
    const atual = (await lerLocal()).flatMap((i) =>
      i.produto_id === item.produto_id && i.variacao_id === item.variacao_id
        ? (qtd <= 0 ? [] : [{ ...i, quantidade: Math.min(qtd, 99) }])
        : [i]);
    await gravarLocal(atual);
    setLocal(atual);
  }, [uid, qc]);

  const valor: Sacola = {
    itens,
    carregando: uid ? servidor.isLoading : local === null || (idsLocais.length > 0 && produtosLocais.isLoading),
    quantidadeTotal: itens.reduce((s, i) => s + i.quantidade, 0),
    subtotal: itens.reduce((s, i) => s + (i.disponivel ? Number(i.subtotal) : 0), 0),
    temIndisponivel: itens.some((i) => !i.disponivel),
    adicionar,
    alterar,
    recarregar: () => (uid ? servidor.refetch() : produtosLocais.refetch()),
  };
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useSacola() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSacola fora do SacolaProvider');
  return c;
}
