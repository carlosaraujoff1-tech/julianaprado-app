import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { router, Stack, type ErrorBoundaryProps, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/toast';
import { Botao, T } from '@/components/ui';
import { cores, espaco } from '@/constants/tema';
import { AuthProvider, useAuth } from '@/lib/auth';
import { registrarErro } from '@/lib/erros';
import { configurarNotificacoes, registrarAparelho } from '@/lib/notificacoes';
import { SacolaProvider } from '@/lib/sacola';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, gcTime: 30 * 60_000, retry: 1, refetchOnWindowFocus: false },
  },
});

// Abre a tela certa quando a pessoa toca numa notificação.
function abrirRota(resp: Notifications.NotificationResponse | null | undefined) {
  const rota = resp?.notification.request.content.data?.rota;
  if (typeof rota === 'string' && rota.startsWith('/')) router.push(rota as Href);
}

function Raiz() {
  const { carregando, session } = useAuth();

  useEffect(() => {
    if (!carregando) SplashScreen.hideAsync().catch(() => undefined);
  }, [carregando]);

  // Registra o aparelho ao abrir e de novo quando entra/sai da conta.
  useEffect(() => {
    if (!carregando) registrarAparelho();
  }, [carregando, session?.user.id]);

  useEffect(() => {
    configurarNotificacoes().catch(() => undefined);
    Notifications.getLastNotificationResponseAsync().then(abrirRota).catch(() => undefined);
    const sub = Notifications.addNotificationResponseReceivedListener(abrirRota);
    return () => sub.remove();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.creme }, animation: 'slide_from_right' }}>
        <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
        <Stack.Screen name="busca" options={{ animation: 'fade' }} />
        <Stack.Screen name="entrar" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="cadastro" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </>
  );
}

export default function Layout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SacolaProvider>
            <ToastProvider>
              <Raiz />
            </ToastProvider>
          </SacolaProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

// Tela amigável se algo inesperado quebrar (e o erro fica registrado para a equipe).
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    registrarErro(error, 'ErrorBoundary');
    SplashScreen.hideAsync().catch(() => undefined);
  }, [error]);
  return (
    <View style={{ flex: 1, backgroundColor: cores.creme, alignItems: 'center', justifyContent: 'center', padding: espaco.xxl, gap: espaco.lg }}>
      <T v="titulo" style={{ textAlign: 'center' }}>Ops, algo deu errado</T>
      <T style={{ textAlign: 'center', color: cores.textoSuave }}>Já avisamos nossa equipe. Tente de novo.</T>
      <Botao titulo="Tentar de novo" onPress={retry} />
    </View>
  );
}
