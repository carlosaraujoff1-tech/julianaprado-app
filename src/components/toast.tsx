import Ionicons from '@expo/vector-icons/Ionicons';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cores, fontes, raio } from '@/constants/tema';

type Aviso = { texto: string; tipo: 'ok' | 'erro'; acao?: { titulo: string; onPress: () => void } };
const Ctx = createContext<(a: Aviso) => void>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<(Aviso & { id: number }) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ins = useSafeAreaInsets();
  const mostrar = useCallback((a: Aviso) => {
    if (timer.current) clearTimeout(timer.current);
    setAviso({ ...a, id: Date.now() });
    timer.current = setTimeout(() => setAviso(null), a.acao ? 4000 : 2600);
  }, []);
  return (
    <Ctx.Provider value={mostrar}>
      {children}
      {aviso && (
        <Animated.View key={aviso.id} entering={FadeInDown.duration(180)} exiting={FadeOutDown.duration(160)}
          style={[s.caixa, { bottom: ins.bottom + 76 }]} pointerEvents="box-none">
          <Ionicons name={aviso.tipo === 'ok' ? 'checkmark-circle' : 'alert-circle'} size={20}
            color={aviso.tipo === 'ok' ? cores.dourado : '#FF8A80'} />
          <Text style={s.texto} numberOfLines={3}>{aviso.texto}</Text>
          {aviso.acao && (
            <Pressable hitSlop={10} onPress={() => { setAviso(null); aviso.acao!.onPress(); }}>
              <Text style={s.acao}>{aviso.acao.titulo}</Text>
            </Pressable>
          )}
        </Animated.View>
      )}
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);

const s = StyleSheet.create({
  caixa: {
    position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: cores.grafiteEscuro, borderRadius: raio.md, paddingVertical: 14, paddingHorizontal: 16,
    elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  texto: { flex: 1, color: cores.branco, fontFamily: fontes.textoMedio, fontSize: 14 },
  acao: { color: cores.dourado, fontFamily: fontes.textoForte, fontSize: 14 },
});
