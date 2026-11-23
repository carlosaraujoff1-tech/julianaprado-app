import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Ícones do topo do celular (hora, bateria) brancos nas telas escuras.
// Só vale enquanto a tela está na frente; nas outras fica o padrão (escuro).
export function BarraStatusClara() {
  const focada = useIsFocused();
  return focada ? <StatusBar style="light" /> : null;
}
