import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Notificacao } from '@/types/database';

// Canal Android usado pela Edge Function (channelId "avisos").
export const CANAL = 'avisos';

export async function configurarNotificacoes() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL, {
      name: 'Avisos da Juliana Prado',
      importance: AndroidImportance.MAX,
      vibrationPattern: [0, 200, 150, 200],
      lightColor: '#B8994A',
    });
  }
}

// Registra o aparelho para receber avisos. Funciona para visitante também:
// quando a pessoa entra na conta, o mesmo aparelho passa a ficar ligado a ela.
export async function registrarAparelho() {
  try {
    if (!Device.isDevice) return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return;
    let perm = await Notifications.getPermissionsAsync();
    if (!perm.granted && perm.canAskAgain) perm = await Notifications.requestPermissionsAsync();
    if (!perm.granted) return;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await supabase.rpc('registrar_dispositivo', { p_token: token, p_plataforma: Platform.OS === 'ios' ? 'ios' : 'android' });
  } catch (e) {
    console.warn('[push] não registrou o aparelho', e);
  }
}

const CHAVE_LIDAS_VISITANTE = 'notificacoes-lidas-em';

export function useNotificacoes() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['notificacoes', session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('notificacoes').select('*')
        .order('criado_em', { ascending: false }).limit(60);
      if (error) throw error;
      return (data ?? []) as Notificacao[];
    },
  });
}

export function useNaoLidas() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['nao-lidas', session?.user.id],
    refetchInterval: 120_000,
    queryFn: async () => {
      if (session) {
        const { data } = await supabase.rpc('contar_notificacoes_nao_lidas');
        return Number(data ?? 0);
      }
      const desde = (await AsyncStorage.getItem(CHAVE_LIDAS_VISITANTE)) ?? new Date(0).toISOString();
      const { count } = await supabase.from('notificacoes').select('id', { count: 'exact', head: true })
        .is('destinatario_id', null).gt('criado_em', desde);
      return count ?? 0;
    },
  });
}

export function useMarcarLidas() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return async () => {
    if (session) await supabase.rpc('marcar_notificacoes_lidas');
    else await AsyncStorage.setItem(CHAVE_LIDAS_VISITANTE, new Date().toISOString());
    qc.setQueryData(['nao-lidas', session?.user.id], 0);
  };
}
