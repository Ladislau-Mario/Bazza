import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../../../global/ThemeContext';
import { authService } from '../../../components/modules/services/api/authService';
import { auth } from '../../../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

export default function SplashScreen({ navigation }: any) {
  const { theme } = useTheme();

  useEffect(() => {
    // Esperar o Firebase restaurar a sessão antes de decidir a navegação
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        const sessao = await authService.obterSessao();

        if (sessao && firebaseUser) {
          // Bloquear admin de aceder à app mobile
          if (sessao.role === 'admin') {
            await authService.limparSessao();
            navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
            return;
          }

          // Para deliver, verificar o status no backend antes de navegar
          if (sessao.role === 'deliver' || sessao.role === 'motoqueiro') {
            try {
              const perfil = await authService.perfil();
              const status = perfil.data?.status;

              if (status === 'pending') {
                navigation.reset({ index: 0, routes: [{ name: 'PendingApproval' }] });
                return;
              } else if (status === 'suspended') {
                navigation.reset({ index: 0, routes: [{ name: 'Suspended' }] });
                return;
              }
              // status === 'active' → vai para o painel normalmente
            } catch (perfilError) {
              // Se falhar ao verificar perfil, usar a sessão local
              console.warn('[Splash] Erro ao verificar perfil:', perfilError);
            }
            navigation.reset({ index: 0, routes: [{ name: 'DeliverHomeTab' }] });
          } else {
            navigation.reset({ index: 0, routes: [{ name: 'ClientHome' }] });
          }
        } else {
          // Sem sessão - mostrar onboarding
          navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
        }
      } catch (error) {
        // Em caso de erro, mostrar onboarding
        navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
