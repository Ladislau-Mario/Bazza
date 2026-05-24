import 'react-native-gesture-handler';

import React from 'react';
import { StyleSheet, LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useFonts, Poppins_300Light, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Outfit_300Light, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold } from '@expo-google-fonts/outfit';

import { ThemeProvider, useTheme } from './src/global/ThemeContext';
import Routes from './src/routes/index.routes';
import ToastNotification from './src/components/common/toastNotification';
import { useRealtimeNotifications } from './src/hooks/useRealtimeNotifications';

import Map from 'react-native-maps';

try {
  const { setNotificationHandler } = require('expo-notifications');
  setNotificationHandler({
    handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
} catch (e) {
  // expo-notifications not available — skip
}

LogBox.ignoreLogs(['Setting a timer', 'SafeAreaView has been deprecated']);

const queryClient = new QueryClient();

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
  },
};

function AppContent() {
  const { theme } = useTheme();
  const { toast, hideToast } = useRealtimeNotifications();

  let [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
  });

  if (!fontsLoaded) return null;

  return (
    <NavigationContainer theme={MyTheme}>
      <StatusBar style="light" />
      <Routes />
      {toast && (
        <ToastNotification
          titulo={toast.titulo}
          mensagem={toast.mensagem}
          tipo={toast.tipo}
          visible={!!toast}
          onHide={hideToast}
        />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});