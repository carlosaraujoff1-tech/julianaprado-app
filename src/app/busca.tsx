import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradeProdutos } from '@/components/grade';
import { T, Vazio } from '@/components/ui';
import { cores, espaco, fontes, raio } from '@/constants/tema';
import { useCategorias, useProdutos } from '@/lib/vitrine';

export default function Busca() {
  const ins = useSafeAreaInsets();
  const [texto, setTexto] = useState('');
  const [termo, setTermo] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setTermo(texto.trim()), 250); // espera a pessoa parar de digitar
    return () => clearTimeout(t);
  }, [texto]);
  const q = useProdutos({ busca: termo, limite: 60 }, termo.length >= 2);
  const categorias = useCategorias();

  return (
    <View style={{ flex: 1 }}>
      <View style={[s.topo, { paddingTop: ins.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={26} color={cores.texto} />
        </Pressable>
        <View style={s.campo}>
          <Ionicons name="search" size={18} color={cores.textoSuave} />
          <TextInput
            autoFocus
            value={texto}
            onChangeText={setTexto}
            placeholder="O que você procura?"
            placeholderTextColor="#B3ABB1"
            style={s.input}
            returnKeyType="search"
          />
          {q.isFetching ? <ActivityIndicator size="small" color={cores.dourado} />
            : !!texto && (
              <Pressable onPress={() => setTexto('')} hitSlop={10} accessibilityLabel="Limpar">
                <Ionicons name="close-circle" size={18} color={cores.textoSuave} />
              </Pressable>
            )}
        </View>
      </View>
      {termo.length < 2 ? (
        <View style={{ padding: espaco.lg, gap: espaco.md }}>
          <T v="rotulo">Sugestões</T>
          <View style={s.chips}>
            {(categorias.data ?? []).map((c) => (
              <Pressable key={c.id} style={s.chip} onPress={() => setTexto(c.nome)}>
                <T v="corpoForte">{c.nome}</T>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <GradeProdutos
          produtos={q.data ?? []}
          cabecalho={q.data?.length ? (
            <T v="legenda" style={{ paddingHorizontal: espaco.lg, paddingTop: espaco.md }}>
              {q.data.length} {q.data.length === 1 ? 'resultado' : 'resultados'} para “{termo}”
            </T>
          ) : null}
          vazio={q.isFetching ? null : <Vazio icone="search-outline" titulo="Nada encontrado" texto={`Não achamos peças para “${termo}”. Tente outra palavra.`} />}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  topo: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm, paddingHorizontal: espaco.md, paddingBottom: espaco.sm },
  campo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: cores.branco, borderRadius: raio.pill, paddingHorizontal: espaco.lg, height: 46, borderWidth: 1, borderColor: cores.linha },
  input: { flex: 1, fontFamily: fontes.texto, fontSize: 15, color: cores.texto },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
  chip: { backgroundColor: cores.branco, borderWidth: 1, borderColor: cores.linha, borderRadius: raio.pill, paddingHorizontal: 14, paddingVertical: 8 },
});
