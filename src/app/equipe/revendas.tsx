import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { FlatList, View } from 'react-native';

import { useToast } from '@/components/toast';
import { Botao, Cabecalho, Carregando, Cartao, T, Vazio } from '@/components/ui';
import { espaco } from '@/constants/tema';
import { useAuth } from '@/lib/auth';
import { dataHora, mascaraCpf, mascaraTelefone } from '@/lib/formatacao';
import { mensagemErro, supabase } from '@/lib/supabase';
import type { Perfil } from '@/types/database';

// Só a equipe chega aqui; o banco também só deixa a equipe ver e decidir.
export default function Revendas() {
  const { equipe } = useAuth();
  const toast = useToast();
  const [decidindo, setDecidindo] = useState<string | null>(null);
  const q = useQuery({
    queryKey: ['revendas-pendentes'],
    enabled: equipe,
    queryFn: async () => {
      const { data, error } = await supabase.from('perfis').select('*').eq('revenda', 'pendente').order('atualizado_em');
      if (error) throw error;
      return (data ?? []) as Perfil[];
    },
  });

  const decidir = async (p: Perfil, aprovar: boolean) => {
    setDecidindo(p.id);
    const { error } = await supabase.rpc('decidir_revenda', { p_usuario: p.id, p_aprovar: aprovar });
    setDecidindo(null);
    if (error) return toast({ texto: mensagemErro(error), tipo: 'erro' });
    toast({ texto: aprovar ? `${p.nome.split(' ')[0]} agora é revendedora` : 'Pedido recusado', tipo: 'ok' });
    q.refetch();
  };

  return (
    <View style={{ flex: 1 }}>
      <Cabecalho titulo="Aprovar revendedoras" />
      {!equipe ? <Vazio icone="lock-closed-outline" titulo="Somente equipe" /> : q.isLoading ? <Carregando /> : (
        <FlatList
          data={q.data ?? []}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: espaco.lg, gap: espaco.md }}
          refreshing={q.isRefetching}
          onRefresh={q.refetch}
          ListEmptyComponent={<Vazio icone="checkmark-done-outline" titulo="Tudo em dia" texto="Nenhum pedido de revenda esperando." />}
          renderItem={({ item }) => (
            <Cartao style={{ gap: 4 }}>
              <T v="subtitulo">{item.nome}</T>
              <T>{item.email}</T>
              {!!item.telefone && <T>{mascaraTelefone(item.telefone)}</T>}
              {!!item.cpf && <T v="legenda">CPF {mascaraCpf(item.cpf)}</T>}
              {!!item.cidade && <T v="legenda">{item.cidade}{item.uf ? `/${item.uf}` : ''}</T>}
              <T v="legenda">Cliente desde {dataHora(item.criado_em)}</T>
              <View style={{ flexDirection: 'row', gap: espaco.sm, marginTop: espaco.sm }}>
                <Botao titulo="Recusar" tipo="contorno" pequeno style={{ flex: 1 }} onPress={() => decidir(item, false)} desabilitado={decidindo === item.id} />
                <Botao titulo="Aprovar" pequeno style={{ flex: 1 }} onPress={() => decidir(item, true)} carregando={decidindo === item.id} />
              </View>
            </Cartao>
          )}
        />
      )}
    </View>
  );
}
