// src/components/modules/services/api/authService.ts
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  // Após Firebase Phone Auth confirmar o código no frontend,
  // envia o idToken ao backend para sincronizar o utilizador na BD
  sincronizarTelefone: (idToken: string) =>
    api.post('/auth/telefone/sincronizar', { idToken }),

  // ATUALIZADO: Agora aceita photoURL (vinda do Google)
  loginGoogle: (data: { uid: string; email?: string; displayName?: string; photoURL?: string }) =>
    api.post('/auth/google', data),

  perfil: () => api.get('/auth/perfil'),

  // ATUALIZADO: Adicionada fotoPerfil para permitir atualizações manuais
  atualizarPerfil: (dados: {
    nome?: string;
    sobrenome?: string;
    dataNascimento?: string;
    email?: string;
    telefone?: string;
    fotoPerfil?: string; 
  }) => api.patch('/auth/perfil', dados),

  escolherRole: (role: 'cliente' | 'motoqueiro') =>
    api.patch('/auth/escolher-role', { role }),

  atualizarFcmToken: (fcmToken: string) =>
    api.patch('/auth/fcm-token', { fcmToken }),

  // ── Sessão local ───────────────────────────────────────────
  salvarSessao: async (user: any) =>
    await AsyncStorage.setItem('@Baza:user', JSON.stringify(user)),

  obterSessao: async (): Promise<any | null> => {
    const raw = await AsyncStorage.getItem('@Baza:user');
    return raw ? JSON.parse(raw) : null;
  },

  limparSessao: async () =>
    await AsyncStorage.multiRemove(['@Baza:user']),
};